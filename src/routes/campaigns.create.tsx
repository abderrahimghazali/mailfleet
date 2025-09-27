import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/campaigns/create')({
  component: CreateCampaign,
})

function CreateCampaign() {
  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Campaigns", href: route.campaigns },
    { label: "Create Campaign" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
          <p className="text-muted-foreground">Campaign creation form will be implemented here.</p>
        </div>
      </div>
    </>
  )
}