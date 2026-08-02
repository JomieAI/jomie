"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Clock, Building2, BarChart2,
  CalendarDays, Sparkles, ChevronRight,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine,
  LineChart, Line, AreaChart, Area, Tooltip, ResponsiveContainer,
} from "recharts"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  purple:  "#5d5ef4",
  purpleL: "#eef0ff",
  green:   "#10b981",
  greenL:  "#d1fae5",
  amber:   "#f59e0b",
  amberL:  "#fef3c7",
  red:     "#ef4444",
  redL:    "#fee2e2",
  blue:    "#3b82f6",
  blueL:   "#dbeafe",
  text1:   "#1d2939",
  text2:   "#344054",
  text3:   "#667085",
  text4:   "#98a2b3",
  border:  "#eaecf0",
  bg:      "#f9fafb",
}

const fmtMYR  = (n: number) => n.toLocaleString("en-MY", { minimumFractionDigits: 2 })
const fmtK    = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : n.toString()

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHLY_SPEND = [
  { month: "Feb",  spend: 188_200, paid: 160_000 },
  { month: "Mar",  spend: 214_500, paid: 195_000 },
  { month: "Apr",  spend: 176_800, paid: 170_000 },
  { month: "May",  spend: 239_100, paid: 200_000 },
  { month: "Jun",  spend: 261_400, paid: 225_000 },
  { month: "Jul",  spend: 423_220, paid: 180_000 },
]

const AGING = [
  { bucket: "Current",  label: "0–30 days",  amount: 219_920, count: 6,  color: C.green },
  { bucket: "30 Days",  label: "31–60 days", amount: 38_500,  count: 2,  color: C.amber },
  { bucket: "60 Days",  label: "61–90 days", amount: 22_000,  count: 1,  color: "#f97316" },
  { bucket: "90+ Days", label: ">90 days",   amount: 142_800, count: 3,  color: C.red },
]
const AGING_TOTAL = AGING.reduce((s, a) => s + a.amount, 0)

const TOP_VENDORS = [
  { name: "Tech Solutions MY",   shortName: "Tech Sol.",    amount: 142_800, invoices: 3, dpo: 45, trend: "up"   },
  { name: "SKY Renovation Works",shortName: "SKY Reno.",   amount: 87_200,  invoices: 2, dpo: 28, trend: "down" },
  { name: "Mazars Plt",          shortName: "Mazars",       amount: 74_500,  invoices: 4, dpo: 62, trend: "up"   },
  { name: "Netassist (M) Sdn Bhd",shortName: "Netassist",  amount: 65_980,  invoices: 5, dpo: 18, trend: "down" },
  { name: "AWS Singapore",       shortName: "AWS SG",       amount: 48_200,  invoices: 6, dpo: 33, trend: "stable" },
  { name: "Petronas Dagangan",   shortName: "Petronas",     amount: 22_000,  invoices: 2, dpo: 41, trend: "up"   },
]

const CASHFLOW_FORECAST = [
  { label: "1 Aug",  outstanding: 423_220, forecast: 0 },
  { label: "5 Aug",  outstanding: 398_000, forecast: 25_220 },
  { label: "10 Aug", outstanding: 354_500, forecast: 43_500 },
  { label: "15 Aug", outstanding: 290_000, forecast: 64_500 },
  { label: "20 Aug", outstanding: 230_000, forecast: 60_000 },
  { label: "25 Aug", outstanding: 175_000, forecast: 55_000 },
  { label: "31 Aug", outstanding: 140_000, forecast: 35_000 },
]

const CONTROL_CHECKS = [
  { category: "e-Invoice Compliance", pass: 14, warn: 2, fail: 1, score: 82 },
  { category: "Vendor Master",         pass: 18, warn: 1, fail: 0, score: 95 },
  { category: "3-Way Match",           pass: 9,  warn: 3, fail: 2, score: 71 },
  { category: "WHT Compliance",        pass: 6,  warn: 4, fail: 1, score: 68 },
  { category: "Duplicate Detection",   pass: 21, warn: 0, fail: 0, score: 100 },
]

const CATEGORY_SPEND = [
  { name: "Professional Services", amount: 183_280, color: C.purple },
  { name: "Technology & Cloud",     amount: 98_340,  color: C.blue },
  { name: "Renovation & CAPEX",     amount: 87_200,  color: C.amber },
  { name: "Utilities & Fuel",       amount: 48_200,  color: C.green },
  { name: "Logistics",              amount: 6_200,   color: "#8b5cf6" },
]
const CATEGORY_TOTAL = CATEGORY_SPEND.reduce((s, c) => s + c.amount, 0)

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[16px] font-semibold text-[#1d2939]" style={{ fontFamily: "Inter" }}>{children}</h2>
      {sub && <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>{sub}</p>}
    </div>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-[#eaecf0] rounded-[14px] p-5", className)}>
      {children}
    </div>
  )
}

