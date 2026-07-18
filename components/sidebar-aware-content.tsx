"use client"

import { useSidebar } from "@/components/sidebar-context"

export function SidebarAwareContent({ children }: { children: React.ReactNode }) {
  const { l2Open } = useSidebar()

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: '#F2F3F3',
        marginLeft: l2Open ? 280 : 56,
        height: "100vh",
        overflow: "hidden",
        transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div className="flex-1 overflow-hidden p-8" style={{ backgroundColor: '#F2F3F3' }}>
        {children}
      </div>
    </div>
  )
}
