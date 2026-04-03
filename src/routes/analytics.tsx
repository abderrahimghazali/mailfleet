import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import { BarChart3, TrendingUp, Mail, MousePointer, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, Area, AreaChart, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import { toast } from 'sonner'

export const Route = createFileRoute(route.analytics)({
  component: Analytics,
})

function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [allAnalytics, setAllAnalytics] = useState<CampaignAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [campaignsData, analyticsData] = await Promise.all([
          DatabaseService.getCampaigns(),
          DatabaseService.getAllAnalytics(),
        ])
        setCampaigns(campaignsData)
        setAllAnalytics(analyticsData)
      } catch (error) {
        console.error('Failed to load analytics data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Analytics" }
  ]

  const totals = allAnalytics.reduce(
    (acc, a) => ({
      totalSent: acc.totalSent + a.sent,
      totalDelivered: acc.totalDelivered + a.delivered,
      totalOpened: acc.totalOpened + a.opened,
      totalClicked: acc.totalClicked + a.clicked,
      totalBounced: acc.totalBounced + a.bounced,
      totalUnsubscribed: acc.totalUnsubscribed + a.unsubscribed,
    }),
    { totalSent: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, totalUnsubscribed: 0 }
  )

  const formatPct = (num: number, den: number): string => {
    if (den === 0) return '0.0'
    return ((num / den) * 100).toFixed(1)
  }

  const deliveryRate = formatPct(totals.totalDelivered, totals.totalSent)
  const openRate = formatPct(totals.totalOpened, totals.totalDelivered)
  const clickRate = formatPct(totals.totalClicked, totals.totalOpened)
  const bounceRate = formatPct(totals.totalBounced, totals.totalSent)
  const hasSentData = totals.totalSent > 0

  // Chart data: per-campaign bar chart
  const barChartData = allAnalytics.map((a) => {
    const campaign = campaigns.find(c => c.id === a.campaign_id)
    const name = campaign?.name || 'Unknown'
    return {
      name: name.length > 18 ? name.slice(0, 18) + '...' : name,
      delivered: a.delivered,
      opened: a.opened,
      clicked: a.clicked,
      bounced: a.bounced,
    }
  })

  const barConfig: ChartConfig = {
    delivered: { label: "Delivered", color: "var(--color-chart-2)" },
    opened: { label: "Opened", color: "var(--color-chart-1)" },
    clicked: { label: "Clicked", color: "var(--color-chart-4)" },
    bounced: { label: "Bounced", color: "var(--color-chart-5)" },
  }

  // Funnel / pie data
  const funnelData = [
    { name: 'Sent', value: totals.totalSent, fill: 'var(--color-chart-1)' },
    { name: 'Delivered', value: totals.totalDelivered, fill: 'var(--color-chart-2)' },
    { name: 'Opened', value: totals.totalOpened, fill: 'var(--color-chart-3)' },
    { name: 'Clicked', value: totals.totalClicked, fill: 'var(--color-chart-4)' },
  ]

  const pieConfig: ChartConfig = {
    sent: { label: "Sent", color: "var(--color-chart-1)" },
    delivered: { label: "Delivered", color: "var(--color-chart-2)" },
    opened: { label: "Opened", color: "var(--color-chart-3)" },
    clicked: { label: "Clicked", color: "var(--color-chart-4)" },
  }

  // Area chart: cumulative sends over campaigns
  const areaData = allAnalytics.reduce<{ name: string; sent: number; delivered: number }[]>((acc, a, i) => {
    const campaign = campaigns.find(c => c.id === a.campaign_id)
    const prev = acc[i - 1] || { sent: 0, delivered: 0 }
    acc.push({
      name: campaign?.name?.slice(0, 12) || `Campaign ${i + 1}`,
      sent: prev.sent + a.sent,
      delivered: prev.delivered + a.delivered,
    })
    return acc
  }, [])

  const areaConfig: ChartConfig = {
    sent: { label: "Total Sent", color: "var(--color-chart-1)" },
    delivered: { label: "Total Delivered", color: "var(--color-chart-2)" },
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1>Analytics</h1>
            <p className="text-muted-foreground mt-1">Track the performance of your email campaigns</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={polling}
            onClick={async () => {
              setPolling(true)
              try {
                const count = await DatabaseService.pollTrackingEvents()
                if (count > 0) {
                  const analyticsData = await DatabaseService.getAllAnalytics()
                  setAllAnalytics(analyticsData)
                  toast.success(`Updated ${count} event(s)`)
                } else {
                  toast.info('No new events')
                }
              } catch {
                toast.error('Failed to poll events')
              } finally {
                setPolling(false)
              }
            }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${polling ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {!hasSentData && (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaign data yet</h3>
                  <p className="text-muted-foreground">Analytics will appear here once you send your first campaign.</p>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Delivery Rate', value: `${deliveryRate}%`, sub: `${totals.totalDelivered.toLocaleString()} delivered`, icon: Mail, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600 dark:text-blue-400' },
                { label: 'Open Rate', value: `${openRate}%`, sub: `${totals.totalOpened.toLocaleString()} opened`, icon: TrendingUp, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Click Rate', value: `${clickRate}%`, sub: `${totals.totalClicked.toLocaleString()} clicked`, icon: MousePointer, iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600 dark:text-violet-400' },
                { label: 'Bounce Rate', value: `${bounceRate}%`, sub: `${totals.totalBounced.toLocaleString()} bounced`, icon: AlertTriangle, iconBg: 'bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400' },
              ].map((metric) => (
                <Card key={metric.label} className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${metric.iconBg}`}>
                        <metric.icon className={`h-5 w-5 ${metric.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                        <p className="text-2xl font-display font-bold tracking-tight">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.sub}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            {hasSentData && (
              <div className="grid gap-6 lg:grid-cols-5">
                {/* Bar Chart: Campaign Performance */}
                <Card className="lg:col-span-3 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg">Campaign Performance</CardTitle>
                    <CardDescription>Delivered, opened, clicked, and bounced per campaign</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={barConfig} className="h-[300px] w-full">
                      <BarChart data={barChartData} accessibilityLayer>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={4} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="delivered" fill="var(--color-delivered)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="opened" fill="var(--color-opened)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="clicked" fill="var(--color-clicked)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bounced" fill="var(--color-bounced)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Pie Chart: Email Funnel */}
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg">Email Funnel</CardTitle>
                    <CardDescription>From sent to clicked</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <ChartContainer config={pieConfig} className="h-[260px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={funnelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          strokeWidth={2}
                          stroke="var(--background)"
                        >
                          {funnelData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Area Chart: Cumulative Growth */}
            {areaData.length > 1 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg">Cumulative Sends</CardTitle>
                  <CardDescription>Total emails sent and delivered over campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={areaConfig} className="h-[250px] w-full">
                    <AreaChart data={areaData} accessibilityLayer>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={4} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="sent" fill="var(--color-sent)" fillOpacity={0.15} stroke="var(--color-sent)" strokeWidth={2} />
                      <Area type="monotone" dataKey="delivered" fill="var(--color-delivered)" fillOpacity={0.15} stroke="var(--color-delivered)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Campaign Breakdown Table */}
            {allAnalytics.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg">Campaign Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-muted-foreground">Campaign</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Sent</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Delivered</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Opened</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Clicked</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Bounced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAnalytics.map((analytics) => {
                          const campaign = campaigns.find(c => c.id === analytics.campaign_id)
                          return (
                            <tr key={analytics.campaign_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{campaign?.name || 'Unknown'}</td>
                              <td className="text-right p-3">{analytics.sent}</td>
                              <td className="text-right p-3 text-emerald-600">{analytics.delivered}</td>
                              <td className="text-right p-3 text-blue-600">{analytics.opened}</td>
                              <td className="text-right p-3 text-violet-600">{analytics.clicked}</td>
                              <td className="text-right p-3 text-red-600">{analytics.bounced}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  )
}
