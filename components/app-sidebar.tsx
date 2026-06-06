"use client"

import { useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-context"
import {
  PanelLeft,
  ChevronDown,
  Plus,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Calculator,
  ShieldCheck,
  ListChecks,
  Bell,
  Store,
  Package,
  ArrowLeftRight,
  BarChart3,
  Users,
  BookOpen,
  Cpu,
  Settings,
  LogOut,
  User,
  RefreshCcw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ── Types ──────────────────────────────────────────────────────────────────

type ModuleKey =
  | "dashboard" | "procurement" | "accounts-payable" | "accounting"
  | "audit" | "approvals" | "notifications" | "vendors" | "items"
  | "interco" | "reports" | "practice" | "knowledge" | "automation" | "settings"

interface MainNavItem {
  icon: React.ElementType
  label: string
  moduleKey: ModuleKey
  href: string
  badge?: number
}

interface SubNavItem {
  label: string
  href: string
  badge?: number
  badgeVariant?: "red" | "amber"
  icon?: React.ElementType
  exact?: boolean  // if true, only active on exact path match (not startsWith)
}

interface SubNavGroup {
  moduleKey: ModuleKey
  sectionLabel: string
  items: SubNavItem[]
}

// ── Colours ────────────────────────────────────────────────────────────────

const NAV_ACTIVE_BG  = "rgba(93,94,244,0.18)"
const NAV_HOVER_BG   = "rgba(93,94,244,0.10)"

// ── L1 nav data ────────────────────────────────────────────────────────────

const MAIN_NAV_TOP: MainNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",        moduleKey: "dashboard",        href: "/dashboard" },
  { icon: ShoppingCart,    label: "Procurement",      moduleKey: "procurement",      href: "/p2p/purchase-requests" },
  { icon: Receipt,         label: "Accounts Payable", moduleKey: "accounts-payable", href: "/ap/invoices" },
  { icon: Calculator,      label: "Accounting",       moduleKey: "accounting",       href: "/accounting/journals" },
  { icon: ShieldCheck,     label: "Audit",            moduleKey: "audit",            href: "/audit/findings" },
  { icon: ListChecks,      label: "Approvals",        moduleKey: "approvals",        href: "/approvals",   badge: 4 },
  { icon: Bell,            label: "Notifications",    moduleKey: "notifications",    href: "/notifications", badge: 7 },
]

const MAIN_NAV_MID: MainNavItem[] = [
  { icon: Store,           label: "Vendors",          moduleKey: "vendors",          href: "/vendors" },
  { icon: Package,         label: "Items",            moduleKey: "items",            href: "/items" },
  { icon: ArrowLeftRight,  label: "Inter-company",    moduleKey: "interco",          href: "/interco/transactions" },
  { icon: BarChart3,       label: "Reports",          moduleKey: "reports",          href: "/reports/financial-statements" },
  { icon: Users,           label: "Practice Hub",     moduleKey: "practice",         href: "/practice/clients" },
]

const MAIN_NAV_BOTTOM: MainNavItem[] = [
  { icon: BookOpen,        label: "Knowledge Base",   moduleKey: "knowledge",        href: "/knowledge" },
  { icon: Cpu,             label: "Automation",       moduleKey: "automation",       href: "/automation" },
]

// ── L2 sub-navigation ──────────────────────────────────────────────────────

const SUB_NAV: SubNavGroup[] = [
  {
    moduleKey: "dashboard",
    sectionLabel: "Dashboard",
    items: [
      { label: "Overview",           href: "/dashboard" },
      { label: "Cash Position",      href: "/dashboard/cash" },
      { label: "Upcoming Deadlines", href: "/dashboard/deadlines" },
    ],
  },
  {
    moduleKey: "procurement",
    sectionLabel: "Procurement",
    items: [
      { label: "New Request",        href: "/p2p/purchase-requests/new", icon: Plus, exact: true },
      { label: "Purchase Requests",  href: "/p2p/purchase-requests" },
      { label: "Purchase Orders",    href: "/p2p/purchase-orders" },
      { label: "GRN",                href: "/p2p/grn" },
      { label: "Quotations",         href: "/p2p/quotations" },
      { label: "Standing Orders",    href: "/p2p/standing-orders" },
      { label: "Spend Analytics",    href: "/p2p/spend-analytics" },
      { label: "Budget Tracker",     href: "/p2p/budget-tracker" },
    ],
  },
  {
    moduleKey: "accounts-payable",
    sectionLabel: "Accounts Payable",
    items: [
      { label: "Invoice Inbox",      href: "/ap/invoices",                  badge: 3, badgeVariant: "red" },
      { label: "Payment Runs",       href: "/ap/payment-runs" },
      { label: "Payment History",    href: "/ap/payment-history" },
    ],
  },
  {
    moduleKey: "accounting",
    sectionLabel: "Accounting",
    items: [
      { label: "Journal Entries",      href: "/accounting/journals" },
      { label: "Bank Reconciliation",  href: "/accounting/bank-reconciliation" },
      { label: "Fixed Assets",         href: "/accounting/fixed-assets" },
      { label: "Period Close",         href: "/accounting/period-close" },
      { label: "Financial Reports",    href: "/accounting/reports" },
      { label: "Tax Summary",          href: "/accounting/tax-summary" },
      { label: "Prepayments",          href: "/accounting/prepayments" },
    ],
  },
  {
    moduleKey: "audit",
    sectionLabel: "Audit",
    items: [
      { label: "Findings Queue",       href: "/audit/findings",               badge: 12, badgeVariant: "red" },
      { label: "Controls Health",      href: "/audit/controls-health" },
      { label: "Audit Trail",          href: "/audit/trail" },
      { label: "Compliance Radar",     href: "/audit/compliance" },
      { label: "Audit Reports",        href: "/audit/reports" },
      { label: "Automation Log",       href: "/audit/automation-log" },
    ],
  },
  {
    moduleKey: "approvals",
    sectionLabel: "Approvals",
    items: [
      { label: "All Pending",          href: "/approvals" },
      { label: "My Queue",             href: "/approvals/mine" },
      { label: "Approval History",     href: "/approvals/history" },
      { label: "Escalations",          href: "/approvals/escalations" },
      { label: "Delegation Rules",     href: "/approvals/delegation" },
    ],
  },
  {
    moduleKey: "notifications",
    sectionLabel: "Notifications",
    items: [
      { label: "All",                  href: "/notifications" },
      { label: "Unread",               href: "/notifications/unread" },
      { label: "Mentions",             href: "/notifications/mentions" },
      { label: "System Alerts",        href: "/notifications/system" },
    ],
  },
  {
    moduleKey: "vendors",
    sectionLabel: "Vendors",
    items: [
      { label: "All Vendors",          href: "/vendors" },
      { label: "Onboarding Queue",     href: "/vendors/onboarding-queue",     badge: 2, badgeVariant: "amber" },
      { label: "Risk Scores",          href: "/vendors/risk-scores" },
      { label: "Blacklist",            href: "/vendors/blacklist" },
    ],
  },
  {
    moduleKey: "items",
    sectionLabel: "Items",
    items: [
      { label: "Item Catalogue",       href: "/items" },
      { label: "New Item Requests",    href: "/items/requests",               badge: 1, badgeVariant: "amber" },
      { label: "Price History",        href: "/items/price-history" },
      { label: "Jomie Library",        href: "/items/jomie-library" },
    ],
  },
  {
    moduleKey: "interco",
    sectionLabel: "Inter-company",
    items: [
      { label: "Transaction Log",      href: "/interco/transactions" },
      { label: "Elimination",          href: "/interco/elimination" },
      { label: "Reconciliation",       href: "/interco/reconciliation" },
      { label: "TP Documentation",     href: "/interco/tp-documentation" },
      { label: "Management Fees",      href: "/interco/management-fees" },
    ],
  },
  {
    moduleKey: "reports",
    sectionLabel: "Reports",
    items: [
      { label: "Financial Statements", href: "/reports/financial-statements" },
      { label: "Management Accounts",  href: "/reports/management-accounts" },
      { label: "Audit Report",         href: "/reports/audit-report" },
      { label: "Tax Computation",      href: "/reports/tax-computation" },
      { label: "Custom Reports",       href: "/reports/custom" },
      { label: "Scheduled Reports",    href: "/reports/scheduled" },
    ],
  },
  {
    moduleKey: "practice",
    sectionLabel: "Practice Hub",
    items: [
      { label: "All Clients",          href: "/practice/clients" },
      { label: "Portfolio Health",     href: "/practice/portfolio-health" },
      { label: "Cross-client Audit",   href: "/practice/cross-audit" },
      { label: "Firm Reports",         href: "/practice/firm-reports" },
      { label: "User Management",      href: "/practice/users" },
    ],
  },
  {
    moduleKey: "knowledge",
    sectionLabel: "Knowledge Base",
    items: [
      { label: "Skills Studio",        href: "/knowledge" },
      { label: "Conflict Resolver",    href: "/knowledge/conflicts",          badge: 1, badgeVariant: "amber" },
      { label: "Version History",      href: "/knowledge/history" },
      { label: "Jomie Library",        href: "/knowledge/jomie-library" },
    ],
  },
  {
    moduleKey: "automation",
    sectionLabel: "Automation",
    items: [
      { label: "Active Rules",         href: "/automation" },
      { label: "Consent History",      href: "/automation/consent-history" },
      { label: "Revoke / Pause",       href: "/automation/revoke" },
    ],
  },
  {
    moduleKey: "settings",
    sectionLabel: "Settings",
    items: [
      { label: "Company Profile",        href: "/settings/company" },
      { label: "Entities & Users",       href: "/settings/entities" },
      { label: "Roles & Permissions",    href: "/settings/roles" },
      { label: "Integrations",           href: "/settings/integrations" },
      { label: "Fiscal Year & Currency", href: "/settings/fiscal" },
      { label: "Notifications",          href: "/settings/notifications" },
      { label: "Billing & Plan",         href: "/settings/billing" },
    ],
  },
]

// ── Route → module ─────────────────────────────────────────────────────────

function getActiveModule(pathname: string): ModuleKey {
  if (pathname.startsWith("/ap"))            return "accounts-payable"
  if (pathname.startsWith("/accounting"))    return "accounting"
  if (pathname.startsWith("/audit"))         return "audit"
  if (pathname.startsWith("/approvals"))     return "approvals"
  if (pathname.startsWith("/notifications")) return "notifications"
  if (pathname.startsWith("/vendors"))       return "vendors"
  if (pathname.startsWith("/items"))         return "items"
  if (pathname.startsWith("/interco"))       return "interco"
  if (pathname.startsWith("/reports"))       return "reports"
  if (pathname.startsWith("/practice"))      return "practice"
  if (pathname.startsWith("/knowledge"))     return "knowledge"
  if (pathname.startsWith("/automation"))    return "automation"
  if (pathname.startsWith("/settings"))      return "settings"
  if (pathname.startsWith("/p2p") || pathname.startsWith("/procurement")) return "procurement"
  return "dashboard"
}

// ── Logo components — exact production SVG paths from logos.md ─────────────

/** Full primary logo — white text, dark bg. 318×76 source, scaled to 40px height. */
function LogoFull() {
  return (
    <svg width="167" height="40" viewBox="0 0 318 76" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Jomie">
      <rect x="4.75" y="4.75" width="66.5" height="66.5" rx="20.5833" fill="#5D5EF4"/>
      <path d="M39.9359 22.1038C38.9819 23.0579 38.2481 24.1589 37.6611 25.3333C36.487 22.9111 34.5058 20.9294 32.0842 19.755C33.2583 19.1678 34.359 18.4338 35.313 17.4796C36.2669 16.5254 37.0741 15.4244 37.6611 14.25C38.2481 15.4244 38.9819 16.452 39.9359 17.4796C40.8898 18.4338 41.9905 19.2412 43.1646 19.8284C41.9905 20.3422 40.8898 21.1496 39.9359 22.1038Z" fill="#1C184E"/>
      <path d="M39.1288 58.5834V36.1965C39.1288 30.1043 44.0452 25.1132 50.2091 25.1132V47.5C50.2091 53.5922 45.2193 58.5834 39.1288 58.5834Z" fill="white"/>
      <path d="M30.9102 58.3628C27.8283 58.3628 25.3333 55.8672 25.3333 52.7844C25.3333 49.7016 27.8283 47.2061 30.9102 47.2061C33.9921 47.2061 36.4871 49.7016 36.4871 52.7844C36.4871 55.9406 33.9921 58.3628 30.9102 58.3628Z" fill="white"/>
      <path d="M51.8233 25.1132H50.209V25.627H51.8233V25.1132Z" fill="white"/>
      <g clipPath="url(#sb-logo-clip)">
        <path d="M96.9221 41.5601C96.9221 43.9336 96.1804 45.7878 94.697 47.197C93.2136 48.6062 91.2852 49.3479 88.8376 49.3479H85.5V58.9158H88.9118C92.6944 58.9158 95.9579 58.1741 98.7763 56.6907C101.595 55.2073 103.746 53.1306 105.229 50.4605C106.712 47.7904 107.528 44.6753 107.528 41.1893V17.0842C101.743 17.0842 96.9963 21.8311 96.9963 27.6163V41.5601H96.9221Z" fill="white"/>
        <path d="M149.063 19.0127C145.726 17.1584 141.943 16.1942 137.79 16.1942C133.71 16.1942 130.002 17.1584 126.664 19.0127C123.326 20.9411 120.656 23.537 118.654 26.8004C116.651 30.0639 115.687 33.8465 115.687 38C115.687 42.1535 116.651 45.9362 118.654 49.1996C120.656 52.5372 123.401 55.1332 126.738 56.9874C130.076 58.9158 133.784 59.8058 137.864 59.8058C141.943 59.8058 145.651 58.8416 148.989 56.9874C152.253 55.1332 154.923 52.5372 156.925 49.1996C158.928 45.9362 159.892 42.1535 159.892 38C159.892 33.7724 158.928 29.9897 156.925 26.7263C154.923 23.4628 152.401 20.9411 149.063 19.0127ZM147.951 44.5269C146.912 46.4553 145.577 47.9387 143.871 48.9771C142.166 50.0897 140.163 50.6088 137.864 50.6088C135.639 50.6088 133.636 50.0897 131.856 48.9771C130.076 47.9387 128.741 46.4553 127.702 44.5269C126.738 42.5985 126.219 40.4476 126.219 38C126.219 35.6266 126.738 33.4757 127.702 31.5473C128.667 29.6189 130.076 28.1355 131.782 27.0971C133.488 25.9846 135.49 25.4654 137.79 25.4654C140.089 25.4654 142.091 25.9846 143.797 27.0971C145.503 28.2097 146.838 29.6931 147.877 31.5473C148.915 33.4015 149.36 35.6266 149.36 38C149.434 40.4476 148.915 42.5985 147.951 44.5269Z" fill="white"/>
        <path d="M222.491 18.1968C220.192 16.8617 217.522 16.1942 214.555 16.1942C211.217 16.1942 208.25 17.0101 205.729 18.716C204.023 19.8285 202.688 21.4602 201.575 23.3145C200.685 21.6086 199.498 20.1252 197.718 18.9385C195.122 17.0842 192.081 16.1942 188.67 16.1942C185.554 16.1942 182.81 16.9359 180.511 18.4193C178.953 19.4577 177.841 20.9411 176.951 22.7211V17.0842C171.685 17.0842 167.457 21.3861 167.457 26.5779V58.8416H177.618V34.3657C177.618 32.5115 177.989 30.9539 178.583 29.6189C179.25 28.2838 180.214 27.2455 181.401 26.5779C182.662 25.8362 184.071 25.4654 185.629 25.4654C187.26 25.4654 188.67 25.8362 189.856 26.5779C191.043 27.3196 192.007 28.2838 192.675 29.6189C193.342 30.9539 193.639 32.5115 193.639 34.3657V58.8416H203.726V34.3657C203.726 32.5115 204.023 30.9539 204.69 29.6189C205.358 28.2838 206.322 27.2455 207.509 26.5779C208.77 25.8362 210.179 25.4654 211.736 25.4654C213.368 25.4654 214.777 25.8362 216.038 26.5779C217.225 27.3196 218.189 28.2838 218.857 29.6189C219.524 30.9539 219.821 32.5115 219.821 34.3657V58.8416H229.908V31.9923C229.908 28.8772 229.24 26.1329 227.905 23.7595C226.719 21.3861 224.864 19.5318 222.491 18.1968Z" fill="white"/>
        <path d="M238.437 58.9158H248.599V17.0842C243.036 17.0842 238.437 21.6086 238.437 27.2454V58.9158Z" fill="white"/>
        <path d="M295.919 28.7289C295.029 26.2813 293.694 24.1303 291.914 22.2019C290.134 20.2735 288.057 18.7901 285.609 17.7518C283.162 16.7134 280.195 16.1942 276.931 16.1942C273 16.1942 269.44 17.1584 266.325 19.0127C263.21 20.9411 260.688 23.4628 258.908 26.7263C257.054 29.9897 256.164 33.6982 256.164 37.9259C256.164 42.0052 257.054 45.6395 258.834 48.9771C260.614 52.3147 263.136 54.9107 266.399 56.9132C269.663 58.8416 273.445 59.8058 277.747 59.8058C280.566 59.8058 283.162 59.3608 285.609 58.4708C287.983 57.5808 290.059 56.3941 291.839 54.8365C293.62 53.2789 294.88 51.4989 295.696 49.4963L287.538 45.4911C286.648 47.1229 285.313 48.4579 283.755 49.4221C282.123 50.3863 280.195 50.9055 277.896 50.9055C275.596 50.9055 273.52 50.3863 271.814 49.2738C270.034 48.1612 268.699 46.6779 267.809 44.6753C267.289 43.4886 266.993 42.1535 266.844 40.8185H296.883C297.105 40.2251 297.254 39.5576 297.328 38.8159C297.402 38.0742 297.476 37.3325 297.476 36.5166C297.328 33.8465 296.883 31.1764 295.919 28.7289ZM266.993 33.179C267.141 32.289 267.364 31.4731 267.66 30.7314C268.476 28.7289 269.737 27.1713 271.369 26.1329C273 25.0204 274.855 24.5012 277.006 24.5012C279.231 24.5012 281.085 25.0204 282.642 26.1329C284.2 27.2455 285.313 28.6547 286.054 30.5089C286.351 31.3248 286.499 32.289 286.573 33.179H266.993Z" fill="white"/>
      </g>
      <defs>
        <clipPath id="sb-logo-clip">
          <rect width="211.828" height="43.6116" fill="white" transform="translate(85.5 16.1942)"/>
        </clipPath>
      </defs>
    </svg>
  )
}

/** Favicon mark only — exact jomie-favicon.svg. 74×74 source, displayed at 34px. */
function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Jomie">
      <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
      <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
      <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
      <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
      <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
    </svg>
  )
}

