import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, ContactList, CampaignAnalytics } from '@/types/database'
import { PageHeader } from '@/components/PageHeader'
import {
  Mail,
  Edit,
  Trash2,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Eye,
  AlertCircle
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'

export const Route = createFileRoute('/campaigns_/$campaignId')({
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
      toast.success('Campaign deleted successfully!')
      navigate({ to: route.campaigns })
    } catch (err) {
      console.error('Failed to delete campaign:', err)
      toast.error('Failed to delete campaign')
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

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Campaigns", href: route.campaigns },
    { label: campaign?.name || "Campaign Details" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
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


        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Info
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Campaign Information</h3>

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

              {/* Email Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Email Settings</h3>

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
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            {analytics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-3xl font-bold text-blue-600">{analytics.sent}</p>
                  <p className="text-sm text-muted-foreground mt-1">Sent</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-3xl font-bold text-green-600">{analytics.delivered}</p>
                  <p className="text-sm text-muted-foreground mt-1">Delivered</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-3xl font-bold text-purple-600">{analytics.opened}</p>
                  <p className="text-sm text-muted-foreground mt-1">Opened</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border">
                  <p className="text-3xl font-bold text-orange-600">{analytics.clicked}</p>
                  <p className="text-sm text-muted-foreground mt-1">Clicked</p>
                </div>
                {analytics.bounced > 0 && (
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <p className="text-3xl font-bold text-red-600">{analytics.bounced}</p>
                    <p className="text-sm text-muted-foreground mt-1">Bounced</p>
                  </div>
                )}
                {analytics.complained > 0 && (
                  <div className="text-center p-4 bg-background rounded-lg border">
                    <p className="text-3xl font-bold text-red-600">{analytics.complained}</p>
                    <p className="text-sm text-muted-foreground mt-1">Complaints</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-12">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No analytics data available yet</p>
                <p className="text-sm text-muted-foreground">
                  Analytics will appear here once the campaign is sent
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6 mt-6">
            {associatedLists.length > 0 ? (
              <div className="space-y-4">
                {associatedLists.map((list) => (
                  <div key={list.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div>
                      <p className="font-medium text-lg">{list.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium">{list.contact_count} contacts</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No contact lists associated</p>
                <p className="text-sm text-muted-foreground">
                  This campaign doesn't have any contact lists assigned yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}