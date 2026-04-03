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
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Save } from 'lucide-react'

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
        if (settings.ses_settings.tracking_config_set) {
          setTrackingEnabled(true)
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
        {/* Setup Guide */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-5">
            <details>
              <summary className="text-sm font-medium cursor-pointer select-none">
                How to get your AWS SES credentials
              </summary>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Go to the <a href="https://console.aws.amazon.com/ses" target="_blank" className="text-primary underline">AWS SES Console</a> and pick a region (e.g. eu-west-3 for Paris)</li>
                <li>Under <strong>Identities</strong>, click <strong>Create Identity</strong> and verify your email address (click the link AWS sends you)</li>
                <li>Go to <a href="https://console.aws.amazon.com/iam/home#/users/create" target="_blank" className="text-primary underline">IAM &gt; Create User</a>, name it <code className="bg-muted px-1 rounded">mailfleet-ses</code></li>
                <li>Attach the policy <code className="bg-muted px-1 rounded">AmazonSESFullAccess</code></li>
                <li>Go to the user &gt; <strong>Security credentials</strong> &gt; <strong>Create access key</strong> &gt; select "Application running outside AWS"</li>
                <li>Copy the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> below</li>
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Note: In SES sandbox mode, you can only send to verified email addresses. Request production access to send to anyone.
              </p>
            </details>
          </CardContent>
        </Card>

        {/* AWS SES Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>AWS SES Configuration</CardTitle>
            <CardDescription>
              Enter your IAM user credentials and select the region where your SES identities are verified.
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

        {/* Email Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Email Tracking</CardTitle>
            <CardDescription>
              Enable open, click, and bounce tracking via AWS SES event publishing.
              This creates an SES Configuration Set, SNS topic, and SQS queue in your AWS account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {trackingEnabled ? 'Tracking is active' : 'Tracking not configured'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trackingEnabled
                    ? 'Opens, clicks, and bounces are being tracked for new campaigns.'
                    : 'Set up tracking to get real open and click analytics.'}
                </p>
              </div>
              <Button
                variant={trackingEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={async () => {
                  setSettingUpTracking(true)
                  try {
                    await DatabaseService.setupTracking()
                    setTrackingEnabled(true)
                    toast.success('Tracking configured successfully!')
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err)
                    toast.error(msg)
                  } finally {
                    setSettingUpTracking(false)
                  }
                }}
                disabled={settingUpTracking || !formData.ses_access_key}
              >
                {settingUpTracking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : trackingEnabled ? (
                  'Reconfigure'
                ) : (
                  'Enable Tracking'
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
