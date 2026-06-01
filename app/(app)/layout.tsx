import { AppTopbar } from "@/components/app-topbar"
import { AppSidebar } from "@/components/app-sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      {/* Fixed header — 64px */}
      <AppTopbar />

      {/* Fixed sidebar — 280px, starts below header */}
      <AppSidebar />

      {/* Content area — offset for header + sidebar */}
      <div
        className="ml-[280px] pt-[64px] h-screen overflow-hidden"
        style={{ padding: "0 10px 10px", paddingTop: "74px" }}
      >
        {/* Children manage their own panel layout */}
        {children}
      </div>
    </div>
  )
}
