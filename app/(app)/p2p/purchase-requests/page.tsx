"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  TriangleAlert, ShieldCheck, CheckCircle2, Sparkles,
  Plus, Download, Search, ChevronRight, Clock,
} from "lucide-react"

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
      { initials: "SA", state: "done",    name: "Siti Aisyah",    role: "Dept Head",   level: 1 },
      { initials: "RA", state: "pending", name: "Razif Abdullah", role: "Finance Mgr", level: 2 },
      { initials: "CM", state: "waiting", name: "Chong Mei Ling", role: "CFO",         level: 3 },
    ],
    aiFlags: 1,
    lineItems: [
      { name: "Dell Latitude 5540",   detail: "14 × RM 7,200 · Tech Solutions MY", amount: "100,800" },
      { name: "LG 27\" UltraFine 4K", detail: "6 × RM 2,500 · Tech Solutions MY",  amount: "15,000" },
      { name: "Dell WD22TB4 Dock",    detail: "14 × RM 1,929 · Tech Solutions MY", amount: "27,000" },
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
    aiFlags: 0, lineItems: [], aiInsights: [],
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
    aiFlags: 2, lineItems: [], aiInsights: [],
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
    aiFlags: 0, lineItems: [], aiInsights: [],
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
    aiFlags: 0, lineItems: [], aiInsights: [],
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
    aiFlags: 0, lineItems: [], aiInsights: [],
  },
]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<PRStatus, { label: string; dot: string; text: string; bg: string }> = {
  pending:  { label: "Pending",      dot: "#F59E0B", text: "#92400E", bg: "#FEF3C7" },
  review:   { label: "Under Review", dot: "#5D5EF4", text: "#3730A3", bg: "#EDE9FE" },
  approved: { label: "Approved",     dot: "#10B981", text: "#065F46", bg: "#D1FAE5" },
  draft:    { label: "Draft",        dot: "#9CA3AF", text: "#6B7280", bg: "#F3F4F6" },
}

function StatusBadge({ status }: { status: PRStatus }) {
  const s = STATUS[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.text }}>
      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

// ─── Workflow dots ────────────────────────────────────────────────────────────

function WorkflowDots({ approvers, status }: { approvers: Approver[]; status: PRStatus }) {
  if (status === "draft") return <span className="text-[10px] text-gray-400 font-mono">draft</span>
  if (status === "approved") return (
    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
      <CheckCircle2 size={10} />all done
    </span>
  )
  if (!approvers.length) return null
  const current = approvers.find(a => a.state === "pending")
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {approvers.map((a, i) => (
          <div key={i} className={cn("rounded-full", {
            "size-1.5 bg-emerald-500": a.state === "done",
            "size-2 bg-amber-400": a.state === "pending",
            "size-1.5 bg-gray-300": a.state === "waiting",
          })} title={`L${a.level} ${a.role}`} />
        ))}
      </div>
      {current && <span className="text-[10px] text-gray-500 font-mono">L{current.level}</span>}
    </div>
  )
}

// ─── AI citation (signature) ──────────────────────────────────────────────────

function AICite({ cite }: { cite: string }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <code className="text-[9px] font-mono text-gray-400">{cite}</code>
    </div>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const cfg = {
    info: { bg: "rgba(93,94,244,0.06)", border: "rgba(93,94,244,0.15)", dot: "#5D5EF4", title: "#4338CA" },
    warn: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", dot: "#F59E0B", title: "#92400E" },
    ok:   { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.15)", dot: "#10B981", title: "#065F46" },
  }[insight.type]

  return (
    <div className="rounded-lg p-3 mb-2 last:mb-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-start gap-2">
        <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: cfg.dot }} />
        <div className="flex-1">
          <div className="text-[11px] font-semibold mb-1" style={{ color: cfg.title }}>{insight.title}</div>
          <p className="text-[11px] text-gray-600 leading-relaxed">{insight.body}</p>
          <AICite cite={insight.cite} />
        </div>
      </div>
    </div>
  )
}

// ─── Right panel (AI co-pilot) — uses light panel bg ─────────────────────────