// ── L1 icon button with tooltip ────────────────────────────────────────────

function NavIcon({ item, isActive }: { item: MainNavItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [tooltipY, setTooltipY] = useState(0)
  const [tooltipX, setTooltipX] = useState(0)
  const anchorRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setTooltipY(rect.top + rect.height / 2)
      setTooltipX(rect.right + 8)   // always right of the icon, regardless of sidebar width
    }
    setHovered(true)
  }

  return (
    <>
      <a
        ref={anchorRef}
        href={item.href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center no-underline"
        style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: isActive ? NAV_ACTIVE_BG : hovered ? NAV_HOVER_BG : "transparent",
          transition: "background 0.15s ease",
        }}
      >
        <item.icon size={17} strokeWidth={2}
          color={isActive ? "#A5B4FC" : "rgba(255,255,255,0.55)"} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute flex items-center justify-center" style={{
            top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7,
            background: "#EF4444", fontSize: 9, fontWeight: 700, color: "#fff",
            lineHeight: 1, padding: "0 3px", fontFamily: "var(--font-inter)",
          }}>
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </a>
      {hovered && (
        <div style={{
          position: "fixed", left: tooltipX, top: tooltipY,
          transform: "translateY(-50%)", zIndex: 200,
          background: "#101828", border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 6, padding: "5px 10px",
          fontSize: 12, fontWeight: 500, color: "#fff",
          whiteSpace: "nowrap", pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          fontFamily: "var(--font-inter)",
        }}>
          {item.label}
        </div>
      )}
    </>
  )
}

