import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Template } from '@/types/database'
import { FileText, Plus, Eye, Edit3, Trash2 } from 'lucide-react'
import DOMPurify from 'dompurify'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { toast } from 'sonner'

export const Route = createFileRoute(route.templates)({
  component: Templates,
})

function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const data = await DatabaseService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTemplate) return
    try {
      await DatabaseService.deleteTemplate(deleteTemplate.id)
      setTemplates(prev => prev.filter(t => t.id !== deleteTemplate.id))
      toast.success('Template deleted')
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeleteTemplate(null)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Templates" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Email Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable email templates for your campaigns
            </p>
          </div>

          <Button size="sm" asChild>
            <Link to={route.templatesCreate}>
              <Plus className="h-4 w-4" />
              Create Template
            </Link>
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : templates.length > 0 ? (
            templates.map((template) => (
              <div key={template.id} className="bg-muted/50 rounded-xl overflow-hidden">
                {/* Template Preview */}
                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                  <div className="h-full bg-white dark:bg-zinc-900 rounded shadow-sm p-3 overflow-hidden">
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{template.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(template.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/templates/$templateId/edit" params={{ templateId: template.id }}>
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTemplate(template)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-muted/50 rounded-xl p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first email template to streamline your campaign creation process
              </p>
              <Button size="sm" asChild>
                <Link to={route.templatesCreate}>
                  <Plus className="h-4 w-4" />
                  Create First Template
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Template Statistics */}
        {templates.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Template Statistics</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Total Templates</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {templates.filter(t => t.text_content).length}
                </p>
                <p className="text-sm text-muted-foreground">With Plain Text</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {new Set(templates.map(t => new Date(t.created_at).toDateString())).size}
                </p>
                <p className="text-sm text-muted-foreground">Creation Days</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Subject: {previewTemplate?.subject}
            </p>
            <div className="border rounded-lg p-4 bg-white dark:bg-zinc-900">
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewTemplate?.html_content || '') }}
                className="prose dark:prose-invert max-w-none"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
