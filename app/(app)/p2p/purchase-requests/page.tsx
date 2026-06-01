"use client"

import * as React from "react"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Download, Plus, Search, TriangleAlert,
  Star, CheckCircle2, ShieldCheck, MessageCircle, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────

type PRStatus = "pending" | "review" | "approved" | "draft"

interface Approver {
  initials: string
  state: "done" | "pending" | "waiting"
  name: string
  role: string
}

interface LineItem {
  name: string
  detail: string
  amount: string
}

interface AIInsight {
  type: "info" | "warn" | "ok"
  title: string
  body: string
  cite: string
}

interface PR {
  id: string
  title: string
  sub: string
  requester: string
  date: string
  dept: string
  amount: string
  budget: string
  overBudget?: boolean
  status: PRStatus
  approvers: Approver[]
  aiFlags: number
  lineItems: LineItem[]
  aiInsights: AIInsight[]
}

// ── Sample data ───────────────────────────────────────────────

const PRS: PR[] = [
  {
    id: "PR-2024-0089",
    title: "IT Equipment — Q3 Upgrade",
    sub: "14 laptops, 6 monitors · IT Dept",
    requester: "Lim Wei Xiang",
    date: "28 May",
    dept: "IT",
    amount: "142,800",
    budget: "150,000",
    status: "pending",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah", role: "L1 Dept Head" },
      { initials: "RA", state: "pending", name: "Razif Abdullah", role: "L2 Finance Mgr" },
      { initials: "CM", state: "waiting", name: "Chong Mei Ling", role: "L3 CFO" },
    ],
    aiFlags: 1,
    lineItems: [
      { name: "Dell Latitude 5540 Laptop",  detail: "14 × RM 7,200 · Tech Solutions MY", amount: "RM 100,800" },
      { name: "LG 27\" 4K Monitor",          detail: "6 × RM 2,500 · Tech Solutions MY",  amount: "RM 15,000" },
      { name: "Docking Stations",            detail: "14 × RM 1,929 · Tech Solutions MY", amount: "RM 27,000" },
    ],
    aiInsights: [
      {
        type: "info",
        title: "Capital Allowance Eligible",
        body: "Laptops and monitors qualify for Initial Allowance (20%) + Annual Allowance (14%) under Schedule 3. Tag as IT Equipment in the asset register before period close.",
        cite: "capitalAllowance.md v1.4 · ITA 1967, Schedule 3",
      },
      {
        type: "warn",
        title: "SST Input Tax — Verify Vendor",
        body: "Tech Solutions MY is not yet registered on MyInvois. SST input tax credit may be disallowed. Request a validated e-invoice before issuing the PO.",
        cite: "jomie-sst-baseline.md v1.5 · SST Act 2018, S38",
      },
      {
        type: "ok",
        title: "Within Capex Budget",
        body: "RM 142,800 is within the approved IT capex budget of RM 150,000. No budget override approval required.",
        cite: "budgetControl.md v1.2 · approvalMatrix.md v1.0",
      },
    ],
  },
  {
    id: "PR-2024-0088",
    title: "Office Renovation — Level 3",
    sub: "Partitioning, furniture · Admin",
    requester: "Nur Aisyah",
    date: "27 May",
    dept: "Admin",
    amount: "38,500",
    budget: "40,000",
    status: "review",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah", role: "L1" },
      { initials: "RA", state: "done",    name: "Razif Abdullah", role: "L2" },
      { initials: "CM", state: "pending", name: "Chong Mei Ling", role: "L3" },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-2024-0087",
    title: "Raw Materials — Batch #44",
    sub: "Packaging film, adhesives · Production",
    requester: "Ahmad Firdaus",
    date: "26 May",
    dept: "Production",
    amount: "285,000",
    budget: "280,000",
    overBudget: true,
    status: "pending",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah", role: "L1" },
      { initials: "RA", state: "done",    name: "Razif Abdullah", role: "L2" },
      { initials: "CM", state: "pending", name: "Chong Mei Ling", role: "L3" },
    ],
    aiFlags: 2,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-2024-0086",
    title: "Marketing — Trade Fair Booth",
    sub: "KLCC Convention 2024 · Marketing",
    requester: "Priya Nair",
    date: "24 May",
    dept: "Marketing",
    amount: "22,000",
    budget: "25,000",
    status: "approved",
    approvers: [
      { initials: "SA", state: "done", name: "Siti Aisyah", role: "L1" },
      { initials: "RA", state: "done", name: "Razif Abdullah", role: "L2" },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-2024-0085",
    title: "Cleaning Services Contract",
    sub: "Annual renewal · Facilities",
    requester: "Tan Beng Huat",
    date: "22 May",
    dept: "Facilities",
    amount: "18,600",
    budget: "20,000",
    status: "approved",
    approvers: [
      { initials: "SA", state: "done", name: "Siti Aisyah", role: "L1" },
      { initials: "RA", state: "done", name: "Razif Abdullah", role: "L2" },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-2024-0084",
    title: "Software Licences — Adobe CC",
    sub: "12 seats annual · Creative",
    requester: "Lim Wei Xiang",
    date: "Today",
    dept: "Creative",
    amount: "8,400",
    budget: "10,000",
    status: "draft",
    approvers: [],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
]

// ── Sub-components ────────────────────────────────────────────

const STATUS_MAP: Record<PRStatus, { label: string; className: string }> = {
  pending:  { label: "Pending",      className: "bg-warning/12 text-warning border-warning/20" },
  review:   { label: "Under Review", className: "bg-primary/12 text-primary/80 border-primary/20" },
  approved: { label: "Approved",     className: "bg-success/12 text-success border-success/20" },
  draft:    { label: "Draft",        className: "bg-muted text-muted-foreground border-border" },
}

function StatusBadge({ status }: { status: PRStatus }) {
  const { label, className } = STATUS_MAP[status]
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold h-5 px-2 rounded-full", className)}>
      {label}
    </Badge>
  )
}

