import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, Contact } from '@/types/database'
import { PageHeader } from '@/components/PageHeader'
import {
  Users,
  Edit,
  Trash2,
  Mail,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'

export const Route = createFileRoute('/contacts_/$contactListId')({
  component: ContactListDetail,
})

function ContactListDetail() {
  const { contactListId } = Route.useParams()
  const navigate = useNavigate()
  const [contactList, setContactList] = useState<ContactList | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Load contact list data
        const foundContactList = await DatabaseService.getContactListById(contactListId)

        if (!foundContactList) {
          setError('Contact list not found')
          return
        }

        setContactList(foundContactList)

        // Load contacts in this list
        const contactsData = await DatabaseService.getContactsByListId(contactListId)
        setContacts(contactsData)

      } catch (err) {
        console.error('Failed to load contact list data:', err)
        setError('Failed to load contact list data')
      } finally {
        setLoading(false)
      }
    }

    if (contactListId) {
      loadData()
    }
  }, [contactListId])

  const handleDelete = async () => {
    if (!contactList || !confirm('Are you sure you want to delete this contact list? This action cannot be undone.')) {
      return
    }

    try {
      await DatabaseService.deleteContactList(contactList.id)
      toast.success('Contact list deleted successfully!')
      navigate({ to: route.contacts })
    } catch (err) {
      console.error('Failed to delete contact list:', err)
      toast.error('Failed to delete contact list')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'
      case 'Unsubscribed': return 'bg-red-100 text-red-800 border-red-200'
      case 'Bounced': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Complained': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading contact list...</p>
        </div>
      </div>
    )
  }

  if (error || !contactList) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate({ to: route.contacts })}>
            Back to Contacts
          </Button>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: contactList?.name || "Contact List Details" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{contactList.name}</h1>
              <p className="text-muted-foreground">{contactList.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/contacts/$contactListId/edit" params={{ contactListId: contactList.id }}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">List Information</h3>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">List Name</label>
                  <p className="mt-1">{contactList.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{contactList.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="mt-1 text-sm">{new Date(contactList.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="mt-1 text-sm">{new Date(contactList.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Contacts</label>
                  <p className="mt-1 text-2xl font-bold">{contactList.contact_count}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active Contacts</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {contacts.filter(c => c.status === 'Active').length}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unsubscribed</label>
                  <p className="mt-1 text-lg font-semibold text-red-600">
                    {contacts.filter(c => c.status === 'Unsubscribed').length}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6 mt-6">
            {contacts.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.email}</TableCell>
                        <TableCell>
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(contact.status)}`}>
                            {contact.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No contacts in this list</p>
                <p className="text-sm text-muted-foreground">
                  Import contacts to get started with this list
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Contacts', value: contactList.contact_count, color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/10 to-indigo-500/10' },
                { label: 'Active', value: contacts.filter(c => c.status === 'Active').length, color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500/10 to-teal-500/10' },
                { label: 'Unsubscribed', value: contacts.filter(c => c.status === 'Unsubscribed').length, color: 'text-red-600 dark:text-red-400', gradient: 'from-red-500/10 to-orange-500/10' },
                { label: 'Bounced', value: contacts.filter(c => c.status === 'Bounced').length, color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/10 to-yellow-500/10' },
              ].map((stat) => (
                <Card key={stat.label} className="shadow-sm overflow-hidden relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`} />
                  <CardContent className="p-5 relative text-center">
                    <p className={`text-3xl font-display font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}