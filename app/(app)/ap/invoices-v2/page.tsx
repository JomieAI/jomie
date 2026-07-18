"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, Search, Upload, Download,
  AlertTriangle, Star, Globe, Building2,
  CheckCircle2, XCircle, RefreshCw, Mail, Zap,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { listInvoices, type InvoiceListItem } from "@/lib/api"
import { getMockInvoices, isMockMode } from "@/lib/mock"

// ─── Maia b38CNqeIq token override ───────────────────────────────────────────
// baseColor: mauve · theme: indigo · font: inter · radius: default
// Scoped to this wrapper — does not affect globals.css or any other page

const MAIA_STYLE: React.CSSProperties = {
  "--background":           "oklch(0.098 0.007 285)",
  "--foreground":           "oklch(0.954 0.004 285)",
  "--card":                 "oklch(0.132 0.007 285)",
  "--card-foreground":      "oklch(0.954 0.004 285)",
  "--popover":              "oklch(0.132 0.007 285)",
  "--popover-foreground":   "oklch(0.954 0.004 285)",
  "--primary":              "oklch(0.498 0.218 266)",
  "--primary-foreground":   "oklch(0.962 0.018 272)",
  "--secondary":            "oklch(0.162 0.007 285)",
  "--secondary-foreground": "oklch(0.954 0.004 285)",
  "--muted":                "oklch(0.162 0.007 285)",
  "--muted-foreground":     "oklch(0.650 0.015 285)",
  "--accent":               "oklch(0.185 0.007 285)",
  "--accent-foreground":    "oklch(0.954 0.004 285)",
  "--destructive":          "oklch(0.704 0.191 22)",
  "--border":               "oklch(0.270 0.009 285 / 50%)",
  "--input":                "oklch(0.270 0.009 285 / 40%)",
  "--ring":                 "oklch(0.498 0.218 266)",
  "--success":              "oklch(0.670 0.165 165)",
  "--success-foreground":   "oklch(0.098 0.007 285)",
  "--warning":              "oklch(0.731 0.174 75)",
  "--warning-foreground":   "oklch(0.098 0.007 285)",
  "--font-sans":            "var(--font-inter)",
  "--font-heading":         "var(--font-inter)",
  fontFamily:               "var(--font-inter)",
  backgroundColor:          "oklch(0.098 0.007 285)",
} as React.CSSProperties

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyBucket = "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
type InvoiceStatus = "pending_review" | "approved" | "rejected" | "paid" | "overdue" | "partially_paid"
type Invoice = InvoiceListItem

const URGENCY_LABEL: Record<UrgencyBucket, string> = {
  overdue: "Overdue",
  due_3d:  "Due ≤3d",
  due_7d:  "Due ≤7d",
  due_30d: "Due ≤30d",
  future:  "Future",
}

const URGENCY_ORDER: UrgencyBucket[] = ["overdue", "due_3d", "due_7d", "due_30d", "future"]

const STATUS_BADGE_VARIANT: Record<InvoiceStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending_review: "status-pending",
  approved:       "status-approved",
  rejected:       "status-rejected",
  paid:           "status-paid",
  overdue:        "status-overdue",
  partially_paid: "status-partial",
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending_review: "Pending Review",
  approved:       "Approved",
  rejected:       "Rejected",
  paid:           "Paid",
  overdue:        "Overdue",
  partially_paid: "Partial",
}

const URGENCY_BADGE_VARIANT: Record<UrgencyBucket, React.ComponentProps<typeof Badge>["variant"]> = {
  overdue: "urgency-overdue",
  due_3d:  "urgency-3d",
  due_7d:  "urgency-7d",
  due_30d: "urgency-30d",
  future:  "urgency-future",
}

const FILTER_KEYS = [
  { key: "pending_review", label: "Pending Review" },
  { key: "overdue",        label: "Overdue"        },
  { key: "approved",       label: "Approved"       },
  { key: "partially_paid", label: "Partial"        },
  { key: "paid",           label: "Paid"           },
  { key: "all",            label: "All"            },
]

function isFirstPayment(inv: Invoice): boolean {
  return (inv as any).payment_type === "progress" && (inv as any).milestone_sequence === 1
}

