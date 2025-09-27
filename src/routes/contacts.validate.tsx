import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'

export const Route = createFileRoute('/contacts/validate')({
  component: ValidateContacts,
})

function ValidateContacts() {
  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: "Validate Emails" }
  ]

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Validate Email Addresses</h2>
          <p className="text-muted-foreground">Email validation functionality will be implemented here.</p>
        </div>
      </div>
    </>
  )
}