import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { Campaign, ContactList, Template } from '@/types/database'
import { Mail, Users, FileText, BarChart3, Plus, ArrowRight, Send, TrendingUp } from 'lucide-react'
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
        await DatabaseService.initDatabase()
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

  const breadcrumbs = [{ label: "Dashboard" }]

  const stats = {
    totalCampaigns: campaigns.length,
    draftCampaigns: campaigns.filter(c => c.status === 'Draft').length,
    sentCampaigns: campaigns.filter(c => c.status === 'Sent').length,
    totalContacts: contactLists.reduce((sum, list) => sum + list.contact_count, 0),
    totalTemplates: templates.length,
    totalLists: contactLists.length,
  }

  const recentCampaigns = campaigns.slice(0, 5)

  const statCards = [
    {
      label: 'Campaigns',
      value: stats.totalCampaigns,
      sub: `${stats.draftCampaigns} drafts`,
      icon: Mail,
      color: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: route.campaigns,
    },
    {
      label: 'Contacts',
      value: stats.totalContacts,
      sub: `${stats.totalLists} lists`,
      icon: Users,
      color: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: route.contacts,
    },
    {
      label: 'Templates',
      value: stats.totalTemplates,
      sub: 'reusable designs',
      icon: FileText,
      color: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      href: route.templates,
    },
    {
      label: 'Delivered',
      value: stats.sentCampaigns,
      sub: 'campaigns sent',
      icon: TrendingUp,
      color: 'from-violet-500/10 to-purple-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: route.analytics,
    },
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {/* Welcome section */}
        <div>
          <h1 className="text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your email campaigns and contacts.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.label} to={stat.href} className="group">
              <Card className="card-hover shadow-sm overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-60`} />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-3xl font-display font-bold mt-1 tracking-tight">
                        {loading ? '...' : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 shadow-sm">
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent Campaigns — wider */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-foreground">Recent Campaigns</h2>
                <Link to={route.campaigns} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : recentCampaigns.length > 0 ? (
                <div className="space-y-2">
                  {recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      to="/campaigns/$campaignId"
                      params={{ campaignId: campaign.id }}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{campaign.subject}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 ml-3 px-2.5 py-1 text-[11px] font-medium rounded-full ${
                        campaign.status === 'Sent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        campaign.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        campaign.status === 'Draft' ? 'bg-muted text-muted-foreground' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-2xl bg-muted/50 mb-4">
                    <Send className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">No campaigns yet</p>
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

          {/* Quick Actions — narrower */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-5">Quick Actions</h2>

              <div className="space-y-2">
                {[
                  { to: route.campaignCreate, icon: Mail, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/8', title: 'New Campaign', desc: 'Create an email campaign' },
                  { to: route.contactsImport, icon: Users, iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/8', title: 'Import Contacts', desc: 'Upload a CSV file' },
                  { to: route.templatesCreate, icon: FileText, iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/8', title: 'Design Template', desc: 'Create a reusable email' },
                  { to: route.settings, icon: BarChart3, iconColor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/8', title: 'Configure SES', desc: 'Set up email sending' },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/50 transition-all group"
                  >
                    <div className={`p-2 rounded-lg ${action.bg} group-hover:scale-105 transition-transform`}>
                      <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 ml-auto group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
