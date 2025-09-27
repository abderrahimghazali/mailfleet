import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import { Mail, Plus, Filter, Edit, Trash2, Eye } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const campaignData = await DatabaseService.getCampaigns()

        // Load analytics for each campaign
        const campaignsWithAnalytics = await Promise.all(
          campaignData.map(async (campaign) => {
            try {
              const analytics = await DatabaseService.getCampaignAnalytics(campaign.id)
              return {
                ...campaign,
                analytics,
                recipients: analytics?.sent || 0
              }
            } catch (error) {
              console.error(`Failed to load analytics for campaign ${campaign.id}:`, error)
              return {
                ...campaign,
                analytics: undefined,
                recipients: 0
              }
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
      case 'Sent': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sending': return 'bg-blue-100 text-blue-800'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'Paused': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0%'
    return `${((numerator / denominator) * 100).toFixed(1)}%`
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setDeletingId(campaignId)
      await DatabaseService.deleteCampaign(campaignId)
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate({ to: '/campaigns/create' })}
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Table */}
      {loading ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      ) : campaigns.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Unsubscribed</TableHead>
              <TableHead className="text-right">Bounced</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {campaign.recipients?.toLocaleString() || '0'}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.analytics
                    ? formatPercentage(campaign.analytics.opened, campaign.analytics.sent)
                    : '0%'}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.analytics?.unsubscribed || 0}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.analytics?.bounced || 0}
                </TableCell>
                <TableCell>
                  {new Date(campaign.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right w-32">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate({ to: '/campaigns/$campaignId', params: { campaignId: campaign.id } })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate({ to: '/campaigns/$campaignId/edit', params: { campaignId: campaign.id } })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === campaign.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete Campaign
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
      ) : (
        <div className="p-8 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-4">Create your first email campaign to get started</p>
          <Button
            size="sm"
            onClick={() => navigate({ to: '/campaigns/create' })}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      )}
    </div>
  )
}