function rowBorderColor(inv: Invoice): string {
  if (inv.urgency_bucket === "overdue" || inv.status === "overdue") return "var(--color-destructive)"
  if (inv.status === "pending_review") {
    if (isFirstPayment(inv)) return "#185FA5"
    return "var(--color-warning)"
  }
  if (inv.status === "approved")       return "#534AB7"
  if (inv.status === "partially_paid") return "rgba(29,158,117,0.5)"
  if (inv.status === "paid")           return "transparent"
  if (inv.status === "rejected")       return "var(--color-destructive)"
  return "transparent"
}

type FindingLevel = "blue" | "amber" | "green"
interface RightPanelFinding { level: FindingLevel; title: string; detail: string }

const RIGHT_PANEL_FINDINGS: Record<string, RightPanelFinding[]> = {
  "00000000-0000-0000-0000-000000000001": [
    { level: "blue",  title: "Final payment — contract series",     detail: "Milestone 2 of 2 · Contract NASB-Q-TT-20260423 · Total RM 16,329.60" },
    { level: "green", title: "MyInvois validated — LHDN compliant", detail: "QR code present and verified." },
    { level: "amber", title: "Possible duplicate — same amount",    detail: "Matches NA0526-0010 (RM 8,164.80). Expected — both are 50% milestones." },
    { level: "amber", title: "SST not claimable — blocked input",   detail: "Service Tax RM 604.80 is blocked for professional IT services." },
    { level: "blue",  title: "Project assigned — WO 2026-0264 (82%)", detail: "Matched from email. RM 3,670 budget remaining." },
  ],
}

