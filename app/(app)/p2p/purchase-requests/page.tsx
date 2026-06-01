"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  TriangleAlert, ShieldCheck, CheckCircle2,
  Sparkles, Plus, Download, Search,
  ChevronRight, ArrowUpRight, Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// ─── Types ────────────────────────────────────────────────────────────────────

type PRStatus = "pending" | "review" | "approved" | "draft"

interface Approver {
  initials: string
  state: "done" | "pending" | "waiting"
  name: string
  role: string
  level: number
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
  // Signature: structured citation — module:version → regulation:clause
  cite: string
}

interface PR {
  id: string
  title: string
  sub: string
  requester: string
  requesterInitials: string
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRS: PR[] = [
  {
    id: "PR-0089",
    title: "IT Equipment — Q3 Upgrade",
    sub: "14 laptops · 6 monitors · 14 docks",
    requester: "Lim Wei Xiang",
    requesterInitials: "LW",
    date: "28 May",
    dept: "IT",
    amount: "142,800",
    budget: "150,000",
    status: "pending",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah",    role: "Dept Head",    level: 1 },
      { initials: "RA", state: "pending", name: "Razif Abdullah", role: "Finance Mgr",  level: 2 },
      { initials: "CM", state: "waiting", name: "Chong Mei Ling", role: "CFO",          level: 3 },
    ],
    aiFlags: 1,
    lineItems: [
      { name: "Dell Latitude 5540",  detail: "14 × RM 7,200 · Tech Solutions MY", amount: "100,800" },
      { name: "LG 27\" UltraFine 4K", detail: "6 × RM 2,500 · Tech Solutions MY",  amount: "15,000"  },
      { name: "Dell WD22TB4 Dock",   detail: "14 × RM 1,929 · Tech Solutions MY", amount: "27,000"  },
    ],
    aiInsights: [
      {
        type: "info",
        title: "Capital allowance eligible",
        body: "Laptops and monitors qualify for IA 20% + AA 14% under Schedule 3. Tag as IT Equipment in asset register before period close.",
        cite: "capitalAllowance.md:v1.4 → ITA67:Sch3",
      },
      {
        type: "warn",
        title: "Vendor not on MyInvois",
        body: "Tech Solutions MY has no MyInvois registration. SST input credit may be disallowed. Request validated e-invoice before PO issuance.",
        cite: "jomie-sst-baseline.md:v1.5 → SST18:S38",
      },
      {
        type: "ok",
        title: "Within capex budget",
        body: "RM 142,800 is 95.2% of the approved RM 150,000 IT capex budget. No override approval required.",
        cite: "budgetControl.md:v1.2 → approvalMatrix.md:v1.0",
      },
    ],
  },
  {
    id: "PR-0088",
    title: "Office Renovation — Level 3",
    sub: "Partitioning · furniture · electrical",
    requester: "Nur Aisyah",
    requesterInitials: "NA",
    date: "27 May",
    dept: "Admin",
    amount: "38,500",
    budget: "40,000",
    status: "review",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah",    role: "Dept Head",   level: 1 },
      { initials: "RA", state: "done",    name: "Razif Abdullah", role: "Finance Mgr", level: 2 },
      { initials: "CM", state: "pending", name: "Chong Mei Ling", role: "CFO",         level: 3 },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-0087",
    title: "Raw Materials — Batch #44",
    sub: "Packaging film · adhesives · labels",
    requester: "Ahmad Firdaus",
    requesterInitials: "AF",
    date: "26 May",
    dept: "Production",
    amount: "285,000",
    budget: "280,000",
    overBudget: true,
    status: "pending",
    approvers: [
      { initials: "SA", state: "done",    name: "Siti Aisyah",    role: "Dept Head",   level: 1 },
      { initials: "RA", state: "done",    name: "Razif Abdullah", role: "Finance Mgr", level: 2 },
      { initials: "CM", state: "pending", name: "Chong Mei Ling", role: "CFO",         level: 3 },
    ],
    aiFlags: 2,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-0086",
    title: "Marketing — Trade Fair Booth",
    sub: "KLCC Convention 2024",
    requester: "Priya Nair",
    requesterInitials: "PN",
    date: "24 May",
    dept: "Marketing",
    amount: "22,000",
    budget: "25,000",
    status: "approved",
    approvers: [
      { initials: "SA", state: "done", name: "Siti Aisyah",    role: "Dept Head",   level: 1 },
      { initials: "RA", state: "done", name: "Razif Abdullah", role: "Finance Mgr", level: 2 },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-0085",
    title: "Cleaning Services Contract",
    sub: "Annual renewal · 3 locations",
    requester: "Tan Beng Huat",
    requesterInitials: "TB",
    date: "22 May",
    dept: "Facilities",
    amount: "18,600",
    budget: "20,000",
    status: "approved",
    approvers: [
      { initials: "SA", state: "done", name: "Siti Aisyah",    role: "Dept Head",   level: 1 },
      { initials: "RA", state: "done", name: "Razif Abdullah", role: "Finance Mgr", level: 2 },
    ],
    aiFlags: 0,
    lineItems: [],
    aiInsights: [],
  },
  {
    id: "PR-0084",
    title: "Software Licences — Adobe CC",
    sub: "12 seats · annual subscription",
    requester: "Lim Wei Xiang",
    requesterInitials: "LW",
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

// ─── Workflow position indicator ──────────────────────────────────────────────
// Replaces badge pills — shows approval chain position as a compact visual track

function WorkflowPosition({ approvers, status }: { approvers: Approver[]; status: PRStatus }) {
  if (status === "draft") return (
    <span className="text-[10px] text-muted-foreground/40 font-mono">draft</span>
  )
  if (status === "approved") return (
    <span className="flex items-center gap-1 text-[10px] text-success font-medium">
      <CheckCircle2 size={10} /> all approved
    </span>
  )
  if (approvers.length === 0) return null

  const current = approvers.find(a => a.state === "pending")
  const done = approvers.filter(a => a.state === "done").length

  return (
    <div className="flex items-center gap-1.5">
      {/* Compact dot track */}
      <div className="flex items-center gap-0.5">
        {approvers.map((a, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-colors",
              a.state === "done"    && "size-1.5 bg-success",
              a.state === "pending" && "size-2 bg-warning border border-warning/50 animate-pulse",
              a.state === "waiting" && "size-1.5 bg-muted-foreground/20",
            )}
            title={`L${a.level} ${a.role} — ${a.state}`}
          />
        ))}
      </div>
      {current && (
        <span className="text-[10px] text-muted-foreground/60 font-mono whitespace-nowrap">
          L{current.level}
        </span>
      )}
    </div>
  )
}

// ─── AI Citation (signature element) ─────────────────────────────────────────

function AICitation({ cite }: { cite: string }) {
  return (
    <div className="mt-2 pt-2 border-t border-white/[0.05]">
      <code className="text-[9px] font-mono text-muted-foreground/40 tracking-tight">
        {cite}
      </code>
    </div>
  )
}

// ─── AI Panel insight card ────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const cfg = {
    info: { dot: "bg-primary", text: "text-primary/80",  border: "border-primary/10",  bg: "bg-primary/[0.05]" },
    warn: { dot: "bg-warning", text: "text-warning",     border: "border-warning/15",  bg: "bg-warning/[0.05]" },
    ok:   { dot: "bg-success", text: "text-success",     border: "border-success/12",  bg: "bg-success/[0.04]" },
  }[insight.type]

  return (
    <div className={cn("rounded-lg border p-3", cfg.border, cfg.bg)}>
      <div className="flex items-start gap-2">
        <div className={cn("size-1.5 rounded-full mt-1.5 shrink-0", cfg.dot)} />
        <div className="flex-1 min-w-0">
          <div className={cn("text-[11px] font-semibold mb-1", cfg.text)}>{insight.title}</div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{insight.body}</p>
          <AICitation cite={insight.cite} />
        </div>
      </div>
    </div>
  )
}

