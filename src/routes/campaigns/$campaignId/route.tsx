import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, ContactList, CampaignAnalytics } from '@/types/database'
import {
  Mail,
  Edit,
  Trash2,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Eye,
  Send,
  Clock,
  CheckCircle,
  PauseCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: CampaignDetail,
})

function CampaignDetail() {
  const { campaignId } = Route.useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Load campaign data
        const foundCampaign = await DatabaseService.getCampaignById(campaignId)

        if (!foundCampaign) {
          setError('Campaign not found')
          return
        }

        setCampaign(foundCampaign)

        // Load contact lists
        const lists = await DatabaseService.getContactLists()
        setContactLists(lists)

        // Load analytics
        const analyticsData = await DatabaseService.getCampaignAnalytics(campaignId)
        setAnalytics(analyticsData)

      } catch (err) {
        console.error('Failed to load campaign data:', err)
        setError('Failed to load campaign data')
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      loadData()
    }
  }, [campaignId])

  const handleDelete = async () => {
    if (!campaign || !confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      await DatabaseService.deleteCampaign(campaign.id)
      navigate({ to: route.campaigns })
    } catch (err) {
      console.error('Failed to delete campaign:', err)
      alert('Failed to delete campaign')
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'Draft': return <Edit className="h-5 w-5 text-gray-500" />
      case 'Sending': return <Send className="h-5 w-5 text-blue-500" />
      case 'Scheduled': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'Paused': return <PauseCircle className="h-5 w-5 text-red-500" />
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent': return 'bg-green-100 text-green-800 border-green-200'
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Sending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Paused': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate({ to: route.campaigns })}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  const associatedLists = contactLists.filter(list =>
    campaign.contact_list_ids.includes(list.id)
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <p className="text-muted-foreground">{campaign.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/campaigns/$campaignId/edit" params={{ campaignId: campaign.id }}>
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

        {/* Status Banner */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor(campaign.status)}`}>
          {getStatusIcon(campaign.status)}
          <div>
            <p className="font-medium">Campaign Status: {campaign.status}</p>
            {campaign.scheduled_at && (
              <p className="text-sm opacity-75">
                Scheduled for: {new Date(campaign.scheduled_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Campaign Information</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Campaign Name</label>
                    <p className="mt-1">{campaign.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                    <p className="mt-1">{campaign.subject}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="mt-1 text-sm">{new Date(campaign.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="mt-1 text-sm">{new Date(campaign.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Email Settings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">From Name</label>
                    <p className="mt-1">{campaign.settings.from_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">From Email</label>
                    <p className="mt-1">{campaign.settings.from_email}</p>
                  </div>

                  {campaign.settings.reply_to && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reply To</label>
                      <p className="mt-1">{campaign.settings.reply_to}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Lists & Analytics */}
          <div className="space-y-6">
            {/* Contact Lists */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Contact Lists</h3>
                  <span className="text-sm text-muted-foreground">({associatedLists.length})</span>
                </div>

                {associatedLists.length > 0 ? (
                  <div className="space-y-3">
                    {associatedLists.map((list) => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                        <div>
                          <p className="font-medium">{list.name}</p>
                          <p className="text-sm text-muted-foreground">{list.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{list.contact_count} contacts</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(list.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No contact lists associated with this campaign.</p>
                )}
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Analytics</h3>
                </div>

                {analytics ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-blue-600">{analytics.sent}</p>
                      <p className="text-sm text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-green-600">{analytics.delivered}</p>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-purple-600">{analytics.opened}</p>
                      <p className="text-sm text-muted-foreground">Opened</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-orange-600">{analytics.clicked}</p>
                      <p className="text-sm text-muted-foreground">Clicked</p>
                    </div>
                    {analytics.bounced > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg border">
                        <p className="text-2xl font-bold text-red-600">{analytics.bounced}</p>
                        <p className="text-sm text-muted-foreground">Bounced</p>
                      </div>
                    )}
                    {analytics.complained > 0 && (
                      <div className="text-center p-3 bg-background rounded-lg border">
                        <p className="text-2xl font-bold text-red-600">{analytics.complained}</p>
                        <p className="text-sm text-muted-foreground">Complaints</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No analytics data available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analytics will appear here once the campaign is sent
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}