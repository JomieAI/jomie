"use client"

import { usePathname } from "next/navigation"
import {
  LayoutGrid, CheckSquare, Bell, ShoppingCart,
  FileText, BookOpen, Shield, Settings, LogOut, MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: number
}

// ── Nav data ───────────────────────────────────────────────────────────────

const MAIN_NAV: NavItem[] = [
  { label: "Dashboard",     icon: LayoutGrid,  href: "/dashboard" },
  { label: "Approval",      icon: CheckSquare, href: "/approval" },
  { label: "Notifications", icon: Bell,        href: "/notifications", badge: 5 },
]

const AGENT_NAV: NavItem[] = [
  { label: "Procurement",    icon: ShoppingCart, href: "/p2p/purchase-requests" },
  { label: "Account Payable",icon: FileText,     href: "/ap/invoices" },
  { label: "Accounting",     icon: BookOpen,     href: "/accounting/journals" },
  { label: "Audit",          icon: Shield,       href: "/audit" },
]

// ── NavItem component ──────────────────────────────────────────────────────

function SidebarNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <a
      href={item.href}
      className="flex flex-row items-center no-underline"
      style={{
        padding: "8px 16px",
        gap: 8,
        width: 248,
        height: 40,
        borderRadius: 6,
        background: active ? "rgba(93,94,244,0.15)" : "transparent",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}
    >
      <item.icon
        size={16}
        strokeWidth={1.5}
        color="white"
        style={{ flexShrink: 0 }}
      />
      <span
        className="flex-1 truncate"
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: "20px",
          color: "#FFFFFF",
        }}
      >
        {item.label}
      </span>
      {item.badge != null && (
        <span
          className="flex items-center justify-center"
          style={{
            width: 16, height: 16,
            background: "#5D5EF4",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 400,
            color: "#FFFFFF",
            fontFamily: "var(--font-inter)",
            lineHeight: 1,
          }}
        >
          {item.badge}
        </span>
      )}
    </a>
  )
}

// ── Section label ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "0 8px",
        fontFamily: "var(--font-inter)",
        fontWeight: 600,
        fontSize: 12,
        lineHeight: "18px",
        color: "#667085",
        marginTop: 8,
      }}
    >
      {label}
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 flex flex-col"
      style={{
        top: 64,
        width: 280,
        height: "calc(100vh - 64px)",
        // inherits gradient from body — transparent so gradient shows through
        background: "transparent",
      }}
    >
      {/* Nav items */}
      <nav
        className="flex flex-col overflow-y-auto flex-1"
        style={{ padding: "8px 16px 0", gap: 8 }}
      >
        {/* Main nav */}
        {MAIN_NAV.map(item => (
          <SidebarNavItem key={item.href} item={item} active={pathname === item.href} />
        ))}

        {/* Agent section */}
        <SectionLabel label="AGENT" />
        {AGENT_NAV.map(item => (
          <SidebarNavItem key={item.href} item={item} active={
            pathname === item.href || pathname.startsWith(item.href.split("/").slice(0, 2).join("/"))
          } />
        ))}
      </nav>

      {/* Bottom — user info + settings + logout */}
      <div
        style={{
          padding: "8px 0 24px",
          borderTop: "1px solid #0F0D2B",
        }}
      >
        {/* User info row */}
        <div
          className="flex flex-row items-center mx-4"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
            padding: "8px 16px",
            gap: 10,
            width: 248,
            height: 52,
            marginBottom: 4,
          }}
        >
          {/* User avatar — primary-25 bg, primary-500 initials */}
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 32, height: 32,
              background: "#F7F7FE",
              color: "#5D5EF4",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-inter)",
            }}
          >
            T
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", fontFamily: "var(--font-inter)" }}>
              Thony
            </div>
            <div style={{ fontSize: 12, fontWeight: 300, color: "#FFFFFF", fontFamily: "var(--font-inter)", opacity: 0.7 }}>
              thony@abc.com.my
            </div>
          </div>
          {/* More button */}
          <button
            className="flex items-center justify-center shrink-0"
            style={{
              width: 24, height: 24,
              background: "#1C184E",
              border: "1px solid #1C184E",
              borderRadius: 8,
            }}
            aria-label="More options"
          >
            <MoreHorizontal size={14} color="white" strokeWidth={1.5} />
          </button>
        </div>

        {/* Settings */}
        <a
          href="/settings"
          className="flex flex-row items-center no-underline mx-4"
          style={{ padding: "8px 16px", gap: 8, width: 248, height: 40, borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <Settings size={16} strokeWidth={1.5} color="white" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", fontFamily: "var(--font-inter)" }}>
            Settings
          </span>
        </a>

        {/* Logout */}
        <a
          href="/logout"
          className="flex flex-row items-center no-underline mx-4"
          style={{ padding: "8px 16px", gap: 8, width: 248, height: 40, borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} strokeWidth={1.5} color="white" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", fontFamily: "var(--font-inter)" }}>
            Logout
          </span>
        </a>
      </div>
    </aside>
  )
}
