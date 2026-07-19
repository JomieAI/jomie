"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal,
  FileText, Paperclip, MessageSquare, X, Download, Printer,
  Zap, RefreshCw, Users, Landmark, Truck, Globe, Building2,
  Wrench, Receipt, Banknote, CreditCard, UserCheck, ArrowLeftRight,
  Briefcase, HeartPulse, AlertTriangle, XCircle, CheckCircle2,
  Minus, Clock,
} from "lucide-react"
import {
  getMockInvoices,
  getMockMetrics,
  DEFAULT_PINNED_METRICS,
} from "@/lib/mock"
import type { InvoiceListItem, InvoiceStatus, ApprovalStep, CommentThreadItem } from "@/lib/api"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending_review: "Pending",
  approved:       "Approved",
  rejected:       "Rejected",
  paid:           "Paid",
  overdue:        "Overdue",
  partially_paid: "Part Paid",
}

const CATEGORY_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  utility:              { icon: Zap,           color: "#185FA5", label: "Utility" },
  subscription:         { icon: RefreshCw,     color: "#534AB7", label: "Subscription" },
  payroll:              { icon: Users,          color: "#1D9E75", label: "Payroll" },
  regulatory:           { icon: Landmark,       color: "#E24B4A", label: "Regulatory" },
  local_supplier:       { icon: Truck,          color: "#1D9E75", label: "Local Supplier" },
  foreign_supplier:     { icon: Globe,          color: "#185FA5", label: "Foreign Supplier" },
  office_rental:        { icon: Building2,      color: "#BA7517", label: "Office Rental" },
  capex:                { icon: Wrench,         color: "#888780", label: "CAPEX" },
  staff_claim:          { icon: Receipt,        color: "#BA7517", label: "Staff Claim" },
  petty_cash:           { icon: Banknote,       color: "#1D9E75", label: "Petty Cash" },
  staff_credit_card:    { icon: CreditCard,     color: "#534AB7", label: "Staff Credit Card" },
  freelancer:           { icon: UserCheck,      color: "#BA7517", label: "Freelancer" },
  interco:              { icon: ArrowLeftRight, color: "#534AB7", label: "Interco Chargeback" },
  professional_service: { icon: Briefcase,      color: "#BA7517", label: "Professional Service" },
  opex:                 { icon: HeartPulse,     color: "#E24B4A", label: "OPEX" },
}

function getCat(category?: string | null) {
  return CATEGORY_MAP[category ?? ""] ?? { icon: FileText, color: "#888780", label: "Unknown" }
}

