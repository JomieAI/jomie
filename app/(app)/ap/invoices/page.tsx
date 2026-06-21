"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, Search, Upload, Download,
  AlertTriangle, Star, Globe, Building2, Clock,
  CheckCircle2, XCircle, RefreshCw, Filter,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { listInvoices, type InvoiceListItem } from "@/lib/api"

// ─── Design tokens (consistent with P2P) ─────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyBucket = "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
type InvoiceStatus = "pending_review" | "approved" | "rejected" | "paid" | "overdue"
type InvoiceOrigin = "local" | "foreign" | "unknown"

type Invoice = InvoiceListItem

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<UrgencyBucket, { label: string; color: string; bg: string; border: string }> = {
  overdue:  { label: "Overdue",   color: T.red,   bg: T.redLight,   border: T.red   },
  due_3d:   { label: "Due ≤3d",   color: T.amber, bg: T.amberLight, border: T.amber },
  due_7d:   { label: "Due ≤7d",   color: T.amber, bg: T.amberLight + "88", border: T.amber + "88" },
  due_30d:  { label: "Due ≤30d",  color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border + "44" },
  future:   { label: "Future",    color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border + "44" },
}

const URGENCY_ORDER: UrgencyBucket[] = ["overdue", "due_3d", "due_7d", "due_30d", "future"]

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pending Review", color: "#92400E",     bg: "#FEF3C7" },
  approved:       { label: "Approved",       color: T.tealText,    bg: T.tealLight },
  rejected:       { label: "Rejected",       color: T.redText,     bg: T.redLight },
  paid:           { label: "Paid",           color: T.dimText,     bg: "rgba(255,255,255,0.06)" },
  overdue:        { label: "Overdue",        color: T.redText,     bg: T.redLight },
}

const FILTER_KEYS = [
  { key: "all",            label: "All"     },
  { key: "pending_review", label: "Pending" },
  { key: "approved",       label: "Approved"},
  { key: "paid",           label: "Paid"    },
]

// ─── Right panel — Invoice quick view ─────────────────────────────────────────

