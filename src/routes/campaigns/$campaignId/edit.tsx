import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useEffect, useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, UpdateCampaignRequest, ContactList, Template } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2, Save, X, Send, Mail, Users, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { PlateEditor } from '@/components/plate-editor'

export const Route = createFileRoute('/campaigns/$campaignId/edit')({
  component: EditCampaign,
})

function EditCampaign() {
  const { campaignId } = Route.useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_email: '',
    from_name: ''
  })
  const [editorContent, setEditorContent] = useState('')

  // Contact lists
  const [allContactLists, setAllContactLists] = useState<ContactList[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])

  // Templates
  const [allTemplates, setAllTemplates] = useState<Template[]>([])

  // Send dialogs
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showTestEmail, setShowTestEmail] = useState(false)
  const [testEmailTo, setTestEmailTo] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const campaignData = await DatabaseService.getCampaignById(campaignId)
        if (campaignData) {
          setCampaign(campaignData)
          setFormData({
            name: campaignData.name,
            subject: campaignData.subject,
            from_email: campaignData.settings.from_email,
            from_name: campaignData.settings.from_name
          })
          setEditorContent(campaignData.content || '')
          setSelectedListIds(campaignData.contact_list_ids || [])
        } else {
          setError('Campaign not found')
          return
        }

        // Load lists and templates independently — don't block on failure
        const [listsData, templatesData] = await Promise.all([
          DatabaseService.getContactLists().catch(() => []),
          DatabaseService.getTemplates().catch(() => []),
        ])

        setAllContactLists(listsData)
        setAllTemplates(templatesData)
      } catch (err) {
        console.error('Failed to load campaign:', err)
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Failed to load campaign: ${msg}`)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [campaignId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleListToggle = (listId: string) => {
    setSelectedListIds(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'none') return
    const template = allTemplates.find(t => t.id === templateId)
    if (template) {
      if (editorContent && editorContent !== '<p><br></p>') {
        if (!window.confirm('This will replace your current content with the template. Continue?')) {
          return
        }
      }
      setEditorContent(template.html_content)
      if (!formData.subject) {
        setFormData(prev => ({ ...prev, subject: template.subject }))
      }
      toast.success(`Template "${template.name}" loaded`)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!campaign) return

    try {
      setSaving(true)
      setError(null)

      if (!formData.name.trim()) throw new Error('Campaign name is required')
      if (!formData.subject.trim()) throw new Error('Subject line is required')

      const updateRequest: UpdateCampaignRequest = {
        id: campaign.id,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: editorContent
      }

      await DatabaseService.updateCampaign(updateRequest)

      // Update contact lists if changed
      const currentListIds = (campaign.contact_list_ids || []).sort().join(',')
      const newListIds = selectedListIds.sort().join(',')
      if (currentListIds !== newListIds) {
        await DatabaseService.updateCampaignContactLists(campaign.id, selectedListIds)
      }

      toast.success('Campaign updated successfully!')
      navigate({ to: route.campaigns })
    } catch (err) {
      console.error('Failed to update campaign:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update campaign'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleSendCampaign = async () => {
    setShowSendConfirm(false)
    setSending(true)
    try {
      // Save current state first
      await DatabaseService.updateCampaign({
        id: campaignId,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: editorContent,
      })
      if (selectedListIds.length > 0) {
        await DatabaseService.updateCampaignContactLists(campaignId, selectedListIds)
      }

      const result = await DatabaseService.sendCampaign(campaignId)
      toast.success(`Campaign sent! ${result.sent} emails delivered.${result.errors.length > 0 ? ` ${result.errors.length} errors.` : ''}`)
      navigate({ to: '/campaigns/$campaignId', params: { campaignId } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSending(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) return
    setSendingTest(true)
    try {
      await DatabaseService.sendTestEmail(
        testEmailTo.trim(),
        formData.subject || 'Test Email',
        editorContent,
        formData.from_email,
        formData.from_name
      )
      toast.success(`Test email sent to ${testEmailTo}`)
      setShowTestEmail(false)
      setTestEmailTo('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setSendingTest(false)
    }
  }

  const totalRecipients = allContactLists
    .filter(l => selectedListIds.includes(l.id))
    .reduce((sum, l) => sum + l.contact_count, 0)

  const canSend = campaign?.status === 'Draft' || campaign?.status === 'Scheduled' || campaign?.status === 'Paused'

  const handleCancel = () => {
    navigate({ to: route.campaigns })
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading campaign...</span>
        </div>
      </div>
    )
  }

  if (error && !campaign) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleCancel} className="mt-4">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Edit Campaign</CardTitle>
          <CardDescription>
            Configure your campaign, assign contacts, and compose your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter campaign name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter email subject"
                  required
                />
              </div>
            </div>

            {/* Contact Lists */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contact Lists
              </Label>
              <p className="text-xs text-muted-foreground">
                Select which contact lists to send this campaign to ({totalRecipients} total recipients)
              </p>
              <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                {allContactLists.length > 0 ? (
                  allContactLists.map((list) => (
                    <label
                      key={list.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedListIds.includes(list.id)}
                        onChange={() => handleListToggle(list.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{list.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({list.contact_count} contacts)
                        </span>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground p-2">
                    No contact lists yet. Create one in the Contacts section.
                  </p>
                )}
              </div>
            </div>

            {/* Template Selector */}
            {allTemplates.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Load from Template
                </Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to load..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} — {template.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Email Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <PlateEditor
                content={editorContent}
                onChange={setEditorContent}
                placeholder="Write your email content here..."
              />
            </div>

            {/* From Settings (read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={formData.from_name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Set during campaign creation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  value={formData.from_email}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 flex-wrap">
              <Button type="submit" disabled={saving || sending}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>

              {canSend && (
                <>
                  <Button
                    type="button"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={saving || sending || selectedListIds.length === 0 || !editorContent.trim()}
                    onClick={() => setShowSendConfirm(true)}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Campaign
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || sending || !editorContent.trim()}
                    onClick={() => setShowTestEmail(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </>
              )}

              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              This will send "{formData.name}" to {totalRecipients} contacts across {selectedListIds.length} list(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendCampaign}
              className="bg-green-600 hover:bg-green-700"
            >
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestEmail} onOpenChange={setShowTestEmail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a preview of this campaign to test your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test_email">Recipient Email</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmail(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailTo.trim()}
            >
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