// ── L2 sub-nav item ────────────────────────────────────────────────────────

function SubNavItem({ item, isActive }: { item: SubNavItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-between no-underline"
      style={{
        padding: "8px 16px", borderRadius: 8,
        background: isActive ? NAV_ACTIVE_BG : hovered ? NAV_HOVER_BG : "transparent",
        fontFamily: "var(--font-inter)", fontWeight: isActive ? 600 : 400,
        fontSize: 14, lineHeight: "20px",
        color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.6)",
        transition: "background 0.15s ease",
      }}
    >
      <span className="flex items-center gap-2">
        {item.icon && <item.icon size={16} strokeWidth={2} />}
        {item.label}
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9,
          background: item.badgeVariant === "amber" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
          color: item.badgeVariant === "amber" ? "#FBBF24" : "#F87171",
          fontSize: 10, fontWeight: 700, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "0 4px", flexShrink: 0,
        }}>
          {item.badge}
        </span>
      )}
    </a>
  )
}

// ── Bottom text nav item (Settings / Logout) ───────────────────────────────

function BottomNavItem({
  icon: Icon, label, href, danger = false,
}: {
  icon: React.ElementType; label: string; href: string; danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 no-underline"
      style={{
        padding: "8px 16px", borderRadius: 8, width: "100%",
        background: hovered ? NAV_HOVER_BG : "transparent",
        fontFamily: "var(--font-inter)", fontWeight: 600,
        fontSize: 14, lineHeight: "20px",
        color: danger ? "#F87171" : "#fff",
        transition: "background 0.15s ease",
      }}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </a>
  )
}