function urgencyLabel(inv: InvoiceListItem): string {
  if (inv.status === "paid") return "Paid"
  const dateStr = (inv as any).payment_needed_by ?? inv.due_date
  if (!dateStr) return ""
  const due = new Date(dateStr)
  const diff = Math.floor((due.getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Due today"
  if (diff <= 7) return `Due ${diff}d`
  return due.toLocaleDateString("en-MY", { day: "numeric", month: "short" })
}

function urgencyColor(inv: InvoiceListItem): string {
  if (inv.status === "paid") return "text-[#667085]"
  const dateStr = (inv as any).payment_needed_by ?? inv.due_date
  if (!dateStr) return "text-[#667085]"
  const diff = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return "text-red-500 font-medium"
  if (diff <= 7) return "text-amber-500 font-medium"
  return "text-[#667085]"
}

// ─── Channel Toggle ───────────────────────────────────────────────────────────

function ChannelToggle({
  channel, onChange,
}: { channel: "form" | "email"; onChange: (v: "form" | "email") => void }) {
  return (
    <div className="flex bg-[#e7e6e6] border border-[#f2f4f7] rounded-[12px] p-1 gap-0" style={{ fontFamily: "Inter" }}>
      {(["form", "email"] as const).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "px-3 py-2 rounded-[10px] text-[14px] capitalize transition-all duration-150 cursor-pointer",
            channel === v
              ? "bg-white text-[#344054] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]"
              : "text-[#667085] hover:text-[#344054]"
          )}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  )
}

// ─── Metrics Board ────────────────────────────────────────────────────────────

function MetricsBoard({
  metrics, pinned, expanded,
}: {
  metrics: ReturnType<typeof getMockMetrics>
  pinned: string[]
  expanded: boolean
}) {
  const toShow = expanded
    ? Object.values(metrics)
    : pinned.map(k => metrics[k as keyof typeof metrics]).filter(Boolean)

  const cols = expanded ? "grid-cols-3" : "grid-cols-2"

  return (
    <div className={cn("grid gap-2", cols)}>
      {toShow.map(m => (
        <div
          key={m.key}
          className={cn(
            "rounded-[15px] p-4 cursor-pointer transition-colors duration-150",
            m.color === "gradient" ? "border border-[#eaecf0]" : "bg-white border border-[#eaecf0] hover:border-[#d0d5dd]"
          )}
          style={m.color === "gradient" ? {
            background: "linear-gradient(135deg, #5d5ef4 0%, #4546c8 50%, #3a3ab5 100%)",
          } : {}}
        >
          <p className={cn("text-[14px] leading-5 truncate", m.color === "gradient" ? "text-white/80" : "text-[#667085]")}
             style={{ fontFamily: "Inter", fontWeight: 400 }}>
            {m.label}
          </p>
          <p className={cn(
            "text-[24px] font-semibold leading-8 mt-1.5",
            m.color === "gradient" ? "text-white" :
            m.color === "red"      ? "text-red-500" :
            m.color === "amber"    ? "text-amber-500" :
            "text-[#344054]"
          )}
             style={{ fontFamily: "Inter" }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Request List Item ────────────────────────────────────────────────────────

function RequestListItem({
  inv, selected, expanded, onSelect,
}: { inv: InvoiceListItem; selected: boolean; expanded: boolean; onSelect: () => void }) {
  const cat = getCat(inv.invoice_category)
  const CatIcon = cat.icon
  const amount = (inv.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })
  const pr = (inv as any).pr_number as string | undefined

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 p-2 rounded-[10px] cursor-pointer transition-colors duration-150",
        selected ? "bg-[#f2f4f7]" : "bg-white hover:bg-[#f2f4f7]"
      )}
    >
      <div
        className="size-[40px] rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: cat.color + "18" }}
        title={cat.label}
      >
        <CatIcon size={20} style={{ color: cat.color }} strokeWidth={1.6} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#344054] truncate" style={{ fontFamily: "Inter" }}>
          {toTitleCase(inv.vendor_name_raw ?? "")}
        </p>
        <p className="text-[12px] text-[#667085] truncate" style={{ fontFamily: "Inter" }}>
          {inv.invoice_number}{pr && ` · ${pr}`}
        </p>

        {expanded && (
          <>
            <p className="text-[11px] text-[#98a2b3] truncate" style={{ fontFamily: "Inter" }}>
              {(inv as any).requestor_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[11px]", urgencyColor(inv))} style={{ fontFamily: "Inter" }}>
                {urgencyLabel(inv)}
              </span>
              {inv.risk_level === "warning" && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <AlertTriangle size={11} />
                  <span className="text-[11px] font-semibold">{inv.risk_count}</span>
                </span>
              )}
              {inv.risk_level === "fail" && (
                <span className="flex items-center gap-0.5 text-red-500">
                  <XCircle size={11} />
                  <span className="text-[11px] font-semibold">{inv.risk_count}</span>
                </span>
              )}
              {inv.risk_level === "pass" && (
                <CheckCircle2 size={11} className="text-green-500" />
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="mix-blend-multiply">
          <div className="bg-[#eff8ff] rounded-[6px] px-2 py-0.5">
            <span className="text-[12px] text-[#175cd3]" style={{ fontFamily: "Inter" }}>
              {STATUS_LABEL[inv.status as InvoiceStatus]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {inv.duplicate_risk !== "none" && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
              <AlertTriangle size={9} /> Dup
            </span>
          )}
          {(inv as any).sla_warning && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
              <Clock size={9} /> {(inv as any).sla_warning}
            </span>
          )}
        </div>
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>
          {amount}
        </p>
      </div>
    </div>
  )
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any

  const vendorFields = [
    { label: "Vendor Name",    value: toTitleCase(invoice.vendor_name_raw ?? "") },
    { label: "TIN",            value: inv.vendor_tin ?? "—" },
    { label: "Reg No.",        value: inv.vendor_reg_no ?? "—" },
    { label: "Address",        value: inv.vendor_address ?? "—" },
  ]
  const billToFields = [
    { label: "Company",   value: inv.bill_to_name ?? "—" },
    { label: "TIN",       value: inv.bill_to_tin ?? "—" },
    { label: "Address",   value: inv.bill_to_address ?? "—" },
  ]
  const invoiceFields = [
    { label: "Invoice No.",    value: invoice.invoice_number ?? "—" },
    { label: "Invoice Date",   value: inv.invoice_date ?? "—" },
    { label: "Due Date",       value: invoice.due_date ?? "—" },
    { label: "Pay Terms",      value: inv.payment_terms ?? "—" },
    { label: "Currency",       value: inv.currency ?? "MYR" },
    { label: "PO Ref",         value: inv.po_reference ?? "—" },
    { label: "DO No.",         value: inv.do_number ?? "—" },
  ]
  const amountFields = [
    { label: "Subtotal",  value: `MYR ${(inv.subtotal_myr ?? 0).toFixed(2)}`,    bold: false },
    { label: "Tax",       value: `MYR ${(inv.tax_amount_myr ?? 0).toFixed(2)}`,  bold: false },
    { label: "Total",     value: `MYR ${(invoice.total_myr ?? 0).toFixed(2)}`,   bold: true  },
  ]

  const sectionLabel = "text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3]"
  const fieldRow = "flex items-start justify-between py-2.5 border-b border-[#f2f4f7]"
  const fieldLabel = "text-[12px] text-[#667085] shrink-0 w-28"
  const fieldVal = "text-[13px] font-medium text-[#344054] text-right"

  function Section({ title, fields }: { title: string; fields: { label: string; value: string; bold?: boolean }[] }) {
    return (
      <div className="mb-5">
        <p className={sectionLabel} style={{ fontFamily: "Inter" }}>{title}</p>
        <div className="border-b border-[#eaecf0] mb-2" />
        {fields.map((f, i) => (
          <div key={i} className={fieldRow} style={{ fontFamily: "Inter" }}>
            <span className={fieldLabel}>{f.label}</span>
            <span className={cn(fieldVal, f.bold && "font-bold")}>{f.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Action Required Banner */}
      {inv.risk_level === "warning" && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-[12px] p-4 mb-5 border-l-4 border-l-amber-400">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-900" style={{ fontFamily: "Inter" }}>
              Action Required
            </p>
            <p className="text-[12px] text-amber-700 mt-0.5" style={{ fontFamily: "Inter" }}>
              {inv.risk_count} compliance warning{inv.risk_count !== 1 ? "s" : ""} detected. Review before approving.
            </p>
          </div>
        </div>
      )}

      {/* PR Info */}
      {inv.pr_number && (
        <div className="mb-5">
          <p className={sectionLabel} style={{ fontFamily: "Inter" }}>Payment Request</p>
          <div className="border-b border-[#eaecf0] mb-2" />
          {[
            { label: "PR Number",   value: inv.pr_number },
            { label: "Requestor",   value: inv.requestor_name ?? "—" },
            { label: "Pay By",      value: inv.payment_needed_by ?? "—" },
            { label: "Channel",     value: inv.intake_channel ?? "—" },
            { label: "Urgency",     value: inv.urgency_level ?? "normal" },
          ].map((f, i) => (
            <div key={i} className={fieldRow} style={{ fontFamily: "Inter" }}>
              <span className={fieldLabel}>{f.label}</span>
              <span className={fieldVal}>{f.value}</span>
            </div>
          ))}
        </div>
      )}

      <Section title="Vendor" fields={vendorFields} />
      <Section title="Bill To" fields={billToFields} />
      <Section title="Invoice" fields={invoiceFields} />
      <Section title="Amounts" fields={amountFields} />
    </div>
  )
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

function CommentsTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const thread: CommentThreadItem[] = inv.comment_thread ?? []
  const [message, setMessage] = React.useState("")

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true })
  }
  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString("en-MY", { day: "numeric", month: "short" })
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 300 }}>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {thread.length === 0 && (
          <p className="text-[13px] text-[#98a2b3] text-center py-8" style={{ fontFamily: "Inter" }}>
            No comments yet.
          </p>
        )}
        {thread.map(item => {
          if (item.type === "activity") {
            return (
              <div key={item.id} className="flex items-start gap-2 pl-1">
                <div className="flex flex-col items-center mt-1">
                  <div className="size-2 rounded-full bg-[#d0d5dd]" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] italic text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
                    {item.description}
                  </span>
                  <span className="ml-2 text-[10px] text-[#c0c5ce] tabular-nums" style={{ fontFamily: "Inter" }}>
                    {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                  </span>
                </div>
              </div>
            )
          }

          const isQuery = item.is_query
          const initials = (item.author ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

          return (
            <div key={item.id} className={cn("flex gap-2.5", isQuery && item.resolved && "opacity-50")}>
              <div className="size-8 rounded-full bg-[#f2f4f7] flex items-center justify-center shrink-0 text-[12px] font-semibold text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{item.author}</span>
                  {item.role && (
                    <span className="text-[10px] bg-[#f2f4f7] rounded-full px-2 text-[#667085]" style={{ fontFamily: "Inter" }}>{item.role}</span>
                  )}
                  <span className="text-[10px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
                    {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                  </span>
                </div>
                <div className={cn(
                  "rounded-[12px] rounded-tl-[4px] p-3",
                  isQuery ? "bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400" : "bg-[#f9fafb] border border-[#eaecf0]"
                )}>
                  <p className={cn("text-[13px] text-[#344054] leading-5", isQuery && item.resolved && "line-through")} style={{ fontFamily: "Inter" }}>
                    {item.message}
                  </p>
                  {item.attachment && (
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-[#f2f4f7] border border-[#eaecf0] rounded-[8px] px-2 py-1">
                      <Paperclip size={10} className="text-[#5d5ef4]" />
                      <span className="text-[11px] text-[#5d5ef4] hover:underline cursor-pointer" style={{ fontFamily: "Inter" }}>{item.attachment}</span>
                    </div>
                  )}
                  {isQuery && !item.resolved && (
                    <button className="mt-2 text-[11px] text-green-600 hover:underline cursor-pointer" style={{ fontFamily: "Inter" }}>
                      Mark Resolved ✓
                    </button>
                  )}
                  {isQuery && item.resolved && (
                    <p className="mt-1 text-[10px] text-green-600" style={{ fontFamily: "Inter" }}>✓ Resolved by {item.resolved_by ?? "—"}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Compose */}
      <div className="border-t border-[#eaecf0] pt-4 bg-white shrink-0">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-[#f9fafb] border border-[#eaecf0] rounded-[12px] px-3 py-2.5 text-[13px] text-[#344054] min-h-[72px] resize-none focus:outline-none focus:border-[#5d5ef4] focus:ring-2 focus:ring-[#5d5ef4]/10 transition-colors"
          style={{ fontFamily: "Inter" }}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-3">
            <button className="text-[#98a2b3] hover:text-[#344054] transition-colors cursor-pointer"><Paperclip size={14} /></button>
            <button className="text-[#98a2b3] hover:text-[#344054] transition-colors cursor-pointer"><AlertTriangle size={14} /></button>
          </div>
          <button
            className="bg-[#5d5ef4] text-white rounded-[10px] px-4 py-2 text-[13px] hover:bg-[#4546d4] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Checks Tab ───────────────────────────────────────────────────────────────

const MOCK_CHECKS = [
  {
    category: "Document",
    checks: [
      { title: "Invoice number format valid", status: "pass",    detail: "NA0626-0023 matches vendor format." },
      { title: "Duplicate invoice check",     status: "warning", detail: "Similar invoice NA0526-0010 found (May).", badge: "Possible Dup" },
      { title: "DO received & signed",        status: "warning", detail: "DO0626-0020 received but not signed back.", badge: "Missing Sign-off" },
    ],
  },
  {
    category: "Compliance",
    checks: [
      { title: "e-Invoice verified (MyInvois)", status: "pass",    detail: "Verified against MyInvois portal." },
      { title: "Vendor TIN active",             status: "pass",    detail: "C10836440020 is active." },
      { title: "GL coding confidence > 85%",    status: "warning", detail: "Line item #5 has 88% confidence.", badge: "Low Confidence" },
    ],
  },
  {
    category: "Payment",
    checks: [
      { title: "Within payment terms",  status: "pass", detail: "Due date within 30-day terms." },
      { title: "Approval route set",    status: "pass", detail: "Auto-determined: FM approval required." },
    ],
  },
]

function ChecksTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const passCount = MOCK_CHECKS.flatMap(c => c.checks).filter(c => c.status === "pass").length
  const warnCount = MOCK_CHECKS.flatMap(c => c.checks).filter(c => c.status === "warning").length
  const score = Math.round((passCount / (passCount + warnCount)) * 100)

  return (
    <div>
      {/* Score card */}
      <div className="bg-gradient-to-br from-[#f7f7fe] to-white border border-[#e0e1fd] rounded-[16px] p-5 mb-5">
        <div className="flex items-end gap-1 mb-2">
          <span className="text-[32px] font-bold text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>{score}</span>
          <span className="text-[16px] text-[#98a2b3] mb-1" style={{ fontFamily: "Inter" }}> / 100</span>
        </div>
        <div className="h-2 rounded-full bg-[#eaecf0] overflow-hidden mb-2">
          <div className="h-full rounded-full bg-[#5d5ef4] transition-all duration-500" style={{ width: `${score}%` }} />
        </div>
        <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
          {passCount} passed · {warnCount} warnings · 0 critical
        </p>
      </div>

      {MOCK_CHECKS.map(section => (
        <div key={section.category} className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] border-b border-[#f2f4f7] pb-2 mb-2" style={{ fontFamily: "Inter" }}>
            {section.category}
          </p>
          {section.checks.map((check, i) => {
            const key = `${section.category}-${i}`
            const isOpen = expanded[key]
            return (
              <div key={i}>
                <div
                  className="flex items-center gap-3 h-10 hover:bg-[#f9fafb] rounded-[8px] px-2 cursor-pointer transition-colors"
                  onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                >
                  {check.status === "pass"    && <CheckCircle2  size={16} className="text-green-500 shrink-0" />}
                  {check.status === "warning" && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                  {check.status === "fail"    && <XCircle       size={16} className="text-red-500 shrink-0" />}
                  {check.status === "na"      && <Minus         size={16} className="text-[#98a2b3] shrink-0" />}
                  <span className="text-[13px] text-[#344054] flex-1" style={{ fontFamily: "Inter" }}>{check.title}</span>
                  {(check as any).badge && (
                    <span className="bg-amber-50 text-amber-600 rounded-[6px] px-2 py-0.5 text-[11px]" style={{ fontFamily: "Inter" }}>
                      {(check as any).badge}
                    </span>
                  )}
                  <ChevronDown size={14} className={cn("text-[#98a2b3] transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
                {isOpen && (
                  <div className="ml-9 pb-2">
                    <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{check.detail}</p>
                    <button className="text-[11px] text-[#5d5ef4] hover:underline mt-1 cursor-pointer" style={{ fontFamily: "Inter" }}>Override →</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Approval Tab ─────────────────────────────────────────────────────────────

function ApprovalTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const steps: ApprovalStep[] = inv.approval_steps ?? []

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No approval route</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Approval steps will appear once configured.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-[#f9fafb] border border-[#eaecf0] rounded-[10px] p-3 mb-5 flex items-center gap-2">
        <p className="text-[11px] text-[#667085] flex-1" style={{ fontFamily: "Inter" }}>
          Auto-determined by approvalMatrix.md@v1.3
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const circleClass =
            step.status === "completed" ? "bg-green-500 text-white" :
            step.status === "current"   ? "bg-[#5d5ef4] text-white" :
            step.status === "skipped"   ? "bg-[#f2f4f7]/40 text-[#98a2b3]/40" :
            "bg-[#f2f4f7] text-[#98a2b3] border border-[#eaecf0]"

          const badgeClass =
            step.status === "completed" ? "bg-green-50 text-green-600" :
            step.status === "current"   ? "bg-[#f7f7fe] text-[#5d5ef4] border border-[#c7c9fb]" :
            step.status === "skipped"   ? "bg-[#f2f4f7]/40 text-[#98a2b3]/40" :
            "bg-[#f2f4f7] text-[#98a2b3]"

          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold", circleClass)}>
                  {step.status === "completed" ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                {!isLast && <div className="w-px flex-1 bg-[#eaecf0] my-1" />}
              </div>
              <div className={cn("pb-5 min-h-[72px]", isLast && "pb-0")}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{step.title}</span>
                  <span className={cn("text-[11px] rounded-full px-2 py-0.5", badgeClass)} style={{ fontFamily: "Inter" }}>
                    {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </span>
                </div>
                {step.assignee && (
                  <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{step.assignee}</p>
                )}
                {step.timestamp && (
                  <p className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
                    {new Date(step.timestamp).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {step.note && (
                  <p className="text-[12px] italic text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>"{step.note}"</p>
                )}
                {step.sla_at_risk && step.sla && (
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    <Clock size={11} />
                    <span className="text-[11px]" style={{ fontFamily: "Inter" }}>SLA: {step.sla}</span>
                  </div>
                )}
                {step.skip_reason && (
                  <p className="text-[11px] italic text-[#98a2b3]/60 mt-0.5" style={{ fontFamily: "Inter" }}>{step.skip_reason}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Emails Tab ───────────────────────────────────────────────────────────────

function EmailsTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  return (
    <div>
      {inv.email_from ? (
        <div className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{inv.email_subject}</p>
              <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>From: {inv.email_from}</p>
            </div>
          </div>
          <div
            className="text-[13px] text-[#344054] leading-5 border-t border-[#f2f4f7] pt-3"
            style={{ fontFamily: "Inter" }}
            dangerouslySetInnerHTML={{ __html: inv.email_body_html ?? "" }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText size={40} className="text-[#d0d5dd] mb-3" />
          <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No emails</p>
          <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>No email thread for this request.</p>
        </div>
      )}
    </div>
  )
}

// ─── PV Tab ───────────────────────────────────────────────────────────────────

function PVTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const pvs = inv.payment_vouchers ?? []
  return (
    <div>
      {pvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText size={40} className="text-[#d0d5dd] mb-3" />
          <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No payment vouchers</p>
          <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Vouchers will appear after approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pvs.map((pv: any, i: number) => (
            <div key={i} className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{pv.pv_number}</span>
                <span className="bg-green-50 text-green-600 text-[11px] rounded-[6px] px-2 py-0.5" style={{ fontFamily: "Inter" }}>{pv.status}</span>
              </div>
              <p className="text-[13px] text-[#344054]" style={{ fontFamily: "Inter" }}>MYR {pv.amount.toFixed(2)}</p>
              <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>{pv.payment_method} · {pv.payment_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  invoice, activeTab, onTabChange, onOpenPDF, onQuery,
}: {
  invoice: InvoiceListItem
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenPDF: () => void
  onQuery: () => void
}) {
  const cat = getCat(invoice.invoice_category)
  const CatIcon = cat.icon
  const inv = invoice as any

  return (
    <div className="flex-1 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-8 pt-6 pb-5 shrink-0">
        <div className="flex items-start gap-3">
          <div className="size-[48px] rounded-[8px] flex items-center justify-center shrink-0" style={{ background: cat.color + "18" }}>
            <CatIcon size={24} style={{ color: cat.color }} strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-[#344054] leading-7" style={{ fontFamily: "Inter" }}>
              {toTitleCase(invoice.vendor_name_raw ?? "")}
            </p>
            <p className="text-[14px] text-[#667085]" style={{ fontFamily: "Inter" }}>
              {invoice.invoice_number}{inv.pr_number && ` · ${inv.pr_number}`}
            </p>
            {inv.requestor_name && (
              <p className="text-[12px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>Submitted by {inv.requestor_name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onQuery}
            className="bg-white border border-[#eaecf0] rounded-[12px] px-4 py-[10px] text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#f2f4f7] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Query
          </button>
          <button
            className="bg-white border border-[#fda29b] rounded-[12px] p-[10px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-red-50 transition-colors cursor-pointer">
            <X size={20} className="text-[#b42318]" />
          </button>
          <button
            className="bg-[#5d5ef4] border border-[#5d5ef4] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#4546d4] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Approve
          </button>
          <button
            onClick={onOpenPDF}
            className="text-[12px] text-[#5d5ef4] hover:text-[#4546d4] transition-colors cursor-pointer whitespace-nowrap"
            style={{ fontFamily: "Inter" }}>
            View Document →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 shrink-0">
        <div className="inline-flex bg-[#f2f4f7] border border-[#f2f4f7] rounded-[12px] p-1 gap-0">
          {[
            { key: "details",  label: "Info" },
            { key: "comments", label: "Comments & Activity" },
            { key: "checks",   label: "Checks" },
            { key: "approval", label: "Approval" },
            { key: "emails",   label: "Emails" },
            { key: "pv",       label: "PV" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "px-3 py-2 rounded-[10px] text-[14px] whitespace-nowrap transition-all duration-150 cursor-pointer",
                activeTab === tab.key
                  ? "bg-white text-[#344054] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]"
                  : "text-[#667085] hover:text-[#344054]"
              )}
              style={{ fontFamily: "Inter" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        {activeTab === "details"  && <DetailsTab  invoice={invoice} />}
        {activeTab === "comments" && <CommentsTab invoice={invoice} />}
        {activeTab === "checks"   && <ChecksTab   invoice={invoice} />}
        {activeTab === "approval" && <ApprovalTab invoice={invoice} />}
        {activeTab === "emails"   && <EmailsTab   invoice={invoice} />}
        {activeTab === "pv"       && <PVTab       invoice={invoice} />}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentRequestsPage() {
  const invoices = getMockInvoices()
  const metrics  = getMockMetrics()

  const [channel, setChannel]           = React.useState<"form" | "email">("form")
  const [pinnedMetrics]                 = React.useState(DEFAULT_PINNED_METRICS)
  const [viewTab, setViewTab]           = React.useState<"all" | "dashboard" | "my_request" | "awaiting">("all")
  const [selected, setSelected]         = React.useState<InvoiceListItem | null>(null)
  const [activeTab, setActiveTab]       = React.useState("details")
  const [rightOpen, setRightOpen]       = React.useState(false)
  const [leftWidth, setLeftWidth]       = React.useState(320)
  const [leftCollapsed, setLeftCollapsed] = React.useState(false)
  const [search, setSearch]             = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (inv.vendor_name_raw ?? "").toLowerCase().includes(q) ||
      (inv.invoice_number ?? "").toLowerCase().includes(q) ||
      ((inv as any).pr_number ?? "").toLowerCase().includes(q)
    )
  })

  const handleLeftDrag = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startW = leftWidth
    const onMove = (ev: MouseEvent) => {
      const maxW = (containerRef.current?.offsetWidth ?? 1200) - 400 - 4
      setLeftWidth(Math.max(280, Math.min(maxW, startW + ev.clientX - startX)))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#f4f4f1" }}>

      {/* Header */}
      <div className="flex items-end justify-between px-8 pt-8 pb-0 shrink-0">
        <div>
          <p className="text-[12px] font-light text-[#344054]" style={{ fontFamily: "Inter" }}>
            AP / Payment Requests
          </p>
          <h1 className="text-[30px] font-semibold leading-[38px] text-[#171b1d] mt-0" style={{ fontFamily: "Inter" }}>
            Payment Requests
          </h1>
        </div>

        <div className="flex items-center gap-3 pb-1">
          <ChannelToggle channel={channel} onChange={setChannel} />
          <button
            className="bg-white border border-[#d0d5dd] rounded-[12px] px-4 py-[10px] text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Export ↓
          </button>
          <button
            className="bg-[#171b1d] border border-[#171b1d] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#2a2f31] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            + Create Request
          </button>
        </div>
      </div>

      {/* Body */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden mt-8 px-8 pb-8 gap-2">

        {/* Left panel */}
        <div className="flex flex-col gap-3 overflow-hidden shrink-0" style={{ width: leftCollapsed ? 48 : leftWidth }}>

          {!leftCollapsed && (
            <>
              {/* View tabs */}
              <div className="flex items-center gap-0.5 flex-wrap">
                {[
                  { key: "all",        label: "All",         count: filteredInvoices.length },
                  { key: "dashboard",  label: "Dashboard",   count: null },
                  { key: "my_request", label: "My Request",  count: 2 },
                  { key: "awaiting",   label: "Awaiting Me", count: 1 },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setViewTab(tab.key as any)}
                    className={cn(
                      "px-3 py-2 rounded-[10px] text-[14px] transition-colors whitespace-nowrap cursor-pointer",
                      viewTab === tab.key ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]"
                    )}
                    style={{ fontFamily: "Inter" }}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-1 text-[11px] opacity-70">{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search invoice number, vendor..."
                  className="w-full bg-white border border-[#eaecf0] rounded-[10px] pl-9 pr-3 py-[7px] text-[14px] text-[#667085] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:border-[#5d5ef4] transition-colors"
                  style={{ fontFamily: "Inter" }}
                />
              </div>

              {/* Metrics */}
              <MetricsBoard metrics={metrics} pinned={pinnedMetrics} expanded={leftWidth > 500} />

              {/* Filters */}
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 bg-white border border-[#eaecf0] rounded-[10px] pl-3 pr-3.5 py-2 text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] cursor-pointer hover:bg-[#f9fafb] transition-colors"
                  style={{ fontFamily: "Inter" }}>
                  Pending <ChevronDown size={14} />
                </button>
                <button
                  className="flex items-center gap-1 bg-white border border-[#eaecf0] rounded-[10px] pl-3 pr-3.5 py-2 text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] cursor-pointer hover:bg-[#f9fafb] transition-colors"
                  style={{ fontFamily: "Inter" }}>
                  Datetime <ChevronDown size={14} />
                </button>
                <button className="p-[10px] rounded-[10px] hover:bg-[#f2f4f7] transition-colors cursor-pointer">
                  <SlidersHorizontal size={16} className="text-[#667085]" />
                </button>
              </div>

              {/* Request list */}
              <div className="flex flex-col bg-white border border-[#eaecf0] rounded-[12px] p-2 gap-1 flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] px-2 pt-1 pb-1" style={{ fontFamily: "Inter" }}>
                  VENDOR / INVOICE
                </p>
                {filteredInvoices.map(inv => (
                  <RequestListItem
                    key={inv.id}
                    inv={inv}
                    selected={selected?.id === inv.id}
                    expanded={leftWidth > 480}
                    onSelect={() => { setSelected(inv); setActiveTab("details") }}
                  />
                ))}
                {filteredInvoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search size={24} className="text-[#d0d5dd] mb-2" />
                    <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No requests found</p>
                    <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Collapse button */}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="flex items-center justify-center p-2 rounded-[8px] border border-[#eaecf0] bg-white hover:bg-[#f2f4f7] text-[#667085] transition-colors cursor-pointer shrink-0"
          >
            {leftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Drag handle */}
        {!leftCollapsed && (
          <div
            className="w-1 cursor-col-resize hover:bg-[#5d5ef4]/20 active:bg-[#5d5ef4]/30 transition-colors shrink-0 rounded-full"
            onMouseDown={handleLeftDrag}
          />
        )}

        {/* Middle panel */}
        <div className="flex flex-1 min-w-[400px] gap-2 overflow-hidden">

          {/* Icon gutter */}
          <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
            {[
              { icon: FileText,      key: "details",   title: "Details" },
              { icon: Paperclip,     key: "pv",        title: "Attachments" },
              { icon: MessageSquare, key: "comments",  title: "Comments" },
            ].map(btn => {
              const BtnIcon = btn.icon
              const isActive = activeTab === btn.key && selected !== null
              return (
                <button
                  key={btn.key}
                  title={btn.title}
                  onClick={() => selected && setActiveTab(btn.key)}
                  className={cn(
                    "p-2 rounded-[8px] transition-colors cursor-pointer",
                    isActive ? "bg-[#e7e6e6] text-[#344054]" : "text-[#667085] hover:text-[#344054] hover:bg-[#f2f4f7]"
                  )}
                >
                  <BtnIcon size={16} />
                </button>
              )
            })}
          </div>

          {/* Detail panel or empty */}
          {selected ? (
            <DetailPanel
              invoice={selected}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenPDF={() => setRightOpen(true)}
              onQuery={() => setActiveTab("comments")}
            />
          ) : (
            <div className="flex-1 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col items-center justify-center gap-3">
              <FileText size={48} className="text-[#d0d5dd]" />
              <div className="text-center">
                <p className="text-[16px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Select a request</p>
                <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Choose a payment request from the list to review</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — PDF preview */}
        {rightOpen && (
          <div className="w-[440px] shrink-0 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaecf0] shrink-0">
              <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>PDF Preview</span>
              <div className="flex items-center gap-3">
                <select
                  className="text-[12px] border border-[#eaecf0] rounded-[8px] px-2 py-1 text-[#344054] cursor-pointer"
                  style={{ fontFamily: "Inter" }}>
                  <option>{selected?.invoice_number}.pdf</option>
                  <option>DO0626-0020.pdf</option>
                </select>
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1 rounded-[6px] hover:bg-[#f2f4f7] text-[#667085] cursor-pointer transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#f2f4f7] flex items-center justify-center">
              <p className="text-[13px] text-[#667085]" style={{ fontFamily: "Inter" }}>
                {selected?.invoice_number}.pdf
              </p>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-[#eaecf0] shrink-0 text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
              <div className="flex items-center gap-2">
                <button className="cursor-pointer hover:text-[#344054]">−</button>
                <span>100%</span>
                <button className="cursor-pointer hover:text-[#344054]">+</button>
              </div>
              <div className="flex items-center gap-2">
                <span>Page 1 / 3</span>
                <button className="cursor-pointer hover:text-[#344054]">‹</button>
                <button className="cursor-pointer hover:text-[#344054]">›</button>
              </div>
              <div className="flex items-center gap-2">
                <button title="Download" className="cursor-pointer hover:text-[#344054]"><Download size={12} /></button>
                <button title="Print"    className="cursor-pointer hover:text-[#344054]"><Printer size={12} /></button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
