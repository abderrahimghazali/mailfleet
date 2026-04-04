import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Settings as SettingsType } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, CheckCircle2, Save } from 'lucide-react'

export const Route = createFileRoute(route.settings)({
  component: Settings,
})

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-west-3', label: 'EU (Paris)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
]

const MODEL_NAMES: Record<string, string> = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-opus-4-20250514': 'Claude Opus 4',
  'claude-haiku-4-20250414': 'Claude Haiku 4',
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gpt-4.1-nano': 'GPT-4.1 Nano',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'o3': 'o3',
  'o3-mini': 'o3 Mini',
  'o3-pro': 'o3 Pro',
  'o4-mini': 'o4 Mini',
}

function modelDisplayName(id: string): string {
  return MODEL_NAMES[id] || id
}

function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testError, setTestError] = useState('')
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [settingUpTracking, setSettingUpTracking] = useState(false)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [showAiKey, setShowAiKey] = useState(false)
  const [claudeCodeStatus, setClaudeCodeStatus] = useState<{ loggedIn: boolean; email?: string; orgName?: string; subscriptionType?: string } | null>(null)
  const [checkingClaude, setCheckingClaude] = useState(false)
  const [aiModels, setAiModels] = useState<string[]>(['claude-sonnet-4-20250514', 'claude-haiku-4-20250414', 'claude-opus-4-20250514'])

  const [formData, setFormData] = useState({
    ses_access_key: '', ses_secret_key: '', ses_region: 'us-east-1',
    default_from_email: '', default_from_name: '',
    theme: 'Light' as 'Light' | 'Dark',
    ai_provider: 'Anthropic', ai_api_key: '', ai_model: 'claude-sonnet-4-20250514', ai_custom_endpoint: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const settings: SettingsType = await DatabaseService.getSettings()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ai = (settings as any).ai_settings || {}
        setFormData({
          ses_access_key: settings.ses_settings.access_key_id || '', ses_secret_key: settings.ses_settings.secret_access_key || '',
          ses_region: settings.ses_settings.region || 'us-east-1',
          default_from_email: settings.app_settings.default_from_email || '', default_from_name: settings.app_settings.default_from_name || '',
          theme: settings.app_settings.theme || 'Light',
          ai_provider: ai.provider || 'Anthropic', ai_api_key: ai.api_key || '',
          ai_model: ai.model || 'claude-sonnet-4-20250514', ai_custom_endpoint: ai.custom_endpoint || '',
        })
        if (ai.provider === 'ClaudeCode') { try { const s = await DatabaseService.checkClaudeCodeStatus(); setClaudeCodeStatus(s) } catch { /* ignore */ } }
        else if (ai.provider) { try { const m = await DatabaseService.getAiProviderModels(ai.provider); setAiModels(m) } catch { /* ignore */ } }
        if (settings.ses_settings.verified) setTestResult('success')
        if (settings.ses_settings.tracking_config_set) setTrackingEnabled(true)
      } catch (e) { console.error('Failed to load settings:', e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleTest = async () => {
    if (!formData.ses_access_key || !formData.ses_secret_key) { toast.error('Enter AWS credentials first'); return }
    setTesting(true); setTestResult(null); setTestError('')
    try { await DatabaseService.verifySesCreds(formData.ses_access_key, formData.ses_secret_key, formData.ses_region); setTestResult('success'); toast.success('Connection verified!') }
    catch (e) { setTestResult('error'); setTestError(e instanceof Error ? e.message : String(e)); toast.error('Connection failed') }
    finally { setTesting(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await DatabaseService.updateSettings({
        ses_access_key: formData.ses_access_key || undefined, ses_secret_key: formData.ses_secret_key || undefined,
        ses_region: formData.ses_region, default_from_email: formData.default_from_email || undefined,
        default_from_name: formData.default_from_name || undefined, theme: formData.theme.toLowerCase(),
        ai_provider: formData.ai_provider, ai_api_key: formData.ai_api_key || undefined,
        ai_model: formData.ai_model, ai_custom_endpoint: formData.ai_custom_endpoint || undefined,
      })
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const PasswordInput = ({ id, value, show, onToggle, onChange, placeholder }: { id: string; value: string; show: boolean; onToggle: () => void; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={onToggle}>
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )

  if (loading) return (<><PageHeader breadcrumbs={[{ label: "Dashboard", href: route.dashboard }, { label: "Settings" }]} /><div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></>)

  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Dashboard", href: route.dashboard }, { label: "Settings" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-2 pb-8 space-y-8">

          {/* ── AWS SES ── */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">AWS SES</h3>
              <p className="text-xs text-muted-foreground">Email sending credentials</p>
            </div>

            <details className="group rounded-lg border border-primary/10 bg-primary/[0.02] overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-2.5 text-xs font-medium cursor-pointer select-none text-primary hover:bg-primary/[0.04] transition-colors list-none [&::-webkit-details-marker]:hidden">
                How to get your credentials
                <span className="text-primary/40 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <div className="px-4 pb-3 pt-1 text-xs text-muted-foreground space-y-2 border-t border-primary/10">
                <p><strong className="text-foreground">1.</strong> Open the <a href="https://console.aws.amazon.com/ses" target="_blank" className="text-primary underline">AWS SES Console</a>, pick a region, and verify your sender email under Identities.</p>
                <p><strong className="text-foreground">2.</strong> Go to <a href="https://console.aws.amazon.com/iam/home#/users/create" target="_blank" className="text-primary underline">IAM &gt; Create User</a>. Name it <code className="bg-muted px-1 rounded">mailfleet-ses</code> and attach <code className="bg-muted px-1 rounded">AmazonSESFullAccess</code>.</p>
                <p><strong className="text-foreground">3.</strong> Open the user &gt; Security credentials &gt; Create access key. Select "Application running outside AWS" and copy both keys below.</p>
                <p className="text-muted-foreground/60 pt-1">Sandbox mode only sends to verified emails. <a href="https://github.com/abderrahimghazali/mailfleet/wiki/AWS-SES-Setup" target="_blank" className="text-primary underline">Full guide</a></p>
              </div>
            </details>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Access Key ID</Label>
                <PasswordInput id="ak" value={formData.ses_access_key} show={showAccessKey} onToggle={() => setShowAccessKey(!showAccessKey)}
                  onChange={(v) => { setFormData(p => ({ ...p, ses_access_key: v })); setTestResult(null) }} placeholder="AKIA..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Secret Access Key</Label>
                <PasswordInput id="sk" value={formData.ses_secret_key} show={showSecretKey} onToggle={() => setShowSecretKey(!showSecretKey)}
                  onChange={(v) => { setFormData(p => ({ ...p, ses_secret_key: v })); setTestResult(null) }} placeholder="wJalr..." />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={formData.ses_region} onValueChange={(v) => { setFormData(p => ({ ...p, ses_region: v })); setTestResult(null) }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{AWS_REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="pt-5 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !formData.ses_access_key || !formData.ses_secret_key}>
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
                </Button>
                {testResult === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {testResult === 'error' && <span className="text-xs text-red-600 truncate max-w-[150px]">{testError || 'Failed'}</span>}
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* ── Default Sender ── */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Default Sender</h3>
              <p className="text-xs text-muted-foreground">Pre-fills new campaign forms</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">From Email</Label>
                <Input value={formData.default_from_email} onChange={(e) => setFormData(p => ({ ...p, default_from_email: e.target.value }))} placeholder="noreply@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">From Name</Label>
                <Input value={formData.default_from_name} onChange={(e) => setFormData(p => ({ ...p, default_from_name: e.target.value }))} placeholder="Your Company" />
              </div>
            </div>
          </section>

          <div className="border-t" />

          {/* ── Tracking ── */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Email Tracking</h3>
              <p className="text-xs text-muted-foreground">Opens, clicks, bounces via SES events</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{trackingEnabled ? 'Active' : 'Not configured'}</p>
                <p className="text-[11px] text-muted-foreground">{trackingEnabled ? 'Events tracked for new campaigns' : 'Creates SES config set + SNS + SQS'}</p>
              </div>
              <Button variant={trackingEnabled ? 'outline' : 'default'} size="sm" disabled={settingUpTracking || !formData.ses_access_key}
                onClick={async () => {
                  setSettingUpTracking(true)
                  try { await DatabaseService.setupTracking(); setTrackingEnabled(true); toast.success('Tracking enabled!') }
                  catch (e) { toast.error(e instanceof Error ? e.message : String(e)) }
                  finally { setSettingUpTracking(false) }
                }}>
                {settingUpTracking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : trackingEnabled ? 'Reconfigure' : 'Enable'}
              </Button>
            </div>
          </section>

          <div className="border-t" />

          {/* ── AI Agent ── */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">AI Agent</h3>
              <p className="text-xs text-muted-foreground">Provider for the agent assistant</p>
            </div>
            <div className={formData.ai_provider === 'ClaudeCode' ? '' : 'grid grid-cols-2 gap-3'}>
              <div className="space-y-1.5">
                <Label className="text-xs">Provider</Label>
                <Select value={formData.ai_provider} onValueChange={async (v) => {
                  setFormData(p => ({ ...p, ai_provider: v, ai_model: '' }))
                  if (v === 'ClaudeCode') {
                    setCheckingClaude(true)
                    try { const s = await DatabaseService.checkClaudeCodeStatus(); setClaudeCodeStatus(s) }
                    catch { /* ignore */ setClaudeCodeStatus({ loggedIn: false }) }
                    finally { setCheckingClaude(false) }
                  } else {
                    try { const m = await DatabaseService.getAiProviderModels(v); setAiModels(m); setFormData(p => ({ ...p, ai_model: m[0] || '' })) } catch { /* ignore */ }
                  }
                }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ClaudeCode">Claude Code (uses your session)</SelectItem>
                    <SelectItem value="Anthropic">Anthropic (API key)</SelectItem>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.ai_provider !== 'ClaudeCode' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  <Select value={formData.ai_model || ''} onValueChange={(v) => setFormData(p => ({ ...p, ai_model: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select model" /></SelectTrigger>
                    <SelectContent>{aiModels.map((m) => <SelectItem key={m} value={m}>{modelDisplayName(m)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {formData.ai_provider === 'ClaudeCode' ? (
              <div className="rounded-lg border px-3 py-2.5 text-xs space-y-1.5">
                {checkingClaude ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking Claude Code session...
                  </div>
                ) : claudeCodeStatus?.loggedIn ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Logged in as <strong>{claudeCodeStatus.email}</strong>{claudeCodeStatus.orgName ? ` (${claudeCodeStatus.orgName})` : ''}{claudeCodeStatus.subscriptionType ? ` · ${claudeCodeStatus.subscriptionType}` : ''}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                    <span className="shrink-0">✕</span>
                    <span>Not logged in. Run <code className="bg-muted px-1 rounded">claude login</code> in your terminal first.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">API Key</Label>
                <PasswordInput id="aik" value={formData.ai_api_key} show={showAiKey} onToggle={() => setShowAiKey(!showAiKey)}
                  onChange={(v) => setFormData(p => ({ ...p, ai_api_key: v }))} placeholder={formData.ai_provider === 'Anthropic' ? 'sk-ant-api03-...' : 'sk-...'} />
                {formData.ai_provider === 'Anthropic' && (
                  <p className="text-[11px] text-muted-foreground">Get your API key at <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-primary underline">console.anthropic.com</a></p>
                )}
              </div>
            )}
            {formData.ai_provider === 'Custom' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Endpoint URL</Label>
                <Input value={formData.ai_custom_endpoint || ''} onChange={(e) => setFormData(p => ({ ...p, ai_custom_endpoint: e.target.value }))} placeholder="https://api.example.com/v1/chat/completions" />
              </div>
            )}
          </section>

          <div className="border-t" />

          {/* ── Footer ── */}
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>v1.0.0</span>
              <a href="https://github.com/abderrahimghazali/mailfleet" target="_blank" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="https://github.com/abderrahimghazali/mailfleet/issues/new?template=bug_report.yml" target="_blank" className="hover:text-foreground transition-colors">Report Bug</a>
              <button className="hover:text-foreground transition-colors" onClick={async () => {
                try { const p = await DatabaseService.getLogPath(); const { revealItemInDir } = await import('@tauri-apps/plugin-opener'); await revealItemInDir(p) }
                catch { toast.error('Could not open logs') }
              }}>Logs</button>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </section>
        </div>
      </div>
    </>
  )
}