// ── Main sidebar component ──────────────────────────────────────────────────

export function AppSidebar() {
  const pathname    = usePathname()
  const { l2Open, toggleL2 } = useSidebar()
  const activeModule = getActiveModule(pathname)
  const subGroup    = SUB_NAV.find(g => g.moduleKey === activeModule)
  const ALL_L1      = [...MAIN_NAV_TOP, ...MAIN_NAV_MID, ...MAIN_NAV_BOTTOM]

  return (
    <div
      className="fixed left-0 top-0 flex flex-col"
      style={{
        width: l2Open ? 280 : 56,
        height: "100vh",
        background: "linear-gradient(45deg, #141137 0%, #191647 100%)",
        zIndex: 40,
        overflow: "hidden",
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── TOP: Logo + toggle ──────────────────────────────── */}
      {l2Open ? (
        /* ── EXPANDED top section ── */
        <div style={{ padding: "24px 16px 16px", flexShrink: 0 }}>
          {/* Logo row: full logo left, PanelLeft right */}
          <div className="flex items-center" style={{ paddingLeft: 8, gap: 8, height: 40, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <LogoFull />
            </div>
            <button
              onClick={toggleL2}
              className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5 active:bg-white/10 flex-shrink-0"
              style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer" }}
            >
              <PanelLeft size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </button>
          </div>

          {/* WORKSPACE label */}
          <div style={{
            padding: "0 8px",
            fontFamily: "var(--font-inter)", fontWeight: 600,
            fontSize: 12, lineHeight: "18px", color: "#667085",
          }}>
            WORKSPACE
          </div>

          {/* Entity selector */}
          <div
            className="flex items-center cursor-pointer"
            style={{
              padding: "8px 16px", gap: 10, marginTop: 8,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8, width: "100%",
            }}
          >
            <div className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 32, height: 32, background: "#F7F7FE",
                fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#5D5EF4" }}>
              A
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 12,
                lineHeight: "18px", color: "#fff", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>
                ABC Retails Sdn Bhd
              </span>
              <span style={{ fontFamily: "var(--font-inter)", fontWeight: 300, fontSize: 12,
                lineHeight: "18px", color: "rgba(255,255,255,0.6)" }}>
                14 Entities · MYR
              </span>
            </div>
            <ChevronDown size={16} color="white" strokeWidth={2} style={{ flexShrink: 0 }} />
          </div>
        </div>
      ) : (
        /* ── COLLAPSED top section: favicon + toggle centred in 56px column ── */
        <div style={{ flexShrink: 0, padding: "20px 0 8px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {/* Favicon — centred in 40×40 same width as nav icons */}
          <div style={{ width: 40, height: 40, display: "flex",
            alignItems: "center", justifyContent: "center" }}>
            <LogoMark />
          </div>
          {/* PanelLeft — centred in 40×40 same width as nav icons */}
          <button
            onClick={toggleL2}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ width: 40, height: 40, border: "none", background: "transparent", cursor: "pointer" }}
          >
            <PanelLeft size={16} color="rgba(255,255,255,0.55)" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── MIDDLE: L1 rail + L2 text nav ──────────────────── */}
      <div className="flex flex-row flex-1 min-h-0" style={{ overflow: "hidden" }}>

        {/* L1 icon rail — always visible */}
        <div
          className="flex flex-col overflow-y-auto overflow-x-hidden"
          style={{
            width: 56, flexShrink: 0,
            padding: "0 8px", gap: 4,
            scrollbarWidth: "none",
          }}
        >
          {MAIN_NAV_TOP.map(item => (
            <NavIcon key={item.moduleKey} item={item} isActive={activeModule === item.moduleKey} />
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

          {MAIN_NAV_MID.map(item => (
            <NavIcon key={item.moduleKey} item={item} isActive={activeModule === item.moduleKey} />
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

          {MAIN_NAV_BOTTOM.map(item => (
            <NavIcon key={item.moduleKey} item={item} isActive={activeModule === item.moduleKey} />
          ))}
        </div>

        {/* L2 text nav — only when expanded */}
        {l2Open && subGroup && (
          <div
            className="flex flex-col flex-1 overflow-y-auto"
            style={{ padding: "0 8px 8px", scrollbarWidth: "none", minWidth: 0 }}
          >
            {/* Section label */}
            <div style={{
              padding: "0 8px 8px",
              fontFamily: "var(--font-inter)", fontWeight: 600,
              fontSize: 12, lineHeight: "18px", letterSpacing: "0.05em",
              textTransform: "uppercase", color: "#667085",
            }}>
              {subGroup.sectionLabel}
            </div>

            {subGroup.items.map(item => {
              const p = pathname.replace(/\/$/, "")  // strip trailing slash
              const isActive = p === item.href ||
                (!item.exact && item.href !== "/" && p.startsWith(item.href + "/") &&
                  !subGroup.items.some(other => other.href !== item.href && p === other.href))
              return <SubNavItem key={item.href} item={item} isActive={isActive} />
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM: User info + Settings + Logout ──────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid #0F0D2B",
        padding: "8px 0 24px",
      }}>
        {l2Open ? (
          /* Expanded: full user card + text links */
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* User card */}
            <div className="flex items-center" style={{
              padding: "8px 16px", gap: 10,
              background: "rgba(255,255,255,0.05)", borderRadius: 8,
            }}>
              {/* User avatar */}
              <div className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 32, height: 32, background: "#F7F7FE",
                  fontFamily: "var(--font-inter)", fontSize: 12, fontWeight: 700, color: "#5D5EF4",
                }}>
                T
              </div>
              {/* Name + email */}
              <div className="flex flex-col flex-1 min-w-0">
                <span style={{
                  fontFamily: "var(--font-inter)", fontWeight: 600,
                  fontSize: 12, lineHeight: "18px", color: "#fff",
                }}>
                  Thony
                </span>
                <span style={{
                  fontFamily: "var(--font-inter)", fontWeight: 300,
                  fontSize: 12, lineHeight: "18px", color: "rgba(255,255,255,0.6)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  thony@abc.com.my
                </span>
              </div>
              {/* "..." menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus:outline-none flex-shrink-0"
                  style={{
                    width: 24, height: 24, border: "1px solid #1C184E",
                    background: "#1C184E", cursor: "pointer",
                    boxShadow: "0px 1px 2px rgba(16,24,40,0.05)", borderRadius: 8,
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 14, letterSpacing: 1, lineHeight: 1 }}>···</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top" align="end"
                  className="w-48 p-0 overflow-hidden"
                  style={{
                    background: "#101828", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                  }}
                >
                  <div style={{ padding: "8px 12px 6px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "var(--font-inter)" }}>Thony</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>thony@abc.com.my</p>
                  </div>
                  <div style={{ padding: "4px" }}>
                    <DropdownMenuItem
                      className="flex items-center gap-2 rounded-lg cursor-pointer"
                      style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)" }}
                      onClick={() => { window.location.href = "/settings/profile" }}
                    >
                      <User size={14} strokeWidth={2} /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 rounded-lg cursor-pointer"
                      style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "var(--font-inter)" }}
                      onClick={() => { window.location.href = "/settings/entities" }}
                    >
                      <RefreshCcw size={14} strokeWidth={2} /> Switch Entity
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                    <DropdownMenuItem
                      className="flex items-center gap-2 rounded-lg cursor-pointer"
                      style={{ padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#F87171", fontFamily: "var(--font-inter)" }}
                      onClick={() => { window.location.href = "/logout" }}
                    >
                      <LogOut size={14} strokeWidth={2} /> Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Settings + Logout text items */}
            <BottomNavItem icon={Settings} label="Settings" href="/settings/company" />
            <BottomNavItem icon={LogOut}   label="Logout"   href="/logout" danger />
          </div>
        ) : (
          /* Collapsed: just small icons */
          <div className="flex flex-col items-center" style={{ padding: "0 8px", gap: 4 }}>
            <a href="/settings/company" title="Settings"
              className="flex items-center justify-center rounded-lg no-underline hover:bg-white/5 transition-colors"
              style={{ width: 40, height: 40 }}>
              <Settings size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            </a>
            <a href="/logout" title="Logout"
              className="flex items-center justify-center rounded-lg no-underline hover:bg-white/5 transition-colors"
              style={{ width: 40, height: 40 }}>
              <LogOut size={16} color="rgba(255,255,255,0.35)" strokeWidth={2} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