// ─── Executive KPIs ───────────────────────────────────────────────────────────

function ExecutiveKPIs() {
  const kpis = [
    {
      label:  "Total Outstanding",
      value:  "MYR 423,220",
      sub:    "+62% vs last month",
      trend:  "up-bad",
      detail: "12 invoices pending",
      color:  C.red,
    },
    {
      label:  "Overdue Amount",
      value:  "MYR 142,800",
      sub:    "3 invoices >90 days",
      trend:  "bad",
      detail: "Action required",
      color:  C.red,
    },
    {
      label:  "Days Payable Outstanding",
      value:  "38.4 days",
      sub:    "+5.2d vs last month",
      trend:  "neutral",
      detail: "Industry avg: 32d",
      color:  C.amber,
    },
    {
      label:  "Invoices Processed",
      value:  "47",
      sub:    "Jul 2026",
      trend:  "up-good",
      detail: "+12 vs Jun",
      color:  C.green,
    },
    {
      label:  "Avg Processing Time",
      value:  "9.2 days",
      sub:    "-1.3d vs last month",
      trend:  "down-good",
      detail: "AP → Payment",
      color:  C.green,
    },
    {
      label:  "Control Health Score",
      value:  "83 / 100",
      sub:    "4 checks need attention",
      trend:  "neutral",
      detail: "Last checked today",
      color:  C.amber,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 xl:grid-cols-6 mb-6">
      {kpis.map(({ label, value, sub, trend, detail, color }) => (
        <Panel key={label} className="flex flex-col gap-2 p-4">
          <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>{label}</p>
          <p className="text-[20px] font-bold text-[#1d2939] leading-tight" style={{ fontFamily: "Inter" }}>{value}</p>
          <div className="flex items-center gap-1">
            {(trend === "up-bad" || trend === "up-good") && (
              <ArrowUpRight size={12} style={{ color: trend === "up-bad" ? C.red : C.green }} />
            )}
            {(trend === "down-good" || trend === "down-bad") && (
              <ArrowDownRight size={12} style={{ color: trend === "down-good" ? C.green : C.red }} />
            )}
            <p className="text-[11px]" style={{ color, fontFamily: "Inter" }}>{sub}</p>
          </div>
        </Panel>
      ))}
    </div>
  )
}

// ─── Spend Trend Chart ─────────────────────────────────────────────────────────

function SpendTrendChart() {
  const config = {
    spend: { label: "Invoiced",   color: C.purple },
    paid:  { label: "Paid",       color: C.green },
  }

  return (
    <Panel>
      <div className="flex items-start justify-between mb-4">
        <SectionTitle sub="Invoiced vs paid — last 6 months">Monthly Spend</SectionTitle>
        <div className="flex items-center gap-3">
          {Object.entries(config).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <ChartContainer config={config} className="h-[200px] w-full">
        <BarChart data={MONTHLY_SPEND} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f7" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.text4 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: C.text4 }} axisLine={false} tickLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `MYR ${fmtK(Number(v))}`} />} />
          <Bar dataKey="spend" fill={C.purple} radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid"  fill={C.green}  radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

// ─── Aging Buckets ─────────────────────────────────────────────────────────────

function AgingBuckets() {
  return (
    <Panel>
      <SectionTitle sub={`MYR ${fmtMYR(AGING_TOTAL)} total outstanding`}>AP Aging</SectionTitle>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-4">
        {AGING.map(a => (
          <div
            key={a.bucket}
            className="h-full rounded-sm transition-all"
            style={{ width: `${(a.amount / AGING_TOTAL) * 100}%`, background: a.color }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {AGING.map(a => (
          <div key={a.bucket} className="flex items-center gap-3">
            <div className="size-2 rounded-full shrink-0" style={{ background: a.color }} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>{a.bucket}</span>
                <span className="text-[12px] font-bold text-[#1d2939] tabular-nums" style={{ fontFamily: "Inter" }}>MYR {fmtK(a.amount)}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>{a.label}</span>
                <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>{a.count} inv · {Math.round((a.amount / AGING_TOTAL) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {AGING.some(a => a.bucket === "90+ Days" && a.amount > 0) && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-[10px] px-3 py-2.5">
          <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-600" style={{ fontFamily: "Inter" }}>
            MYR 142,800 is 90+ days overdue. Escalation recommended.
          </p>
        </div>
      )}
    </Panel>
  )
}

// ─── Top Vendors ───────────────────────────────────────────────────────────────

function TopVendors() {
  const max = Math.max(...TOP_VENDORS.map(v => v.amount))

  return (
    <Panel>
      <SectionTitle sub="By outstanding balance">Top Vendors</SectionTitle>
      <div className="flex flex-col gap-3">
        {TOP_VENDORS.map((v, i) => (
          <div key={v.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#98a2b3] w-4 text-right tabular-nums" style={{ fontFamily: "Inter" }}>{i + 1}</span>
                <span className="text-[12px] font-medium text-[#344054] truncate max-w-[140px]" style={{ fontFamily: "Inter" }}>{v.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>DPO {v.dpo}d</span>
                <span className="text-[12px] font-bold text-[#1d2939] tabular-nums" style={{ fontFamily: "Inter" }}>MYR {fmtK(v.amount)}</span>
                {v.trend === "up" && <TrendingUp size={12} className="text-red-400 shrink-0" />}
                {v.trend === "down" && <TrendingDown size={12} className="text-green-500 shrink-0" />}
              </div>
            </div>
            <div className="h-1.5 bg-[#f2f4f7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(v.amount / max) * 100}%`,
                  background: i === 0 ? C.purple : i < 3 ? C.blue : C.text4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── 30-Day Cash Flow Forecast ─────────────────────────────────────────────────

function CashFlowForecast() {
  const config = {
    outstanding: { label: "Outstanding", color: C.purple },
    forecast:    { label: "Payments Due", color: C.amber },
  }

  return (
    <Panel>
      <div className="flex items-start justify-between mb-4">
        <SectionTitle sub="Outstanding balance & projected payment outflows">30-Day Cash Flow</SectionTitle>
        <div className="flex items-center gap-1.5 bg-[#f7f7fe] border border-[#e0e1fd] rounded-[6px] px-2 py-1">
          <Sparkles size={11} style={{ color: C.purple }} />
          <span className="text-[10px] font-medium text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>AI Forecast</span>
        </div>
      </div>
      <ChartContainer config={config} className="h-[180px] w-full">
        <AreaChart data={CASHFLOW_FORECAST}>
          <defs>
            <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.purple} stopOpacity={0.15} />
              <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.amber} stopOpacity={0.15} />
              <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f7" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.text4 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: C.text4 }} axisLine={false} tickLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `MYR ${fmtK(Number(v))}`} />} />
          <Area dataKey="outstanding" stroke={C.purple} strokeWidth={2} fill="url(#gradPurple)" dot={false} />
          <Area dataKey="forecast"    stroke={C.amber}  strokeWidth={2} fill="url(#gradAmber)"  dot={false} />
        </AreaChart>
      </ChartContainer>
      <div className="flex items-center gap-3 mt-3">
        {Object.entries(config).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="size-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>{label}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Spend by Category ─────────────────────────────────────────────────────────

function SpendByCategory() {
  return (
    <Panel>
      <SectionTitle sub="Jul 2026 invoiced amount">Spend by Category</SectionTitle>
      <div className="flex flex-col gap-3">
        {CATEGORY_SPEND.map(c => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-[12px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>{Math.round((c.amount / CATEGORY_TOTAL) * 100)}%</span>
                <span className="text-[12px] font-bold text-[#1d2939] tabular-nums" style={{ fontFamily: "Inter" }}>MYR {fmtK(c.amount)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-[#f2f4f7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(c.amount / CATEGORY_TOTAL) * 100}%`, background: c.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

// ─── Control Health ────────────────────────────────────────────────────────────

function ControlHealthPanel() {
  const overall = Math.round(CONTROL_CHECKS.reduce((s, c) => s + c.score, 0) / CONTROL_CHECKS.length)

  return (
    <Panel>
      <div className="flex items-start justify-between mb-4">
        <SectionTitle sub="AI compliance checks across all invoices">Control Health</SectionTitle>
        <div className="text-right">
          <p className="text-[28px] font-bold leading-none" style={{ color: overall >= 90 ? C.green : overall >= 70 ? C.amber : C.red, fontFamily: "Inter" }}>
            {overall}
          </p>
          <p className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>/ 100</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-[#eaecf0] overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${overall}%`,
            background: overall >= 90 ? C.green : overall >= 70 ? C.amber : C.red,
          }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {CONTROL_CHECKS.map(c => (
          <div key={c.category} className="flex items-center gap-3">
            <div
              className="size-2 rounded-full shrink-0"
              style={{ background: c.score >= 90 ? C.green : c.score >= 70 ? C.amber : C.red }}
            />
            <span className="text-[12px] text-[#344054] flex-1" style={{ fontFamily: "Inter" }}>{c.category}</span>
            <div className="flex items-center gap-1.5">
              {c.fail > 0 && (
                <span className="text-[10px] bg-red-50 text-red-600 rounded-[4px] px-1.5 py-0.5 font-semibold" style={{ fontFamily: "Inter" }}>
                  {c.fail} fail
                </span>
              )}
              {c.warn > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-600 rounded-[4px] px-1.5 py-0.5 font-semibold" style={{ fontFamily: "Inter" }}>
                  {c.warn} warn
                </span>
              )}
              <span className="text-[12px] font-bold w-8 text-right" style={{ color: c.score >= 90 ? C.green : c.score >= 70 ? C.amber : C.red, fontFamily: "Inter" }}>
                {c.score}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <Sparkles size={11} style={{ color: C.purple }} />
        <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
          Powered by Jomie Compliance Engine — approvalMatrix.md@v1.3
        </p>
      </div>
    </Panel>
  )
}

// ─── DPO Trend ────────────────────────────────────────────────────────────────

const DPO_TREND = [
  { month: "Feb", dpo: 29 },
  { month: "Mar", dpo: 31 },
  { month: "Apr", dpo: 27 },
  { month: "May", dpo: 33 },
  { month: "Jun", dpo: 34 },
  { month: "Jul", dpo: 38 },
]

function DPOTrendChart() {
  const config = { dpo: { label: "DPO (days)", color: C.purple } }
  const current = DPO_TREND[DPO_TREND.length - 1].dpo

  return (
    <Panel>
      <div className="flex items-start justify-between mb-1">
        <SectionTitle sub="Days Payable Outstanding — 6 month trend">DPO Trend</SectionTitle>
        <div className="text-right">
          <p className="text-[24px] font-bold text-[#1d2939] leading-none" style={{ fontFamily: "Inter" }}>{current}d</p>
          <p className="text-[10px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>Jul 2026</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] text-amber-600 bg-amber-50 rounded-[5px] px-1.5 py-0.5 font-medium" style={{ fontFamily: "Inter" }}>
          +5.2d vs Jun
        </span>
        <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>Industry avg: 32d</span>
      </div>
      <ChartContainer config={config} className="h-[130px] w-full">
        <LineChart data={DPO_TREND}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f7" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.text4 }} axisLine={false} tickLine={false} />
          <YAxis domain={[20, 45]} tick={{ fontSize: 10, fill: C.text4 }} axisLine={false} tickLine={false} width={24} />
          <ReferenceLine y={32} stroke={C.text4} strokeDasharray="4 4" strokeOpacity={0.5} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} days`} />} />
          <Line dataKey="dpo" stroke={C.purple} strokeWidth={2} dot={{ fill: C.purple, r: 3 }} />
        </LineChart>
      </ChartContainer>
      <p className="text-[10px] text-[#98a2b3] mt-2" style={{ fontFamily: "Inter" }}>
        Dashed line = 32d industry average (Malaysian SME benchmark)
      </p>
    </Panel>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpendAnalysisPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#f4f4f1" }}>

      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-0 shrink-0">
        <div>
          <p className="text-[12px] font-light text-[#344054]" style={{ fontFamily: "Inter" }}>AP / Spend Analysis</p>
          <h1 className="text-[30px] font-semibold leading-[38px] text-[#171b1d]" style={{ fontFamily: "Inter" }}>Spend Analysis</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#eaecf0] rounded-[12px] px-3 py-[9px] text-[13px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]" style={{ fontFamily: "Inter" }}>
            <CalendarDays size={14} className="text-[#667085]" />
            <span>Jul 2026</span>
            <ChevronRight size={13} className="text-[#98a2b3]" />
          </div>
          <button
            className="bg-white border border-[#d0d5dd] rounded-[12px] px-4 py-[9px] text-[13px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}
          >
            Export ↓
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8">

        {/* Executive KPIs */}
        <ExecutiveKPIs />

        {/* Row 1: Spend Trend + DPO */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2"><SpendTrendChart /></div>
          <div><DPOTrendChart /></div>
        </div>

        {/* Row 2: Aging + Top Vendors + Category */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <AgingBuckets />
          <TopVendors />
          <SpendByCategory />
        </div>

        {/* Row 3: Cash Flow + Control Health */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><CashFlowForecast /></div>
          <ControlHealthPanel />
        </div>

      </div>
    </div>
  )
}
