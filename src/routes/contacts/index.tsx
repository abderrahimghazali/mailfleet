import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList } from '@/types/database'
import type { ColumnDef } from '@tanstack/react-table'
import { Users, Plus, Upload, CheckCircle, Eye, Edit, Trash2, MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { DataTable } from "@/components/ui/data-table"

export const Route = createFileRoute('/contacts/')({
  component: Contacts,
})

function Contacts() {
  const navigate = useNavigate()
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingList, setDeletingList] = useState<ContactList | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const listsData = await DatabaseService.getContactLists()
        setContactLists(listsData)
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

  const totalContacts = contactLists.reduce((sum, list) => sum + list.contact_count, 0)

  const handleDeleteContactList = async () => {
    if (!deletingList) return
    try {
      await DatabaseService.deleteContactList(deletingList.id)
      setContactLists(prev => prev.filter(list => list.id !== deletingList.id))
      toast.success(`Contact list "${deletingList.name}" deleted`)
    } catch (error) {
      console.error('Failed to delete contact list:', error)
      toast.error('Failed to delete contact list')
    } finally {
      setDeletingList(null)
    }
  }

  const columns: ColumnDef<ContactList>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          List Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate max-w-[250px]">
          {row.original.description || 'No description'}
        </div>
      ),
    },
    {
      accessorKey: "contact_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contacts
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.contact_count}</div>,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const list = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: '/contacts/$contactListId', params: { contactListId: list.id } })}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/contacts/$contactListId/edit', params: { contactListId: list.id } })}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletingList(list)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
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

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading contact lists...</p>
          </div>
        ) : contactLists.length > 0 ? (
          <DataTable
            columns={columns}
            data={contactLists}
            searchKey="name"
            searchPlaceholder="Search contact lists..."
          />
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingList} onOpenChange={() => setDeletingList(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingList?.name}"? This action cannot be undone and will remove all contacts in this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContactList}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
