import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PlateEditor } from '@/components/plate-editor'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

export const Route = createFileRoute('/templates_/create')({
  component: CreateTemplate,
})

function CreateTemplate() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
  })
  const [htmlContent, setHtmlContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Template name is required'
    if (!formData.subject.trim()) newErrors.subject = 'Subject line is required'
    if (!htmlContent.trim() || htmlContent === '<p><br></p>') newErrors.content = 'Email content is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await DatabaseService.createTemplate({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        html_content: htmlContent,
        text_content: textContent.trim() || undefined,
      })
      toast.success('Template created successfully!')
      navigate({ to: route.templates })
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error('Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Templates", href: route.templates },
    { label: "Create Template" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Create Email Template</CardTitle>
            <CardDescription>
              Design a reusable email template for your campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                  }}
                  placeholder="e.g. Welcome Email, Monthly Newsletter"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, subject: e.target.value }))
                    if (errors.subject) setErrors(prev => ({ ...prev, subject: '' }))
                  }}
                  placeholder="Enter email subject line"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email Content (HTML) *</Label>
                <PlateEditor
                  content={htmlContent}
                  onChange={(val) => {
                    setHtmlContent(val)
                    if (errors.content) setErrors(prev => ({ ...prev, content: '' }))
                  }}
                  placeholder="Design your email template..."
                />
                {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_content">Plain Text Version (optional)</Label>
                <Textarea
                  id="text_content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text alternative for email clients that don't support HTML..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Providing a plain text version improves deliverability and accessibility.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate({ to: route.templates })}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
