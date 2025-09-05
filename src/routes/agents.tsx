import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute(route.agents)({
  component: Agents,
})

function Agents() {
  const breadcrumbs = [
    { label: "Agents" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Agent Card 1</span>
          </div>
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Agent Card 2</span>
          </div>
          <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
            <span className="text-muted-foreground">Agent Card 3</span>
          </div>
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min flex items-center justify-center">
          <span className="text-muted-foreground">Agents Content Area</span>
        </div>
      </div>
    </>
  )
}