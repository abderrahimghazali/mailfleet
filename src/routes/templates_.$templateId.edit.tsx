import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import type { Template } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PlateEditor } from '@/components/plate-editor'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

export const Route = createFileRoute('/templates_/$templateId/edit')({
  component: EditTemplate,
})

function EditTemplate() {
  const { templateId } = Route.useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
  })
  const [htmlContent, setHtmlContent] = useState('')
  const [textContent, setTextContent] = useState('')

  useEffect(() => {
    async function loadTemplate() {
      try {
        const data = await DatabaseService.getTemplateById(templateId)
        if (data) {
          setTemplate(data)
          setFormData({ name: data.name, subject: data.subject })
          setHtmlContent(data.html_content)
          setTextContent(data.text_content || '')
        } else {
          setError('Template not found')
        }
      } catch (err) {
        console.error('Failed to load template:', err)
        setError('Failed to load template')
      } finally {
        setLoading(false)
      }
    }
    loadTemplate()
  }, [templateId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!template) return

    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Name and subject are required')
      return
    }

    setSaving(true)
    try {
      await DatabaseService.updateTemplate({
        id: template.id,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        html_content: htmlContent,
        text_content: textContent.trim() || undefined,
      })
      toast.success('Template updated successfully!')
      navigate({ to: route.templates })
    } catch (err) {
      console.error('Failed to update template:', err)
      toast.error('Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Templates", href: route.templates },
    { label: template?.name || "Edit Template" }
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

  if (error) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => navigate({ to: route.templates })} className="mt-4">
                Back to Templates
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Edit Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email Content (HTML)</Label>
                <PlateEditor
                  content={htmlContent}
                  onChange={setHtmlContent}
                  placeholder="Edit your email template..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_content">Plain Text Version (optional)</Label>
                <Textarea
                  id="text_content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Plain text alternative..."
                  rows={6}
                />
              </div>

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
