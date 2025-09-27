import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/campaigns')({
  component: CampaignsLayout,
})

function CampaignsLayout() {
  const location = useLocation()

  const getBreadcrumbs = () => {
    const baseBreadcrumbs = [
      { label: "Dashboard", href: route.dashboard },
      { label: "Campaigns", href: route.campaigns }
    ]

    // Add specific breadcrumb based on current route
    if (location.pathname === '/campaigns/create') {
      return [...baseBreadcrumbs, { label: "Create Campaign" }]
    }

    if (location.pathname.includes('/edit')) {
      return [...baseBreadcrumbs, { label: "Edit Campaign" }]
    }

    if (location.pathname.match(/\/campaigns\/[^/]+$/)) {
      return [...baseBreadcrumbs, { label: "Campaign Details" }]
    }

    return baseBreadcrumbs
  }

  return (
    <>
      <PageHeader breadcrumbs={getBreadcrumbs()} />
      <Outlet />
    </>
  )
}