"use client"

import * as React from "react"
import {
  ChevronRight, Sparkles, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine,
  RadialBarChart, RadialBar, PolarGrid, PolarRadiusAxis, Label,
} from "recharts"
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  purple: "#5D5EF4",
  amber:  "#D97706",
  red:    "#EF4444",
  blue:   "#3B82F6",
  green:  "#10B981",
  teal:   "#1D9E75",
  muted:  "#6B7280",
  border: "#E5E7EB",
  bg:     "#FFFFFF",
  surfaceMuted: "#F9FAFB",
}

const fmt  = (n: number) => n.toLocaleString("en-MY")
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : fmt(n)

// ─── Data ─────────────────────────────────────────────────────────────────────

const AGING = [
  { bucket: "Current",  days: "0–30d",  amount: 219920, color: C.teal   },
  { bucket: "30 Days",  days: "31–60d", amount: 38500,  color: C.amber  },
  { bucket: "60 Days",  days: "61–90d", amount: 22000,  color: "#F97316" },
  { bucket: "90+ Days", days: ">90d",   amount: 142800, color: C.red    },
]
const AGING_TOTAL = AGING.reduce((s, a) => s + a.amount, 0)

const TOP_VENDORS = [
  { name: "Tech Solutions MY",  shortName: "Tech Sol.", amount: 142800, invoices: 3, status: "overdue" },
  { name: "SKY Renovation",     shortName: "SKY Reno.", amount: 38500,  invoices: 1, status: "due_3d"  },
  { name: "Petronas Dagangan",  shortName: "Petronas",  amount: 22000,  invoices: 2, status: "due_3d"  },
  { name: "AWS Singapore",      shortName: "AWS SG",    amount: 12340,  invoices: 2, status: "due_7d"  },
  { name: "Tenaga Nasional",    shortName: "TNB",       amount: 4280,   invoices: 1, status: "due_30d" },
]
const VENDOR_TOTAL = TOP_VENDORS.reduce((s, v) => s + v.amount, 0)

const PROJECTS = [
  { code: "PROJ-2024-01", name: "ERP System Implementation Phase 2", budget: 300000, committed: 142800, paid: 85000, cc: "IT-OPS" },
  { code: "PROJ-2024-03", name: "HQ Office Renovation FY2024",       budget: 80000,  committed: 35000,  paid: 0,     cc: "ADMIN"  },
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
const CASH_AVG = Math.round(
  CASH_FLOW.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0) /
  CASH_FLOW.filter(c => c.amount > 0).length
)

const CONTROLS = [
  { label: "e-Invoice compliance",        score: 60,  status: "warning",  detail: "3 of 5 local invoices missing MyInvois verification" },
  { label: "3-way PO matching",           score: 85,  status: "good",     detail: "4 of 5 invoices matched to approved PO" },
  { label: "SOD enforcement",             score: 100, status: "good",     detail: "Segregation of duties enforced on all approvals" },
  { label: "CAPEX approval threshold",    score: 70,  status: "warning",  detail: "1 CAPEX item pending CFO sign-off (RM 14k)" },
  { label: "Duplicate invoice detection", score: 95,  status: "good",     detail: "1 flagged, confirmed not duplicate after review" },
  { label: "Overdue payment rate",        score: 40,  status: "critical", detail: "RM 142,800 overdue — Tech Solutions past due" },
]
const AVG_HEALTH = Math.round(CONTROLS.reduce((s, c) => s + c.score, 0) / CONTROLS.length)

// ─── Chart configs ─────────────────────────────────────────────────────────────

const vendorCfg   = { amount: { label: "Outstanding (MYR)" } } satisfies ChartConfig
const cashCfg     = { amount: { label: "Payment (MYR)"     } } satisfies ChartConfig
const dpoCfg      = { dpo:    { label: "DPO", color: C.amber } } satisfies ChartConfig

// ─── Helpers ──────────────────────────────────────────────────────────────────

