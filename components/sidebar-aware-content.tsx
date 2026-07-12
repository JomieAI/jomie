"use client"

import { useSidebar } from "@/components/sidebar-context"

export function SidebarAwareContent({ children }: { children: React.ReactNode }) {
  const { l2Open } = useSidebar()

  return (
    <div
      className="bg-white flex flex-col"
      style={{
        marginLeft: l2Open ? 280 : 56,
        height: "100vh",
        overflow: "hidden",
        transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div className="flex-1 bg-white overflow-hidden p-8">
        {children}
      </div>
    </div>
  )
}
