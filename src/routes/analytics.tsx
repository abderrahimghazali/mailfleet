import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign } from '@/types/database'
import { BarChart3, TrendingUp, Mail, MousePointer, AlertTriangle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute(route.analytics)({
  component: Analytics,
})

function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const campaignsData = await DatabaseService.getCampaigns()
        setCampaigns(campaignsData)

        // TODO: Load analytics data for each campaign
        // const analyticsPromises = campaignsData.map(c => DatabaseService.getCampaignAnalytics(c.id))
        // const analyticsData = await Promise.all(analyticsPromises)

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

  // Mock analytics data for demonstration
  const mockAnalytics = {
    totalSent: 15420,
    totalDelivered: 14890,
    totalOpened: 4467,
    totalClicked: 892,
    totalBounced: 530,
    totalUnsubscribed: 23,
  }

  const deliveryRate = ((mockAnalytics.totalDelivered / mockAnalytics.totalSent) * 100).toFixed(1)
  const openRate = ((mockAnalytics.totalOpened / mockAnalytics.totalDelivered) * 100).toFixed(1)
  const clickRate = ((mockAnalytics.totalClicked / mockAnalytics.totalOpened) * 100).toFixed(1)
  const bounceRate = ((mockAnalytics.totalBounced / mockAnalytics.totalSent) * 100).toFixed(1)

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Track the performance of your email campaigns
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-bold">{deliveryRate}%</p>
                    <p className="text-xs text-green-600">↗ +2.1% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">{openRate}%</p>
                    <p className="text-xs text-green-600">↗ +1.5% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MousePointer className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">{clickRate}%</p>
                    <p className="text-xs text-red-600">↘ -0.3% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">{bounceRate}%</p>
                    <p className="text-xs text-green-600">↘ -0.8% from last month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Campaign Performance */}
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Email Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Sent</span>
                    <span className="font-medium">{mockAnalytics.totalSent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivered</span>
                    <span className="font-medium text-green-600">{mockAnalytics.totalDelivered.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Opened</span>
                    <span className="font-medium text-blue-600">{mockAnalytics.totalOpened.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clicked</span>
                    <span className="font-medium text-purple-600">{mockAnalytics.totalClicked.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounced</span>
                    <span className="font-medium text-red-600">{mockAnalytics.totalBounced.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unsubscribed</span>
                    <span className="font-medium text-red-600">{mockAnalytics.totalUnsubscribed.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Top Performing Campaigns */}
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
                          <p className="text-sm font-medium">N/A</p>
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

            {/* Chart Placeholder */}
            <div className="bg-muted/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
              <div className="h-64 bg-background rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}