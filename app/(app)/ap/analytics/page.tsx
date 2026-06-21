"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, TrendingUp, TrendingDown, AlertTriangle,
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react"

// ─── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  purple:      "#5D5EF4",
  purpleLight: "#EEEDFE",
  purpleText:  "#3C3489",
  teal:        "#1D9E75",
  tealLight:   "#E1F5EE",
  tealText:    "#085041",
  amber:       "#BA7517",
  amberLight:  "#FAEEDA",
  amberText:   "#633806",
  red:         "#E24B4A",
  redLight:    "#FCEBEB",
  redText:     "#791F1F",
  border:      "#676488",
  dimText:     "#98A2B3",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n: number, dec = 0) => n.toLocaleString("en-MY", { minimumFractionDigits: dec })
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : fmt(n)

// ─── Demo data ────────────────────────────────────────────────────────────────

const AGING = [
  { label: "Current",  days: "0–30d",  amount: 219920, color: T.teal   },
  { label: "30 Days",  days: "31–60d", amount: 38500,  color: T.amber  },
  { label: "60 Days",  days: "61–90d", amount: 22000,  color: "#F97316" },
  { label: "90+ Days", days: ">90d",   amount: 142800, color: T.red    },
]
const AGING_TOTAL = AGING.reduce((s, a) => s + a.amount, 0)

const TOP_VENDORS = [
  { name: "Tech Solutions MY Sdn Bhd", amount: 142800, invoices: 3, status: "overdue"  },
  { name: "SKY Renovation Sdn Bhd",    amount: 38500,  invoices: 1, status: "due_3d"   },
  { name: "Petronas Dagangan Sdn Bhd", amount: 22000,  invoices: 2, status: "due_3d"   },
  { name: "AWS Singapore Pte Ltd",     amount: 12340,  invoices: 2, status: "due_7d"   },
  { name: "Tenaga Nasional Berhad",    amount: 4280,   invoices: 1, status: "due_30d"  },
]
const VENDOR_MAX = TOP_VENDORS[0].amount

const PROJECTS = [
  { code: "PROJ-2024-01", name: "ERP System Implementation Phase 2", budget: 300000, committed: 142800, paid: 85000,  cc: "IT-OPS" },
  { code: "PROJ-2024-03", name: "HQ Office Renovation FY2024",       budget: 80000,  committed: 35000,  paid: 0,      cc: "ADMIN"  },
]

const CASH_FLOW = [
  { label: "20 Jun", amount: 142800, overdue: true  },
  { label: "21 Jun", amount: 38500,  overdue: false },
  { label: "22 Jun", amount: 0,      overdue: false },
  { label: "23 Jun", amount: 0,      overdue: false },
  { label: "24 Jun", amount: 0,      overdue: false },
  { label: "25 Jun", amount: 12340,  overdue: false },
  { label: "28 Jun", amount: 0,      overdue: false },
  { label: "10 Jul", amount: 4280,   overdue: false },
  { label: "15 Jul", amount: 22000,  overdue: false },
  { label: "01 Aug", amount: 8400,   overdue: false },
]
const CF_MAX = Math.max(...CASH_FLOW.map(c => c.amount))

const CONTROLS = [
  { label: "e-Invoice compliance",         score: 60, status: "warning",  detail: "3 of 5 local invoices missing MyInvois verification" },
  { label: "3-way PO matching",            score: 85, status: "good",     detail: "4 of 5 invoices matched to approved PO" },
  { label: "SOD enforcement",              score: 100, status: "good",    detail: "Segregation of duties enforced on all approvals" },
  { label: "CAPEX approval threshold",     score: 70, status: "warning",  detail: "1 CAPEX item pending CFO sign-off (RM 14k)" },
  { label: "Duplicate invoice detection",  score: 95, status: "good",     detail: "1 flagged, confirmed not duplicate after review" },
  { label: "Overdue payment rate",         score: 40, status: "critical", detail: "RM 142,800 overdue — Tech Solutions invoice past due" },
]
const AVG_HEALTH = Math.round(CONTROLS.reduce((s, c) => s + c.score, 0) / CONTROLS.length)

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, unit, sub, trend, color }: {
  label: string; value: string | number; unit?: string; sub?: string
  trend?: "up" | "down" | "flat"; color: string
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus
  const trendColor = trend === "up" ? T.teal : trend === "down" ? T.red : T.dimText
  return (
    <div className="rounded-xl px-4 py-3.5"
      style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(103,100,136,0.3)" }}>
      <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: T.dimText }}>{label}</div>
      <div className="flex items-end gap-1.5 mb-0.5">
        <span className="text-[24px] font-bold tabular-nums leading-none" style={{ color }}>{value}</span>
        {unit && <span className="text-[11px] font-medium mb-0.5" style={{ color: T.dimText }}>{unit}</span>}
      </div>
      {(sub || trend) && (
        <div className="flex items-center gap-1 mt-1">
          {trend && <TrendIcon size={11} style={{ color: trendColor }} strokeWidth={2}/>}
          {sub && <span className="text-[10px]" style={{ color: T.dimText }}>{sub}</span>}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[13px] font-bold text-white">{title}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: T.dimText }}>{sub}</div>}
    </div>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl p-4", className)}
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(103,100,136,0.28)" }}>
      {children}
    </div>
  )
}

