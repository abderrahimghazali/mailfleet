import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, ContactList, Template } from '@/types/database'
import { Mail, Users, FileText, BarChart3, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute(route.home)({
  component: Dashboard,
})

function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initializeAndLoadData() {
      try {
        // Initialize database first
        await DatabaseService.initDatabase()

        // Load all data in parallel
        const [campaignsData, contactListsData, templatesData] = await Promise.all([
          DatabaseService.getCampaigns(),
          DatabaseService.getContactLists(),
          DatabaseService.getTemplates(),
        ])

        setCampaigns(campaignsData)
        setContactLists(contactListsData)
        setTemplates(templatesData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAndLoadData()
  }, [])

  const breadcrumbs = [
    { label: "Dashboard" }
  ]

  const stats = {
    totalCampaigns: campaigns.length,
    draftCampaigns: campaigns.filter(c => c.status === 'Draft').length,
    sentCampaigns: campaigns.filter(c => c.status === 'Sent').length,
    totalContacts: contactLists.reduce((sum, list) => sum + list.contact_count, 0),
    totalTemplates: templates.length,
  }

  const recentCampaigns = campaigns.slice(0, 5)

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Stats Cards */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                  <p className="text-2xl font-bold">{loading ? '...' : stats.totalCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">{loading ? '...' : stats.totalContacts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold">{loading ? '...' : stats.totalTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent Campaigns</p>
                  <p className="text-2xl font-bold">{loading ? '...' : stats.sentCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Campaigns */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Campaigns</h3>
                <Link to={route.campaigns} className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>

              {loading ? (
                <p className="text-muted-foreground">Loading campaigns...</p>
              ) : recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'Sent' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No campaigns yet</p>
                  <Button size="sm" asChild>
                    <Link to={route.campaignCreate}>
                      <Plus className="h-4 w-4" />
                      Create First Campaign
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

              <div className="grid gap-3">
                <Link
                  to={route.campaignCreate}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-accent transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Create Campaign</p>
                    <p className="text-sm text-muted-foreground">Start a new email campaign</p>
                  </div>
                </Link>

                <Link
                  to={route.contactsImport}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-accent transition-colors"
                >
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Import Contacts</p>
                    <p className="text-sm text-muted-foreground">Add contacts to your lists</p>
                  </div>
                </Link>

                <Link
                  to={route.templatesCreate}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Create Template</p>
                    <p className="text-sm text-muted-foreground">Design an email template</p>
                  </div>
                </Link>

                <Link
                  to={route.settings}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-accent transition-colors"
                >
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Setup AWS SES</p>
                    <p className="text-sm text-muted-foreground">Configure email sending</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}