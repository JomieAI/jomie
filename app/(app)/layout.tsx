import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/sidebar-context"
import { SidebarAwareContent } from "@/components/sidebar-aware-content"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen relative">
        <AppSidebar />
        <SidebarAwareContent>{children}</SidebarAwareContent>
      </div>
    </SidebarProvider>
  )
}