const vendorColor = (s: string) =>
  s === "overdue" ? C.red : s === "due_3d" ? C.amber : s === "due_7d" ? "#F97316" : C.muted
const vendorLabel = (s: string) =>
  s === "overdue" ? "Overdue" : s === "due_3d" ? "Due ≤3d" : s === "due_7d" ? "Due ≤7d" : "Due ≤30d"
const controlColor = (s: string) =>
  s === "good" ? C.teal : s === "warning" ? C.amber : C.red
const controlIcon = (s: string) =>
  s === "good"
    ? <CheckCircle2 size={14} strokeWidth={1.8} style={{ color: C.teal  }} />
    : s === "warning"
    ? <AlertTriangle size={14} strokeWidth={1.8} style={{ color: C.amber }} />
    : <XCircle size={14} strokeWidth={1.8} style={{ color: C.red }} />

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-[13px] font-semibold text-foreground tracking-tight">{title}</h2>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ─── Divider card ──────────────────────────────────────────────────────────────

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl bg-white ${className}`}
      style={{ border: `1px solid ${C.border}` }}
    >
      {children}
    </div>
  )
}

// ─── AI Bar ────────────────────────────────────────────────────────────────────

function AIBar() {
  return (
    <div
      className="rounded-xl px-4 py-3 flex items-start gap-3"
      style={{ background: "#FAFAFA", border: `1px solid ${C.border}` }}
    >
      <div
        className="size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: C.purple }}
      >
        <Sparkles size={10} strokeWidth={2.5} color="#fff" />
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground flex-1">
        <span className="font-semibold" style={{ color: C.purple }}>Action needed:</span>{" "}
        RM 142,800 overdue — Tech Solutions requires immediate payment.
        Control health at <span className="font-medium text-foreground">{AVG_HEALTH}/100</span> — e-invoice compliance and overdue rate are the main drags.{" "}
        <span className="font-semibold" style={{ color: C.purple }}>Recommend</span> approving Tier 2 and running a batch payment for all invoices due this week.
      </p>
      <button className="text-[10px] text-muted-foreground font-mono shrink-0 self-center border rounded px-1.5 py-0.5 hover:bg-muted/50 transition-colors" style={{ borderColor: C.border }}>
        ⌘K
      </button>
    </div>
  )
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

function KpiStrip() {
  const kpis = [
    { label: "Days Payable Outstanding", value: "52", unit: "days", change: "+7 vs benchmark", up: true,  color: C.amber },
    { label: "Total AP Balance",         value: "423k", unit: "MYR",  change: "6 invoices",       up: null, color: C.blue  },
    { label: "Overdue Amount",           value: "143k", unit: "MYR",  change: "1 invoice past due", up: false, color: C.red  },
    { label: "Invoices This Month",      value: "6",    unit: "",     change: "↑ 2 vs last month", up: true,  color: C.green },
  ]

  return (
    <Panel>
      <div className="grid grid-cols-4 divide-x" style={{ borderColor: C.border }}>
        {kpis.map((k, i) => (
          <div key={i} className="px-5 py-4">
            <p className="text-[11px] text-muted-foreground mb-2 font-medium">{k.label}</p>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-[28px] font-bold leading-none tabular-nums" style={{ color: k.color }}>
                {k.value}
              </span>
              {k.unit && <span className="text-xs text-muted-foreground font-medium">{k.unit}</span>}
            </div>
            <div className="flex items-center gap-1">
              {k.up === true  && <ArrowUpRight   size={11} style={{ color: k.color }} />}
              {k.up === false && <ArrowDownRight  size={11} style={{ color: k.color }} />}
              <span className="text-[11px] text-muted-foreground">{k.change}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── AP Aging ─────────────────────────────────────────────────────────────────

function AgingSection() {
  return (
    <Panel className="p-5">
      <SectionHead
        title="AP Aging"
        sub="Outstanding balance by age"
        right={
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.purple }}>
            {fmtK(AGING_TOTAL)} MYR total
          </span>
        }
      />

      {/* Proportional bar */}
      <div className="flex rounded-full overflow-hidden mb-5" style={{ height: 5, gap: 2 }}>
        {AGING.map((a, i) => (
          <div key={i} style={{ flex: a.amount, background: a.color, borderRadius: 99 }} />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0">
        {AGING.map((a, i) => {
          const pct = (a.amount / AGING_TOTAL) * 100
          return (
            <div
              key={i}
              className="flex items-center gap-4 py-4"
              style={{ borderBottom: i < AGING.length - 1 ? `1px solid ${C.border}` : undefined }}
            >
              <div className="flex items-center gap-2 w-36 shrink-0">
                <div className="size-2 rounded-full shrink-0" style={{ background: a.color }} />
                <span className="text-[12px] font-semibold text-foreground">{a.bucket}</span>
                <span className="text-[10px] text-muted-foreground">{a.days}</span>
              </div>

              {/* Track */}
              <div className="flex-1 h-2 rounded-full" style={{ background: C.border }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-muted-foreground w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
                <span className="text-[14px] font-bold tabular-nums font-mono w-16 text-right" style={{ color: a.color }}>
                  {fmtK(a.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground w-6">MYR</span>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ─── DPO ──────────────────────────────────────────────────────────────────────

function DPOSection({ dpo }: { dpo: number }) {
  const pct = Math.min((dpo / 90) * 100, 100)
  const data = [{ dpo: pct, fill: C.amber }]

  return (
    <Panel className="p-5 flex flex-col">
      <SectionHead title="Days Payable Outstanding" sub="vs benchmark 45 days" />

      <ChartContainer config={dpoCfg} className="mx-auto w-full" style={{ height: 200 }}>
        <RadialBarChart data={data} startAngle={180} endAngle={180 - (pct / 100) * 180} innerRadius={65} outerRadius={90} margin={{ top: 20, bottom: 0, left: 0, right: 0 }}>
          <PolarGrid gridType="circle" radialLines={false} stroke="none"
            className="first:fill-muted last:fill-background" polarRadius={[82, 70]} />
          <RadialBar dataKey="dpo" background cornerRadius={4} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 4}
                        style={{ fontSize: 32, fontWeight: 700, fill: C.amber }}>
                        {dpo}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16}
                        style={{ fontSize: 10, fill: C.muted, fontWeight: 500 }}>
                        DAYS
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>

      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Actual", value: dpo,  color: C.amber },
            { label: "Benchmark", value: 45, color: C.teal  },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-[22px] font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label} (days)</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1 mt-3">
          <TrendingUp size={12} style={{ color: C.amber }} />
          <span className="text-[11px]" style={{ color: C.amber }}>{dpo - 45} days above benchmark</span>
        </div>
      </div>
    </Panel>
  )
}

// ─── Top Vendors ──────────────────────────────────────────────────────────────

function VendorsSection() {
  return (
    <Panel className="p-5">
      <SectionHead title="Top Vendors by Spend" sub="YTD outstanding balance" />

      <ChartContainer config={vendorCfg} className="w-full" style={{ height: 148 }}>
        <BarChart data={TOP_VENDORS} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid horizontal={false} stroke={C.border} strokeDasharray="3 3" />
          <YAxis dataKey="shortName" type="category" tickLine={false} axisLine={false} width={58}
            tick={{ fontSize: 10, fill: C.muted }} />
          <XAxis type="number" hide />
          <ChartTooltip cursor={{ fill: C.surfaceMuted }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _, item) => (
                  <span className="text-xs">{item.payload.name} · MYR {fmt(Number(value))}</span>
                )}
              />
            }
          />
          <Bar dataKey="amount" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {TOP_VENDORS.map((v, i) => <Cell key={i} fill={vendorColor(v.status)} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-3 space-y-0">
        {TOP_VENDORS.map((v, i) => {
          const share = ((v.amount / VENDOR_TOTAL) * 100).toFixed(0)
          const vc = vendorColor(v.status)
          return (
            <div
              key={i}
              className="flex items-center justify-between py-2"
              style={{ borderTop: i > 0 ? `1px solid ${C.border}` : undefined }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="text-[12px] text-foreground truncate">{v.name}</span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                <span className="text-[10px] text-muted-foreground">{share}%</span>
                <span className="text-[10px] font-medium" style={{ color: vc }}>{vendorLabel(v.status)}</span>
                <span className="text-[12px] font-bold tabular-nums font-mono" style={{ color: vc }}>{fmtK(v.amount)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

// ─── Cash Flow ────────────────────────────────────────────────────────────────

function CashFlowSection() {
  const total = CASH_FLOW.reduce((s, c) => s + c.amount, 0)

  return (
    <Panel className="p-5">
      <SectionHead
        title="30-Day Payment Forecast"
        sub="Projected AP outflows by due date"
        right={
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.purple }}>
            MYR {fmtK(total)} total
          </span>
        }
      />

      <ChartContainer config={cashCfg} className="w-full" style={{ height: 180 }}>
        <BarChart data={CASH_FLOW} margin={{ left: 0, right: 0, top: 4, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false}
            tick={{ fontSize: 8, fill: C.muted }} tickMargin={4} />
          <YAxis hide />
          <ReferenceLine y={CASH_AVG} stroke={C.blue} strokeDasharray="4 3" strokeWidth={1}
            label={{ value: "avg", position: "insideTopRight", fontSize: 8, fill: C.blue }} />
          <ChartTooltip cursor={{ fill: C.surfaceMuted }}
            content={<ChartTooltipContent formatter={(v) => `MYR ${fmt(Number(v))}`} labelFormatter={l => l} />}
          />
          <Bar dataKey="amount" radius={[2, 2, 0, 0]} maxBarSize={22}>
            {CASH_FLOW.map((c, i) => (
              <Cell key={i}
                fill={c.overdue ? C.red : c.amount > 50000 ? C.amber : c.amount > 0 ? C.purple : "transparent"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
        {[{ c: C.red, l: "Overdue" }, { c: C.amber, l: ">RM 50k" }, { c: C.purple, l: "Scheduled" }].map((x, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="size-2 rounded-sm" style={{ background: x.c, opacity: 0.8 }} />
            <span className="text-[10px] text-muted-foreground">{x.l}</span>
          </div>
        ))}
      </div>

      {/* Upcoming payments list */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming payments</p>
        <div className="space-y-0">
          {CASH_FLOW.filter(c => c.amount > 0).slice(0, 4).map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 -mx-1 px-1 rounded-md hover:bg-muted/40 transition-colors cursor-default"
              style={{ borderTop: i > 0 ? `1px solid ${C.border}` : undefined }}>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full shrink-0"
                  style={{ background: c.overdue ? C.red : c.amount > 50000 ? C.amber : C.purple }} />
                <span className="text-[11px] text-foreground">{c.label}</span>
                {c.overdue && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${C.red}12`, color: C.red }}>Overdue</span>
                )}
              </div>
              <span className="text-[12px] font-bold tabular-nums font-mono"
                style={{ color: c.overdue ? C.red : c.amount > 50000 ? C.amber : C.purple }}>
                {fmtK(c.amount)} MYR
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

