import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, Contact } from '@/types/database'
import { Users, Plus, Upload, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

export const Route = createFileRoute('/contacts/')({
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
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'
      case 'Unsubscribed': return 'bg-red-100 text-red-800 border-red-200'
      case 'Bounced': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Complained': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const totalContacts = contactLists.reduce((sum, list) => sum + list.contact_count, 0)

  const handleDeleteContactList = async (listId: string, listName: string) => {
    try {
      await DatabaseService.deleteContactList(listId)

      // Remove from local state
      setContactLists(prev => prev.filter(list => list.id !== listId))

      toast.success(`Contact list "${listName}" deleted successfully`)
    } catch (error) {
      console.error('Failed to delete contact list:', error)
      toast.error('Failed to delete contact list')
    }
  }

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
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading contact lists...</p>
          </div>
        ) : contactLists.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>List Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {list.description || 'No description provided'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{list.contact_count}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(list.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right w-40">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                          asChild
                        >
                          <Link to="/contacts/$contactListId" params={{ contactListId: list.id }}>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-yellow-50"
                          asChild
                        >
                          <Link to="/contacts/$contactListId/edit" params={{ contactListId: list.id }}>
                            <Edit className="h-4 w-4 text-yellow-600" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contact List</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the contact list "{list.name}"?
                                This action cannot be undone and will remove all contacts in this list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteContactList(list.id, list.name)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-8 text-center">
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
    </>
  )
}