function ApproverStack({ approvers }: { approvers: Approver[] }) {
  return (
    <div className="flex">
      {approvers.map((a, i) => (
        <Avatar
          key={i}
          className={cn(
            "size-[22px] border-[1.5px] text-[8px] font-bold",
            i > 0 && "-ml-1.5",
            a.state === "done"    && "border-success bg-success/15 text-success",
            a.state === "pending" && "border-warning bg-warning/10 text-warning",
            a.state === "waiting" && "border-border bg-muted text-muted-foreground",
          )}
          title={`${a.name} — ${a.role}`}
        >
          <AvatarFallback className="text-[8px] bg-transparent">
            {a.state === "done" ? "✓" : a.initials[0]}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}

// ── AI Insight card ───────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const config = {
    info: { icon: <Star size={12} className="text-primary/80" />, cls: "bg-primary/8 border-primary/18", title: "text-primary/80" },
    warn: { icon: <TriangleAlert size={12} className="text-warning" />, cls: "bg-warning/8 border-warning/18", title: "text-warning" },
    ok:   { icon: <CheckCircle2 size={12} className="text-success" />, cls: "bg-success/8 border-success/18", title: "text-success" },
  }[insight.type]

  return (
    <div className={cn("rounded-lg border p-2.5 mb-1.5 last:mb-0", config.cls)}>
      <div className="flex items-center gap-1.5 mb-1">
        {config.icon}
        <span className={cn("text-[11px] font-semibold", config.title)}>{insight.title}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.body}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1.5 pt-1.5 border-t border-white/5 italic">{insight.cite}</p>
    </div>
  )
}

// ── Detail Sheet ──────────────────────────────────────────────

function PRDetailSheet({
  pr,
  open,
  onClose,
}: {
  pr: PR | null
  open: boolean
  onClose: () => void
}) {
  if (!pr) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[360px] sm:w-[360px] p-0 bg-card border-l border-border flex flex-col gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border space-y-1">
          <div className="font-mono text-[10px] font-semibold text-primary tracking-wide">{pr.id}</div>
          <SheetTitle className="text-[15px] font-bold leading-snug text-foreground">{pr.title}</SheetTitle>
          <div className="flex items-center gap-2">
            <StatusBadge status={pr.status} />
            <span className="text-[10px] text-muted-foreground">{pr.date} · {pr.dept}</span>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-5">

            {/* Line items */}
            {pr.lineItems.length > 0 && (
              <section>
                <SectionTitle>Line Items</SectionTitle>
                <div className="flex flex-col gap-1.5">
                  {pr.lineItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-white/[0.02] p-2.5">
                      <span className="size-[18px] rounded shrink-0 bg-white/5 flex items-center justify-center text-[9px] font-bold text-muted-foreground mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</div>
                      </div>
                      <div className="text-[11px] font-bold text-foreground shrink-0">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AI Insights */}
            {pr.aiInsights.length > 0 && (
              <section>
                <SectionTitle>Jomie AI Insights</SectionTitle>
                {pr.aiInsights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </section>
            )}

            {/* Approval chain */}
            {pr.approvers.length > 0 && (
              <section>
                <SectionTitle>Approval Chain</SectionTitle>
                <div className="flex flex-col">
                  {pr.approvers.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 pb-3 relative">
                      {/* Connector line */}
                      {i < pr.approvers.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                      )}
                      {/* Step dot */}
                      <div className={cn(
                        "size-[22px] rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 z-10",
                        a.state === "done"    && "bg-success/15 border-success text-success",
                        a.state === "pending" && "bg-primary/15 border-primary text-primary",
                        a.state === "waiting" && "bg-muted border-border text-muted-foreground",
                      )}>
                        {a.state === "done" ? "✓" : i + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="text-[11px] font-semibold text-foreground">{a.role}</div>
                        <div className="text-[10px] text-muted-foreground">{a.name}</div>
                        <div className={cn(
                          "text-[10px] mt-0.5",
                          a.state === "done"    && "text-success",
                          a.state === "pending" && "text-warning",
                          a.state === "waiting" && "text-muted-foreground/60",
                        )}>
                          {a.state === "done"    && "Approved"}
                          {a.state === "pending" && "Awaiting · 18 hrs pending"}
                          {a.state === "waiting" && `Required ≥ RM 100K`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SOD notice */}
                <div className="flex gap-2 rounded-lg border border-primary/18 bg-primary/8 p-2.5 mt-1">
                  <ShieldCheck size={13} className="text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    <strong className="text-primary/80 font-semibold">SOD enforced</strong> — {pr.requester} (requestor) is excluded from all approval steps by system control. This cannot be overridden.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border p-4 shrink-0 bg-card">
          <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-border">
            <span className="text-[11px] text-muted-foreground">Total amount</span>
            <span className="text-xl font-bold tracking-tight text-foreground">RM {pr.amount}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-semibold gap-1.5">
              <CheckCircle2 size={13} />
              Approve
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5">
              <MessageCircle size={13} />
              Query
            </Button>
            <Button size="sm" variant="ghost" className="px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10">
              <X size={13} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative pb-1.5 mb-2.5">
      <span className="text-[11px] font-bold text-foreground">{children}</span>
      <div className="absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-primary" />
    </div>
  )
}

// ── Filter tabs ───────────────────────────────────────────────

const FILTERS = [
  { key: "all",      label: "All",      count: 12 },
  { key: "pending",  label: "Pending",  count: 3 },
  { key: "review",   label: "Review",   count: 2 },
  { key: "approved", label: "Approved", count: 6 },
  { key: "draft",    label: "Draft",    count: 1 },
]

// ── Main page ─────────────────────────────────────────────────

export default function PurchaseRequestsPage() {
  const [activeFilter, setActiveFilter] = React.useState("all")
  const [selectedPR, setSelectedPR] = React.useState<PR | null>(PRS[0])
  const [sheetOpen, setSheetOpen] = React.useState(true)

  const handleRowClick = (pr: PR) => {
    setSelectedPR(pr)
    setSheetOpen(true)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Subheader strip: greeting + page title */}
      <div className="flex shrink-0 border-b border-border bg-sidebar">
        {/* Greeting card — Payhawk dark anchor pattern */}
        <div className="w-56 shrink-0 border-r border-primary/12 bg-[oklch(0.145_0.035_255)] px-4 py-3.5">
          <div className="text-[13px] font-bold text-foreground">Good morning, Lim</div>
          <div className="text-[11px] text-muted-foreground mb-3">5 items need your attention</div>
          <div className="flex flex-col">
            {[
              { label: "Awaiting your approval",  count: "2" },
              { label: "PRs pending submission",   count: "1" },
              { label: "AI flags to review",       count: "1" },
              { label: "Invoices unmatched",       count: "1" },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between py-1.5 border-b border-dashed border-white/7 last:border-0">
                <span className="text-[11px] font-medium text-foreground/65">{t.label}</span>
                <span className="text-[11px] font-bold text-primary">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Page header */}
        <div className="flex flex-1 items-center justify-between px-5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
              <span>P2P</span>
              <span className="opacity-40">›</span>
              <span className="text-foreground/60">Purchase Requests</span>
            </div>
            <h1 className="text-[18px] font-bold tracking-tight">Purchase Requests</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-[11px]">
              <Download size={12} />
              Export
            </Button>
            <Button size="sm" className="gap-1.5 text-[11px] font-semibold">
              <Plus size={12} />
              New PR
            </Button>
          </div>
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-y-auto">
        {/* Section heading + filters */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-end justify-between mb-2.5">
            <div className="relative pb-1.5">
              <span className="text-[13px] font-bold text-foreground">All Purchase Requests</span>
              <div className="absolute bottom-0 left-0 h-0.5 w-6 rounded-full bg-primary" />
            </div>
            <a href="#" className="text-[11px] font-medium text-primary hover:underline">View all</a>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 mb-3">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search PRs, vendors…"
                className="h-8 w-48 rounded-md border border-border bg-card pl-7 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  activeFilter === f.key
                    ? "bg-primary/8 border-primary/25 text-primary/90"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span className={cn(
                  "text-[9px] font-bold rounded-full px-1.5 py-0.5",
                  activeFilter === f.key
                    ? "bg-primary/20 text-primary/80"
                    : "bg-white/8 text-muted-foreground",
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mx-5 mb-5 rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 pl-4 w-[38%]">Item</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-[18%]">Requested by</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-[14%]">Amount (RM)</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-[13%]">Status</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-[10%]">Approvers</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-[5%]">AI</TableHead>
                <TableHead className="w-9" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRS.map((pr) => {
                const isSelected = selectedPR?.id === pr.id && sheetOpen
                return (
                  <TableRow
                    key={pr.id}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors",
                      isSelected
                        ? "bg-primary/8"
                        : "hover:bg-white/[0.02]",
                    )}
                    onClick={() => handleRowClick(pr)}
                  >
                    {/* Item */}
                    <TableCell className="pl-4 py-2.5">
                      <div className="text-[12px] font-semibold text-foreground leading-tight">{pr.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{pr.id} · {pr.sub}</div>
                    </TableCell>

                    {/* Requester */}
                    <TableCell className="py-2.5">
                      <div className="text-[12px] font-medium text-foreground/80">{pr.requester}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <span>{pr.date}</span>
                        <span className="size-[3px] rounded-full bg-muted-foreground/40 inline-block" />
                        <span>{pr.dept}</span>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="py-2.5">
                      <div className="text-[12px] font-semibold text-foreground">{pr.amount}</div>
                      <div className={cn("text-[10px] mt-0.5", pr.overBudget ? "text-warning" : "text-muted-foreground")}>
                        {pr.overBudget ? `Over budget +${(Number(pr.amount.replace(",","")) - Number(pr.budget.replace(",",""))).toLocaleString()}` : `Budget: ${pr.budget}`}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-2.5">
                      <StatusBadge status={pr.status} />
                    </TableCell>

                    {/* Approvers */}
                    <TableCell className="py-2.5">
                      {pr.approvers.length > 0
                        ? <ApproverStack approvers={pr.approvers} />
                        : <span className="text-[10px] text-muted-foreground/40">—</span>
                      }
                    </TableCell>

                    {/* AI flags */}
                    <TableCell className="py-2.5">
                      {pr.aiFlags > 0
                        ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-warning">
                            <TriangleAlert size={11} />
                            {pr.aiFlags}
                          </span>
                        )
                        : <span className="text-[10px] text-muted-foreground/40">—</span>
                      }
                    </TableCell>

                    {/* More */}
                    <TableCell className="py-2.5 pr-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground/40 hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="More options"
                      >
                        <span className="text-sm leading-none">⋯</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail sheet */}
      <PRDetailSheet
        pr={selectedPR}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
