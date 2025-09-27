import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="w-full h-8 fixed top-0 left-0 z-50 pointer-events-none" data-tauri-drag-region>
          <div className="w-full h-full pointer-events-auto" data-tauri-drag-region />
        </div>
        <Outlet />
      </SidebarInset>
      <Toaster position="bottom-right" />
    </SidebarProvider>
  )
}