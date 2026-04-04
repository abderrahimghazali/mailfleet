import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import type { ColumnDef } from '@tanstack/react-table'
import { Mail, Plus, Eye, Edit, Trash2, MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
import { toast } from 'sonner'

export const Route = createFileRoute('/campaigns/')({
  component: CampaignsIndex,
})

interface CampaignWithAnalytics extends Campaign {
  analytics?: CampaignAnalytics
  recipients?: number
}

function CampaignsIndex() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CampaignWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignWithAnalytics | null>(null)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const campaignData = await DatabaseService.getCampaigns()
        const campaignsWithAnalytics = await Promise.all(
          campaignData.map(async (campaign) => {
            try {
              const analytics = await DatabaseService.getCampaignAnalytics(campaign.id)
              return {
                ...campaign,
                analytics: analytics || undefined,
                recipients: analytics?.sent || 0
              }
            } catch {
              return { ...campaign, analytics: undefined, recipients: 0 }
            }
          })
        )
        setCampaigns(campaignsWithAnalytics)
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
      case 'Sending': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
      case 'Paused': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0%'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
  }

  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return
    try {
      await DatabaseService.deleteCampaign(deletingCampaign.id)
      setCampaigns(prev => prev.filter(c => c.id !== deletingCampaign.id))
      toast.success('Campaign deleted successfully!')
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast.error('Failed to delete campaign')
    } finally {
      setDeletingCampaign(null)
    }
  }

  const columns: ColumnDef<CampaignWithAnalytics>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Campaign
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">{row.original.subject}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
      filterFn: (row, _id, value) => {
        if (value === "all") return true
        return row.original.status.toLowerCase() === value
      },
    },
    {
      accessorKey: "recipients",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Recipients
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right">{row.original.recipients?.toLocaleString() || '0'}</div>
      ),
    },
    {
      id: "openRate",
      header: () => <div className="text-right">Open Rate</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.analytics
            ? formatPercentage(row.original.analytics.opened, row.original.analytics.sent)
            : '0%'}
        </div>
      ),
    },
    {
      id: "bounced",
      header: () => <div className="text-right">Bounced</div>,
      cell: ({ row }) => (
        <div className="text-right">{row.original.analytics?.bounced || 0}</div>
      ),
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
        const campaign = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: '/campaigns/$campaignId', params: { campaignId: campaign.id } })}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/campaigns/$campaignId/edit', params: { campaignId: campaign.id } })}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletingCampaign(campaign)}
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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Campaigns</h1>
        <Button size="sm" onClick={() => navigate({ to: '/campaigns/create' })}>
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading campaigns...</p>
          </div>
        </Card>
      ) : campaigns.length > 0 ? (
        <DataTable
          columns={columns}
          data={campaigns}
          searchKey="name"
          searchPlaceholder="Search campaigns..."
        />
      ) : (
        <Card>
          <div className="p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first email campaign to get started</p>
            <Button size="sm" onClick={() => navigate({ to: '/campaigns/create' })}>
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCampaign} onOpenChange={() => setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCampaign?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
