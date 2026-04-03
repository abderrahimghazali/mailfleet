import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, CampaignAnalytics } from '@/types/database'
import { BarChart3, TrendingUp, Mail, MousePointer, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute(route.analytics)({
  component: Analytics,
})

function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [allAnalytics, setAllAnalytics] = useState<CampaignAnalytics[]>([])
  const [loading, setLoading] = useState(true)

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

  // Aggregate real analytics
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

  const getOpenRateForCampaign = (campaignId: string): string => {
    const analytics = allAnalytics.find(a => a.campaign_id === campaignId)
    if (!analytics || analytics.sent === 0) return 'N/A'
    return `${formatPct(analytics.opened, analytics.sent)}%`
  }

  const hasSentData = totals.totalSent > 0

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Track the performance of your email campaigns
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {!hasSentData && (
              <div className="bg-muted/50 rounded-xl p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaign data yet</h3>
                <p className="text-muted-foreground">
                  Analytics will appear here once you send your first campaign.
                </p>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-bold">{deliveryRate}%</p>
                    <p className="text-xs text-muted-foreground">{totals.totalDelivered.toLocaleString()} delivered</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">{openRate}%</p>
                    <p className="text-xs text-muted-foreground">{totals.totalOpened.toLocaleString()} opened</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                    <MousePointer className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">{clickRate}%</p>
                    <p className="text-xs text-muted-foreground">{totals.totalClicked.toLocaleString()} clicked</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">{bounceRate}%</p>
                    <p className="text-xs text-muted-foreground">{totals.totalBounced.toLocaleString()} bounced</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Email Performance */}
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Email Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Sent</span>
                    <span className="font-medium">{totals.totalSent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <span className="font-medium text-green-600">{totals.totalDelivered.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opened</span>
                    <span className="font-medium text-blue-600">{totals.totalOpened.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clicked</span>
                    <span className="font-medium text-purple-600">{totals.totalClicked.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounced</span>
                    <span className="font-medium text-red-600">{totals.totalBounced.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unsubscribed</span>
                    <span className="font-medium text-red-600">{totals.totalUnsubscribed.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Campaigns</h3>
                {campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{getOpenRateForCampaign(campaign.id)}</p>
                          <p className="text-xs text-muted-foreground">Open rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No campaign data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Analytics Table */}
            {allAnalytics.length > 0 && (
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Campaign Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Campaign</th>
                        <th className="text-right p-2 font-medium">Sent</th>
                        <th className="text-right p-2 font-medium">Delivered</th>
                        <th className="text-right p-2 font-medium">Opened</th>
                        <th className="text-right p-2 font-medium">Clicked</th>
                        <th className="text-right p-2 font-medium">Bounced</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAnalytics.map((analytics) => {
                        const campaign = campaigns.find(c => c.id === analytics.campaign_id)
                        return (
                          <tr key={analytics.campaign_id} className="border-b last:border-0">
                            <td className="p-2">{campaign?.name || 'Unknown'}</td>
                            <td className="text-right p-2">{analytics.sent}</td>
                            <td className="text-right p-2 text-green-600">{analytics.delivered}</td>
                            <td className="text-right p-2 text-blue-600">{analytics.opened}</td>
                            <td className="text-right p-2 text-purple-600">{analytics.clicked}</td>
                            <td className="text-right p-2 text-red-600">{analytics.bounced}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