// ─── Project Burn Rates ───────────────────────────────────────────────────────

function BurnSection() {
  return (
    <Panel className="p-5">
      <SectionHead title="Project Burn Rates" sub="Budget · committed · paid" />

      <div className="space-y-6">
        {PROJECTS.map((p, i) => {
          const committedPct = (p.committed / p.budget) * 100
          const paidPct      = (p.paid      / p.budget) * 100
          const remaining    = p.budget - p.committed
          const burnColor    = committedPct > 85 ? C.red : committedPct > 60 ? C.amber : C.teal

          return (
            <div key={i}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 pr-4">
                  <p className="text-[12px] font-semibold leading-snug text-foreground">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-mono text-muted-foreground">{p.code}</span>
                    <span className="text-muted-foreground">·</span>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-medium">{p.cc}</Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[18px] font-bold tabular-nums leading-none" style={{ color: burnColor }}>
                    {committedPct.toFixed(0)}%
                  </span>
                  <p className="text-[9px] text-muted-foreground">committed</p>
                </div>
              </div>

              {/* Track */}
              <div className="relative h-1.5 rounded-full mb-3" style={{ background: C.border }}>
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${committedPct}%`, background: burnColor, opacity: 0.25 }} />
                <div className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${paidPct}%`, background: burnColor }} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Budget",    v: fmtK(p.budget),    c: "hsl(var(--foreground))" },
                  { l: "Committed", v: fmtK(p.committed), c: burnColor },
                  { l: "Remaining", v: fmtK(remaining),   c: remaining < p.budget * 0.15 ? C.red : C.teal },
                ].map((s, j) => (
                  <div key={j} className="py-3 rounded-lg" style={{ background: C.surfaceMuted }}>
                    <p className="text-[15px] font-bold tabular-nums font-mono" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.l}</p>
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

// ─── Control Health ───────────────────────────────────────────────────────────

function ControlSection() {
  const scoreColor = AVG_HEALTH >= 80 ? C.teal : AVG_HEALTH >= 60 ? C.amber : C.red

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight">Control Health Score</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">AP compliance & risk controls</p>
        </div>
        <div className="text-right">
          <p className="text-[36px] font-black leading-none tabular-nums" style={{ color: scoreColor }}>{AVG_HEALTH}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: scoreColor }}>
            {AVG_HEALTH >= 80 ? "Healthy" : AVG_HEALTH >= 60 ? "Needs Attention" : "Critical"}
          </p>
        </div>
      </div>

      {/* Scale bar */}
      <div className="relative h-1.5 rounded-full mb-4" style={{ background: C.border }}>
        <div className="h-full rounded-full" style={{ width: `${AVG_HEALTH}%`, background: scoreColor }} />
        <div className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-white shadow"
          style={{ left: `${AVG_HEALTH}%`, transform: "translate(-50%, -50%)", background: scoreColor }} />
      </div>

      <div className="space-y-0.5">
        {CONTROLS.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-md cursor-default transition-colors hover:bg-muted/50"
          >
            <div className="shrink-0">{controlIcon(c.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground leading-none">{c.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.detail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-12 h-1 rounded-full" style={{ background: C.border }}>
                <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: controlColor(c.status) }} />
              </div>
              <span className="text-[11px] font-bold w-6 text-right tabular-nums" style={{ color: controlColor(c.status) }}>
                {c.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F9FAFB" }}>
      <div className="max-w-[1400px] flex flex-col gap-5 p-6 pb-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-1 mb-1 text-[11px] text-muted-foreground">
            <span>AP</span>
            <ChevronRight size={10} strokeWidth={2} />
            <span className="text-foreground">Spend & Project Analysis</span>
          </div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground">Spend & Project Analysis</h1>
        </div>

        {/* AI bar */}
        <AIBar />

        {/* KPI strip */}
        <KpiStrip />

        {/* Row 1: Aging + DPO */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2"><AgingSection /></div>
          <DPOSection dpo={52} />
        </div>

        {/* Row 2: Vendors + Cash flow */}
        <div className="grid grid-cols-2 gap-5">
          <VendorsSection />
          <CashFlowSection />
        </div>

        {/* Row 3: Burn + Controls */}
        <div className="grid grid-cols-2 gap-5">
          <BurnSection />
          <ControlSection />
        </div>

      </div>
    </div>
  )
}
