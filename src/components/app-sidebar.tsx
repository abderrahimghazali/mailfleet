"use client"

import * as React from "react"
import { Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import {
  BarChart3,
  Bot,
  Home,
  LifeBuoy,
  Mail,
  Send,
  Settings,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "MailFleet User",
    email: "user@mailfleet.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: route.dashboard,
      icon: Home,
      isActive: true,
    },
    {
      title: "Campaigns",
      url: route.campaigns,
      icon: Mail,
    },
    {
      title: "Contacts",
      url: route.contacts,
      icon: Users,
    },
    // {
    //   title: "Templates",
    //   url: route.templates,
    //   icon: SquareTerminal,
    // },
    {
      title: "Analytics",
      url: route.analytics,
      icon: BarChart3,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader  data-tauri-drag-region>
        <SidebarMenu>
          <SidebarMenuItem className="pt-2">
            <SidebarMenuButton size="lg" asChild>
              <Link to={route.home}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="/icon-32.png" alt="Mailfleet" className="size-8 rounded-lg" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mailfleet</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={route.agents}>
                <Bot />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={route.settings}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
