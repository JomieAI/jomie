"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Search, ChevronDown, CheckCircle2, Clock, AlertTriangle, XCircle,
  Play, Download, Send, Plus, Banknote, Building2, FileText,
  ChevronRight, MoreHorizontal, Check, X, Users, ArrowUpRight,
  CalendarDays, CreditCard, Landmark,
} from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"
import { toast } from "sonner"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const PURPLE = "#5d5ef4"
const GREEN  = "#10b981"
const AMBER  = "#f59e0b"
const RED    = "#ef4444"

// ─── Types ────────────────────────────────────────────────────────────────────

type RunStatus = "draft" | "pending_approval" | "approved" | "processing" | "completed" | "rejected"

interface PaymentRun {
  id: string
  run_number: string
  name: string
  status: RunStatus
  total_myr: number
  invoice_count: number
  created_by: string
  created_at: string
  payment_date: string
  bank_account: string
  approval_steps: ApprovalStep[]
  invoices: RunInvoice[]
}

interface ApprovalStep {
  title: string
  assignee: string
  status: "completed" | "current" | "pending" | "rejected"
  timestamp?: string
  note?: string
}

interface RunInvoice {
  id: string
  vendor: string
  invoice_number: string
  amount_myr: number
  due_date: string
  bank_name: string
  account_number: string
  payment_method: "IBG" | "SWIFT" | "DuitNow"
  status: "included" | "excluded" | "on_hold"
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RUNS: PaymentRun[] = [
  {
    id: "pr1",
    run_number: "PAY-2026-0012",
    name: "July Vendor Payment Run",
    status: "pending_approval",
    total_myr: 142_890.60,
    invoice_count: 8,
    created_by: "Nurhusna Hafeeza",
    created_at: "2026-07-28T09:00:00",
    payment_date: "2026-08-02",
    bank_account: "Maybank — 5141-2300-4822",
    approval_steps: [
      { title: "AP Clerk Review",         assignee: "Nurhusna Hafeeza",  status: "completed", timestamp: "2026-07-28T10:30:00" },
      { title: "Finance Manager Approval", assignee: "Chan Heng Lim",    status: "current" },
      { title: "CFO Sign-off",             assignee: "Thony Chwa",       status: "pending" },
    ],
    invoices: [
      { id: "i1", vendor: "Apex Supplies Sdn Bhd",  invoice_number: "APEX-INV-0445", amount_myr: 6_250.00,  due_date: "2026-07-25", bank_name: "Maybank",   account_number: "3024-5566-1122", payment_method: "IBG",     status: "included" },
      { id: "i2", vendor: "Netassist (M) Sdn Bhd",  invoice_number: "NA0626-0023",   amount_myr: 8_164.80,  due_date: "2026-07-15", bank_name: "CIMB",      account_number: "8020-1234-5600", payment_method: "IBG",     status: "included" },
      { id: "i3", vendor: "Mazars Plt",              invoice_number: "MAZ-2026-0892", amount_myr: 18_500.00, due_date: "2026-06-15", bank_name: "RHB",       account_number: "2122-3300-9900", payment_method: "IBG",     status: "included" },
      { id: "i4", vendor: "AWS Singapore Pte Ltd",   invoice_number: "AWS-JUN-26-MY", amount_myr: 12_340.00, due_date: "2026-07-31", bank_name: "SWIFT",     account_number: "DBSSSGSGXXX",    payment_method: "SWIFT",   status: "included" },
      { id: "i5", vendor: "SKY Renovation Works",    invoice_number: "SKY-INV-0221",  amount_myr: 38_500.00, due_date: "2026-08-01", bank_name: "Maybank",   account_number: "5566-7788-9900", payment_method: "IBG",     status: "included" },
      { id: "i6", vendor: "Pos Malaysia Berhad",     invoice_number: "POS-2026-3301", amount_myr: 1_200.00,  due_date: "2026-07-30", bank_name: "CIMB",      account_number: "4455-6677-8800", payment_method: "DuitNow", status: "included" },
      { id: "i7", vendor: "Petronas Dagangan Bhd",   invoice_number: "PDB-JUL-5590",  amount_myr: 22_000.00, due_date: "2026-08-05", bank_name: "HLBank",    account_number: "0820-1122-3344", payment_method: "IBG",     status: "on_hold" },
      { id: "i8", vendor: "Celcom Axiata Bhd",       invoice_number: "CEL-2026-8840", amount_myr: 935.80,    due_date: "2026-08-03", bank_name: "Maybank",   account_number: "3344-5566-7788", payment_method: "DuitNow", status: "excluded" },
    ],
  },
  {
    id: "pr2",
    run_number: "PAY-2026-0011",
    name: "Mid-July Urgent Payments",
    status: "completed",
    total_myr: 31_420.00,
    invoice_count: 3,
    created_by: "Thony Chwa",
    created_at: "2026-07-15T08:00:00",
    payment_date: "2026-07-16",
    bank_account: "Maybank — 5141-2300-4822",
    approval_steps: [
      { title: "AP Clerk Review",          assignee: "Nurhusna Hafeeza", status: "completed", timestamp: "2026-07-15T09:00:00" },
      { title: "Finance Manager Approval", assignee: "Chan Heng Lim",   status: "completed", timestamp: "2026-07-15T11:30:00" },
      { title: "CFO Sign-off",             assignee: "Thony Chwa",      status: "completed", timestamp: "2026-07-15T14:00:00", note: "Urgent — approved on priority basis." },
    ],
    invoices: [
      { id: "j1", vendor: "Tech Solutions MY",      invoice_number: "TS-INV-1122", amount_myr: 14_200.00, due_date: "2026-07-16", bank_name: "Maybank",  account_number: "1122-3344-5566", payment_method: "IBG",     status: "included" },
      { id: "j2", vendor: "KPMG Malaysia Plt",      invoice_number: "KPM-2026-442",amount_myr: 12_000.00, due_date: "2026-07-16", bank_name: "CIMB",     account_number: "8800-9922-1100", payment_method: "IBG",     status: "included" },
      { id: "j3", vendor: "TNB Energy Services",    invoice_number: "TNB-JUL-0091",amount_myr: 5_220.00,  due_date: "2026-07-15", bank_name: "Maybank",  account_number: "2211-3300-4411", payment_method: "DuitNow", status: "included" },
    ],
  },
  {
    id: "pr3",
    run_number: "PAY-2026-0013",
    name: "Aug Advance Payments",
    status: "draft",
    total_myr: 58_300.00,
    invoice_count: 5,
    created_by: "Nurhusna Hafeeza",
    created_at: "2026-07-30T16:00:00",
    payment_date: "2026-08-08",
    bank_account: "Maybank — 5141-2300-4822",
    approval_steps: [
      { title: "AP Clerk Review",          assignee: "Nurhusna Hafeeza", status: "current" },
      { title: "Finance Manager Approval", assignee: "Chan Heng Lim",   status: "pending" },
      { title: "CFO Sign-off",             assignee: "Thony Chwa",      status: "pending" },
    ],
    invoices: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMYR = (n: number) => n.toLocaleString("en-MY", { minimumFractionDigits: 2 })

const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  draft:            "Draft",
  pending_approval: "Pending Approval",
  approved:         "Approved",
  processing:       "Processing",
  completed:        "Completed",
  rejected:         "Rejected",
}

const RUN_STATUS_COLOR: Record<RunStatus, { bg: string; text: string; border: string }> = {
  draft:            { bg: "#f9fafb", text: "#667085", border: "#d0d5dd" },
  pending_approval: { bg: "#fffaeb", text: "#b54708", border: "#fec84b" },
  approved:         { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  processing:       { bg: "#eff8ff", text: "#175cd3", border: "#93c5fd" },
  completed:        { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  rejected:         { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
}

const PAYMENT_METHOD_COLOR: Record<string, string> = {
  IBG:     "#eff8ff",
  SWIFT:   "#fdf4ff",
  DuitNow: "#f0fdf4",
}

const PAYMENT_METHOD_TEXT: Record<string, string> = {
  IBG:     "#175cd3",
  SWIFT:   "#7e22ce",
  DuitNow: "#166534",
}

// ─── Run List Item ─────────────────────────────────────────────────────────────

function RunListItem({ run, selected, onSelect }: { run: PaymentRun; selected: boolean; onSelect: () => void }) {
  const sc = RUN_STATUS_COLOR[run.status]

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1.5 p-2.5 rounded-[10px] cursor-pointer transition-colors duration-150 border",
        selected
          ? "bg-[#f2f4f7] border-[#d0d5dd]"
          : "bg-white border-transparent hover:bg-[#f9fafb] hover:border-[#eaecf0]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-[8px] flex items-center justify-center shrink-0 border" style={{ background: "#5d5ef418", borderColor: "#5d5ef448" }}>
          <Banknote size={16} style={{ color: PURPLE }} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-[#1d2939] truncate" style={{ fontFamily: "Inter" }}>{run.name}</p>
            <p className="text-[14px] font-bold text-[#1d2939] tabular-nums shrink-0" style={{ fontFamily: "Inter" }}>
              {fmtMYR(run.total_myr)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-[11px] text-[#667085] truncate" style={{ fontFamily: "Inter" }}>
              {run.run_number} · {run.invoice_count} invoices
            </p>
            <span
              className="text-[10px] font-semibold rounded-[5px] px-1.5 py-0.5 shrink-0 border"
              style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
            >
              {RUN_STATUS_LABEL[run.status]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pl-12">
        <CalendarDays size={10} className="text-[#98a2b3] shrink-0" />
        <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
          Pay {new Date(run.payment_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>· {run.created_by}</span>
      </div>
    </div>
  )
}

// ─── Run Detail Panel ──────────────────────────────────────────────────────────

function RunDetailPanel({ run, onClose }: { run: PaymentRun; onClose: () => void }) {
  const [activeTab, setActiveTab] = React.useState<"invoices" | "approval" | "export">("invoices")
  const sc = RUN_STATUS_COLOR[run.status]

  const included = run.invoices.filter(i => i.status === "included")
  const onHold   = run.invoices.filter(i => i.status === "on_hold")
  const excluded = run.invoices.filter(i => i.status === "excluded")
  const includedTotal = included.reduce((s, i) => s + i.amount_myr, 0)

  return (
    <div className="flex flex-col h-full bg-[#f7f7fe] rounded-[14px] overflow-hidden border border-[#e0e1fd]">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#eaecf0] bg-white shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#98a2b3] mb-0.5" style={{ fontFamily: "Inter" }}>{run.run_number}</p>
            <h2 className="text-[18px] font-semibold text-[#1d2939] leading-tight" style={{ fontFamily: "Inter" }}>{run.name}</h2>
          </div>
          <span
            className="text-[11px] font-semibold rounded-[6px] px-2 py-1 border shrink-0"
            style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
          >
            {RUN_STATUS_LABEL[run.status]}
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Amount",   value: `MYR ${fmtMYR(includedTotal)}`, highlight: true },
            { label: "Payment Date",   value: new Date(run.payment_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) },
            { label: "Invoices",       value: `${included.length} included` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-[#f7f7fe] border border-[#eaecf0] rounded-[10px] px-3 py-2.5">
              <p className="text-[10px] text-[#98a2b3] uppercase tracking-wide mb-0.5" style={{ fontFamily: "Inter" }}>{label}</p>
              <p className={cn("text-[13px] font-semibold", highlight ? "text-[#5d5ef4]" : "text-[#1d2939]")} style={{ fontFamily: "Inter" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Bank account */}
        <div className="flex items-center gap-2 bg-[#f9fafb] border border-[#eaecf0] rounded-[8px] px-3 py-2">
          <Landmark size={13} className="text-[#667085] shrink-0" />
          <p className="text-[12px] text-[#344054]" style={{ fontFamily: "Inter" }}>{run.bank_account}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-4 py-2 bg-white border-b border-[#eaecf0] shrink-0">
        {([
          { key: "invoices", label: `Invoices (${run.invoices.length})` },
          { key: "approval", label: "Approval Chain" },
          { key: "export",   label: "Export" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-[13px] transition-colors whitespace-nowrap cursor-pointer",
              activeTab === t.key ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]"
            )}
            style={{ fontFamily: "Inter" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto">

        {/* Invoices tab */}
        {activeTab === "invoices" && (
          <div className="p-4 flex flex-col gap-4">

            {/* Included */}
            {included.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#344054] uppercase tracking-wide" style={{ fontFamily: "Inter" }}>
                    Included · MYR {fmtMYR(includedTotal)}
                  </p>
                  <span className="text-[10px] bg-green-50 text-green-600 rounded-[5px] px-1.5 py-0.5 font-semibold" style={{ fontFamily: "Inter" }}>
                    {included.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {included.map(inv => <InvoiceRow key={inv.id} inv={inv} />)}
                </div>
              </div>
            )}

            {/* On Hold */}
            {onHold.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#344054] uppercase tracking-wide" style={{ fontFamily: "Inter" }}>On Hold</p>
                  <span className="text-[10px] bg-amber-50 text-amber-600 rounded-[5px] px-1.5 py-0.5 font-semibold" style={{ fontFamily: "Inter" }}>{onHold.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {onHold.map(inv => <InvoiceRow key={inv.id} inv={inv} muted />)}
                </div>
              </div>
            )}

            {/* Excluded */}
            {excluded.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#344054] uppercase tracking-wide" style={{ fontFamily: "Inter" }}>Excluded</p>
                  <span className="text-[10px] bg-[#f2f4f7] text-[#667085] rounded-[5px] px-1.5 py-0.5 font-semibold" style={{ fontFamily: "Inter" }}>{excluded.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {excluded.map(inv => <InvoiceRow key={inv.id} inv={inv} muted />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approval tab */}
        {activeTab === "approval" && (
          <div className="p-4">
            <div className="bg-[#f9fafb] border border-[#eaecf0] rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
                Auto-determined by approvalMatrix.md@v1.3
              </p>
            </div>
            <div className="flex flex-col">
              {run.approval_steps.map((step, i) => {
                const isLast = i === run.approval_steps.length - 1
                const circleClass =
                  step.status === "completed" ? "bg-green-500 text-white" :
                  step.status === "current"   ? "bg-[#5d5ef4] text-white" :
                  step.status === "rejected"  ? "bg-red-500 text-white" :
                  "bg-[#f2f4f7] text-[#98a2b3] border border-[#eaecf0]"
                const badgeClass =
                  step.status === "completed" ? "bg-green-50 text-green-600" :
                  step.status === "current"   ? "bg-[#f7f7fe] text-[#5d5ef4] border border-[#c7c9fb]" :
                  step.status === "rejected"  ? "bg-red-50 text-red-600" :
                  "bg-[#f2f4f7] text-[#98a2b3]"
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold", circleClass)}>
                        {step.status === "completed" ? <CheckCircle2 size={16} /> : step.status === "rejected" ? <XCircle size={16} /> : i + 1}
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
                      <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{step.assignee}</p>
                      {step.timestamp && (
                        <p className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
                          {new Date(step.timestamp).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {step.note && (
                        <p className="text-[12px] italic text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>"{step.note}"</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action buttons for current approver */}
            {run.status === "pending_approval" && (
              <div className="flex gap-2 mt-4 border-t border-[#eaecf0] pt-4">
                <button
                  onClick={() => toast("Approved", { description: "Payment run approved and forwarded to next approver." })}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#5d5ef4] hover:bg-[#5556de] text-white rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer"
                  style={{ fontFamily: "Inter" }}
                >
                  <Check size={14} />
                  Approve Run
                </button>
                <button
                  onClick={() => toast("Rejected", { description: "Payment run has been rejected." })}
                  className="flex items-center justify-center gap-2 bg-white border border-[#fca5a5] text-red-600 rounded-[10px] px-4 py-2.5 text-[13px] font-medium hover:bg-red-50 transition-colors cursor-pointer"
                  style={{ fontFamily: "Inter" }}
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Export tab */}
        {activeTab === "export" && (
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <p className="text-[13px] font-semibold text-[#344054] mb-1" style={{ fontFamily: "Inter" }}>IBG Bank File</p>
              <p className="text-[12px] text-[#667085] mb-3" style={{ fontFamily: "Inter" }}>
                Interbank GIRO formatted file for bulk payment submission to Maybank Business Online.
              </p>
              <div className="flex items-center justify-between text-[12px] text-[#667085] mb-4 bg-[#f9fafb] rounded-[8px] px-3 py-2" style={{ fontFamily: "Inter" }}>
                <span>Format: IBG v2.1 (Maybank)</span>
                <span className="text-[#5d5ef4] font-medium">{included.length} transactions</span>
              </div>
              <button
                onClick={() => toast("Downloading...", { description: "IBG file will be ready in a moment." })}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer",
                  run.status === "approved" || run.status === "completed"
                    ? "bg-[#171b1d] text-white hover:bg-[#2a2f31]"
                    : "bg-[#f2f4f7] text-[#98a2b3] cursor-not-allowed"
                )}
                disabled={run.status !== "approved" && run.status !== "completed"}
                style={{ fontFamily: "Inter" }}
              >
                <Download size={14} />
                {run.status === "approved" || run.status === "completed" ? "Download IBG File" : "Awaiting Approval"}
              </button>
            </div>

            <div className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <p className="text-[13px] font-semibold text-[#344054] mb-1" style={{ fontFamily: "Inter" }}>Payment Voucher</p>
              <p className="text-[12px] text-[#667085] mb-3" style={{ fontFamily: "Inter" }}>
                PDF summary of all payments in this run, with approval signatures.
              </p>
              <button
                onClick={() => toast("Generating PDF...", { description: "Payment voucher will be ready shortly." })}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#eaecf0] text-[#344054] rounded-[10px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f9fafb] transition-colors cursor-pointer"
                style={{ fontFamily: "Inter" }}
              >
                <FileText size={14} />
                Export Voucher PDF
              </button>
            </div>

            <div className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <p className="text-[13px] font-semibold text-[#344054] mb-1" style={{ fontFamily: "Inter" }}>Notify Vendors</p>
              <p className="text-[12px] text-[#667085] mb-3" style={{ fontFamily: "Inter" }}>
                Send remittance advice to all {included.length} vendors in this run.
              </p>
              <button
                onClick={() => toast("Coming soon", { description: "Vendor remittance is available in the next release." })}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#eaecf0] text-[#344054] rounded-[10px] px-4 py-2.5 text-[13px] font-medium hover:bg-[#f9fafb] transition-colors cursor-pointer"
                style={{ fontFamily: "Inter" }}
              >
                <Send size={14} />
                Send Remittance Advice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Invoice Row ───────────────────────────────────────────────────────────────

function InvoiceRow({ inv, muted }: { inv: RunInvoice; muted?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 bg-white border border-[#eaecf0] rounded-[10px] px-3 py-2.5 transition-colors",
      muted ? "opacity-50" : "hover:bg-[#f9fafb]"
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#344054] truncate" style={{ fontFamily: "Inter" }}>{inv.vendor}</p>
        <p className="text-[11px] text-[#98a2b3] mt-0.5" style={{ fontFamily: "Inter" }}>
          {inv.invoice_number} · {inv.bank_name} {inv.account_number}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-[12px] font-bold text-[#1d2939] tabular-nums" style={{ fontFamily: "Inter" }}>
          {fmtMYR(inv.amount_myr)}
        </p>
        <span
          className="text-[10px] font-semibold rounded-[4px] px-1.5 py-0.5"
          style={{
            background: PAYMENT_METHOD_COLOR[inv.payment_method],
            color: PAYMENT_METHOD_TEXT[inv.payment_method],
          }}
        >
          {inv.payment_method}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentRunsPage() {
  const { l2Open } = useSidebar()

  const [runs] = React.useState(MOCK_RUNS)
  const [selected, setSelected] = React.useState<PaymentRun>(MOCK_RUNS[0])
  const [search, setSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  const filtered = React.useMemo(() => {
    if (!search) return runs
    const q = search.toLowerCase()
    return runs.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.run_number.toLowerCase().includes(q)
    )
  }, [runs, search])

  const summaryStats = React.useMemo(() => {
    const pending   = runs.filter(r => r.status === "pending_approval")
    const approved  = runs.filter(r => r.status === "approved")
    const completed = runs.filter(r => r.status === "completed")
    return {
      pendingCount:   pending.length,
      pendingTotal:   pending.reduce((s, r) => s + r.total_myr, 0),
      approvedCount:  approved.length,
      approvedTotal:  approved.reduce((s, r) => s + r.total_myr, 0),
      completedTotal: completed.reduce((s, r) => s + r.total_myr, 0),
    }
  }, [runs])

  return (
    <div className="flex flex-col h-screen overflow-hidden pb-6" style={{ backgroundColor: "#f4f4f1" }}>

      {/* Header */}
      <div className="relative flex items-center px-4 pt-4 pb-0 shrink-0">
        <div>
          <p className="text-[12px] font-light text-[#344054]" style={{ fontFamily: "Inter" }}>AP / Payment Runs</p>
          <h1 className="text-[30px] font-semibold leading-[38px] text-[#171b1d]" style={{ fontFamily: "Inter" }}>Payment Runs</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => toast("Coming soon", { description: "Export will be available in the next release." })}
            className="bg-white border border-[#d0d5dd] rounded-[12px] px-4 py-[10px] text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}
          >
            Export ↓
          </button>
          <button
            onClick={() => toast("Coming soon", { description: "Create Payment Run is coming in the next release." })}
            className="bg-[#171b1d] border border-[#171b1d] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#2a2f31] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}
          >
            + New Run
          </button>
        </div>
      </div>

      {/* Summary KPI bar */}
      <div className="flex items-center gap-3 px-4 mt-4 shrink-0">
        {[
          { label: "Pending Approval", value: `MYR ${fmtMYR(summaryStats.pendingTotal)}`, sub: `${summaryStats.pendingCount} runs`, color: AMBER },
          { label: "Approved — Ready", value: `MYR ${fmtMYR(summaryStats.approvedTotal)}`, sub: `${summaryStats.approvedCount} runs`, color: GREEN },
          { label: "Paid This Month",  value: `MYR ${fmtMYR(summaryStats.completedTotal)}`, sub: "Completed", color: PURPLE },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="flex items-center gap-3 bg-white border border-[#eaecf0] rounded-[12px] px-4 py-3 flex-1">
            <div className="size-2 rounded-full shrink-0" style={{ background: color }} />
            <div>
              <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>{label}</p>
              <p className="text-[14px] font-bold text-[#1d2939]" style={{ fontFamily: "Inter" }}>{value}</p>
              <p className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Body: 2-column */}
      <div className="flex flex-1 overflow-hidden mt-4 px-4 pb-4 gap-3">

        {/* Left: Run list */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3 overflow-hidden">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search run name or number..."
              className="w-full bg-white border border-[#eaecf0] rounded-[12px] pl-9 pr-4 py-2.5 text-[13px] text-[#344054] placeholder:text-[#98a2b3] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:ring-2 focus:ring-[#5d5ef4]/30"
              style={{ fontFamily: "Inter" }}
            />
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[90px] bg-white rounded-[10px] border border-transparent animate-pulse" />
                ))
              : filtered.map(run => (
                  <RunListItem
                    key={run.id}
                    run={run}
                    selected={selected?.id === run.id}
                    onSelect={() => setSelected(run)}
                  />
                ))
            }
          </div>
        </div>

        {/* Right: Run detail */}
        <div className="flex-1 overflow-hidden">
          {isLoading
            ? <div className="h-full bg-white rounded-[14px] border border-[#e0e1fd] animate-pulse" />
            : selected
              ? <RunDetailPanel run={selected} onClose={() => {}} />
              : (
                  <div className="h-full flex flex-col items-center justify-center bg-[#f7f7fe] rounded-[14px] border border-[#e0e1fd]">
                    <Banknote size={40} className="text-[#c7c9fb] mb-3" />
                    <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Select a payment run</p>
                    <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Choose a run from the list to view details.</p>
                  </div>
                )
          }
        </div>
      </div>
    </div>
  )
}
