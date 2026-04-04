import * as React from "react"
import { Link, useRouterState } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import {
  BarChart3,
  Bot,
  FileText,
  Github,
  Home,
  LifeBuoy,
  Mail,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const GITHUB_REPO = "https://github.com/abderrahimghazali/mailfleet"

const navItems = [
  { title: "Dashboard", url: route.dashboard, icon: Home },
  { title: "Campaigns", url: route.campaigns, icon: Mail },
  { title: "Contacts", url: route.contacts, icon: Users },
  { title: "Templates", url: route.templates, icon: FileText },
  { title: "Analytics", url: route.analytics, icon: BarChart3 },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isActive = (url: string) => {
    if (url === '/') return currentPath === '/'
    return currentPath.startsWith(url)
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader data-tauri-drag-region>
        <SidebarMenu>
          <SidebarMenuItem className="pt-2">
            <SidebarMenuButton size="lg" asChild>
              <Link to={route.home}>
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl">
                  <img src="/icon-32.png" alt="Mailfleet" className="size-9 rounded-xl" />
                </div>
                <span className="font-display font-bold text-base tracking-tight">MailFleet</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={isActive(item.url)}
                  className="transition-all duration-150"
                >
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" asChild className="text-muted-foreground">
                  <a href={`${GITHUB_REPO}/issues/new?template=support.yml`} target="_blank" rel="noopener">
                    <LifeBuoy className="size-4" />
                    <span>Support</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" asChild className="text-muted-foreground">
                  <a href={`${GITHUB_REPO}/issues/new?template=feature_request.yml`} target="_blank" rel="noopener">
                    <MessageSquare className="size-4" />
                    <span>Feedback</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" asChild className="text-muted-foreground">
                  <a href={GITHUB_REPO} target="_blank" rel="noopener">
                    <Github className="size-4" />
                    <span>GitHub</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              data-active={isActive(route.agents)}
              className="transition-all duration-150"
            >
              <Link to={route.agents}>
                <Bot className="size-4" />
                <span>Agent</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              data-active={isActive(route.settings)}
              className="transition-all duration-150"
            >
              <Link to={route.settings}>
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
