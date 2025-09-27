import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, Contact } from '@/types/database'
import { Users, Plus, Upload, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

export const Route = createFileRoute(route.contacts)({
  component: Contacts,
})

function Contacts() {
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [listsData, contactsData] = await Promise.all([
          DatabaseService.getContactLists(),
          DatabaseService.getContacts(),
        ])
        setContactLists(listsData)
        setContacts(contactsData)
      } catch (error) {
        console.error('Failed to load contacts data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Unsubscribed': return 'bg-red-100 text-red-800'
      case 'Bounced': return 'bg-yellow-100 text-yellow-800'
      case 'Complained': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalContacts = contactLists.reduce((sum, list) => sum + list.contact_count, 0)

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">
              {totalContacts} total contacts across {contactLists.length} lists
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={route.contactsValidate}>
                <CheckCircle className="h-4 w-4" />
                Validate Emails
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={route.contactsImport}>
                <Upload className="h-4 w-4" />
                Import Contacts
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={route.contactsCreateList}>
                <Plus className="h-4 w-4" />
                Create List
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact Lists */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Loading contact lists...</p>
            </div>
          ) : contactLists.length > 0 ? (
            contactLists.map((list) => (
              <div key={list.id} className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{list.name}</h3>
                    <p className="text-sm text-muted-foreground">{list.contact_count} contacts</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {list.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Created: {new Date(list.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-1 text-sm border rounded hover:bg-accent">
                    View Contacts
                  </button>
                  <button className="px-3 py-1 text-sm border rounded hover:bg-accent">
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-muted/50 rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contact lists yet</h3>
              <p className="text-muted-foreground mb-4">Create your first contact list to start managing your audience</p>
              <Button size="sm" asChild>
                <Link to={route.contactsCreateList}>
                  <Plus className="h-4 w-4" />
                  Create First List
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent Contacts */}
        {contacts.length > 0 && (
          <div className="bg-muted/50 rounded-xl">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Contacts</h3>
            </div>

            <div className="divide-y">
              {contacts.slice(0, 10).map((contact) => (
                <div key={contact.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(contact.first_name?.[0] || contact.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : contact.email
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Added: {new Date(contact.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lists: {contact.list_ids.length}
                        </p>
                      </div>

                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {contacts.length > 10 && (
              <div className="p-4 text-center border-t">
                <button className="text-sm text-primary hover:underline">
                  View all {contacts.length} contacts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}