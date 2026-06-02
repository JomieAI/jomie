"use client"

import { useSidebar } from "@/components/sidebar-context"

export function SidebarAwareContent({ children }: { children: React.ReactNode }) {
  const { l2Open } = useSidebar()

  return (
    <div
      style={{
        marginLeft: l2Open ? 280 : 56,
        minHeight: "100vh",
        padding: "10px",
        transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {children}
    </div>
  )
}
