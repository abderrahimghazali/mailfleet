import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/analytics/overview')({
  component: AnalyticsOverview,
})

function AnalyticsOverview() {
  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Analytics", href: route.analytics },
    { label: "Performance Overview" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
          <p className="text-muted-foreground">Advanced analytics overview will be implemented here.</p>
        </div>
      </div>
    </>
  )
}