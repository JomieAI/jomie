"use client"

import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  ClipboardList, CheckCircle, Package, ClipboardCheck, CreditCard,
  Mail, Clock, BookOpen, RefreshCw, CalendarDays, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

type BadgeVariant = "amber" | "blue"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: string
  badgeVariant?: BadgeVariant
}

const P2P: NavItem[] = [
  { label: "Purchase Requests", icon: ClipboardList,   href: "/p2p/purchase-requests", badge: "3", badgeVariant: "amber" },
  { label: "Approvals",         icon: CheckCircle,     href: "/p2p/approvals",          badge: "2", badgeVariant: "amber" },
  { label: "Purchase Orders",   icon: Package,         href: "/p2p/purchase-orders" },
  { label: "Goods Receipt",     icon: ClipboardCheck,  href: "/p2p/goods-receipt" },
  { label: "Payment Schedule",  icon: CreditCard,      href: "/p2p/payment-schedule" },
]

const AP: NavItem[] = [
  { label: "Invoice Inbox",  icon: Mail,  href: "/ap/invoices", badge: "8", badgeVariant: "blue" },
  { label: "Payment Queue",  icon: Clock, href: "/ap/payments" },
]

const ACCOUNTING: NavItem[] = [
  { label: "Journal Entries", icon: BookOpen,     href: "/accounting/journals" },
  { label: "Reconciliation",  icon: RefreshCw,    href: "/accounting/reconciliation" },
  { label: "Period Close",    icon: CalendarDays, href: "/accounting/period-close" },
]

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="text-[9px] tracking-widest uppercase text-muted-foreground/30 px-3 mb-0.5">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<a href={item.href} />}
                isActive={isActive}
                tooltip={item.label}
                className={cn(
                  "h-8 rounded-md text-[12px] font-medium transition-all",
                  "text-muted-foreground/55 hover:text-foreground hover:bg-white/[0.04]",
                  isActive && "text-foreground bg-white/[0.06] hover:bg-white/[0.06]",
                )}
              >
                <item.icon
                  size={14}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/40",
                  )}
                />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {item.badge && (
                <SidebarMenuBadge
                  className={cn(
                    "text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center",
                    item.badgeVariant === "amber" && "bg-warning/10 text-warning border border-warning/20",
                    item.badgeVariant === "blue"  && "bg-primary/10 text-primary/80 border border-primary/20",
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
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      <SidebarContent className="pt-2 gap-0">
        <NavGroup label="P2P" items={P2P} />
        <SidebarSeparator className="mx-3 bg-border/50" />
        <NavGroup label="AP Agent" items={AP} />
        <SidebarSeparator className="mx-3 bg-border/50" />
        <NavGroup label="Accounting" items={ACCOUNTING} />
      </SidebarContent>
      <SidebarFooter className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/settings" />}
              tooltip="Settings"
              className="h-8 text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/[0.04] text-[12px]"
            >
              <Settings size={14} />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
