import { AppTopbar } from "@/components/app-topbar"
import { AppSidebar } from "@/components/app-sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <AppTopbar />
      <AppSidebar />
      {/* Content area: 248px left offset (56px icon rail + 192px sub-nav) */}
      <div
        className="overflow-hidden"
        style={{
          marginLeft: 248,
          paddingTop: 74,   // 64px header + 10px gap
          height: "100vh",
          padding: "74px 10px 10px 10px",
        }}
      >
        {children}
      </div>
    </div>
  )
}
