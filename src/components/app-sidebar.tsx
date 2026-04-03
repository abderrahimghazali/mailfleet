import * as React from "react"
import { Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import {
  BarChart3,
  FileText,
  Home,
  LifeBuoy,
  Mail,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useState } from "react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: route.dashboard,
      icon: Home,
      isActive: true,
    },
    {
      title: "Campaigns",
      url: route.campaigns,
      icon: Mail,
    },
    {
      title: "Contacts",
      url: route.contacts,
      icon: Users,
    },
    {
      title: "Templates",
      url: route.templates,
      icon: FileText,
    },
    {
      title: "Analytics",
      url: route.analytics,
      icon: BarChart3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [showSupport, setShowSupport] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [supportMessage, setSupportMessage] = useState('')

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return
    toast.success('Thank you for your feedback!')
    setFeedbackText('')
    setShowFeedback(false)
  }

  const handleSubmitSupport = () => {
    if (!supportMessage.trim()) return
    toast.success('Support request submitted. We\'ll get back to you soon!')
    setSupportEmail('')
    setSupportMessage('')
    setShowSupport(false)
  }

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader data-tauri-drag-region>
          <SidebarMenu>
            <SidebarMenuItem className="pt-2">
              <SidebarMenuButton size="lg" asChild>
                <Link to={route.home}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <img src="/icon-32.png" alt="Mailfleet" className="size-8 rounded-lg" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Mailfleet</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" onClick={() => setShowSupport(true)}>
                    <LifeBuoy />
                    <span>Support</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" onClick={() => setShowFeedback(true)}>
                    <MessageSquare />
                    <span>Feedback</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to={route.settings}>
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Support Dialog */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5" />
              Contact Support
            </DialogTitle>
            <DialogDescription>
              Having trouble? Describe your issue and we'll help you out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="support_email">Your Email</Label>
              <Input
                id="support_email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_message">How can we help?</Label>
              <Textarea
                id="support_message"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSupport(false)}>Cancel</Button>
              <Button onClick={handleSubmitSupport} disabled={!supportMessage.trim()}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Feedback
            </DialogTitle>
            <DialogDescription>
              Your feedback helps us improve Mailfleet. Share your thoughts, ideas, or suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="feedback_text">Your Feedback</Label>
              <Textarea
                id="feedback_text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think..."
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
              <Button onClick={handleSubmitFeedback} disabled={!feedbackText.trim()}>
                Send Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