function InvoicePanel({ invoice }: { invoice: Invoice | null }) {
  const router = useRouter()
  if (!invoice) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 pb-3 mb-3 shrink-0" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">Jomie AP</span>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full animate-pulse" style={{ background: T.teal }} />
            <span className="text-[9px] font-mono font-semibold tracking-wider" style={{ color: T.teal }}>LIVE</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: T.purpleLight }}>
            <Sparkles size={18} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-gray-500 mb-1">Select an invoice</div>
            <div className="text-[11px] text-gray-400 leading-relaxed max-w-[180px]">
              Jomie will show urgency, GL codes, and compliance flags
            </div>
          </div>
        </div>
      </div>
    )
  }

  const urgency = URGENCY_CONFIG[invoice.urgency_bucket ?? "future"]
  const status  = STATUS_CONFIG[invoice.status]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 shrink-0" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">Jomie AP</span>
        </div>
        <button
          onClick={() => router.push(`/ap/invoices/${invoice.id}`)}
          className="flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
          style={{ color: T.purple }}>
          View detail<ChevronRight size={10} strokeWidth={2}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4">
        {/* Vendor + amount */}
        <div>
          <div className="text-[14px] font-bold text-gray-900 leading-snug mb-0.5">{invoice.vendor_name_raw}</div>
          <div className="text-[11px] text-gray-400 mb-3 font-mono">{invoice.invoice_number}</div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Total (MYR)</div>
              <div className="text-[22px] font-bold text-gray-900 tabular-nums font-mono">
                {(invoice.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          {/* Urgency + due date */}
          <div className="rounded-lg px-3 py-2.5 mb-3"
            style={{ background: urgency.bg, border: `0.5px solid ${urgency.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: urgency.color }}>{urgency.label}</span>
              {invoice.due_date && (
                <span className="text-[11px] font-mono" style={{ color: urgency.color }}>
                  {new Date(invoice.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>

          {/* Early payment discount */}
          {invoice.discount_available && invoice.discount_savings_myr && (
            <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2"
              style={{ background: "rgba(93,94,244,0.06)", border: "0.5px solid rgba(93,94,244,0.2)" }}>
              <Star size={12} style={{ color: T.purple, flexShrink: 0 }} strokeWidth={2}/>
              <div>
                <div className="text-[11px] font-semibold" style={{ color: T.purpleText }}>Early Payment Discount</div>
                <div className="text-[10px]" style={{ color: T.purpleText }}>
                  Save RM {invoice.discount_savings_myr.toLocaleString()} if paid early
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flags */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Checks</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">e-Invoice verified</span>
              {invoice.is_einvoice_verified
                ? <span className="flex items-center gap-1 font-medium" style={{ color: T.teal }}><CheckCircle2 size={11}/>Yes</span>
                : <span className="flex items-center gap-1 font-medium text-gray-400"><XCircle size={11}/>No</span>}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Origin</span>
              <span className="flex items-center gap-1 font-medium text-gray-700">
                {invoice.origin === "foreign" ? <Globe size={11}/> : <Building2 size={11}/>}
                {(invoice.origin ?? "unknown").charAt(0).toUpperCase() + (invoice.origin ?? "unknown").slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Duplicate risk</span>
              {invoice.duplicate_risk === "none"
                ? <span className="font-medium text-gray-400">None</span>
                : <span className="flex items-center gap-1 font-semibold" style={{ color: T.amber }}>
                    <AlertTriangle size={11}/>{invoice.duplicate_risk === "exact" ? "Exact match" : "Possible"}
                  </span>}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Source</span>
              <span className="font-medium text-gray-600">
                {invoice.source === "email_gmail" ? "Gmail" : invoice.source === "manual_upload" ? "Upload" : invoice.source}
              </span>
            </div>
          </div>
        </div>

        {/* AI insight placeholder */}
        <div className="rounded-lg p-3"
          style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.12)" }}>
          <div className="flex items-start gap-2">
            <Sparkles size={11} style={{ color: T.purple, flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
            <div>
              <div className="text-[11px] font-semibold mb-1" style={{ color: T.purpleText }}>AI Analysis</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                {invoice.origin === "foreign"
                  ? "Foreign vendor — self-billed e-invoice may be required under LHDN rules. SST input tax not claimable."
                  : (invoice.is_einvoice_verified ?? false)
                    ? "e-Invoice verified via MyInvois. SST input credit claimable if registered."
                    : "No MyInvois registration found. Request e-invoice from vendor before approving."}
              </p>
              <code className="text-[9px] font-mono text-gray-400 mt-1.5 block">
                {invoice.origin === "foreign"
                  ? "lhdn-einvoice-guide.md → MyInvois:S33"
                  : "jomie-sst-baseline.md:v1.5 → SST18:S38"}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {invoice.status === "pending_review" && (
        <div className="pt-3 mt-3 shrink-0" style={{ borderTop: "1px solid #E5E7EB" }}>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/ap/invoices/${invoice.id}`)}
              className="flex-1 flex items-center justify-center h-8 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
              style={{ background: T.purple }}>
              <CheckCircle2 size={13} className="mr-1.5" strokeWidth={2}/> Review
            </button>
            <button className="flex-1 flex items-center justify-center h-8 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer">
              Query
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function APInvoicesPage() {
  const router   = useRouter()
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [selected, setSelected] = React.useState<Invoice | null>(null)
  const [filter,   setFilter]   = React.useState("pending_review")
  const [search,   setSearch]   = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError]         = React.useState<string | null>(null)
  const [rightWidth, setRightWidth] = React.useState<number | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dragging   = React.useRef(false)

  const rightOpen = rightWidth !== 0

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    listInvoices({ limit: 200 })
      .then(data => {
        if (cancelled) return
        setInvoices(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load invoices")
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const onDragMouseDown = (e: React.MouseEvent) => { dragging.current = true; e.preventDefault() }

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const newW = Math.max(0, Math.min(rect.width - 16 - 440, rect.right - e.clientX))
      setRightWidth(newW)
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setRightWidth(w => {
        if (w === null) return w
        if (w < 160) return 0
        if (w < 280) return 280
        return w
      })
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const FILTERS = FILTER_KEYS.map(f => ({
    ...f,
    count: f.key === "all" ? invoices.length : invoices.filter(i => i.status === f.key).length,
  }))

  const filtered = React.useMemo(() => {
    let list = filter === "all" ? invoices : invoices.filter(i => i.status === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        (i.vendor_name_raw ?? "").toLowerCase().includes(q) ||
        (i.invoice_number ?? "").toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) =>
      URGENCY_ORDER.indexOf(a.urgency_bucket ?? "future") - URGENCY_ORDER.indexOf(b.urgency_bucket ?? "future")
    )
  }, [invoices, filter, search])

  // KPI counts
  const overdueCount  = invoices.filter(i => i.urgency_bucket === "overdue").length
  const discountCount = invoices.filter(i => i.discount_available).length
  const pendingTotal  = invoices.filter(i => i.status === "pending_review")
    .reduce((s, i) => s + (i.total_myr ?? 0), 0)

  const rightPanelStyle: React.CSSProperties = {
    background: "#F7F7FE",
    borderRadius: 10,
    overflow: "hidden",
    display: rightWidth === 0 ? "none" : "flex",
    flexDirection: "column",
    flex: rightWidth ? `0 0 ${rightWidth}px` : "0 0 320px",
    minWidth: 0,
  }

  return (
    <TooltipProvider>
      <div ref={wrapperRef} className="flex min-h-0" style={{ height: "calc(100vh - 20px)" }}>

        {/* ── Main content ── */}
        <div className="flex flex-col min-h-0 flex-1 min-w-[440px]" style={{ padding: 16, gap: 16 }}>

          {/* Page header */}
          <div className="shrink-0 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.5)" }}>AP</span>
              <ChevronRight size={10} color="rgba(255,255,255,0.35)" strokeWidth={2}/>
              <span className="text-[12px] font-light text-white">Invoice Inbox</span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-[18px] font-semibold text-white leading-7">Invoice Inbox</h1>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-medium text-white cursor-pointer transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${T.border}` }}>
                  <Download size={13} color="#fff" strokeWidth={2}/> Export
                </button>
                <button
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all"
                  style={{ background: T.purple, border: `1px solid ${T.purple}` }}>
                  <Upload size={13} color="#fff" strokeWidth={2}/> Upload Invoice
                </button>
              </div>
            </div>
          </div>

          {/* AI bar */}
          <div className="shrink-0 flex items-center gap-2.5 px-3.5 py-2.5"
            style={{ background: "rgba(93,94,244,0.12)", border: "0.5px solid rgba(93,94,244,0.3)", borderRadius: 8 }}>
            <Sparkles size={15} style={{ color: "#9EACFE", flexShrink: 0 }} strokeWidth={2}/>
            <span className="flex-1 text-[12px] leading-snug" style={{ color: "#C4C9FF" }}>
              {overdueCount > 0
                ? `${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""} require immediate attention.`
                : "All invoices are within payment terms."}{" "}
              {discountCount > 0 && `${discountCount} invoice${discountCount > 1 ? "s" : ""} eligible for early payment discount — `}
              {discountCount > 0 && `total savings available.`}{" "}
              Pending approval: RM {pendingTotal.toLocaleString()}.
            </span>
            <kbd className="shrink-0 text-[11px] font-mono select-none" style={{ color: "rgba(255,255,255,0.3)" }}>⌘K</kbd>
          </div>

          {/* KPI strip */}
          <div className="shrink-0 grid grid-cols-4 gap-3">
            {[
              { label: "Pending Review", value: invoices.filter(i => i.status === "pending_review").length, unit: "invoices", color: T.amber },
              { label: "Overdue",        value: overdueCount, unit: "invoices", color: T.red },
              { label: "Pending (MYR)",  value: `${(pendingTotal / 1000).toFixed(0)}k`, unit: "outstanding", color: T.purple },
              { label: "Discount Avail", value: discountCount, unit: "early pay", color: T.teal },
            ].map((kpi, i) => (
              <div key={i} className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(103,100,136,0.3)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: T.dimText }}>{kpi.label}</div>
                <div className="text-[22px] font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{kpi.unit}</div>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.border }} strokeWidth={2}/>
              <input
                placeholder="Search vendor, invoice no…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-7 w-52 text-[12px] focus:outline-none rounded-lg"
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: "white" }}
              />
            </div>
            <div className="flex items-center gap-0.5">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className="flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] transition-colors cursor-pointer"
                  style={{
                    background: filter === f.key ? "#1C184E" : "transparent",
                    color:      filter === f.key ? "#FFFFFF" : T.dimText,
                    fontWeight: filter === f.key ? 600 : 500,
                  }}>
                  {f.label}
                  <span className="text-[10px] tabular-nums"
                    style={{ color: filter === f.key ? "rgba(255,255,255,0.4)" : T.border }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="shrink-0 px-4 py-2">
            <div className="grid pl-1" style={{ gridTemplateColumns: "1fr 140px 120px 120px 28px" }}>
              {["VENDOR / INVOICE", "DUE DATE", "AMOUNT (MYR)", "STATUS", ""].map((h, i) => (
                <div key={i} className={cn("text-[10px] font-semibold uppercase tracking-wider",
                  i === 2 && "text-right", i === 3 && "text-center")}
                  style={{ color: "#667085" }}>{h}</div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-2">
            {error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertTriangle size={20} style={{ color: T.amber }} strokeWidth={1.5}/>
                <div className="text-center">
                  <div className="text-[12px] font-semibold mb-1" style={{ color: T.amber }}>Could not load invoices</div>
                  <div className="text-[11px] text-gray-400 max-w-[240px] leading-relaxed">{error}</div>
                </div>
                <button
                  onClick={() => { setError(null); setIsLoading(true); listInvoices({ limit: 200 }).then(d => { setInvoices(d); if (d.length) setSelected(d[0]) }).catch(e => setError(e.message)).finally(() => setIsLoading(false)) }}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  <RefreshCw size={11} strokeWidth={2}/> Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid items-center py-3 border-b px-2"
                    style={{ gridTemplateColumns: "1fr 140px 120px 120px 28px", borderColor: "rgba(103,100,136,0.2)" }}>
                    <div className="flex flex-col gap-1.5 pr-2">
                      <Skeleton className="h-3.5 w-44 bg-white/10"/>
                      <Skeleton className="h-3 w-32 bg-white/[0.06]"/>
                    </div>
                    <Skeleton className="h-3.5 w-20 bg-white/10"/>
                    <div className="flex justify-end"><Skeleton className="h-3.5 w-24 bg-white/10"/></div>
                    <div className="flex justify-center"><Skeleton className="h-5 w-20 rounded-full bg-white/10"/></div>
                    <Skeleton className="h-4 w-4 rounded-sm bg-white/10"/>
                  </div>
                ))}
              </div>
            ) : filtered.map(inv => {
              const isSel    = selected?.id === inv.id
              const urgency  = URGENCY_CONFIG[inv.urgency_bucket ?? "future"]
              const status   = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG["pending_review"]
              const isUrgent = inv.urgency_bucket === "overdue" || inv.urgency_bucket === "due_3d"

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="grid items-center py-2.5 border-b cursor-pointer transition-all duration-150"
                  style={{
                    gridTemplateColumns: "1fr 140px 120px 120px 28px",
                    borderColor: "rgba(103,100,136,0.2)",
                    background: isSel ? "rgba(29,158,117,0.08)" : "transparent",
                    paddingLeft: 8, paddingRight: 8,
                    borderLeft: isUrgent ? `2px solid ${urgency.border}` : "2px solid transparent",
                  }}>

                  {/* Vendor + invoice */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="size-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: inv.origin === "foreign" ? "rgba(93,94,244,0.15)" : "rgba(29,158,117,0.12)" }}>
                      {inv.origin === "foreign"
                        ? <Globe size={13} style={{ color: T.purple }} strokeWidth={1.6}/>
                        : <Building2 size={13} style={{ color: T.teal }} strokeWidth={1.6}/>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>{inv.invoice_number}</span>
                        {inv.discount_available && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Star size={10} style={{ color: T.purple }} strokeWidth={2}/>
                            </TooltipTrigger>
                            <TooltipContent>Early payment discount available</TooltipContent>
                          </Tooltip>
                        )}
                        {inv.duplicate_risk !== "none" && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle size={10} style={{ color: T.amber }} strokeWidth={2}/>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate risk: {inv.duplicate_risk}</TooltipContent>
                          </Tooltip>
                        )}
                        {inv.is_einvoice_verified && (
                          <Tooltip>
                            <TooltipTrigger>
                              <CheckCircle2 size={10} style={{ color: T.teal }} strokeWidth={2}/>
                            </TooltipTrigger>
                            <TooltipContent>e-Invoice verified (MyInvois)</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-[12px] font-semibold text-white truncate">{inv.vendor_name_raw ?? "—"}</div>
                    </div>
                  </div>

                  {/* Due date */}
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium" style={{ color: urgency.color }}>
                        {inv.urgency_bucket === "overdue" ? "OVERDUE" : urgency.label}
                      </span>
                    </div>
                    {inv.due_date && (
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dimText }}>
                        {new Date(inv.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="text-[12px] font-mono font-semibold text-white tabular-nums">
                      {(inv.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: T.dimText }}>MYR</div>
                  </div>

                  {/* Status */}
                  <div className="flex justify-center">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/ap/invoices/${inv.id}`) }}
                      className="cursor-pointer rounded p-0.5 transition-colors">
                      <ChevronRight size={12} strokeWidth={2}
                        color={isSel ? T.purple : "rgba(255,255,255,0.25)"}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Drag handle ── */}
        <div className="flex items-center justify-center shrink-0"
          style={{ width: 16, alignSelf: "stretch", position: "relative", cursor: "col-resize" }}
          onMouseDown={onDragMouseDown}>
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px"
            style={{ background: "rgba(103,100,136,0.25)" }}/>
          <button
            onClick={() => setRightWidth(w => w === 0 ? null : 0)}
            onMouseDown={e => e.stopPropagation()}
            className="relative z-10 flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(103,100,136,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}>
            {rightOpen
              ? <ChevronRight size={13} color="rgba(255,255,255,0.6)" strokeWidth={2}/>
              : <ChevronRight size={13} color="rgba(255,255,255,0.6)" strokeWidth={2} style={{ transform: "rotate(180deg)" }}/>}
          </button>
        </div>

        {/* ── Right panel ── */}
        <div style={rightPanelStyle}>
          <div className="flex flex-col h-full" style={{ padding: "20px 18px" }}>
            <InvoicePanel invoice={selected}/>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