function CopilotPanel({ pr }: { pr: PR | null }) {
  return (
    <div className="flex flex-col h-full">

      {/* Panel header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#5D5EF4]" />
          <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily: "var(--font-pjs)" }}>
            Jomie AI
          </span>
          <div className="flex items-center gap-1 ml-1.5">
            <div className="size-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-gray-400">LIVE</span>
          </div>
        </div>
        {pr && <span className="text-[9px] font-mono text-gray-400">{pr.id}</span>}
      </div>

      {!pr ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(93,94,244,0.1)" }}>
            <Sparkles size={18} style={{ color: "#5D5EF4" }} />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-gray-500">Select a PR to analyse</div>
            <div className="text-[11px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">
              Jomie surfaces tax flags, compliance issues, and approval context
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-1 px-1">

          {/* PR summary */}
          <div className="mb-4">
            <div className="text-[14px] font-bold text-gray-900 leading-tight mb-1"
              style={{ fontFamily: "var(--font-pjs)" }}>{pr.title}</div>
            <div className="text-[11px] text-gray-500 mb-2">{pr.sub}</div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Total</div>
                <div className="text-[22px] font-bold text-gray-900 font-mono tabular-nums tracking-tight">
                  RM {pr.amount}
                </div>
                <div className={cn("text-[10px] font-mono mt-0.5",
                  pr.overBudget ? "text-amber-600" : "text-gray-400")}>
                  {pr.overBudget ? `▲ over by RM ${(+pr.amount.replace(",","") - +pr.budget.replace(",","")).toLocaleString()}` : `/ ${pr.budget}`}
                </div>
              </div>
              <StatusBadge status={pr.status} />
            </div>
          </div>

          {/* Line items */}
          {pr.lineItems.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Line Items</div>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {pr.lineItems.map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-2 px-3 py-2", i > 0 && "border-t border-gray-100")}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-800 truncate">{item.name}</div>
                      <div className="text-[9px] text-gray-400 truncate">{item.detail}</div>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-gray-800 shrink-0 tabular-nums">{item.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {pr.aiInsights.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Analysis</div>
              {pr.aiInsights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          )}

          {/* Approval chain */}
          {pr.approvers.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Approval Chain</div>
              <div className="flex flex-col">
                {pr.approvers.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 pb-3 last:pb-0 relative">
                    {i < pr.approvers.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className={cn(
                      "size-[18px] rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 z-10 bg-white",
                      a.state === "done"    && "border-emerald-400 text-emerald-600",
                      a.state === "pending" && "border-amber-400 text-amber-600",
                      a.state === "waiting" && "border-gray-200 text-gray-400",
                    )}>
                      {a.state === "done" ? "✓" : a.level}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="text-[11px] font-semibold text-gray-700">{a.role} <span className="text-gray-400 font-normal text-[9px]">L{a.level}</span></div>
                      <div className="text-[10px] text-gray-400">{a.name}</div>
                      <div className={cn("text-[9px] mt-0.5 flex items-center gap-1",
                        a.state === "done" && "text-emerald-600",
                        a.state === "pending" && "text-amber-600",
                        a.state === "waiting" && "text-gray-400")}>
                        {a.state === "done" && "✓ Approved"}
                        {a.state === "pending" && <><Clock size={8} />Awaiting · 18 hrs</>}
                        {a.state === "waiting" && "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* SOD */}
              <div className="mt-2 flex items-start gap-1.5 rounded-lg p-2 border border-gray-100 bg-gray-50">
                <ShieldCheck size={11} className="text-[#5D5EF4] mt-0.5 shrink-0" />
                <p className="text-[10px] text-gray-500 leading-snug">
                  SOD enforced — {pr.requester} excluded from all approval steps by system.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {pr && (
        <div className="pt-4 mt-auto border-t border-gray-100">
          <div className="text-[11px] text-gray-400 mb-1.5">Total amount</div>
          <div className="text-[20px] font-bold text-gray-900 font-mono tabular-nums mb-3">RM {pr.amount}</div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: "#10B981" }}>
              <CheckCircle2 size={13} /> Approve
            </button>
            <button className="flex-1 flex items-center justify-center h-9 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
              Query
            </button>
            <button className="px-3 h-9 rounded-lg text-[12px] font-medium border border-red-100 text-red-400 bg-white hover:bg-red-50">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all", label: "All", count: 12 },
  { key: "pending", label: "Pending", count: 3 },
  { key: "review", label: "Review", count: 2 },
  { key: "approved", label: "Approved", count: 6 },
  { key: "draft", label: "Draft", count: 1 },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseRequestsPage() {
  const [selected, setSelected] = React.useState<PR>(PRS[0])
  const [filter, setFilter] = React.useState("all")

  // Panel styles — #F7F7FE primary-25, 10px radius, matching Figma v2 spec
  const panelStyle: React.CSSProperties = {
    background: "#F7F7FE",
    borderRadius: 10,
    overflow: "hidden",
  }

  return (
    <div className="flex gap-[10px] h-full">

      {/* Main panel — flex-1 (~823px) */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={panelStyle}>

        {/* Page header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
              <span>P2P</span>
              <span>/</span>
              <span className="text-gray-600">Purchase Requests</span>
            </div>
            <h1 className="text-[20px] font-bold text-gray-900" style={{ fontFamily: "var(--font-pjs)" }}>
              Purchase Requests
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Download size={13} /> Export
            </button>
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: "#5D5EF4" }}
            >
              <Plus size={13} /> New PR
            </button>
          </div>
        </div>

        {/* Filter + search */}
        <div className="flex items-center gap-2 px-8 pb-3 shrink-0">
          {/* Search */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-400 w-52">
            <Search size={13} className="shrink-0 text-gray-300" />
            <span>Search PRs…</span>
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-0.5">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1 h-8 px-3 rounded-md text-[12px] transition-colors",
                  filter === f.key
                    ? "bg-white border border-gray-200 font-semibold text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/60",
                )}>
                {f.label}
                <span className={cn("text-[10px] rounded px-1",
                  filter === f.key ? "text-gray-400" : "text-gray-400")}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {/* Header row */}
          <div className="grid border-b border-gray-200 pb-2 mb-1"
            style={{ gridTemplateColumns: "1fr 140px 130px 120px 90px 36px" }}>
            {["Request", "Requested by", "Amount (RM)", "Status", "AI Flags", ""].map((h, i) => (
              <div key={i} className={cn(
                "text-[10px] font-semibold uppercase tracking-wider text-gray-400",
                i >= 2 && "text-right",
                i === 5 && "w-9",
              )}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {PRS.map(pr => {
            const isSel = selected?.id === pr.id
            return (
              <div key={pr.id} onClick={() => setSelected(pr)}
                className={cn(
                  "grid items-center py-3 border-b border-gray-100 cursor-pointer rounded-lg -mx-2 px-2 group transition-colors",
                  isSel ? "bg-[rgba(93,94,244,0.06)]" : "hover:bg-white/70",
                )}
                style={{ gridTemplateColumns: "1fr 140px 130px 120px 90px 36px" }}>

                {/* Item */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-400">{pr.id}</span>
                    <span className="text-[12px] font-semibold text-gray-800 truncate">{pr.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">{pr.sub}</div>
                </div>

                {/* Requester */}
                <div>
                  <div className="text-[12px] text-gray-700">{pr.requester}</div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <span>{pr.date}</span>
                    <span>·</span>
                    <span>{pr.dept}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-[12px] font-mono font-semibold text-gray-800 tabular-nums">{pr.amount}</div>
                  <div className={cn("text-[9px] font-mono mt-0.5",
                    pr.overBudget ? "text-amber-500" : "text-gray-400")}>
                    {pr.overBudget ? "▲ over budget" : `/ ${pr.budget}`}
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-end">
                  <WorkflowDots approvers={pr.approvers} status={pr.status} />
                </div>

                {/* AI flags */}
                <div className="flex justify-end">
                  {pr.aiFlags > 0
                    ? <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                        <TriangleAlert size={11} />{pr.aiFlags}
                      </span>
                    : <span className="text-[10px] text-gray-300">—</span>
                  }
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ChevronRight size={13} className={cn(
                    "transition-colors",
                    isSel ? "text-[#5D5EF4]" : "text-gray-200 group-hover:text-gray-400",
                  )} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Side panel — 339px per Figma v2 spec */}
      <div
        className="shrink-0 flex flex-col"
        style={{ ...panelStyle, width: 339, padding: "24px 20px" }}
      >
        <CopilotPanel pr={selected} />
      </div>

    </div>
  )
}
