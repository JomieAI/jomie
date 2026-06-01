"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  ClipboardList, CheckCircle, Package, ClipboardCheck, CreditCard,
  Mail, Clock, BookOpen, RefreshCw, CalendarDays, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const p2pItems = [
  { label: "Purchase Requests", icon: ClipboardList, href: "/p2p/purchase-requests", badge: "3", badgeVariant: "amber" as const },
  { label: "Approvals",         icon: CheckCircle,   href: "/p2p/approvals",          badge: "2", badgeVariant: "amber" as const },
  { label: "Purchase Orders",   icon: Package,       href: "/p2p/purchase-orders" },
  { label: "Goods Receipt",     icon: ClipboardCheck,href: "/p2p/goods-receipt" },
  { label: "Payment Schedule",  icon: CreditCard,    href: "/p2p/payment-schedule" },
]

const apItems = [
  { label: "Invoice Inbox",  icon: Mail,  href: "/ap/invoices", badge: "8", badgeVariant: "blue" as const },
  { label: "Payment Queue",  icon: Clock, href: "/ap/payments" },
]

const accountingItems = [
  { label: "Journal Entries", icon: BookOpen,      href: "/accounting/journals" },
  { label: "Reconciliation",  icon: RefreshCw,     href: "/accounting/reconciliation" },
  { label: "Period Close",    icon: CalendarDays,  href: "/accounting/period-close" },
]

type BadgeVariant = "amber" | "blue"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeVariant?: BadgeVariant
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<a href={item.href} />}
                isActive={isActive}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {item.badge && (
                <SidebarMenuBadge
                  className={cn(
                    "text-[9px] font-bold",
                    item.badgeVariant === "amber" && "bg-warning/15 text-warning",
                    item.badgeVariant === "blue"  && "bg-primary/15 text-primary/80",
                  )}
                >
                  {item.badge}
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <NavGroup label="P2P" items={p2pItems} />
        <SidebarSeparator />
        <NavGroup label="AP Agent" items={apItems} />
        <SidebarSeparator />
        <NavGroup label="Accounting" items={accountingItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" render={<a href="/settings" />}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
