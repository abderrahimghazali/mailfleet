import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { route } from '@/constants/routes'
import { DatabaseService } from '@/services/database'
import type { CreateCampaignRequest } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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

  const [formData, setFormData] = useState<FormData>({
    name: '',
    subject: '',
    from_email: '',
    from_name: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    if (!value.trim()) {
      switch (field) {
        case 'name':
          return 'Campaign name is required'
        case 'subject':
          return 'Subject line is required'
        case 'from_email':
          return 'From email is required'
        case 'from_name':
          return 'From name is required'
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
      if (error) {
        newErrors[field] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const request: CreateCampaignRequest = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        from_email: formData.from_email.trim(),
        from_name: formData.from_name.trim()
      }

      await DatabaseService.createCampaign(request)

      // Show success toast
      toast.success('Campaign created successfully!')

      // Navigate back to campaigns list
      navigate({ to: route.campaigns })
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
              {/* Campaign Name */}
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
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Subject Line */}
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
                {errors.subject && (
                  <p className="text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* From Email */}
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
                {errors.from_email && (
                  <p className="text-sm text-red-500">{errors.from_email}</p>
                )}
              </div>

              {/* From Name */}
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
                {errors.from_name && (
                  <p className="text-sm text-red-500">{errors.from_name}</p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                  {errors.general}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}