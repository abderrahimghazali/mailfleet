import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign } from '@/types/database'
import { Mail, Plus, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute(route.campaigns)({
  component: Campaigns,
})

function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await DatabaseService.getCampaigns()
        setCampaigns(data)
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Campaigns" }
  ]

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

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
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

          <Button asChild size="sm">
            <Link to={route.campaignCreate}>
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>

        {/* Campaigns List */}
        <div className="bg-muted/50 rounded-xl">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="divide-y">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {campaign.settings.from_name} &lt;{campaign.settings.from_email}&gt;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Lists: {campaign.contact_list_ids.length}
                        </p>
                      </div>

                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>

                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-sm border rounded hover:bg-accent">
                          Edit
                        </button>
                        <button className="px-3 py-1 text-sm border rounded hover:bg-accent">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first email campaign to get started</p>
              <Button asChild size="sm">
                <Link to={route.campaignCreate}>
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}