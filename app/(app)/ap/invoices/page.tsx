"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, Search, Upload, Download,
  AlertTriangle, Star, Globe, Building2,
  CheckCircle2, XCircle, RefreshCw, Mail, Zap, MoreHorizontal,
  ExternalLink, FileText, FileImage,
} from "lucide-react"
import { InvoiceDetailPanel } from "./InvoiceDetailPanel"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { listInvoices, type InvoiceListItem } from "@/lib/api"
import { getMockInvoices, isMockMode } from "@/lib/mock"
import { useSidebar } from "@/components/sidebar-context"

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyBucket = "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
type InvoiceStatus = "pending_review" | "approved" | "rejected" | "paid" | "overdue" | "partially_paid"

type Invoice = InvoiceListItem

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_LABEL: Record<UrgencyBucket, string> = {
  overdue: "Overdue",
  due_3d:  "Due ≤3d",
  due_7d:  "Due ≤7d",
  due_30d: "Due ≤30d",
  future:  "Future",
}

const URGENCY_ORDER: UrgencyBucket[] = ["overdue", "due_3d", "due_7d", "due_30d", "future"]

// Badge variant mapping for status + urgency
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

// Tab order
const FILTER_KEYS = [
  { key: "pending_review", label: "Pending Review" },
  { key: "overdue",        label: "Overdue"        },
  { key: "approved",       label: "Approved"       },
  { key: "partially_paid", label: "Partial"        },
  { key: "paid",           label: "Paid"           },
  { key: "all",            label: "All"            },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function toTitleCase(str: string): string {
  if (!str) return str
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function formatInvoiceDate(dateStr?: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" })
}

// ─── Structured AI findings per invoice (right panel) ─────────────────────────

type FindingLevel = "blue" | "amber" | "green"
interface RightPanelFinding { level: FindingLevel; title: string; detail: string }

const RIGHT_PANEL_FINDINGS: Record<string, RightPanelFinding[]> = {
  "00000000-0000-0000-0000-000000000001": [
    { level: "blue",  title: "Final payment — contract series",        detail: "Milestone 2 of 2 · Contract NASB-Q-TT-20260423 · Total RM 16,329.60" },
    { level: "green", title: "MyInvois validated — LHDN compliant",    detail: "QR code present and verified." },
    { level: "amber", title: "Possible duplicate — same amount",       detail: "Matches NA0526-0010 (RM 8,164.80). Expected — both are 50% milestones." },
    { level: "amber", title: "SST not claimable — blocked input",      detail: "Service Tax RM 604.80 is blocked for professional IT services." },
    { level: "blue",  title: "Project assigned — WO 2026-0264 (82%)", detail: "Matched from email. RM 3,670 budget remaining." },
  ],
}

const FINDING_DOT_CLASS: Record<FindingLevel, string> = {
  blue:  "bg-blue-500",
  amber: "bg-warning",
  green: "bg-success",
}

// ─── Right panel — Invoice quick view ─────────────────────────────────────────

function InvoicePanel({ invoice }: { invoice: Invoice | null }) {
  const router = useRouter()

  if (!invoice) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 pb-3 mb-3 shrink-0 border-b border-border/40">
          <div className="size-5 rounded-md flex items-center justify-center bg-primary/10">
            <Sparkles size={11} className="text-primary" strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-foreground">Jomie AP</span>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full animate-pulse bg-success" />
            <span className="text-[9px] font-mono font-semibold tracking-wider text-success">LIVE</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <div className="size-10 rounded-xl flex items-center justify-center bg-primary/10">
            <Sparkles size={18} className="text-primary" strokeWidth={2}/>
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
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md flex items-center justify-center bg-primary/10">
            <Sparkles size={11} className="text-primary" strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-foreground">Jomie AP</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="text-primary hover:text-primary gap-0.5"
          onClick={() => router.push(`/ap/invoices/${invoice.id}`)}>
          View detail<ChevronRight size={10} strokeWidth={2}/>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">

        {/* Primary white card — hero + breakdown */}
        <div className="rounded-xl bg-card border border-[#EAECF0] overflow-hidden p-4">
          {/* Hero */}
          <div className="pb-3">
            <div className="text-[12px] text-muted-foreground leading-snug mb-0.5">{invoice.vendor_name_raw}</div>
            <div className="text-[10px] text-muted-foreground/50 font-mono mb-3">{invoice.invoice_number}</div>
            <div className="text-[26px] font-bold text-foreground tabular-nums leading-none mb-3">
              {(invoice.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
              <span className="text-[12px] font-medium text-muted-foreground/40 ml-1.5">MYR</span>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[invoice.status]}>
              {STATUS_LABEL[invoice.status]}
            </Badge>
          </div>

          {/* Inset breakdown — sits inside the white card */}
          <div className="mt-1 rounded-lg bg-muted/40 border border-border/40 overflow-hidden">
            {invoice.due_date && (
              <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium text-foreground tabular-nums">
                  {new Date(invoice.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
              <span className="text-muted-foreground">e-Invoice verified</span>
              {invoice.is_einvoice_verified
                ? <span className="flex items-center gap-1 font-medium text-success"><CheckCircle2 size={11}/>Yes</span>
                : <span className="flex items-center gap-1 font-medium text-muted-foreground"><XCircle size={11}/>No</span>}
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
              <span className="text-muted-foreground">Origin</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                {invoice.origin === "foreign" ? <Globe size={11}/> : <Building2 size={11}/>}
                {(invoice.origin ?? "unknown").charAt(0).toUpperCase() + (invoice.origin ?? "unknown").slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
              <span className="text-muted-foreground">Duplicate risk</span>
              {invoice.duplicate_risk === "none"
                ? <span className="font-medium text-muted-foreground">None</span>
                : <span className="flex items-center gap-1 font-semibold text-warning">
                    <AlertTriangle size={11}/>{invoice.duplicate_risk === "exact" ? "Exact match" : "Possible"}
                  </span>}
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
              <span className="text-muted-foreground">Source</span>
              <span className="font-medium text-foreground">
                {invoice.source === "email_gmail" ? "Gmail" : invoice.source === "manual_upload" ? "Upload" : invoice.source}
              </span>
            </div>
            {/* Urgency — total row */}
            <div className="flex items-center justify-between px-3 py-2.5 text-[11px] bg-muted/50">
              <span className="font-medium text-muted-foreground">Urgency</span>
              <Badge variant={URGENCY_BADGE_VARIANT[urgencyBucket]} className="text-[10px]">
                {URGENCY_LABEL[urgencyBucket]}
              </Badge>
            </div>
          </div>

          {/* Inline banners inside card */}
          {(isFirstPayment(invoice) || (invoice.discount_available && invoice.discount_savings_myr)) && (
            <div className="mt-3 space-y-2">
              {isFirstPayment(invoice) && (
                <div className="rounded-lg px-3 py-2.5 flex items-start gap-2 bg-sky-500/8 border border-sky-500/15">
                  <Zap size={12} className="text-sky-500 shrink-0 mt-0.5" strokeWidth={2}/>
                  <div>
                    <div className="text-[11px] font-semibold text-sky-600">First payment — vendor commences work on settlement</div>
                    <div className="text-[10px] mt-0.5 text-sky-500">Ensure payment is processed promptly.</div>
                  </div>
                </div>
              )}
              {invoice.discount_available && invoice.discount_savings_myr && (
                <div className="rounded-lg px-3 py-2.5 flex items-center gap-2 bg-primary/6 border border-primary/15">
                  <Star size={12} className="text-primary shrink-0" strokeWidth={2}/>
                  <div>
                    <div className="text-[11px] font-semibold text-primary/90">Early Payment Discount</div>
                    <div className="text-[10px] text-primary/70">Save RM {invoice.discount_savings_myr.toLocaleString()} if paid early</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Analysis — footer tier, below the primary card */}
        <div className="px-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={10} className="text-primary/60 shrink-0" strokeWidth={2}/>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">AI Analysis</span>
          </div>
          {RIGHT_PANEL_FINDINGS[invoice.id] ? (
            <div className="space-y-2.5">
              {RIGHT_PANEL_FINDINGS[invoice.id].map((f, i) => (
                <div key={i} className="flex gap-2">
                  <div className={cn("mt-1.5 size-1.5 rounded-full shrink-0", FINDING_DOT_CLASS[f.level])}/>
                  <div>
                    <div className="text-[11px] font-semibold text-foreground">{f.title}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-relaxed">{f.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {invoice.origin === "foreign"
                ? "Foreign vendor — self-billed e-invoice may be required under LHDN rules. SST input tax not claimable."
                : (invoice.is_einvoice_verified ?? false)
                  ? "e-Invoice verified via MyInvois. Review GL codes and payment terms."
                  : "No MyInvois registration found. Request e-invoice from vendor before approving."}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {invoice.status === "pending_review" && (
        <div className="pt-3 mt-3 shrink-0 border-t border-border/40">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={() => router.push(`/ap/invoices/${invoice.id}`)}>
              <CheckCircle2 size={13} strokeWidth={2} data-icon="inline-start"/> Review
            </Button>
            <Button variant="outline" size="sm" className="flex-1">Query</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Invoice list card ────────────────────────────────────────────────────────

const ROW_GRID = "1fr 90px 36px 120px 28px"

function InvoiceRow({
  inv, selected, onSelect,
}: {
  inv: Invoice
  selected: Invoice | null
  onSelect: (inv: Invoice) => void
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const isSel = selected?.id === inv.id
  const amountStr = (inv.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })
  const dateStr = formatInvoiceDate((inv as any).invoice_date ?? inv.due_date)
  return (
    <div
      onClick={() => onSelect(inv)}
      className={cn("grid items-center gap-4 mx-4 px-2 py-3 rounded-lg cursor-pointer transition-all duration-150 hover:bg-muted/30 border-b border-border/15", (isSel || menuOpen) && "bg-muted/50")}
      style={{ gridTemplateColumns: ROW_GRID }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", inv.origin === "foreign" ? "bg-primary/10" : "bg-muted")}>
          {inv.origin === "foreign"
            ? <Globe size={16} className="text-primary" strokeWidth={1.6} />
            : <Building2 size={16} className="text-muted-foreground" strokeWidth={1.6} />}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-foreground truncate leading-snug">{toTitleCase(inv.vendor_name_raw ?? "")}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground truncate">{inv.invoice_number}</span>
            <Badge variant={STATUS_BADGE_VARIANT[inv.status]} className="text-[10px] h-4 px-1.5 shrink-0">
              {STATUS_LABEL[inv.status]}
            </Badge>
            {inv.duplicate_risk !== "none" && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive shrink-0">
                <AlertTriangle size={9} strokeWidth={2} />
                {" Dup"}
              </span>
            )}
            {inv.discount_available && <Star size={9} className="text-primary/60 shrink-0" strokeWidth={2} />}
          </div>
        </div>
      </div>
      <div className="text-[12px] text-muted-foreground tabular-nums" style={{ textAlign: "left" }}>{dateStr}</div>
      <div className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide" style={{ textAlign: "left" }}>MYR</div>
      <div className="text-[13.5px] font-semibold text-foreground tabular-nums" style={{ textAlign: "left" }}>{amountStr}</div>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          className={cn(
            "shrink-0 flex items-center justify-center size-6 rounded transition-colors",
            menuOpen
              ? "bg-muted text-foreground"
              : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
          )}
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={15} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push("/ap/invoices/" + inv.id) }}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={e => e.stopPropagation()}>Add note</DropdownMenuItem>
          <DropdownMenuItem onClick={e => e.stopPropagation()}>Approve</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={e => e.stopPropagation()} className="text-destructive focus:text-destructive">
            Query / Dispute
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function InvoiceListCard({
  filtered, selected, isLoading, error, onSelect, onRetry,
  search, onSearchChange, filter, onFilterChange, filters,
}: {
  filtered: Invoice[]
  selected: Invoice | null
  isLoading: boolean
  error: string | null
  onSelect: (inv: Invoice) => void
  onRetry: () => void
  search: string
  onSearchChange: (v: string) => void
  filter: string
  onFilterChange: (v: string) => void
  filters: Array<{ key: string; label: string; count: number }>
}) {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden py-0 w-full ring-[#EAECF0]">
      {/* Search + filter tabs */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/20">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" strokeWidth={2}/>
          <Input
            placeholder="Search vendor, invoice no…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="h-8 pl-7 w-52 text-[12px] border-[#EAECF0] placeholder:text-[#98A2B3]"
          />
        </div>
        <Tabs value={filter} onValueChange={v => onFilterChange(v ?? "pending_review")}>
          <TabsList className="h-9 bg-[#F2F4F7]">
            {filters.map(f => (
              <TabsTrigger key={f.key} value={f.key} className="text-[12px] gap-1.5">
                {f.label}
                <span className="text-[10px] tabular-nums opacity-60">{f.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {/* Column headers */}
      <div className="grid items-center gap-4 mx-4 px-2 py-2.5 border-b border-border/20" style={{ gridTemplateColumns: ROW_GRID }}>
        {(["VENDOR / INVOICE", "DATE", "", "AMOUNT", ""] as const).map((h, i) => (
          <div key={i} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ textAlign: "left" }}>{h}</div>
        ))}
      </div>
      {/* Rows */}
      <div>
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <AlertTriangle size={20} className="text-warning" strokeWidth={1.5} />
            <div className="text-center">
              <div className="text-[12px] font-semibold mb-1 text-warning">Could not load invoices</div>
              <div className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">{error}</div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onRetry}>
              <RefreshCw size={11} strokeWidth={2} data-icon="inline-start" /> Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/20">
                <Skeleton className="size-9 rounded-lg shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="size-5 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="pb-4">
            {filtered.map(inv => (
              <InvoiceRow key={inv.id} inv={inv} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function APInvoicesPage() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const { setL2 }     = useSidebar()
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [selected, setSelected] = React.useState<Invoice | null>(null)
  const [filter,   setFilter]   = React.useState("pending_review")
  const [search,   setSearch]   = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError]         = React.useState<string | null>(null)
  const [rightWidth, setRightWidth] = React.useState<number | null>(null)
  const [panelMode, setPanelMode]   = React.useState<"details" | "pdf">("details")
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dragging   = React.useRef(false)

  const rightOpen = rightWidth !== 0

  // Collapse L2 sub-nav when detail panel is open to reclaim horizontal space
  React.useEffect(() => {
    setL2(!rightOpen)
  }, [rightOpen, setL2])

  React.useEffect(() => {
    let cancelled = false
    if (isMockMode()) {
      const data = getMockInvoices()
      if (!cancelled) {
        setInvoices(data)
        const urlId = searchParams.get("id")
        const urlInv = urlId ? data.find(i => i.id === urlId) : null
        const initialInv = urlInv ?? (data.length > 0 ? data[0] : null)
        setSelected(initialInv)
        if (initialInv && !urlId) {
          router.replace(`?id=${initialInv.id}`, { scroll: false })
        }
        setIsLoading(false)
      }
      return () => { cancelled = true }
    }
    setIsLoading(true)
    setError(null)
    listInvoices({ limit: 200 })
      .then(data => {
        if (cancelled) return
        setInvoices(data)
        const urlId = searchParams.get("id")
        const urlInv = urlId ? data.find(i => i.id === urlId) : null
        const initialInv = urlInv ?? (data.length > 0 ? data[0] : null)
        setSelected(initialInv)
        if (initialInv && !urlId) {
          router.replace(`?id=${initialInv.id}`, { scroll: false })
        }
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load invoices")
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const onDragMouseDown = (e: React.MouseEvent) => { dragging.current = true; e.preventDefault() }

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const newW = Math.max(0, Math.min(rect.width - 28 - 440, rect.right - e.clientX))
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
  const overdueCount      = invoices.filter(i => i.urgency_bucket === "overdue").length
  const overdueTotal      = invoices.filter(i => i.urgency_bucket === "overdue").reduce((s, i) => s + (i.total_myr ?? 0), 0)
  const discountCount     = invoices.filter(i => i.discount_available).length
  const pendingTotal      = invoices.filter(i => i.status === "pending_review").reduce((s, i) => s + (i.total_myr ?? 0), 0)
  const toLearnCount      = invoices.filter(i => (i.low_gl_confidence_count ?? 0) > 0).length
  const partialCount      = invoices.filter(i => i.status === "partially_paid").length
  const partialTotal      = invoices.filter(i => i.status === "partially_paid").reduce((s, i) => s + (i.total_myr ?? 0), 0)

  // AI bar text
  const pendingCount   = invoices.filter(i => i.status === "pending_review").length
  const firstDuplicate = invoices.find(i => i.duplicate_risk !== "none")
  const firstOverdue   = invoices.find(i => i.urgency_bucket === "overdue")
  const overdueDays    = firstOverdue?.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(firstOverdue.due_date).getTime()) / 86400000))
    : 0
  const aiBarText = [
    pendingCount > 0
      ? `${pendingCount} invoice${pendingCount !== 1 ? "s" : ""} pending review.`
      : null,
    firstDuplicate
      ? `${firstDuplicate.vendor_name_raw} has a possible duplicate — review before approving.`
      : null,
    firstOverdue
      ? `${firstOverdue.invoice_number} is overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""}.`
      : null,
  ].filter(Boolean).join(" ") || "All invoices are within payment terms."

  const rightPanelStyle: React.CSSProperties = {
    background: "#F7F7FE",
    borderRadius: 20,
    border: "1px solid #EAECF0",
    overflow: "hidden",
    display: rightWidth === 0 ? "none" : "flex",
    flexDirection: "column",
    flex: rightWidth ? `0 0 ${rightWidth}px` : "0 0 600px",
    minWidth: 0,
  }

  return (
    <TooltipProvider>
      <div ref={wrapperRef} className="flex min-h-0 gap-3" style={{ height: "100%" }}>

        {/* ── Main content ── */}
        <div className="flex flex-col min-h-0 flex-1 min-w-[440px]" style={{ background: "#F7F7FE", borderRadius: 20, border: "1px solid #EAECF0", padding: 32, gap: 14 }}>

          {/* Page header */}
          <div className="shrink-0 pb-4 border-b border-border">

            {/* Breadcrumb */}
            <div className="flex items-center justify-between gap-1 mb-2.5">
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-light text-muted-foreground">AP</span>
                <ChevronRight size={10} className="text-muted-foreground/50" strokeWidth={2}/>
                <span className="text-[12px] font-light text-foreground">Invoice Inbox</span>
              </div>
            </div>

            {/* Title + actions */}
            <div className="flex items-center justify-between">
              <h1 className="text-[18px] font-semibold text-foreground leading-7">Invoice Inbox</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download size={13} strokeWidth={2} data-icon="inline-start"/> Export
                </Button>
                <Button size="sm">
                  <Upload size={13} strokeWidth={2} data-icon="inline-start"/> Upload Invoice
                </Button>
              </div>
            </div>
          </div>

          {/* AI assistant bar */}
          <div className="shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-primary/5 border border-primary/12">
            <Sparkles size={12} className="text-primary/60 shrink-0" strokeWidth={2}/>
            <span className="flex-1 text-[11px] leading-snug text-primary/55">
              {isLoading ? "Analysing your invoice inbox…" : aiBarText}
            </span>
            {toLearnCount > 0 && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary/50 bg-primary/8 px-2 py-0.5 rounded-full">
                <Sparkles size={9} strokeWidth={2}/>{toLearnCount} GL to learn
              </span>
            )}
            <kbd className="shrink-0 text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-primary/8 text-primary/45">⌘K</kbd>
          </div>

          {/* KPI strip — 3-col grid: Pending Review (1fr) | Overdue (160px) | Partial (160px) */}
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 200px 200px" }}>

            {/* Pending Review — fluid */}
            <Card size="sm" className="gap-0 py-0 bg-card ring-[#EAECF0]">
              <CardContent className="py-4 px-4 flex flex-col gap-0">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#344054" }}>Pending Review</span>
                <div className="text-[32px] font-bold tabular-nums leading-none tracking-tight text-warning mb-3">
                  {pendingCount}
                  <span className="text-[14px] font-medium text-muted-foreground/50 ml-2">invoice{pendingCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full h-[3px] rounded-full bg-muted mb-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: invoices.length > 0 ? `${Math.min(100, (pendingCount / invoices.length) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground/50 truncate">requires your action</span>
                <span className="text-[12px] font-semibold text-muted-foreground/70 mt-0.5">
                  RM {pendingTotal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </span>
              </CardContent>
            </Card>

            {/* Overdue — fixed 160px, footer stacked */}
            <Card size="sm" className="gap-0 py-0 bg-card ring-[#EAECF0]">
              <CardContent className="py-4 px-4 flex flex-col gap-0">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#344054" }}>Overdue</span>
                <div className="text-[32px] font-bold tabular-nums leading-none tracking-tight text-destructive mb-3">
                  {overdueCount}
                  <span className="text-[14px] font-medium text-muted-foreground/50 ml-2">invoice{overdueCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full h-[3px] rounded-full bg-muted mb-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive transition-all duration-500"
                    style={{ width: invoices.length > 0 ? `${Math.min(100, (overdueCount / invoices.length) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground/50">past due</span>
                <span className="text-[11px] font-semibold text-muted-foreground/70 tabular-nums mt-0.5 truncate">
                  {overdueTotal > 0 ? `RM ${overdueTotal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                </span>
              </CardContent>
            </Card>

            {/* Partial — fixed 160px, footer stacked */}
            <Card size="sm" className="gap-0 py-0 bg-card ring-[#EAECF0]">
              <CardContent className="py-4 px-4 flex flex-col gap-0">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "#344054" }}>Partial</span>
                <div className="text-[32px] font-bold tabular-nums leading-none tracking-tight text-warning mb-3">
                  {partialCount}
                  <span className="text-[14px] font-medium text-muted-foreground/50 ml-2">invoice{partialCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full h-[3px] rounded-full bg-muted mb-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: invoices.length > 0 ? `${Math.min(100, (partialCount / invoices.length) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground/50">balance</span>
                <span className="text-[11px] font-semibold text-muted-foreground/70 tabular-nums mt-0.5 truncate">
                  {partialTotal > 0 ? `RM ${partialTotal.toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                </span>
              </CardContent>
            </Card>

          </div>

          <InvoiceListCard
            filtered={filtered}
            selected={selected}
            isLoading={isLoading}
            error={error}
            onSelect={(inv) => {
              setSelected(inv)
              if (rightWidth === 0) setRightWidth(null)
              router.replace(`?id=${inv.id}`, { scroll: false })
            }}
            onRetry={() => {
              setError(null)
              setIsLoading(true)
              listInvoices({ limit: 200 })
                .then(d => { setInvoices(d); if (d.length) setSelected(d[0]) })
                .catch(e => setError(e.message))
                .finally(() => setIsLoading(false))
            }}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            filters={FILTERS}
          />
        </div>

        {/* ── Control gutter (drag strip on left edge + toggle + collapse) ── */}
        <div className="flex flex-col items-center shrink-0 pt-2 gap-1"
          style={{ width: 28, alignSelf: "stretch", position: "relative" }}>

          {/* Details icon */}
          <Tooltip>
            <TooltipTrigger
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              onClick={() => { setPanelMode("details"); if (!rightOpen) setRightWidth(null) }}
              className={cn(
                "relative z-10 flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer",
                panelMode === "details" && rightOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
              )}>
              <FileText size={13} strokeWidth={2}/>
            </TooltipTrigger>
            <TooltipContent side="left">Details</TooltipContent>
          </Tooltip>

          {/* PDF icon */}
          <Tooltip>
            <TooltipTrigger
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              onClick={() => { setPanelMode("pdf"); if (!rightOpen) setRightWidth(null) }}
              className={cn(
                "relative z-10 flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer",
                panelMode === "pdf" && rightOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
              )}>
              <FileImage size={13} strokeWidth={2}/>
            </TooltipTrigger>
            <TooltipContent side="left">PDF</TooltipContent>
          </Tooltip>

          {/* Collapse / expand */}
          <Tooltip>
            <TooltipTrigger
              onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
              onClick={() => setRightWidth(w => w === 0 ? null : 0)}
              className="relative z-10 flex items-center justify-center size-7 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all cursor-pointer">
              <ChevronRight size={13} strokeWidth={2}
                style={{ transform: rightOpen ? undefined : "rotate(180deg)", transition: "transform 0.2s" }}/>
            </TooltipTrigger>
            <TooltipContent side="left">{rightOpen ? "Collapse" : "Expand"}</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Right panel ── */}
        <div style={rightPanelStyle} className="relative">
          {/* Drag strip on panel's left border — pixel-perfect */}
          <div className="absolute inset-y-0 left-0 w-1.5 cursor-col-resize z-10" onMouseDown={onDragMouseDown}/>
          {selected ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Panel header */}
              <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#EAECF0]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-5 rounded-md flex items-center justify-center shrink-0 bg-primary/10">
                    <Sparkles size={11} className="text-primary" strokeWidth={2}/>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-foreground truncate leading-none">
                      {selected.vendor_name_raw}
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 font-mono mt-0.5 truncate">
                      {selected.invoice_number}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                  title="Open full page"
                  onClick={() => router.push(`/ap/invoices/${selected.id}`)}>
                  <ExternalLink size={11} strokeWidth={2}/>
                </Button>
              </div>

              {/* Amount + status strip */}
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#EAECF0]">
                <div className="text-[22px] font-bold tabular-nums leading-none text-foreground">
                  {(selected.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  <span className="text-[11px] font-medium text-muted-foreground/40 ml-1.5">MYR</span>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[selected.status]}>
                  {STATUS_LABEL[selected.status]}
                </Badge>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto jomie-scrollbar px-5 py-4">
                {panelMode === "details" ? (
                  <InvoiceDetailPanel invoiceId={selected.id}/>
                ) : (
                  /* PDF placeholder */
                  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <div className="size-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(93,94,244,0.08)", border: "1px solid rgba(93,94,244,0.12)" }}>
                      <FileImage size={24} className="text-primary/50" strokeWidth={1.5}/>
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground mb-1">PDF Viewer</div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">
                        Open the full page to view and annotate the invoice PDF.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => router.push(`/ap/invoices/${selected.id}`)}>
                      <ExternalLink size={11} strokeWidth={2}/> Open full page
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col h-full px-8 py-8">
              <div className="flex items-center gap-2 pb-3 mb-3 shrink-0 border-b border-border/40">
                <div className="size-5 rounded-md flex items-center justify-center bg-primary/10">
                  <Sparkles size={11} className="text-primary" strokeWidth={2}/>
                </div>
                <span className="text-[12px] font-semibold text-foreground">Jomie AP</span>
                <div className="flex items-center gap-1">
                  <div className="size-1.5 rounded-full animate-pulse bg-success" />
                  <span className="text-[9px] font-mono font-semibold tracking-wider text-success">LIVE</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <div className="size-10 rounded-xl flex items-center justify-center bg-primary/10">
                  <Sparkles size={18} className="text-primary" strokeWidth={2}/>
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-semibold text-muted-foreground mb-1">Select an invoice</div>
                  <div className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-[180px]">
                    Jomie will show urgency, GL codes, and compliance flags
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
