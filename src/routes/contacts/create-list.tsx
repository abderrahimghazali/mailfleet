import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import type { CreateContactListRequest, CreateContactRequest } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/contacts/create-list')({
  component: CreateContactList,
})

function CreateContactList() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  // Contacts state
  const [contacts, setContacts] = useState<{ email: string; first_name: string; last_name: string }[]>([])
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: ''
  })

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: "Create List" }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContactInputChange = (field: string, value: string) => {
    setNewContact(prev => ({ ...prev, [field]: value }))
  }

  const addContact = () => {
    if (!newContact.email.trim()) {
      toast.error('Email is required')
      return
    }

    // Check if email already exists
    if (contacts.some(c => c.email.toLowerCase() === newContact.email.toLowerCase())) {
      toast.error('Email already exists in the list')
      return
    }

    setContacts(prev => [...prev, { ...newContact }])
    setNewContact({ email: '', first_name: '', last_name: '' })
    toast.success('Contact added to list')
  }

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index))
    toast.success('Contact removed from list')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      setCreating(true)
      setError(null)

      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Contact list name is required')
      }

      // Create the contact list first
      const createListRequest: CreateContactListRequest = {
        name: formData.name.trim(),
        description: formData.description.trim()
      }

      const newContactList = await DatabaseService.createContactList(createListRequest)

      // If there are contacts to add, add them to the list
      if (contacts.length > 0) {
        for (const contact of contacts) {
          const createContactRequest: CreateContactRequest = {
            email: contact.email.trim(),
            first_name: contact.first_name.trim(),
            last_name: contact.last_name.trim(),
            list_id: newContactList.id
          }
          await DatabaseService.createContact(createContactRequest)
        }
      }

      // Show success toast
      toast.success(`Contact list "${formData.name}" created successfully!`)

      // Navigate to the main contacts page
      navigate({ to: route.contacts })
    } catch (err) {
      console.error('Failed to create contact list:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contact list'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: route.contacts })
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create Contact List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* List Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">List Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="name">List Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter contact list name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter contact list description (optional)"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Add Contacts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Add Contacts (Optional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => handleContactInputChange('email', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={newContact.first_name}
                      onChange={(e) => handleContactInputChange('first_name', e.target.value)}
                      placeholder="First name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={newContact.last_name}
                      onChange={(e) => handleContactInputChange('last_name', e.target.value)}
                      placeholder="Last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      type="button"
                      onClick={addContact}
                      className="w-full"
                      disabled={!newContact.email.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </div>

                {/* Contact List */}
                {contacts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Contacts to be added ({contacts.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {contacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div>
                            <p className="font-medium">{contact.email}</p>
                            {(contact.first_name || contact.last_name) && (
                              <p className="text-sm text-muted-foreground">
                                {contact.first_name} {contact.last_name}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeContact(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Contact List
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
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