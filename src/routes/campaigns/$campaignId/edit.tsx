import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useEffect, useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, UpdateCampaignRequest } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_email: '',
    from_name: ''
  })

  const [editorContent, setEditorContent] = useState('')

  useEffect(() => {
    async function loadCampaign() {
      try {
        setLoading(true)
        const data = await DatabaseService.getCampaignById(campaignId)
        if (data) {
          setCampaign(data)
          setFormData({
            name: data.name,
            subject: data.subject,
            from_email: data.settings.from_email,
            from_name: data.settings.from_name
          })
          setEditorContent(data.content || '')
        } else {
          setError('Campaign not found')
        }
      } catch (err) {
        console.error('Failed to load campaign:', err)
        setError('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }

    loadCampaign()
  }, [campaignId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!campaign) return

    try {
      setSaving(true)
      setError(null)

      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Campaign name is required')
      }
      if (!formData.subject.trim()) {
        throw new Error('Subject line is required')
      }

      const updateRequest: UpdateCampaignRequest = {
        id: campaign.id,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: editorContent
      }

      await DatabaseService.updateCampaign(updateRequest)

      // Show success toast
      toast.success('Campaign updated successfully!')

      // Navigate back to campaigns list
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

  if (error) {
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="content">Email Content</Label>
                  <PlateEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    placeholder="Write your email content here..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={formData.from_name}
                      onChange={(e) => handleInputChange('from_name', e.target.value)}
                      placeholder="Enter sender name"
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      From settings cannot be changed after campaign creation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      value={formData.from_email}
                      onChange={(e) => handleInputChange('from_email', e.target.value)}
                      placeholder="Enter sender email"
                      type="email"
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      From settings cannot be changed after campaign creation
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={saving}>
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
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}