// ─── Aging buckets ────────────────────────────────────────────────────────────

function AgingChart() {
  return (
    <Panel>
      <SectionHeader title="AP Aging" sub="Outstanding balance by age"/>
      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden mb-3" style={{ height: 12 }}>
        {AGING.map((a, i) => (
          <div key={i} title={`${a.label}: MYR ${fmt(a.amount)}`}
            style={{ width: `${(a.amount / AGING_TOTAL) * 100}%`, background: a.color }}/>
        ))}
      </div>
      {/* Legend + amounts */}
      <div className="space-y-2">
        {AGING.map((a, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-sm shrink-0" style={{ background: a.color }}/>
              <span className="text-[11px] text-white">{a.label}</span>
              <span className="text-[10px]" style={{ color: T.dimText }}>{a.days}</span>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-semibold tabular-nums font-mono" style={{ color: a.color }}>
                {fmtK(a.amount)}
              </span>
              <span className="text-[10px] ml-1" style={{ color: T.dimText }}>MYR</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2"
          style={{ borderTop: "0.5px solid rgba(103,100,136,0.3)" }}>
          <span className="text-[11px] font-semibold text-white">Total Outstanding</span>
          <span className="text-[13px] font-bold tabular-nums font-mono" style={{ color: T.purple }}>
            {fmtK(AGING_TOTAL)} MYR
          </span>
        </div>
      </div>
    </Panel>
  )
}

// ─── DPO gauge ────────────────────────────────────────────────────────────────

function DPOGauge({ dpo }: { dpo: number }) {
  // Arc from -140deg to +140deg, 280deg range
  const pct  = Math.min(dpo / 90, 1)
  const angle = -140 + pct * 280
  const rad   = (angle * Math.PI) / 180
  const cx = 80, cy = 80, r = 56
  const mx = cx + r * Math.cos(rad)
  const my = cy + r * Math.sin(rad)
  const arcColor = dpo < 30 ? T.teal : dpo < 60 ? T.amber : T.red

  // Arc path helper
  const arc = (startDeg: number, endDeg: number, color: string, sw: number) => {
    const s = (startDeg * Math.PI) / 180
    const e = (endDeg * Math.PI) / 180
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return (
      <path d={`M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    )
  }

  return (
    <Panel>
      <SectionHeader title="Days Payable Outstanding" sub="vs industry benchmark 45 days"/>
      <div className="flex items-center justify-center">
        <svg width={160} height={120} viewBox="0 0 160 120">
          {/* Track */}
          {arc(-140, 140, "rgba(103,100,136,0.2)", 10)}
          {/* Good zone */}
          {arc(-140, -140 + (30/90)*280, T.teal, 10)}
          {/* Warning zone */}
          {arc(-140 + (30/90)*280, -140 + (60/90)*280, T.amber, 10)}
          {/* Critical zone */}
          {arc(-140 + (60/90)*280, 140, T.red, 10)}
          {/* Progress fill */}
          {arc(-140, angle, arcColor, 10)}
          {/* Needle dot */}
          <circle cx={mx} cy={my} r={5} fill={arcColor}/>
          <circle cx={mx} cy={my} r={2.5} fill="#fff"/>
          {/* Center text */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="white" fontSize={22} fontWeight={700} fontFamily="monospace">{dpo}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={T.dimText} fontSize={9} fontFamily="sans-serif">DAYS</text>
          {/* Scale labels */}
          <text x={18} y={110} fill={T.dimText} fontSize={8} fontFamily="monospace">0</text>
          <text x={69} y={30} fill={T.dimText} fontSize={8} fontFamily="monospace">45</text>
          <text x={132} y={110} fill={T.dimText} fontSize={8} fontFamily="monospace">90</text>
        </svg>
      </div>
      <div className="flex items-center justify-center gap-2 -mt-1">
        <span className="text-[10px]" style={{ color: dpo > 45 ? T.amber : T.teal }}>
          {dpo > 45 ? `${dpo - 45} days above benchmark` : `${45 - dpo} days below benchmark`}
        </span>
        {dpo > 45 ? <TrendingUp size={11} style={{ color: T.amber }}/> : <TrendingDown size={11} style={{ color: T.teal }}/>}
      </div>
    </Panel>
  )
}

// ─── Top vendors ──────────────────────────────────────────────────────────────

function TopVendors() {
  const statusColor = (s: string) =>
    s === "overdue" ? T.red : s === "due_3d" ? T.amber : s === "due_7d" ? "#F97316" : T.dimText

  return (
    <Panel>
      <SectionHeader title="Top Vendors by Spend" sub="YTD outstanding"/>
      <div className="space-y-3">
        {TOP_VENDORS.map((v, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold tabular-nums w-4 shrink-0"
                  style={{ color: T.dimText }}>#{i + 1}</span>
                <span className="text-[11px] font-medium text-white truncate">{v.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: statusColor(v.status), background: statusColor(v.status) + "18" }}>
                  {v.status === "overdue" ? "OVERDUE" : v.status.replace("_", " ≤").replace("d", "d")}
                </span>
                <span className="text-[11px] font-bold tabular-nums font-mono" style={{ color: statusColor(v.status) }}>
                  {fmtK(v.amount)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(v.amount / VENDOR_MAX) * 100}%`, background: statusColor(v.status) }}/>
              </div>
              <span className="text-[9px] shrink-0" style={{ color: T.dimText }}>{v.invoices} inv</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Cash flow forecast ───────────────────────────────────────────────────────

function CashFlowForecast() {
  return (
    <Panel>
      <SectionHeader title="30-Day Payment Forecast" sub="Projected AP outflows by due date"/>
      <div className="flex items-end gap-1.5" style={{ height: 100 }}>
        {CASH_FLOW.map((c, i) => {
          const h = CF_MAX > 0 ? Math.max(4, (c.amount / CF_MAX) * 84) : 4
          const color = c.overdue ? T.red : c.amount > 50000 ? T.amber : c.amount > 0 ? T.purple : "transparent"
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className="relative w-full flex items-end justify-center" style={{ height: 84 }}>
                {c.amount > 0 && (
                  <div className="w-full rounded-t-sm relative group cursor-default"
                    style={{ height: h, background: color, opacity: 0.85 }}>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      MYR {fmt(c.amount)}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] text-center leading-tight" style={{ color: c.amount > 0 ? T.dimText : "rgba(103,100,136,0.4)" }}>
                {c.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3"
        style={{ borderTop: "0.5px solid rgba(103,100,136,0.25)" }}>
        {[
          { color: T.red,    label: "Overdue" },
          { color: T.amber,  label: ">RM 50k" },
          { color: T.purple, label: "Scheduled" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-sm" style={{ background: l.color }}/>
            <span className="text-[10px]" style={{ color: T.dimText }}>{l.label}</span>
          </div>
        ))}
        <div className="ml-auto text-right">
          <span className="text-[10px]" style={{ color: T.dimText }}>Total 30-day: </span>
          <span className="text-[11px] font-bold font-mono" style={{ color: T.purple }}>
            MYR {fmtK(CASH_FLOW.reduce((s, c) => s + c.amount, 0))}
          </span>
        </div>
      </div>
    </Panel>
  )
}

// ─── Project burn rates ───────────────────────────────────────────────────────

function ProjectBurnRates() {
  return (
    <Panel>
      <SectionHeader title="Project Burn Rates" sub="Budget vs committed vs paid"/>
      <div className="space-y-5">
        {PROJECTS.map((p, i) => {
          const committedPct = (p.committed / p.budget) * 100
          const paidPct      = (p.paid / p.budget) * 100
          const remaining    = p.budget - p.committed
          const burnColor    = committedPct > 85 ? T.red : committedPct > 60 ? T.amber : T.teal

          return (
            <div key={i}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[12px] font-semibold text-white leading-snug">{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono" style={{ color: T.dimText }}>{p.code}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.07)", color: T.dimText }}>{p.cc}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[11px] font-bold font-mono" style={{ color: burnColor }}>
                    {committedPct.toFixed(0)}%
                  </div>
                  <div className="text-[9px]" style={{ color: T.dimText }}>committed</div>
                </div>
              </div>

              {/* Budget bar */}
              <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 8, background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full relative rounded-full overflow-hidden"
                  style={{ width: `${committedPct}%`, background: burnColor }}>
                  {paidPct > 0 && (
                    <div className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${(paidPct / committedPct) * 100}%`, background: "rgba(255,255,255,0.4)" }}/>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Budget",     value: fmtK(p.budget),    color: "rgba(255,255,255,0.5)" },
                  { label: "Committed",  value: fmtK(p.committed), color: burnColor },
                  { label: "Remaining",  value: fmtK(remaining),   color: remaining < p.budget * 0.15 ? T.red : T.teal },
                ].map((s, j) => (
                  <div key={j} className="text-center">
                    <div className="text-[11px] font-bold font-mono tabular-nums" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="text-[9px]" style={{ color: T.dimText }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ─── Control health ───────────────────────────────────────────────────────────

function ControlHealth() {
  const statusIcon = (s: string) =>
    s === "good"     ? <CheckCircle2 size={12} style={{ color: T.teal  }} strokeWidth={2}/>
    : s === "warning"  ? <AlertTriangle size={12} style={{ color: T.amber }} strokeWidth={2}/>
    : <XCircle size={12} style={{ color: T.red }} strokeWidth={2}/>

  const statusColor = (s: string) =>
    s === "good" ? T.teal : s === "warning" ? T.amber : T.red

  const scoreColor = AVG_HEALTH >= 80 ? T.teal : AVG_HEALTH >= 60 ? T.amber : T.red

  return (
    <Panel>
      <div className="flex items-start justify-between mb-4">
        <SectionHeader title="Control Health Score" sub="AP compliance & risk controls"/>
        <div className="flex flex-col items-center shrink-0 ml-3">
          <div className="text-[28px] font-black tabular-nums leading-none" style={{ color: scoreColor }}>
            {AVG_HEALTH}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: scoreColor }}>
            {AVG_HEALTH >= 80 ? "Healthy" : AVG_HEALTH >= 60 ? "Needs Attention" : "Critical"}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {CONTROLS.map((c, i) => (
          <div key={i} className="flex items-center gap-3 py-2 rounded-lg px-2.5 -mx-2.5 transition-colors hover:bg-white/5">
            <div className="shrink-0">{statusIcon(c.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-white truncate">{c.label}</div>
              <div className="text-[10px] mt-0.5 leading-snug" style={{ color: T.dimText }}>{c.detail}</div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="rounded-full overflow-hidden" style={{ width: 48, height: 4, background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${c.score}%`, background: statusColor(c.status) }}/>
              </div>
              <span className="text-[10px] font-bold tabular-nums w-7 text-right"
                style={{ color: statusColor(c.status) }}>{c.score}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── AI summary bar ───────────────────────────────────────────────────────────

function AIBar() {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
      style={{ background: "rgba(93,94,244,0.12)", border: "0.5px solid rgba(93,94,244,0.3)" }}>
      <Sparkles size={14} style={{ color: "#9EACFE", flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
      <div className="flex-1">
        <span className="text-[12px] leading-relaxed" style={{ color: "#C4C9FF" }}>
          <strong style={{ color: "#fff" }}>Critical:</strong> RM 142,800 overdue — Tech Solutions invoice requires immediate payment.{" "}
          Control health at {AVG_HEALTH}/100 — e-invoice compliance and overdue rate pulling the score down.{" "}
          <strong style={{ color: "#fff" }}>Recommend:</strong> approve Tier 2 today and batch payment run for all due-this-week invoices to recover DPO.
        </span>
      </div>
      <kbd className="text-[11px] font-mono shrink-0 self-center" style={{ color: "rgba(255,255,255,0.3)" }}>⌘K</kbd>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-h-0" style={{ height: "calc(100vh - 20px)", overflowY: "auto" }}>
      <div className="flex flex-col gap-4 p-4 pb-8">

        {/* Header */}
        <div className="shrink-0 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.5)" }}>AP</span>
            <ChevronRight size={10} color="rgba(255,255,255,0.35)" strokeWidth={2}/>
            <span className="text-[12px] font-light text-white">Spend & Project Analysis</span>
          </div>
          <h1 className="text-[18px] font-semibold text-white">Spend & Project Analysis</h1>
        </div>

        {/* AI bar */}
        <AIBar/>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Days Payable Outstanding" value={52}  unit="days"    sub="vs 45d benchmark" trend="up"   color={T.amber}  />
          <KpiCard label="Total AP Balance"          value="423k" unit="MYR"   sub="6 invoices"       trend="flat" color={T.purple} />
          <KpiCard label="Overdue Amount"            value="143k" unit="MYR"   sub="1 invoice"        trend="down" color={T.red}    />
          <KpiCard label="Invoices This Month"       value={6}   unit=""        sub="↑ 2 vs last month" trend="up" color={T.teal}   />
        </div>

        {/* Row 1: Aging + DPO */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><AgingChart/></div>
          <DPOGauge dpo={52}/>
        </div>

        {/* Row 2: Top vendors + Cash flow */}
        <div className="grid grid-cols-2 gap-4">
          <TopVendors/>
          <CashFlowForecast/>
        </div>

        {/* Row 3: Project burn + Control health */}
        <div className="grid grid-cols-2 gap-4">
          <ProjectBurnRates/>
          <ControlHealth/>
        </div>

      </div>
    </div>
  )
}
