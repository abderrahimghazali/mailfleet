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
  BarChart3,
  Eye,
  AlertCircle,
  Send,
  CheckCircle2,
  MousePointer,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
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

        // Load contact lists and analytics independently
        const [lists, analyticsData] = await Promise.all([
          DatabaseService.getContactLists().catch(() => []),
          DatabaseService.getCampaignAnalytics(campaignId).catch(() => null),
        ])
        setContactLists(lists)
        setAnalytics(analyticsData)

      } catch (err) {
        console.error('Failed to load campaign data:', err)
        const msg = err instanceof Error ? err.message : String(err)
        setError(`Failed to load campaign: ${msg}`)
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
            {campaign.status === 'Sent' && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await DatabaseService.updateCampaignStatus(campaign.id, 'Draft')
                    setCampaign({ ...campaign, status: 'Draft' })
                    toast.success('Campaign reset to Draft. You can now resend it.')
                  } catch {
                    toast.error('Failed to reset campaign')
                  }
                }}
              >
                <Send className="h-4 w-4" />
                Resend
              </Button>
            )}
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
            {analytics ? (() => {
              const formatPct = (n: number, d: number) => d === 0 ? '0%' : `${((n / d) * 100).toFixed(1)}%`
              const metrics = [
                { label: 'Sent', value: analytics.sent, icon: Send, color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/10 to-indigo-500/10' },
                { label: 'Delivered', value: analytics.delivered, sub: formatPct(analytics.delivered, analytics.sent), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500/10 to-teal-500/10' },
                { label: 'Opened', value: analytics.opened, sub: formatPct(analytics.opened, analytics.sent), icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500/10 to-purple-500/10' },
                { label: 'Clicked', value: analytics.clicked, sub: formatPct(analytics.clicked, analytics.opened), icon: MousePointer, color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/10 to-orange-500/10' },
                { label: 'Bounced', value: analytics.bounced, sub: formatPct(analytics.bounced, analytics.sent), icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', gradient: 'from-red-500/10 to-orange-500/10' },
              ]
              const chartData = [
                { name: 'Sent', value: analytics.sent, fill: 'var(--color-chart-1)' },
                { name: 'Delivered', value: analytics.delivered, fill: 'var(--color-chart-2)' },
                { name: 'Opened', value: analytics.opened, fill: 'var(--color-chart-3)' },
                { name: 'Clicked', value: analytics.clicked, fill: 'var(--color-chart-4)' },
                { name: 'Bounced', value: analytics.bounced, fill: 'var(--color-chart-5)' },
              ]
              const chartConfig: ChartConfig = {
                value: { label: 'Count' },
              }
              return (
                <>
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {metrics.map((m) => (
                      <Card key={m.label} className="card-hover shadow-sm overflow-hidden relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-60`} />
                        <CardContent className="p-5 relative">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground font-medium">{m.label}</p>
                              <p className="text-3xl font-display font-bold mt-1 tracking-tight">{m.value}</p>
                              {m.sub && <p className={`text-xs font-semibold mt-1 ${m.color}`}>{m.sub}</p>}
                            </div>
                            <div className="p-2.5 rounded-xl bg-background/80 shadow-sm">
                              <m.icon className={`h-5 w-5 ${m.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Funnel Chart */}
                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="font-display text-lg font-semibold mb-4">Email Funnel</h3>
                      <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={chartData} accessibilityLayer layout="vertical">
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={70} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Detailed Breakdown */}
                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="font-display text-lg font-semibold mb-4">Delivery Breakdown</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Delivery Rate', value: formatPct(analytics.delivered, analytics.sent), bar: analytics.sent > 0 ? (analytics.delivered / analytics.sent) * 100 : 0, color: 'bg-emerald-500' },
                          { label: 'Open Rate', value: formatPct(analytics.opened, analytics.delivered), bar: analytics.delivered > 0 ? (analytics.opened / analytics.delivered) * 100 : 0, color: 'bg-violet-500' },
                          { label: 'Click Rate', value: formatPct(analytics.clicked, analytics.opened), bar: analytics.opened > 0 ? (analytics.clicked / analytics.opened) * 100 : 0, color: 'bg-amber-500' },
                          { label: 'Bounce Rate', value: formatPct(analytics.bounced, analytics.sent), bar: analytics.sent > 0 ? (analytics.bounced / analytics.sent) * 100 : 0, color: 'bg-red-500' },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{item.label}</span>
                              <span className="text-sm font-semibold">{item.value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${Math.min(item.bar, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )
            })() : (
              <div className="text-center p-12">
                <Eye className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No analytics data yet</p>
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