const FINDING_DOT_CLASS: Record<FindingLevel, string> = {
  blue:  "bg-blue-500",
  amber: "bg-warning",
  green: "bg-success",
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function InvoicePanel({ invoice }: { invoice: Invoice | null }) {
  const router = useRouter()

  if (!invoice) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 pb-3 mb-3 shrink-0 border-b border-border/40">
          <div className="size-5 rounded-md flex items-center justify-center bg-brand/10">
            <Sparkles size={11} className="text-brand" strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-foreground">Jomie AP</span>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full animate-pulse bg-success" />
            <span className="text-[9px] font-mono font-semibold tracking-wider text-success">LIVE</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <div className="size-10 rounded-xl flex items-center justify-center bg-brand/10">
            <Sparkles size={18} className="text-brand" strokeWidth={2}/>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-muted-foreground mb-1">Select an invoice</div>
            <div className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-[180px]">
              Jomie will show urgency, GL codes, and compliance flags
            </div>
          </div>
        </div>
      </div>
    )
  }

  const urgencyBucket = (invoice.urgency_bucket ?? "future") as UrgencyBucket

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md flex items-center justify-center bg-brand/10">
            <Sparkles size={11} className="text-brand" strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-foreground">Jomie AP</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="text-brand hover:text-brand gap-0.5"
          onClick={() => router.push(`/ap/invoices/${invoice.id}`)}>
          View detail<ChevronRight size={10} strokeWidth={2}/>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4">
        <div>
          <div className="text-[14px] font-bold text-foreground leading-snug mb-0.5">{invoice.vendor_name_raw}</div>
          <div className="text-[11px] text-muted-foreground mb-3 font-mono">{invoice.invoice_number}</div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-muted-foreground">Total (MYR)</div>
              <div className="text-[22px] font-bold text-foreground tabular-nums font-mono">
                {(invoice.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>
              {STATUS_LABEL[invoice.status]}
            </Badge>
          </div>
          <div className="rounded-lg px-3 py-2.5 mb-3">
            <Badge variant={URGENCY_BADGE_VARIANT[urgencyBucket]} className="w-full justify-between h-auto px-3 py-2 rounded-lg text-[11px]">
              <span className="font-semibold">{URGENCY_LABEL[urgencyBucket]}</span>
              {invoice.due_date && (
                <span className="font-mono">
                  {new Date(invoice.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </Badge>
          </div>
          {isFirstPayment(invoice) && (
            <div className="rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2 bg-sky-500/10 border border-sky-500/25">
              <Zap size={12} className="text-sky-400 shrink-0 mt-0.5" strokeWidth={2}/>
              <div>
                <div className="text-[11px] font-semibold text-sky-300">First payment — vendor commences work on settlement</div>
                <div className="text-[10px] mt-0.5 text-sky-400">Ensure payment is processed promptly.</div>
              </div>
            </div>
          )}
          {invoice.discount_available && invoice.discount_savings_myr && (
            <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2 bg-brand/6 border border-brand/20">
              <Star size={12} className="text-brand shrink-0" strokeWidth={2}/>
              <div>
                <div className="text-[11px] font-semibold text-brand/90">Early Payment Discount</div>
                <div className="text-[10px] text-brand/70">Save RM {invoice.discount_savings_myr.toLocaleString()} if paid early</div>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Checks</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">e-Invoice verified</span>
              {invoice.is_einvoice_verified
                ? <span className="flex items-center gap-1 font-medium text-success"><CheckCircle2 size={11}/>Yes</span>
                : <span className="flex items-center gap-1 font-medium text-muted-foreground"><XCircle size={11}/>No</span>}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Origin</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                {invoice.origin === "foreign" ? <Globe size={11}/> : <Building2 size={11}/>}
                {(invoice.origin ?? "unknown").charAt(0).toUpperCase() + (invoice.origin ?? "unknown").slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Duplicate risk</span>
              {invoice.duplicate_risk === "none"
                ? <span className="font-medium text-muted-foreground">None</span>
                : <span className="flex items-center gap-1 font-semibold text-warning">
                    <AlertTriangle size={11}/>{invoice.duplicate_risk === "exact" ? "Exact match" : "Possible"}
                  </span>}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Source</span>
              <span className="font-medium text-foreground">
                {invoice.source === "email_gmail" ? "Gmail" : invoice.source === "manual_upload" ? "Upload" : invoice.source}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-3 bg-brand/5 border border-brand/12">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={11} className="text-brand shrink-0" strokeWidth={2}/>
            <span className="text-[11px] font-semibold text-brand/90">AI Analysis</span>
          </div>
          {RIGHT_PANEL_FINDINGS[invoice.id] ? (
            <div className="space-y-2">
              {RIGHT_PANEL_FINDINGS[invoice.id].map((f, i) => (
                <div key={i} className="flex gap-2">
                  <div className={cn("mt-1.5 size-1.5 rounded-full shrink-0", FINDING_DOT_CLASS[f.level])}/>
                  <div>
                    <div className="text-[10.5px] font-semibold text-foreground">{f.title}</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">{f.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {invoice.origin === "foreign"
                ? "Foreign vendor — self-billed e-invoice may be required under LHDN rules."
                : (invoice.is_einvoice_verified ?? false)
                  ? "e-Invoice verified via MyInvois. Review GL codes and payment terms."
                  : "No MyInvois registration found. Request e-invoice from vendor before approving."}
            </p>
          )}
        </div>
      </div>
      {invoice.status === "pending_review" && (
        <div className="pt-3 mt-3 shrink-0 border-t border-border/40">
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" onClick={() => router.push(`/ap/invoices/${invoice.id}`)}>
              <CheckCircle2 size={13} strokeWidth={2} data-icon="inline-start"/> Review
            </Button>
            <Button variant="outline" size="sm" className="flex-1">Query</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function APInvoicesV2Page() {
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
    if (isMockMode()) {
      const data = getMockInvoices()
      setInvoices(data)
      if (data.length > 0) setSelected(data[0])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    listInvoices({ limit: 200 })
      .then(data => { if (cancelled) return; setInvoices(data); if (data.length > 0) setSelected(data[0]) })
      .catch(err => { if (cancelled) return; setError(err instanceof Error ? err.message : "Failed to load invoices") })
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

  const overdueCount  = invoices.filter(i => i.urgency_bucket === "overdue").length
  const discountCount = invoices.filter(i => i.discount_available).length
  const pendingTotal  = invoices.filter(i => i.status === "pending_review").reduce((s, i) => s + (i.total_myr ?? 0), 0)
  const toLearnCount  = invoices.filter(i => (i.low_gl_confidence_count ?? 0) > 0).length

  const pendingCount   = invoices.filter(i => i.status === "pending_review").length
  const firstDuplicate = invoices.find(i => i.duplicate_risk !== "none")
  const firstOverdue   = invoices.find(i => i.urgency_bucket === "overdue")
  const overdueDays    = firstOverdue?.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(firstOverdue.due_date).getTime()) / 86400000))
    : 0
  const aiBarText = [
    pendingCount > 0 ? `${pendingCount} invoice${pendingCount !== 1 ? "s" : ""} pending review.` : null,
    firstDuplicate ? `${firstDuplicate.vendor_name_raw} has a possible duplicate — review before approving.` : null,
    firstOverdue ? `${firstOverdue.invoice_number} is overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""}.` : null,
  ].filter(Boolean).join(" ") || "All invoices are within payment terms."

  // Maia dark right panel — uniform dark surface (no light panel)
  const rightPanelStyle: React.CSSProperties = {
    background: "oklch(0.162 0.007 285)",
    borderRadius: 10,
    overflow: "hidden",
    display: rightWidth === 0 ? "none" : "flex",
    flexDirection: "column",
    flex: rightWidth ? `0 0 ${rightWidth}px` : "0 0 320px",
    minWidth: 0,
  }

  const GRID = "1fr 140px 32px 120px 120px 28px"

  return (
    // ── Maia token scope — all CSS vars overridden for this subtree ──
    <div style={MAIA_STYLE} className="min-h-screen">
      <TooltipProvider>
        <div ref={wrapperRef} className="flex min-h-0" style={{ height: "calc(100vh - 20px)" }}>

          {/* ── Main content ── */}
          <div className="flex flex-col min-h-0 flex-1 min-w-[440px]" style={{ padding: 16, gap: 14 }}>

            {/* Page header */}
            <div className="shrink-0 pb-4 border-b border-white/8">

              {/* Breadcrumb + version toggle */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-light text-white/50">AP</span>
                  <ChevronRight size={10} color="rgba(255,255,255,0.35)" strokeWidth={2}/>
                  <span className="text-[12px] font-light text-white">Invoice Inbox</span>
                </div>
                {/* Version switcher */}
                <div className="flex items-center gap-0.5 rounded-md bg-white/6 p-0.5">
                  <a href="/ap/invoices"
                    className="text-[10px] font-mono px-2 py-0.5 rounded text-white/40 hover:text-white/70 transition-colors">
                    V1 Brand
                  </a>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/20 text-brand font-semibold">
                    V2 Maia
                  </span>
                </div>
              </div>

              {/* AI assistant bar — ambient weight */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 mb-3 rounded-lg bg-brand/5 border border-brand/12">
                <Sparkles size={12} className="text-brand/60 shrink-0" strokeWidth={2}/>
                <span className="flex-1 text-[11px] leading-snug text-brand/55">
                  {isLoading ? "Analysing your invoice inbox…" : aiBarText}
                </span>
                <kbd className="shrink-0 text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-brand/8 text-brand/45">⌘K</kbd>
              </div>

              {/* Title + actions */}
              <div className="flex items-center justify-between">
                <h1 className="text-[18px] font-semibold text-white leading-7">Invoice Inbox</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-white/20 bg-white/7 text-white hover:bg-white/12 hover:text-white">
                    <Download size={13} strokeWidth={2} data-icon="inline-start"/> Export
                  </Button>
                  <Button size="sm">
                    <Upload size={13} strokeWidth={2} data-icon="inline-start"/> Upload Invoice
                  </Button>
                </div>
              </div>
            </div>

            {/* KPI strip */}
            <div className="shrink-0 grid grid-cols-5 gap-3">
              {[
                { label: "Pending Review", value: invoices.filter(i => i.status === "pending_review").length, unit: "invoices",    hi: false, color: "text-warning" },
                { label: "Overdue",        value: overdueCount,   unit: "invoices",    hi: false, color: "text-destructive" },
                { label: "Pending (MYR)",  value: `${(pendingTotal / 1000).toFixed(0)}k`, unit: "outstanding", hi: false, color: "text-brand" },
                { label: "Discount Avail", value: discountCount,  unit: "early pay",   hi: false, color: "text-success" },
                { label: "To Learn",       value: toLearnCount,   unit: "GL items",    hi: true,  color: "text-brand" },
              ].map((kpi, i) => (
                <Card key={i} size="sm" className={cn(
                  "gap-0 py-0",
                  kpi.hi && "ring-brand/40 bg-brand/8"
                )}>
                  <CardContent className="py-3">
                    <div className="text-[8px] font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1 text-muted-foreground/35">
                      {kpi.hi && <Sparkles size={8} className="text-brand/60" strokeWidth={2}/>}
                      {kpi.label}
                    </div>
                    <div className={cn("text-[32px] font-bold tabular-nums leading-none", kpi.color)}>{kpi.value}</div>
                    <div className="text-[9px] mt-1.5 text-muted-foreground/28">{kpi.unit}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search + filter tabs */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" strokeWidth={2}/>
                <Input
                  placeholder="Search vendor, invoice no…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 pl-7 w-52 text-[12px] bg-white/5 border-white/15 text-white placeholder:text-white/25 focus-visible:border-brand/50"
                />
              </div>
              <Tabs value={filter} onValueChange={v => setFilter(v ?? "pending_review")}>
                <TabsList className="h-9">
                  {FILTERS.map(f => (
                    <TabsTrigger key={f.key} value={f.key} className="text-[12px] gap-1.5">
                      {f.label}
                      <span className="text-[10px] tabular-nums opacity-60">{f.count}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* List card */}
            <Card className="flex-1 min-h-0 flex flex-col gap-0 py-0 overflow-hidden">
              {/* Column headers */}
              <div className="shrink-0 px-5 py-3 border-b border-border/25">
                <div className="grid pl-1" style={{ gridTemplateColumns: GRID }}>
                  {["VENDOR / INVOICE", "DUE DATE", "", "AMOUNT (MYR)", "STATUS", ""].map((h, i) => (
                    <div key={i} className={cn("text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                      i === 3 && "text-right", i === 4 && "text-center")}>{h}</div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <AlertTriangle size={20} className="text-warning" strokeWidth={1.5}/>
                    <div className="text-center">
                      <div className="text-[12px] font-semibold mb-1 text-warning">Could not load invoices</div>
                      <div className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">{error}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-white/60"
                      onClick={() => { setError(null); setIsLoading(true); listInvoices({ limit: 200 }).then(d => { setInvoices(d); if (d.length) setSelected(d[0]) }).catch(e => setError(e.message)).finally(() => setIsLoading(false)) }}>
                      <RefreshCw size={11} strokeWidth={2} data-icon="inline-start"/> Retry
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="grid items-center py-2 border-b border-border/20 px-5"
                        style={{ gridTemplateColumns: GRID }}>
                        <div className="flex flex-col gap-1.5 pr-2">
                          <Skeleton className="h-3.5 w-44 bg-white/8"/>
                          <Skeleton className="h-3 w-32 bg-white/[0.05]"/>
                        </div>
                        <Skeleton className="h-3.5 w-20 bg-white/8"/>
                        <div className="flex justify-center"><Skeleton className="h-4 w-4 rounded-full bg-white/8"/></div>
                        <div className="flex justify-end"><Skeleton className="h-3.5 w-24 bg-white/8"/></div>
                        <div className="flex justify-center"><Skeleton className="h-5 w-20 rounded-full bg-white/8"/></div>
                        <Skeleton className="h-4 w-4 rounded-sm bg-white/8"/>
                      </div>
                    ))}
                  </div>
                ) : filtered.map(inv => {
                  const isSel = selected?.id === inv.id
                  const urgencyBucket = (inv.urgency_bucket ?? "future") as UrgencyBucket
                  const borderColor = rowBorderColor(inv)

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelected(inv)}
                      className={cn(
                        "grid items-center py-2 border-b border-border/20 cursor-pointer transition-all duration-150 px-5 hover:bg-muted/25",
                        isSel && "bg-brand/8"
                      )}
                      style={{ gridTemplateColumns: GRID, borderLeft: `2px solid ${borderColor}` }}>

                      {/* Vendor + invoice — 2-row hierarchy */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className={cn(
                          "size-6 rounded-md flex items-center justify-center shrink-0",
                          inv.origin === "foreign" ? "bg-brand/15" : "bg-success/12"
                        )}>
                          {inv.origin === "foreign"
                            ? <Globe size={12} className="text-brand" strokeWidth={1.6}/>
                            : <Building2 size={12} className="text-success" strokeWidth={1.6}/>}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-foreground truncate leading-snug">{inv.vendor_name_raw ?? "—"}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{inv.invoice_number}</span>
                            {isFirstPayment(inv) ? (
                              <Badge variant="type-first" className="text-[9px] h-4 px-1.5 gap-0.5">
                                <Zap size={8} strokeWidth={2}/> First
                              </Badge>
                            ) : (inv as any).payment_type && (inv as any).payment_type !== "standard" ? (
                              <Badge variant="type-progress" className="text-[9px] h-4 px-1.5">
                                {(inv as any).payment_type === "final" ? "Final" : (inv as any).payment_type === "advance" ? "Adv" : "Prog"}
                              </Badge>
                            ) : inv.duplicate_risk !== "none" ? (
                              <span className="text-[9px] font-medium flex items-center gap-0.5 text-destructive shrink-0">
                                <AlertTriangle size={8} strokeWidth={2}/> Dup
                              </span>
                            ) : null}
                            {inv.discount_available && <Star size={9} className="text-brand/70 shrink-0" strokeWidth={2}/>}
                            {inv.is_einvoice_verified && <CheckCircle2 size={9} className="text-success/70 shrink-0" strokeWidth={2}/>}
                          </div>
                        </div>
                      </div>

                      {/* Due date */}
                      <div>
                        <Badge variant={URGENCY_BADGE_VARIANT[urgencyBucket]} className="text-[10px] h-5">
                          {inv.urgency_bucket === "overdue" ? "OVERDUE" : URGENCY_LABEL[urgencyBucket]}
                        </Badge>
                        {inv.due_date && (
                          <div className="text-[10px] font-mono mt-0.5 text-muted-foreground">
                            {new Date(inv.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
                          </div>
                        )}
                      </div>

                      {/* Source icon */}
                      <div className="flex justify-center">
                        {inv.source === "email" || inv.source === "email_gmail"
                          ? <Mail size={14} strokeWidth={1.5} className="text-muted-foreground"/>
                          : inv.source === "manual_upload"
                          ? <Upload size={14} strokeWidth={1.5} className="text-muted-foreground"/>
                          : <RefreshCw size={14} strokeWidth={1.5} className="text-muted-foreground"/>}
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-[12px] font-mono font-semibold text-foreground tabular-nums">
                          {(inv.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[9px] font-mono mt-0.5 text-muted-foreground">MYR</div>
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        <Badge variant={STATUS_BADGE_VARIANT[inv.status]}>
                          {STATUS_LABEL[inv.status]}
                        </Badge>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <Button variant="ghost" size="icon-xs"
                          onClick={e => { e.stopPropagation(); router.push(`/ap/invoices/${inv.id}`) }}>
                          <ChevronRight size={12} strokeWidth={2}
                            className={isSel ? "text-brand" : "text-white/25"}/>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* ── Drag handle ── */}
          <div className="flex items-center justify-center shrink-0"
            style={{ width: 16, alignSelf: "stretch", position: "relative", cursor: "col-resize" }}
            onMouseDown={onDragMouseDown}>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/8"/>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightWidth(w => w === 0 ? null : 0)}
              onMouseDown={e => e.stopPropagation()}
              className="relative z-10 size-7 border border-white/15 bg-white/5 hover:bg-white/10">
              <ChevronRight size={13} className="text-white/60" strokeWidth={2}
                style={{ transform: rightOpen ? undefined : "rotate(180deg)" }}/>
            </Button>
          </div>

          {/* ── Right panel — maia dark surface ── */}
          <div style={rightPanelStyle}>
            <div className="flex flex-col h-full" style={{ padding: "20px 18px" }}>
              <InvoicePanel invoice={selected}/>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
