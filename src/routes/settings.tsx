import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Settings as SettingsType } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Save, Sun, Moon } from 'lucide-react'

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
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
]

function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testError, setTestError] = useState('')
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const [formData, setFormData] = useState({
    ses_access_key: '',
    ses_secret_key: '',
    ses_region: 'us-east-1',
    default_from_email: '',
    default_from_name: '',
    theme: 'Light' as 'Light' | 'Dark',
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings: SettingsType = await DatabaseService.getSettings()
        setFormData({
          ses_access_key: settings.ses_settings.access_key_id || '',
          ses_secret_key: settings.ses_settings.secret_access_key || '',
          ses_region: settings.ses_settings.region || 'us-east-1',
          default_from_email: settings.app_settings.default_from_email || '',
          default_from_name: settings.app_settings.default_from_name || '',
          theme: settings.app_settings.theme || 'Light',
        })
        if (settings.ses_settings.verified) {
          setTestResult('success')
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleTestConnection = async () => {
    if (!formData.ses_access_key || !formData.ses_secret_key) {
      toast.error('Please enter your AWS credentials first')
      return
    }

    setTesting(true)
    setTestResult(null)
    setTestError('')

    try {
      await DatabaseService.verifySesCreds(
        formData.ses_access_key,
        formData.ses_secret_key,
        formData.ses_region
      )
      setTestResult('success')
      toast.success('AWS SES connection verified!')
    } catch (error) {
      setTestResult('error')
      const msg = error instanceof Error ? error.message : String(error)
      setTestError(msg)
      toast.error('Connection failed')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await DatabaseService.updateSettings({
        ses_access_key: formData.ses_access_key || undefined,
        ses_secret_key: formData.ses_secret_key || undefined,
        ses_region: formData.ses_region,
        default_from_email: formData.default_from_email || undefined,
        default_from_name: formData.default_from_name || undefined,
        theme: formData.theme.toLowerCase(),
      })
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeToggle = () => {
    const newTheme = formData.theme === 'Light' ? 'Dark' : 'Light'
    setFormData(prev => ({ ...prev, theme: newTheme }))

    if (newTheme === 'Dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Save immediately
    DatabaseService.updateSettings({ theme: newTheme.toLowerCase() }).catch(console.error)
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Settings" }
  ]

  if (loading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-3xl">
        {/* AWS SES Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>AWS SES Configuration</CardTitle>
            <CardDescription>
              Configure your Amazon SES credentials to send emails. You can find these in your AWS IAM console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access_key">Access Key ID</Label>
              <div className="relative">
                <Input
                  id="access_key"
                  type={showAccessKey ? 'text' : 'password'}
                  value={formData.ses_access_key}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, ses_access_key: e.target.value }))
                    setTestResult(null)
                  }}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                >
                  {showAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Access Key</Label>
              <div className="relative">
                <Input
                  id="secret_key"
                  type={showSecretKey ? 'text' : 'password'}
                  value={formData.ses_secret_key}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, ses_secret_key: e.target.value }))
                    setTestResult(null)
                  }}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">AWS Region</Label>
              <Select
                value={formData.ses_region}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, ses_region: value }))
                  setTestResult(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AWS_REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label} ({region.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !formData.ses_access_key || !formData.ses_secret_key}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              {testResult === 'success' && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Connection verified
                </div>
              )}
              {testResult === 'error' && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  {testError || 'Connection failed'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Sender */}
        <Card>
          <CardHeader>
            <CardTitle>Default Sender</CardTitle>
            <CardDescription>
              These defaults will pre-fill new campaign creation forms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_from_email">Default From Email</Label>
              <Input
                id="default_from_email"
                type="email"
                value={formData.default_from_email}
                onChange={(e) => setFormData(prev => ({ ...prev, default_from_email: e.target.value }))}
                placeholder="noreply@yourdomain.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_from_name">Default From Name</Label>
              <Input
                id="default_from_name"
                type="text"
                value={formData.default_from_name}
                onChange={(e) => setFormData(prev => ({ ...prev, default_from_name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look of your application.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleThemeToggle}>
                {formData.theme === 'Dark' ? (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