// ─── Right co-pilot panel ─────────────────────────────────────────────────────

function CopilotPanel({ pr }: { pr: PR | null }) {
  return (
    <aside className="w-[320px] shrink-0 flex flex-col border-l border-border bg-background overflow-hidden">

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary/60" />
          <span className="text-[11px] font-semibold text-foreground/70">Jomie AI</span>
          {/* Live indicator */}
          <div className="flex items-center gap-1 ml-1">
            <div className="size-1 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-mono text-muted-foreground/30">LIVE</span>
          </div>
        </div>
        {pr && (
          <span className="text-[9px] font-mono text-muted-foreground/30">{pr.id}</span>
        )}
      </div>

      {/* Empty state */}
      {!pr && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center">
            <Sparkles size={16} className="text-primary/50" />
          </div>
          <div className="text-center">
            <div className="text-[12px] font-medium text-muted-foreground/50">Select a PR to analyse</div>
            <div className="text-[10px] text-muted-foreground/30 mt-1">Jomie will surface tax flags, compliance issues, and approval context</div>
          </div>
        </div>
      )}

      {/* PR Detail */}
      {pr && (
        <div className="flex-1 overflow-y-auto">

          {/* PR header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[13px] font-semibold text-foreground leading-tight mb-1">{pr.title}</div>
            <div className="text-[10px] text-muted-foreground/50">{pr.sub}</div>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="size-4">
                <AvatarFallback className="text-[7px] bg-muted text-muted-foreground">{pr.requesterInitials}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground/60">{pr.requester}</span>
              <span className="text-muted-foreground/20">·</span>
              <span className="text-[10px] text-muted-foreground/40">{pr.date}</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-5">

            {/* Amount */}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-1">Total</div>
                <div className="text-[22px] font-bold tracking-tight text-foreground font-mono tabular-nums">
                  RM {pr.amount}
                </div>
                <div className={cn("text-[10px] mt-0.5", pr.overBudget ? "text-warning" : "text-muted-foreground/40")}>
                  {pr.overBudget
                    ? `▲ over budget by RM ${(+pr.amount.replace(",","") - +pr.budget.replace(",","")).toLocaleString()}`
                    : `budget RM ${pr.budget}`
                  }
                </div>
              </div>
              <div className="text-right">
                <WorkflowPosition approvers={pr.approvers} status={pr.status} />
              </div>
            </div>

            {/* Line items — ledger style */}
            {pr.lineItems.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-2">Line Items</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  {pr.lineItems.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 gap-2",
                        i > 0 && "border-t border-border/50",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-foreground truncate">{item.name}</div>
                        <div className="text-[9px] text-muted-foreground/40 mt-0.5 truncate">{item.detail}</div>
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-foreground tabular-nums shrink-0">
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {pr.aiInsights.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-2">AI Analysis</div>
                <div className="flex flex-col gap-2">
                  {pr.aiInsights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {/* Approval chain — vertical track */}
            {pr.approvers.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/30 mb-2">Approval Chain</div>
                <div className="flex flex-col">
                  {pr.approvers.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 relative pb-3 last:pb-0">
                      {/* Connector */}
                      {i < pr.approvers.length - 1 && (
                        <div className="absolute left-[10px] top-5 bottom-0 w-px bg-border/50" />
                      )}
                      {/* Node */}
                      <div className={cn(
                        "size-5 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 z-10 bg-background",
                        a.state === "done"    && "border-success text-success",
                        a.state === "pending" && "border-warning text-warning",
                        a.state === "waiting" && "border-border text-muted-foreground/30",
                      )}>
                        {a.state === "done" ? "✓" : a.level}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] font-medium text-foreground/80">{a.role}</span>
                          <span className="text-[9px] text-muted-foreground/40">L{a.level}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/40">{a.name}</div>
                        <div className={cn(
                          "text-[9px] mt-0.5 flex items-center gap-1",
                          a.state === "done"    && "text-success/70",
                          a.state === "pending" && "text-warning/70",
                          a.state === "waiting" && "text-muted-foreground/25",
                        )}>
                          {a.state === "done"    && "✓ Approved"}
                          {a.state === "pending" && <><Clock size={8} /> Awaiting · 18 hrs</>}
                          {a.state === "waiting" && "Waiting"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SOD notice — structural, not decorative */}
                <div className="mt-3 flex items-start gap-2 rounded-md border border-border/60 bg-white/[0.02] px-2.5 py-2">
                  <ShieldCheck size={11} className="text-primary/50 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground/50 leading-snug">
                    SOD enforced — {pr.requester} excluded from all approval steps by system control.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      {pr && (
        <div className="px-4 py-3 border-t border-border shrink-0 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="h-8 text-[11px] font-semibold bg-success/90 hover:bg-success text-white gap-1.5"
            >
              <CheckCircle2 size={12} />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              Query
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 gap-1"
          >
            Reject this request
          </Button>
        </div>
      )}
    </aside>
  )
}

// ─── Priority queue (replaces greeting card) ──────────────────────────────────

function PriorityQueue() {
  const items = [
    { n: 1, label: "Approve PR-0089", urgent: true },
    { n: 2, label: "Approve PR-0087", urgent: true },
    { n: 3, label: "Review AI flag · Raw Materials", urgent: false },
    { n: 4, label: "8 invoices in AP inbox", urgent: false },
  ]
  return (
    <div className="flex flex-col border-r border-border bg-background shrink-0 w-[200px] overflow-hidden">
      <div className="px-4 h-11 flex items-center border-b border-border shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Your queue</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <div
            key={item.n}
            className="flex items-start gap-2.5 px-4 py-2 hover:bg-white/[0.03] cursor-pointer group transition-colors"
          >
            <span className={cn(
              "text-[10px] font-mono mt-0.5 shrink-0 font-bold",
              item.urgent ? "text-warning/70" : "text-muted-foreground/25",
            )}>
              {String(item.n).padStart(2, "0")}
            </span>
            <span className="text-[11px] text-muted-foreground/60 group-hover:text-foreground/70 transition-colors leading-snug">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-border shrink-0">
        <div className="text-[10px] text-muted-foreground/30">Lim Wei Xiang</div>
        <div className="text-[9px] text-muted-foreground/20">IT Dept · Finance Manager</div>
      </div>
    </div>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",      label: "All",      count: 12 },
  { key: "pending",  label: "Pending",  count: 3 },
  { key: "review",   label: "Review",   count: 2 },
  { key: "approved", label: "Approved", count: 6 },
  { key: "draft",    label: "Draft",    count: 1 },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseRequestsPage() {
  const [selected, setSelected] = React.useState<PR>(PRS[0])
  const [filter, setFilter] = React.useState("all")

  return (
    <div className="flex h-full overflow-hidden">

      {/* Priority queue sidebar */}
      <PriorityQueue />

      {/* Main list */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* List header */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-[13px] font-semibold text-foreground">Purchase Requests</h1>
            {/* Filter tabs */}
            <div className="flex items-center gap-0.5">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors",
                    filter === f.key
                      ? "bg-white/[0.06] text-foreground font-medium"
                      : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.03]",
                  )}
                >
                  {f.label}
                  <span className={cn(
                    "text-[9px] rounded px-1 font-mono",
                    filter === f.key ? "text-muted-foreground/60" : "text-muted-foreground/30",
                  )}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-1.5 rounded px-2.5 py-1 border border-border/60 bg-white/[0.02] text-muted-foreground/40 hover:border-border hover:text-muted-foreground transition-colors cursor-text">
              <Search size={11} />
              <span className="text-[11px]">Search PRs…</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground/50 gap-1.5 px-2.5">
              <Download size={12} />
              Export
            </Button>
            <Button size="sm" className="h-7 text-[11px] gap-1.5 px-3 font-semibold">
              <Plus size={12} />
              New PR
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">

          {/* Column headers */}
          <div className="grid items-center border-b border-border bg-white/[0.01] sticky top-0 z-10"
            style={{ gridTemplateColumns: "1fr 140px 130px 110px 80px 40px" }}>
            {["Request", "Requested by", "Amount (RM)", "Status", "AI", ""].map((h, i) => (
              <div key={i} className={cn(
                "px-4 py-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/35",
                i === 0 && "pl-5",
                i >= 2 && "text-right",
                i === 5 && "w-10",
              )}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {PRS.map((pr) => {
            const isSelected = selected?.id === pr.id
            return (
              <div
                key={pr.id}
                onClick={() => setSelected(pr)}
                className={cn(
                  "grid items-center border-b border-border/50 cursor-pointer transition-colors group",
                  isSelected
                    ? "bg-primary/[0.06] border-l-2 border-l-primary"
                    : "hover:bg-white/[0.025] border-l-2 border-l-transparent",
                )}
                style={{ gridTemplateColumns: "1fr 140px 130px 110px 80px 40px" }}
              >
                {/* Request */}
                <div className="px-4 py-3 pl-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground/30 shrink-0">{pr.id}</span>
                    <span className="text-[12px] font-medium text-foreground truncate">{pr.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{pr.sub}</div>
                </div>

                {/* Requested by */}
                <div className="px-4 py-3">
                  <div className="text-[11px] text-foreground/70">{pr.requester}</div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground/35 mt-0.5">
                    <span>{pr.date}</span>
                    <span>·</span>
                    <span>{pr.dept}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="px-4 py-3 text-right">
                  <div className="text-[12px] font-mono font-semibold text-foreground tabular-nums">
                    {pr.amount}
                  </div>
                  <div className={cn("text-[9px] mt-0.5 font-mono", pr.overBudget ? "text-warning/70" : "text-muted-foreground/30")}>
                    {pr.overBudget ? "▲ over budget" : `/ ${pr.budget}`}
                  </div>
                </div>

                {/* Workflow position */}
                <div className="px-4 py-3 text-right flex items-center justify-end">
                  <WorkflowPosition approvers={pr.approvers} status={pr.status} />
                </div>

                {/* AI flags */}
                <div className="px-4 py-3 text-right">
                  {pr.aiFlags > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
                      <TriangleAlert size={10} />
                      {pr.aiFlags}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/20">—</span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ChevronRight
                    size={13}
                    className={cn(
                      "transition-colors",
                      isSelected ? "text-primary/60" : "text-muted-foreground/20 group-hover:text-muted-foreground/40",
                    )}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Co-pilot panel — permanent, not a sheet */}
      <CopilotPanel pr={selected} />
    </div>
  )
}
