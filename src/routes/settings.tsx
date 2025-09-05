import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute(route.settings)({
  component: Settings,
})

function Settings() {
  const breadcrumbs = [
    { label: "Settings" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-2">
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">General Settings</span>
          </div>
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Advanced Settings</span>
          </div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min flex items-center justify-center">
          <span className="text-muted-foreground">Settings Configuration Area</span>
        </div>
      </div>
    </>
  )
}