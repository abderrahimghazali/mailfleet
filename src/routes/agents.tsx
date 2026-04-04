import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import React, { useEffect, useState, useRef } from 'react'
import { DatabaseService } from '@/services/database'
import type { AgentSession, AgentMessage, QCMQuestion } from '@/types/database'
import { useTypewriter } from '@/hooks/use-agent-stream'
import { parseAgentMessage } from '@/lib/parse-agent-message'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Bot,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  FileText,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute(route.agents)({
  component: AgentPage,
})

function AgentPage() {
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [status] = useState('Thinking...')
  const [typingDone, setTypingDone] = useState(false)
  const [pendingResponse, setPendingResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { displayText, isTyping, typeText, reset: resetTypewriter } = useTypewriter()

  const activeSession = sessions.find(s => s.id === activeSessionId)

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await DatabaseService.getAgentSessions()
        setSessions(data)
        setActiveSessionId(prev => {
          if (prev) return prev
          return data.length > 0 ? data[0].id : null
        })
      } catch (err) {
        console.error('Failed to load sessions:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  // Scroll on new messages and periodically during typewriting
  const lastScrollRef = useRef(0)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages?.length])

  useEffect(() => {
    if (!displayText) return
    const now = Date.now()
    if (now - lastScrollRef.current > 300) {
      lastScrollRef.current = now
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayText])

  async function handleNewChat() {
    try {
      const session = await DatabaseService.createAgentSession('New Chat')
      setSessions(prev => [session, ...prev])
      setActiveSessionId(session.id)
      setInput('')
      resetTypewriter()
      inputRef.current?.focus()
    } catch {
      toast.error('Failed to create session')
    }
  }

  async function handleDeleteSession() {
    if (!deletingSessionId) return
    try {
      await DatabaseService.deleteAgentSession(deletingSessionId)
      const remaining = sessions.filter(s => s.id !== deletingSessionId)
      setSessions(remaining)
      if (activeSessionId === deletingSessionId) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null)
      }
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setDeletingSessionId(null)
    }
  }

  async function handleSendMessage(message: string) {
    if (!message.trim() || !activeSessionId || sending) return
    const userMessage = message.trim()
    setInput('')
    setSending(true)
    setTypingDone(false)
    const userMsg: AgentMessage = {
      id: crypto.randomUUID(), role: 'User',
      content: userMessage, timestamp: new Date().toISOString(),
    }
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
    ))

    try {
      const response = await DatabaseService.sendAgentMessage(activeSessionId, userMessage)
      setPendingResponse(response.content)

      const cleanText = response.content
        .replace(/\[QUESTION\][\s\S]*?\[\/QUESTION\]/g, '')
        .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
        .trim()

      if (cleanText) await typeText(cleanText)
      setTypingDone(true)
      await new Promise(r => setTimeout(r, 400))

      // Load saved data BEFORE clearing typewriter
      const updated = await DatabaseService.getAgentSessions()
      // Set real sessions data — the real message now exists in the list
      setSessions(updated)
      // Wait one frame for React to render the real message, THEN clear typewriter
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      resetTypewriter()
      setTypingDone(false)
      setPendingResponse('')
      setSending(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.id !== userMsg.id) } : s
      ))
      resetTypewriter(); setSending(false); setTypingDone(false)
      setPendingResponse('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input) }
  }

  const suggestions = [
    { label: 'Analyze campaigns', icon: BarChart3 },
    { label: 'Create a template', icon: FileText },
    { label: 'Subject line ideas', icon: Lightbulb },
    { label: 'Review analytics', icon: Zap },
  ]

  return (
    <>
      <div className="flex h-screen">
        {/* ── Sidebar ── */}
        <div className="w-[260px] shrink-0 flex flex-col bg-card/60 border-r">
          <div className="p-3 pt-10">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              New conversation
            </button>
          </div>

          <div className="px-3 pt-1 pb-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium px-2">History</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-px">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-xs text-muted-foreground/40">No conversations yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 text-[13px] ${
                    activeSessionId === session.id
                      ? 'bg-primary/[0.07] text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                  onClick={() => { setActiveSessionId(session.id); resetTypewriter() }}
                >
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${activeSessionId === session.id ? 'text-primary' : ''}`} />
                  <span className="truncate flex-1 leading-tight pr-5">{session.title}</span>
                  <button
                    className="absolute right-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive bg-card/80"
                    onClick={(e) => { e.stopPropagation(); setDeletingSessionId(session.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Main Chat ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {activeSession ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
                  {/* Empty state */}
                  {activeSession.messages.length === 0 && !sending && (
                    <div className="pt-[15vh] pb-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-foreground text-lg leading-none mb-1">MailFleet Agent</h2>
                          <p className="text-xs text-muted-foreground">Your email marketing expert</p>
                        </div>
                      </div>
                      <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-md">
                        I can analyze your campaigns, create templates, optimize subject lines, and help with email strategy. What would you like to work on?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => handleSendMessage(s.label)}
                            className="group flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-sm transition-all text-left"
                          >
                            <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{s.label}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/30 ml-auto group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {activeSession.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onQCMSelect={(opt) => handleSendMessage(opt)}
                      disabled={sending}
                    />
                  ))}

                  {/* Typewriter — visible during typing AND while waiting for session reload */}
                  {sending && (displayText || (pendingResponse && pendingResponse.includes('[ACTION]'))) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Agent</span>
                      </div>

                      {/* Action cards — show immediately, before text */}
                      {pendingResponse && pendingResponse.includes('[ACTION]') && (
                        <div className="pl-8 space-y-3 mb-3">
                          {parseAgentMessage(pendingResponse)
                            .filter(seg => seg.type === 'action')
                            .map((segment, i) => {
                              const action = segment.content as { action: string; name: string }
                              return (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-200/60 dark:border-emerald-800/40">
                                  <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                      {action.action === 'CreateTemplate' ? 'Template' : 'Campaign'} created
                                    </p>
                                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{action.name}</p>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}

                      {displayText && (
                        <div className="pl-8 text-[14.5px] leading-[1.75] text-foreground/90 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
                          {isTyping && <span className="inline-block w-[2px] h-[18px] bg-primary/60 animate-pulse ml-0.5 -mb-0.5 rounded-full" />}
                        </div>
                      )}
                    </div>
                  )}

                  {/* QCM questions — show after typing is done */}
                  {typingDone && pendingResponse && !isTyping && (
                    <div className="pl-8 space-y-3">
                      {parseAgentMessage(pendingResponse)
                        .filter(seg => seg.type === 'question')
                        .map((segment, i) => {
                          const q = segment.content as QCMQuestion
                          return (
                            <div key={i} className="rounded-xl border border-primary/10 bg-gradient-to-b from-primary/[0.03] to-transparent p-5 space-y-3">
                              <p className="text-sm font-medium text-foreground">{q.question}</p>
                              <div className="flex flex-wrap gap-2">
                                {(q.options || []).map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => handleSendMessage(option)}
                                    disabled={sending}
                                    className="px-4 py-2 text-sm rounded-lg border border-border/80 bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 disabled:opacity-40 shadow-sm hover:shadow"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Status / thinking */}
                  {sending && !isTyping && !typingDone && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Agent</span>
                      </div>
                      <div className="pl-8">
                        <div className="inline-flex items-center gap-2.5 py-2 px-4 rounded-xl bg-muted/40 border border-border/40">
                          <div className="relative h-4 w-4">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                          <span className="text-sm text-muted-foreground">{status}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="shrink-0 pb-4 px-6">
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message the agent..."
                      className="w-full resize-none rounded-xl border border-border/60 bg-card px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all disabled:opacity-50"
                      rows={2}
                      disabled={sending}
                    />
                    <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/30">
                      Enter to send
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No session selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-7 w-7 text-primary/70" />
                </div>
                <h1 className="mb-3 text-2xl">AI Agent</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  Your email marketing expert. Analyzes campaigns, creates templates, and provides strategy advice.
                </p>
                <Button onClick={handleNewChat} size="sm" className="rounded-lg px-5">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Start a conversation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingSessionId} onOpenChange={() => setDeletingSessionId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this conversation and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}

/* ── Message Bubble ── */
function MessageBubble({ message, onQCMSelect, disabled }: {
  message: AgentMessage; onQCMSelect: (option: string) => void; disabled: boolean
}) {
  if (message.role === 'User') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="text-[14px] leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  const segments = parseAgentMessage(message.content)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wide">Agent</span>
      </div>
      <div className="pl-8 space-y-3">
        {segments.map((segment, i) => {
          if (segment.type === 'text') {
            return (
              <div key={i} className="text-[14.5px] leading-[1.75] text-foreground/90 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-4 prose-headings:mb-2 prose-li:my-0.5 prose-strong:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{segment.content}</ReactMarkdown>
              </div>
            )
          }
          if (segment.type === 'question') {
            const q = segment.content as QCMQuestion
            return (
              <div key={i} className="rounded-xl border border-primary/10 bg-gradient-to-b from-primary/[0.03] to-transparent p-5 space-y-3">
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                <div className="flex flex-wrap gap-2">
                  {(q.options || []).map((option) => (
                    <button
                      key={option}
                      onClick={() => onQCMSelect(option)}
                      disabled={disabled}
                      className="px-4 py-2 text-sm rounded-lg border border-border/80 bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 disabled:opacity-40 shadow-sm hover:shadow"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )
          }
          if (segment.type === 'action') {
            const action = segment.content as { action: string; name: string }
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {action.action === 'CreateTemplate' ? 'Template' : 'Campaign'} created
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{action.name}</p>
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
