"use client"

import { usePathname } from "next/navigation"
import {
  LayoutGrid, CheckSquare, Bell, ShoppingCart,
  FileText, BookOpen, Shield, Settings, LogOut,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface MainNavItem {
  icon: React.ElementType
  label: string       // tooltip only — hidden in collapsed rail
  moduleKey: string   // which sub-nav group to show
  href: string
}

interface SubNavItem {
  label: string
  href: string
}

interface SubNavGroup {
  moduleKey: string
  sectionLabel: string
  items: SubNavItem[]
}

// ── Nav data ───────────────────────────────────────────────────────────────

const MAIN_NAV: MainNavItem[] = [
  { icon: LayoutGrid,  label: "Dashboard",    moduleKey: "dashboard",    href: "/dashboard" },
  { icon: ShoppingCart,label: "Procurement",  moduleKey: "procurement",  href: "/p2p/purchase-requests" },
  { icon: CheckSquare, label: "Approval",     moduleKey: "approval",     href: "/approval" },
  { icon: Bell,        label: "Notifications",moduleKey: "notifications", href: "/notifications" },
]

const SUB_NAV: SubNavGroup[] = [
  {
    moduleKey: "procurement",
    sectionLabel: "Procurement",
    items: [
      { label: "Request",        href: "/p2p/purchase-requests" },
      { label: "Approval",       href: "/p2p/approvals" },
      { label: "Purchase Order", href: "/p2p/purchase-orders" },
      { label: "Vendor Master",  href: "/p2p/vendors" },
    ],
  },
  {
    moduleKey: "dashboard",
    sectionLabel: "Dashboard",
    items: [
      { label: "Overview",   href: "/dashboard" },
      { label: "Analytics",  href: "/dashboard/analytics" },
    ],
  },
  {
    moduleKey: "notifications",
    sectionLabel: "Notifications",
    items: [
      { label: "All",      href: "/notifications" },
      { label: "Unread",   href: "/notifications/unread" },
    ],
  },
  {
    moduleKey: "approval",
    sectionLabel: "Approval",
    items: [
      { label: "Pending",  href: "/approval/pending" },
      { label: "History",  href: "/approval/history" },
    ],
  },
]

// Shared active bg style
const ACTIVE_BG = "#1C184E" // secondary-500

// Determine active module from pathname
function getActiveModule(pathname: string): string {
  if (pathname.startsWith("/p2p") || pathname.startsWith("/procurement")) return "procurement"
  if (pathname.startsWith("/approval")) return "approval"
  if (pathname.startsWith("/notifications")) return "notifications"
  return "dashboard"
}

// ── Main icon rail (Layer 1 — 56px) ───────────────────────────────────────

function MainRail({ activeModule }: { activeModule: string }) {
  return (
    <div
      className="fixed left-0 flex flex-col"
      style={{ top: 64, width: 56, height: "calc(100vh - 64px)", padding: "8px 0 24px" }}
    >
      {/* Nav icons */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ padding: "8px 8px 0", gap: 8 }}>
        {MAIN_NAV.map((item) => {
          const isActive = activeModule === item.moduleKey
          return (
            <a
              key={item.moduleKey}
              href={item.href}
              title={item.label}
              className="flex items-center justify-center rounded-lg no-underline transition-colors hover:bg-white/5"
              style={{
                width: 40, height: 40,
                background: isActive ? ACTIVE_BG : "transparent",
                borderRadius: 8,
              }}
            >
              <item.icon size={16} color="white" strokeWidth={1.5} />
            </a>
          )
        })}
      </div>

      {/* Bottom — settings + logout icon only */}
      <div style={{ borderTop: "1px solid #0F0D2B", padding: "8px 8px 0" }}>
        <a href="/settings" title="Settings"
          className="flex items-center justify-center rounded-lg no-underline hover:bg-white/5 transition-colors mb-2"
          style={{ width: 40, height: 40 }}>
          <Settings size={16} color="white" strokeWidth={1.5} />
        </a>
        <a href="/logout" title="Logout"
          className="flex items-center justify-center rounded-lg no-underline hover:bg-white/5 transition-colors"
          style={{ width: 40, height: 40 }}>
          <LogOut size={16} color="white" strokeWidth={1.5} />
        </a>
      </div>
    </div>
  )
}

// ── Sub-module sidebar (Layer 2 — 192px) ──────────────────────────────────

function SubNav({ activeModule, pathname }: { activeModule: string; pathname: string }) {
  const group = SUB_NAV.find(g => g.moduleKey === activeModule)
  if (!group) return null

  return (
    <div
      className="fixed flex flex-col"
      style={{
        left: 56, top: 64,
        width: 192, height: "calc(100vh - 64px)",
        padding: "8px 0 24px",
        borderRadius: 10,
      }}
    >
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ padding: "8px 16px 0", gap: 8 }}>
        {/* Section label */}
        <div style={{
          padding: "0 8px",
          fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 12,
          lineHeight: "18px", color: "#667085",
        }}>
          {group.sectionLabel}
        </div>

        {/* Sub-nav items — text only, no icons */}
        {group.items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center no-underline rounded-lg transition-colors hover:bg-white/5"
              style={{
                width: 160, height: 40,
                padding: "8px 16px",
                background: isActive ? ACTIVE_BG : "transparent",
                borderRadius: 8,
                fontFamily: "var(--font-inter)", fontWeight: 600,
                fontSize: 14, lineHeight: "20px", color: "#FFFFFF",
              }}
            >
              {item.label}
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ── Combined export ────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname()
  const activeModule = getActiveModule(pathname)

  return (
    <>
      <MainRail activeModule={activeModule} />
      <SubNav activeModule={activeModule} pathname={pathname} />
    </>
  )
}
