import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/templates/create')({
  component: CreateTemplate,
})

function CreateTemplate() {
  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Templates", href: route.templates },
    { label: "Create Template" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Create Email Template</h2>
          <p className="text-muted-foreground">Email template editor will be implemented here.</p>
        </div>
      </div>
    </>
  )
}