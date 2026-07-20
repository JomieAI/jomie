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
  getMockCompliance,
  DEFAULT_PINNED_METRICS,
} from "@/lib/mock"
import type { InvoiceListItem, InvoiceStatus, ApprovalStep, CommentThreadItem } from "@/lib/api"
import { useSidebar } from "@/components/sidebar-context"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
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
        "flex items-start gap-2 p-2 rounded-[10px] cursor-pointer transition-colors duration-150",
        selected ? "bg-[#f2f4f7]" : "bg-white hover:bg-[#f2f4f7]"
      )}
    >
      <div
        className="size-[38px] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cat.color + "18" }}
        title={cat.label}
      >
        <CatIcon size={18} style={{ color: cat.color }} strokeWidth={1.6} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#344054] truncate" style={{ fontFamily: "Inter" }}>
          {toTitleCase(inv.vendor_name_raw ?? "")}
        </p>
        <p className="text-[11px] text-[#667085] truncate" style={{ fontFamily: "Inter" }}>
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
            <span className="text-[11px] text-[#175cd3]" style={{ fontFamily: "Inter" }}>
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
        <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>
          {amount}
        </p>
      </div>
    </div>
  )
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ invoice, onTabChange }: { invoice: InvoiceListItem; onTabChange?: (tab: string) => void }) {
  const inv = invoice as any

  const checks = getMockCompliance(invoice.id) ?? []
  const passCount = checks.filter((c: any) => c.result === "pass").length
  const warnCount = checks.filter((c: any) => c.result === "warning").length
  const failCount = checks.filter((c: any) => c.result === "fail").length
  const totalChecks = checks.length || 1
  const complianceScore = checks.length > 0
    ? Math.round((passCount / totalChecks) * 100)
    : inv.risk_level === "pass" ? 92 : inv.risk_level === "warning" ? 78 : 45

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
    { label: "Invoice Date",   value: formatDate(inv.invoice_date) },
    { label: "Due Date",       value: formatDate(invoice.due_date) },
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
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-[12px] p-4 mb-5 border-l-4 border-l-amber-400 shadow-[0_2px_8px_rgba(186,117,23,0.10)]">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-900" style={{ fontFamily: "Inter" }}>
              Action Required
            </p>
            <p className="text-[12px] text-amber-700 mt-0.5" style={{ fontFamily: "Inter" }}>
              {inv.risk_count} compliance warning{inv.risk_count !== 1 ? "s" : ""} detected. Review before approving.
            </p>
            <button
              className="text-[11px] text-[#5d5ef4] hover:underline cursor-pointer mt-2 block"
              style={{ fontFamily: "Inter" }}
              onClick={() => onTabChange?.("checks")}>
              View All Checks →
            </button>
          </div>
        </div>
      )}

      {/* Jomie Compliance Summary */}
      {inv.risk_level && (
        <div className="bg-gradient-to-r from-[#f7f7fe] to-[#eef0ff] border border-[#c7c9fb] rounded-[12px] p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>
              ✦ Jomie Compliance
            </span>
            <span className="text-[20px] font-bold text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>
              {complianceScore} / 100
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#eaecf0] overflow-hidden mb-2">
            <div className="h-full rounded-full bg-[#5d5ef4] transition-all"
                 style={{ width: `${complianceScore}%` }} />
          </div>
          <p className="text-[11px] text-[#667085] mb-2" style={{ fontFamily: "Inter" }}>
            {failCount > 0
              ? `${failCount} fail${failCount !== 1 ? "s" : ""}, ${warnCount} warning${warnCount !== 1 ? "s" : ""} detected`
              : warnCount > 0
              ? `${warnCount} warning${warnCount !== 1 ? "s" : ""} detected`
              : "All checks passed"}
          </p>
          <button
            className="text-[11px] text-[#5d5ef4] hover:underline cursor-pointer"
            style={{ fontFamily: "Inter" }}
            onClick={() => onTabChange?.("checks")}>
            View All Checks →
          </button>
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
            { label: "Pay By",      value: formatDate(inv.payment_needed_by) },
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
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {thread.length === 0 && (
          <p className="text-[13px] text-[#98a2b3] text-center py-8" style={{ fontFamily: "Inter" }}>
            No comments yet.
          </p>
        )}
        {thread.map((item, idx) => {
          const isLast = idx === thread.length - 1

          if (item.type === "activity") {
            return (
              <div key={item.id} className="flex gap-3">
                {/* Left: dot + connector */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                  <div className="size-2 rounded-full bg-[#d0d5dd] mt-1 shrink-0" />
                  {!isLast && (
                    <div className="w-px flex-1 mt-1" style={{ borderLeft: "1.5px dashed #eaecf0" }} />
                  )}
                </div>
                {/* Right: text */}
                <div className="flex-1 pb-3">
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
            <div key={item.id} className="flex gap-3">
              {/* Left: avatar + connector */}
              <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                <div className="size-8 rounded-full bg-[#f2f4f7] flex items-center justify-center shrink-0 text-[11px] font-semibold text-[#5d5ef4] -ml-2" style={{ fontFamily: "Inter" }}>
                  {initials}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 mt-1" style={{ borderLeft: "1.5px dashed #eaecf0" }} />
                )}
              </div>
              {/* Right: bubble */}
              <div className="flex-1 pb-3 -ml-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{item.author}</span>
                  {item.role && (
                    <span className="text-[10px] bg-[#f2f4f7] rounded-full px-2 text-[#667085]" style={{ fontFamily: "Inter" }}>{item.role}</span>
                  )}
                  <span className="text-[10px] text-[#98a2b3] ml-auto" style={{ fontFamily: "Inter" }}>
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
          className="w-full bg-[#f9fafb] border border-[#eaecf0] rounded-[12px] px-3 py-2.5 text-[13px] text-[#344054] min-h-[72px] resize-none focus:outline-none focus:border-[#5d5ef4] focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/10 transition-colors"
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

const CATEGORY_LABEL_MAP: Record<string, string> = {
  document_completeness:  "Document Completeness",
  vendor_integrity:       "Vendor Integrity",
  financial_accuracy:     "Financial Accuracy",
  approval_authorisation: "Approval & Authorisation",
  tax_compliance:         "Tax Compliance",
  project_costing:        "Project & Costing",
}

function ChecksTab({ invoice }: { invoice: InvoiceListItem }) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const checks = getMockCompliance(invoice.id) ?? []

  const grouped = checks.reduce((acc: Record<string, any[]>, c: any) => {
    const cat = c.category ?? "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  const passCount = checks.filter((c: any) => c.result === "pass").length
  const warnCount = checks.filter((c: any) => c.result === "warning").length
  const failCount = checks.filter((c: any) => c.result === "fail").length
  const total = checks.length || 1
  const score = Math.round((passCount / total) * 100)

  if (checks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No compliance checks</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Checks will appear after processing.</p>
      </div>
    )
  }

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
          {passCount} passed · {warnCount} warnings · {failCount} critical
        </p>
      </div>

      {Object.entries(grouped).map(([cat, catChecks]) => (
        <div key={cat} className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] border-b border-[#f2f4f7] pb-2 mb-2" style={{ fontFamily: "Inter" }}>
            {CATEGORY_LABEL_MAP[cat] ?? cat}
          </p>
          {(catChecks as any[]).map((check: any, i: number) => {
            const key = `${cat}-${i}`
            const isOpen = expanded[key]
            return (
              <div key={i}>
                <div
                  className="flex items-center gap-3 h-10 hover:bg-[#f9fafb] rounded-[8px] px-2 cursor-pointer transition-colors"
                  onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                >
                  {check.result === "pass"    && <CheckCircle2  size={16} className="text-green-500 shrink-0" />}
                  {check.result === "warning" && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                  {check.result === "fail"    && <XCircle       size={16} className="text-red-500 shrink-0" />}
                  {check.result === "na"      && <Minus         size={16} className="text-[#98a2b3] shrink-0" />}
                  <span className="text-[13px] text-[#344054] flex-1" style={{ fontFamily: "Inter" }}>{check.title}</span>
                  {check.result === "warning" && (
                    <span className="bg-amber-50 text-amber-600 rounded-[6px] px-2 py-0.5 text-[11px]" style={{ fontFamily: "Inter" }}>
                      Warning
                    </span>
                  )}
                  {check.result === "fail" && (
                    <span className="bg-red-50 text-red-600 rounded-[6px] px-2 py-0.5 text-[11px]" style={{ fontFamily: "Inter" }}>
                      Critical
                    </span>
                  )}
                  <ChevronDown size={14} className={cn("text-[#98a2b3] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                </div>
                {isOpen && (
                  <div className="ml-9 pb-3">
                    <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{check.description}</p>
                    {check.skill_citation && (
                      <p className="text-[10px] font-mono text-[#98a2b3]/60 mt-1" style={{ fontFamily: "Inter" }}>{check.skill_citation}</p>
                    )}
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
  const thread = (inv.email_thread ?? []) as any[]
  const [showAll, setShowAll] = React.useState(false)

  const finance = thread.filter((e: any) => e.tier === "finance")
  const context = thread.filter((e: any) => e.tier === "context")
  const toShow = showAll ? thread : [...finance, ...context]

  if (thread.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No emails</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>No email thread for this request.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowAll(false)}
          className={cn("text-[12px] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer",
            !showAll ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]")}
          style={{ fontFamily: "Inter" }}>
          Finance-relevant {finance.length}
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={cn("text-[12px] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer",
            showAll ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]")}
          style={{ fontFamily: "Inter" }}>
          All emails {thread.length}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {toShow.map((email: any) => (
          <div key={email.id} className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{email.subject}</p>
                <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>
                  {email.from_name} · {new Date(email.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-[6px] shrink-0 ml-2",
                email.tier === "finance" ? "bg-[#eff8ff] text-[#175cd3]" : "bg-[#f2f4f7] text-[#667085]")}
                style={{ fontFamily: "Inter" }}>
                {email.tier === "finance" ? "Finance" : "Context"}
              </span>
            </div>
            <p className="text-[12px] text-[#667085] border-t border-[#f2f4f7] pt-2 leading-5" style={{ fontFamily: "Inter" }}>
              {email.body?.split("\n\n")[0]}
            </p>
            {email.attachments?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {email.attachments.map((att: string) => (
                  <div key={att} className="inline-flex items-center gap-1 bg-[#f2f4f7] border border-[#eaecf0] rounded-[6px] px-2 py-1">
                    <Paperclip size={10} className="text-[#5d5ef4]" />
                    <span className="text-[11px] text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>{att}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PV Tab ───────────────────────────────────────────────────────────────────

function PVTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const pvs = inv.payment_vouchers ?? []
  const total = inv.total_myr ?? 0
  const paid = inv.amount_paid ?? 0
  const outstanding = inv.amount_outstanding ?? (total - paid)

  return (
    <div className="flex flex-col gap-4">
      {/* Balance summary — always shown */}
      <div className="bg-[#f9fafb] border border-[#eaecf0] rounded-[12px] p-4">
        <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7]">
          <span className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>Invoice total</span>
          <span className="text-[13px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>MYR {total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7]">
          <span className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>Amount paid</span>
          <span className="text-[13px] font-medium text-green-600" style={{ fontFamily: "Inter" }}>MYR {paid.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-[12px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Outstanding</span>
          <span className={cn("text-[13px] font-bold", outstanding <= 0 ? "text-green-600" : "text-[#5d5ef4]")} style={{ fontFamily: "Inter" }}>
            {outstanding <= 0 ? "✓ Fully paid" : `MYR ${outstanding.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* PV list or empty */}
      {pvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="size-10 rounded-full bg-[#f2f4f7] flex items-center justify-center">
            <FileText size={18} className="text-[#98a2b3]" />
          </div>
          <p className="text-[13px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>No payment vouchers yet</p>
          <p className="text-[12px] text-[#667085] text-center max-w-[180px]" style={{ fontFamily: "Inter" }}>
            A voucher will be auto-created once this request is fully approved
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pvs.map((pv: any, i: number) => (
            <div key={i} className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{pv.pv_number}</span>
                <span className="bg-green-50 text-green-600 text-[11px] rounded-[6px] px-2 py-0.5" style={{ fontFamily: "Inter" }}>{pv.status}</span>
              </div>
              <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>MYR {pv.amount.toFixed(2)}</p>
              <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>{pv.payment_method} · {pv.payment_date}</p>
              {pv.bank_name && (
                <p className="text-[11px] text-[#98a2b3] mt-0.5" style={{ fontFamily: "Inter" }}>{pv.bank_name} · {pv.bank_account_no}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  invoice, activeTab, onTabChange, onOpenPDF, onQuery, onApprove, onReject,
}: {
  invoice: InvoiceListItem
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenPDF: () => void
  onQuery: () => void
  onApprove: () => void
  onReject: () => void
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
            <p className="text-[18px] font-bold text-[#344054] leading-7 truncate max-w-[220px]" style={{ fontFamily: "Inter" }}>
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
            onClick={onReject}
            className="bg-white border border-[#fda29b] rounded-[12px] p-[10px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-red-50 hover:border-[#f97066] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus:ring-offset-1 transition-colors cursor-pointer">
            <X size={20} className="text-[#b42318]" />
          </button>
          <button
            onClick={onApprove}
            className="bg-[#5d5ef4] border border-[#5d5ef4] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#4546d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Approve
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 shrink-0">
        <div className="inline-flex overflow-x-auto bg-[#f2f4f7] border border-[#f2f4f7] rounded-[12px] p-1 gap-0">
          {[
            { key: "details",  label: "Info" },
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
      <div key={activeTab} className="flex-1 overflow-y-auto px-8 py-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-150">
        {activeTab === "details"  && <DetailsTab  invoice={invoice} onTabChange={onTabChange} />}
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
  const { l2Open, setL2 } = useSidebar()
  const metrics = getMockMetrics()

  const [invoices, setInvoices]         = React.useState(() => getMockInvoices())
  const [isLoading, setIsLoading]       = React.useState(true)
  const [channel, setChannel]           = React.useState<"form" | "email">("form")
  const [pinnedMetrics]                 = React.useState(DEFAULT_PINNED_METRICS)
  const [viewTab, setViewTab]           = React.useState<"all" | "dashboard" | "my_request" | "awaiting">("all")
  const [selected, setSelected]         = React.useState<InvoiceListItem | null>(null)
  const [activeTab, setActiveTab]       = React.useState("details")
  const [rightOpen, setRightOpen]       = React.useState(false)
  const [leftWidth, setLeftWidth]       = React.useState(320)
  const [rightWidth, setRightWidth]     = React.useState(440)
  const [middleCollapsed, setMiddleCollapsed] = React.useState(false)
  const [search, setSearch]             = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevL2Open   = React.useRef(l2Open)

  // Simulate loading — replace setTimeout body with real fetch later
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (inv.vendor_name_raw ?? "").toLowerCase().includes(q) ||
      (inv.invoice_number ?? "").toLowerCase().includes(q) ||
      ((inv as any).pr_number ?? "").toLowerCase().includes(q)
    )
  })

  // V7 — auto-select first invoice once loaded
  React.useEffect(() => {
    if (!isLoading && !selected && filteredInvoices.length > 0) {
      setSelected(filteredInvoices[0])
      setActiveTab("details")
    }
  }, [isLoading, filteredInvoices])

  // V9 — when sidebar re-expands (l2Open false→true), close PDF panel
  React.useEffect(() => {
    if (l2Open && !prevL2Open.current) {
      setRightOpen(false)
    }
    prevL2Open.current = l2Open
  }, [l2Open])

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

  const handleRightDrag = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startW = rightWidth
    const GUTTER_W = 60
    const onMove = (ev: MouseEvent) => {
      const containerW = containerRef.current?.offsetWidth ?? 1200
      const bWidth = middleCollapsed ? 0 : leftWidth
      const maxRightW = containerW - bWidth - GUTTER_W - 600 - 8
      setRightWidth(Math.max(320, Math.min(maxRightW, startW - (ev.clientX - startX))))
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
      <div className="relative flex items-center px-4 pt-4 pb-0 shrink-0">
        {/* Left: title */}
        <div>
          <p className="text-[12px] font-light text-[#344054]" style={{ fontFamily: "Inter" }}>
            AP / Payment Requests
          </p>
          <h1 className="text-[30px] font-semibold leading-[38px] text-[#171b1d] mt-0" style={{ fontFamily: "Inter" }}>
            Payment Requests
          </h1>
        </div>

        {/* Centre: channel toggle — absolutely centred */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ChannelToggle channel={channel} onChange={setChannel} />
        </div>

        {/* Right: action buttons */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => toast("Coming soon", { description: "Export will be available in the next release." })}
            className="bg-white border border-[#d0d5dd] rounded-[12px] px-4 py-[10px] text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Export ↓
          </button>
          <button
            onClick={() => toast("Coming soon", { description: "Create Request form is coming in the next release." })}
            className="bg-[#171b1d] border border-[#171b1d] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#2a2f31] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171b1d]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            + Create Request
          </button>
        </div>
      </div>

      {/* Body */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden mt-9 px-4 pb-4 gap-2">

        {/* Left panel */}
        <div
          className={cn(
            "flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out",
            middleCollapsed ? "flex-1" : "shrink-0"
          )}
          style={middleCollapsed ? undefined : { width: leftWidth }}
        >

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
                  className="w-full max-w-[320px] bg-white border border-[#eaecf0] rounded-[10px] pl-9 pr-3 py-[7px] text-[14px] text-[#667085] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:border-[#5d5ef4] focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/20 transition-colors"
                  style={{ fontFamily: "Inter" }}
                />
              </div>

              {/* Metrics */}
              <MetricsBoard metrics={metrics} pinned={pinnedMetrics} expanded={middleCollapsed || leftWidth > 500} />

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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] px-2 pt-1 pb-0.5" style={{ fontFamily: "Inter" }}>
                  VENDOR / INVOICE
                </p>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-2 p-2">
                        <Skeleton className="size-[38px] rounded-[8px] shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <Skeleton className="h-3 w-3/4 rounded" />
                          <Skeleton className="h-2.5 w-1/2 rounded" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-[6px]" />
                      </div>
                    ))
                  : filteredInvoices.map(inv => (
                      <RequestListItem
                        key={inv.id}
                        inv={inv}
                        selected={selected?.id === inv.id}
                        expanded={middleCollapsed || leftWidth > 480}
                        onSelect={() => { setSelected(inv); setActiveTab("details") }}
                      />
                    ))
                }
                {filteredInvoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search size={24} className="text-[#d0d5dd] mb-2" />
                    <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No requests found</p>
                    <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>Try adjusting your filters</p>
                  </div>
                )}
              </div>
          </>

        </div>

        {/* Drag handle */}
        {!middleCollapsed && (
          <div
            className="w-1 cursor-col-resize hover:bg-[#5d5ef4]/20 active:bg-[#5d5ef4]/30 transition-colors shrink-0 rounded-full"
            onMouseDown={handleLeftDrag}
          />
        )}

        {/* Gutter — always shrink-0, never grows, sized to its own content only */}
        <TooltipProvider>
          <div className="flex flex-col items-center gap-2 shrink-0 self-start pt-2 mr-3 px-1 pb-2">
            {[
              { icon: FileText,      key: "details",  title: "Info" },
              { icon: MessageSquare, key: "comments", title: "Activity" },
              { icon: Paperclip,     key: "pdf",      title: "Documents" },
            ].map(btn => {
              const BtnIcon = btn.icon
              const isActive = btn.key === "pdf"
                ? rightOpen
                : (activeTab === btn.key && selected !== null)
              return (
                <Tooltip key={btn.key}>
                  <TooltipTrigger
                    render={
                      <button
                        onClick={() => {
                          if (btn.key === "pdf") {
                            const opening = !rightOpen
                            setRightOpen(opening)
                            setL2(!opening)
                          } else {
                            if (!selected) return
                            setActiveTab(btn.key)
                            if (middleCollapsed) setMiddleCollapsed(false)
                          }
                        }}
                        className={cn(
                          "p-2 rounded-[8px] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1",
                          isActive ? "bg-[#e7e6e6] text-[#344054]" : "text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6]"
                        )}
                      />
                    }
                  >
                    <BtnIcon size={16} />
                  </TooltipTrigger>
                  <TooltipContent side="right">{btn.title}</TooltipContent>
                </Tooltip>
              )
            })}

            {/* Collapse toggle — last item, directly below Documents */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() => setMiddleCollapsed(!middleCollapsed)}
                    className="p-2 rounded-[8px] transition-colors cursor-pointer text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1"
                  />
                }
              >
                {middleCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </TooltipTrigger>
              <TooltipContent side="right">{middleCollapsed ? "Expand panel" : "Collapse panel"}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* D — detail panel, slides in/out like a drawer */}
        <div className={cn(
          "overflow-hidden transition-[width] duration-200",
          middleCollapsed ? "w-0 pointer-events-none" : "flex-1 min-w-[600px]"
        )}>
          {!middleCollapsed && (selected ? (
            <DetailPanel
              invoice={selected}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenPDF={() => setRightOpen(true)}
              onQuery={() => setActiveTab("comments")}
              onApprove={() => {
                setInvoices(prev => prev.map(inv => inv.id === selected.id ? { ...inv, status: "approved" as InvoiceStatus } : inv))
                toast.success("Payment request approved", { description: `${selected.invoice_number} has been approved.` })
              }}
              onReject={() => {
                setInvoices(prev => prev.map(inv => inv.id === selected.id ? { ...inv, status: "rejected" as InvoiceStatus } : inv))
                toast.warning("Payment request rejected", { description: `${selected.invoice_number} has been rejected.` })
              }}
            />
          ) : (
            <div className="flex-1 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col items-center justify-center gap-4 p-8 h-full">
              <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No payment request selected illustration">
                <rect x="20" y="25" width="60" height="70" rx="6" fill="#f2f4f7" stroke="#eaecf0" strokeWidth="1.5"/>
                <rect x="28" y="15" width="60" height="70" rx="6" fill="#f7f7fe" stroke="#e0e1fd" strokeWidth="1.5"/>
                <rect x="36" y="5" width="60" height="70" rx="6" fill="white" stroke="#c7c9fb" strokeWidth="1.5"/>
                <rect x="46" y="20" width="36" height="3" rx="1.5" fill="#5d5ef4" opacity="0.6"/>
                <rect x="46" y="28" width="28" height="2" rx="1" fill="#eaecf0"/>
                <rect x="46" y="34" width="32" height="2" rx="1" fill="#eaecf0"/>
                <rect x="46" y="40" width="24" height="2" rx="1" fill="#eaecf0"/>
                <circle cx="88" cy="60" r="16" fill="white" stroke="#eaecf0" strokeWidth="1.5"/>
                <path d="M81 60 L86 65 L95 55" stroke="#5d5ef4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-center">
                <p className="text-[15px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Select a request to review</p>
                <p className="text-[13px] text-[#98a2b3] mt-1 max-w-[200px]" style={{ fontFamily: "Inter" }}>Choose from the list to see details, compliance checks, and approval status</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#c0c5ce]" style={{ fontFamily: "Inter" }}>
                <span className="bg-[#f2f4f7] border border-[#eaecf0] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">↑</span>
                <span className="bg-[#f2f4f7] border border-[#eaecf0] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">↓</span>
                <span>to navigate</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel — PDF preview */}
        {rightOpen && (
          <>
            <div
              className="w-1 cursor-col-resize hover:bg-[#5d5ef4]/20 active:bg-[#5d5ef4]/30 transition-colors shrink-0 rounded-full"
              onMouseDown={handleRightDrag}
            />
            <div style={{ width: rightWidth }} className="shrink-0 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col overflow-hidden">
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

            {/* PDF viewer area */}
            <div className="flex-1 bg-[#f4f4f1] flex flex-col items-center justify-center overflow-auto p-6">
              {/* Document outline */}
              <div className="bg-white rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden" style={{ width: 280, minHeight: 360 }}>
                {/* Document header bar */}
                <div className="bg-[#5d5ef4] px-5 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-white/80" />
                    <span className="text-[12px] font-medium text-white truncate max-w-[160px]" style={{ fontFamily: "Inter" }}>
                      {selected?.invoice_number}.pdf
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60" style={{ fontFamily: "Inter" }}>Page 1 of 3</span>
                </div>
                {/* Document body — skeleton lines */}
                <div className="flex-1 p-6 flex flex-col gap-3">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-24 bg-[#f2f4f7] rounded-full" />
                      <div className="h-2 w-16 bg-[#f2f4f7] rounded-full" />
                      <div className="h-2 w-20 bg-[#f2f4f7] rounded-full" />
                    </div>
                    <div className="h-8 w-20 bg-[#5d5ef4]/10 rounded-[4px] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>INVOICE</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[#5d5ef4]/15 rounded-full" />
                  {[80, 65, 90, 55, 70].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-[#f2f4f7]" style={{ width: `${w}%` }} />
                      <div className="h-1.5 w-8 rounded-full bg-[#f2f4f7] ml-auto" />
                    </div>
                  ))}
                  <div className="flex-1" />
                  <div className="border-t border-[#f2f4f7] pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <div className="h-1.5 w-16 bg-[#f2f4f7] rounded-full" />
                      <div className="h-1.5 w-12 bg-[#f2f4f7] rounded-full" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-2 w-20 bg-[#344054]/20 rounded-full" />
                      <div className="h-2 w-14 bg-[#5d5ef4]/30 rounded-full" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <div className="size-10 bg-[#f2f4f7] rounded-[4px] flex items-center justify-center">
                      <div className="size-6 grid grid-cols-3 gap-0.5">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className={cn("rounded-[1px]", [0,2,6,8].includes(i) ? "bg-[#344054]" : i === 4 ? "bg-[#5d5ef4]" : "bg-[#d0d5dd]")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#98a2b3] mt-3" style={{ fontFamily: "Inter" }}>
                Real PDF preview will appear when connected to backend
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
          </>
        )}

      </div>
    </div>
  )
}
