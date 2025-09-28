import React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Link } from "@tanstack/react-router"
import { Home } from "lucide-react"

interface BreadcrumbData {
  label: string
  href?: string
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbData[]
}

export function PageHeader({ breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.href} className="flex items-center gap-1">
                        {index === 0 && <Home className="h-4 w-4" />}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-1">
                      {index === 0 && <Home className="h-4 w-4" />}
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}