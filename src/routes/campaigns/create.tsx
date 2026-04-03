import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, type FormEvent } from 'react'
import { route } from '@/constants/routes'
import { DatabaseService } from '@/services/database'
import type { CreateCampaignRequest, ContactList } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/campaigns/create')({
  component: CreateCampaign,
})

interface FormData {
  name: string
  subject: string
  from_email: string
  from_name: string
}

interface FormErrors {
  name?: string
  subject?: string
  from_email?: string
  from_name?: string
  general?: string
}

function CreateCampaign() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [allContactLists, setAllContactLists] = useState<ContactList[]>([])
  const [selectedListIds, setSelectedListIds] = useState<string[]>([])

  const [formData, setFormData] = useState<FormData>({
    name: '',
    subject: '',
    from_email: '',
    from_name: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load contact lists and default settings
  useEffect(() => {
    async function loadData() {
      try {
        const [lists, settings] = await Promise.all([
          DatabaseService.getContactLists(),
          DatabaseService.getSettings(),
        ])
        setAllContactLists(lists)

        // Pre-fill from defaults
        if (settings.app_settings.default_from_email || settings.app_settings.default_from_name) {
          setFormData(prev => ({
            ...prev,
            from_email: settings.app_settings.default_from_email || prev.from_email,
            from_name: settings.app_settings.default_from_name || prev.from_name,
          }))
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [])

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    if (!value.trim()) {
      switch (field) {
        case 'name': return 'Campaign name is required'
        case 'subject': return 'Subject line is required'
        case 'from_email': return 'From email is required'
        case 'from_name': return 'From name is required'
      }
    }
    if (field === 'from_email' && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        return 'Please enter a valid email address'
      }
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    Object.keys(formData).forEach((key) => {
      const field = key as keyof FormData
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    if (errors.general) setErrors(prev => ({ ...prev, general: undefined }))
  }

  const handleListToggle = (listId: string) => {
    setSelectedListIds(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const request: CreateCampaignRequest = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        from_email: formData.from_email.trim(),
        from_name: formData.from_name.trim()
      }

      const created = await DatabaseService.createCampaign(request)

      // Assign contact lists if any selected
      if (selectedListIds.length > 0) {
        await DatabaseService.updateCampaignContactLists(created.id, selectedListIds)
      }

      toast.success('Campaign created! Now add your content.')
      navigate({ to: '/campaigns/$campaignId/edit', params: { campaignId: created.id } })
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create campaign. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: route.campaigns })
  }

  const totalRecipients = allContactLists
    .filter(l => selectedListIds.includes(l.id))
    .reduce((sum, l) => sum + l.contact_count, 0)

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
          <CardDescription>
            Fill in the details below to create a new email campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter campaign name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter email subject line"
                className={errors.subject ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">From Email *</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => handleInputChange('from_email', e.target.value)}
                placeholder="sender@example.com"
                className={errors.from_email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.from_email && <p className="text-sm text-red-500">{errors.from_email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">From Name *</Label>
              <Input
                id="from_name"
                type="text"
                value={formData.from_name}
                onChange={(e) => handleInputChange('from_name', e.target.value)}
                placeholder="Enter sender name"
                className={errors.from_name ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.from_name && <p className="text-sm text-red-500">{errors.from_name}</p>}
            </div>

            {/* Contact Lists */}
            {allContactLists.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contact Lists (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pre-select contact lists ({totalRecipients} recipients). You can also do this later.
                </p>
                <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {allContactLists.map((list) => (
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
                      <span className="text-sm font-medium">{list.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({list.contact_count} contacts)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {errors.general && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {errors.general}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
