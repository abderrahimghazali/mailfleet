import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, UpdateContactListRequest, CreateContactRequest, Contact } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Save, Plus, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/contacts/$contactListId/edit')({
  component: EditContactList,
})

function EditContactList() {
  const { contactListId } = Route.useParams()
  const navigate = useNavigate()
  const [contactList, setContactList] = useState<ContactList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  // Contact addition state
  const [addingContact, setAddingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    email: '',
    first_name: '',
    last_name: ''
  })
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [listData, contactsData] = await Promise.all([
          DatabaseService.getContactListById(contactListId),
          DatabaseService.getContactsByListId(contactListId)
        ])

        if (listData) {
          setContactList(listData)
          setFormData({
            name: listData.name,
            description: listData.description
          })
        } else {
          setError('Contact list not found')
        }

        setContacts(contactsData || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load contact list')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [contactListId])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContactInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddContact = async (e: FormEvent) => {
    e.preventDefault()
    if (!contactList) return

    try {
      setAddingContact(true)

      // Basic validation
      if (!contactForm.email.trim()) {
        throw new Error('Email is required')
      }

      // Check if email already exists
      if (contacts.some(c => c.email.toLowerCase() === contactForm.email.toLowerCase())) {
        throw new Error('Email already exists in this contact list')
      }

      const createRequest: CreateContactRequest = {
        email: contactForm.email.trim(),
        first_name: contactForm.first_name.trim() || undefined,
        last_name: contactForm.last_name.trim() || undefined,
        list_id: contactList.id
      }

      const newContact = await DatabaseService.createContact(createRequest)

      // Add to local state
      setContacts(prev => [...prev, newContact])

      // Reset form
      setContactForm({
        email: '',
        first_name: '',
        last_name: ''
      })

      // Update contact list count
      if (contactList) {
        setContactList(prev => prev ? { ...prev, contact_count: prev.contact_count + 1 } : null)
      }

      toast.success('Contact added successfully!')
    } catch (err) {
      console.error('Failed to add contact:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact'
      toast.error(errorMessage)
    } finally {
      setAddingContact(false)
    }
  }

  const handleDeleteContact = async (contactId: string, contactEmail: string) => {
    try {
      await DatabaseService.deleteContact(contactId)

      // Remove from local state
      setContacts(prev => prev.filter(c => c.id !== contactId))

      // Update contact list count
      if (contactList) {
        setContactList(prev => prev ? { ...prev, contact_count: Math.max(0, prev.contact_count - 1) } : null)
      }

      toast.success(`${contactEmail} removed from contact list`)
    } catch (err) {
      console.error('Failed to delete contact:', err)
      toast.error('Failed to remove contact')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!contactList) return

    try {
      setSaving(true)
      setError(null)

      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Contact list name is required')
      }

      const updateRequest: UpdateContactListRequest = {
        id: contactList.id,
        name: formData.name.trim(),
        description: formData.description.trim()
      }

      await DatabaseService.updateContactList(updateRequest)

      // Show success toast
      toast.success('Contact list updated successfully!')

      // Navigate back to contact list view
      navigate({ to: "/contacts/$contactListId", params: { contactListId: contactList.id } })
    } catch (err) {
      console.error('Failed to update contact list:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact list'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: "/contacts/$contactListId", params: { contactListId } })
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: contactList?.name || "Contact List", href: `/contacts/${contactListId}` },
    { label: "Edit" }
  ]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading contact list...</span>
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
                Back to Contact Lists
              </Button>
            </CardContent>
          </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Edit Contact List
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
                <h3 className="text-lg font-semibold">Add Contacts</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => handleContactInputChange('email', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={contactForm.first_name}
                      onChange={(e) => handleContactInputChange('first_name', e.target.value)}
                      placeholder="First name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={contactForm.last_name}
                      onChange={(e) => handleContactInputChange('last_name', e.target.value)}
                      placeholder="Last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      type="button"
                      onClick={handleAddContact}
                      className="w-full"
                      disabled={!contactForm.email.trim() || addingContact}
                    >
                      {addingContact ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Contact
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Contact List */}
                {contacts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Contacts in this list ({contacts.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div>
                            <p className="font-medium">{contact.email}</p>
                            {(contact.first_name || contact.last_name) && (
                              <p className="text-sm text-muted-foreground">
                                {contact.first_name} {contact.last_name}
                              </p>
                            )}
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full border ${
                              contact.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                              contact.status === 'Unsubscribed' ? 'bg-red-100 text-red-800 border-red-200' :
                              contact.status === 'Bounced' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              contact.status === 'Complained' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {contact.status}
                            </span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Contact</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {contact.email} from this contact list?
                                  This will permanently delete the contact from all lists.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteContact(contact.id, contact.email)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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