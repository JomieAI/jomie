"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronRight, ArrowLeft, Sparkles, CheckCircle2, XCircle, Clock,
  AlertTriangle, Globe, Building2, Star, User, MessageSquare, Send,
  ShieldAlert, ThumbsUp, ThumbsDown, Lock, Unlock, ChevronDown,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ApproverStatus = "approved" | "rejected" | "pending" | "blocked_sod" | "awaiting"

interface Approver {
  id: string
  name: string
  role: string
  avatar: string
  status: ApproverStatus
  timestamp: string | null
  comment: string | null
  is_current_user: boolean
  sod_conflict: boolean
}

interface ApprovalTier {
  tier: number
  label: string
  threshold: string
  approvers: Approver[]
  status: "completed" | "active" | "pending"
}

interface InvoiceSummary {
  id: string
  vendor_name_raw: string
  invoice_number: string
  total_myr: number
  due_date: string | null
  urgency_bucket: "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
  origin: "local" | "foreign" | "unknown"
  is_einvoice_verified: boolean
  submitted_by: string
  submitted_at: string
  po_reference: string | null
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_INVOICE: InvoiceSummary = {
  id: "inv-001",
  vendor_name_raw: "Tech Solutions MY Sdn Bhd",
  invoice_number: "INV-2024-0891",
  total_myr: 142800,
  due_date: "2024-06-18",
  urgency_bucket: "overdue",
  origin: "local",
  is_einvoice_verified: true,
  submitted_by: "Sarah Lim",
  submitted_at: "2 Jun 2024, 9:45 AM",
  po_reference: "PO-2024-0056",
}

const DEMO_TIERS: ApprovalTier[] = [
  {
    tier: 1,
    label: "Department Manager",
    threshold: "All invoices",
    status: "completed",
    approvers: [
      {
        id: "u-001",
        name: "Sarah Lim",
        role: "AP Manager / Submitter",
        avatar: "SL",
        status: "blocked_sod",
        timestamp: null,
        comment: null,
        is_current_user: false,
        sod_conflict: true,
      },
      {
        id: "u-002",
        name: "David Tan",
        role: "Finance Manager",
        avatar: "DT",
        status: "approved",
        timestamp: "3 Jun 2024, 11:02 AM",
        comment: "Reviewed and confirmed PO match. Approved for next tier.",
        is_current_user: false,
        sod_conflict: false,
      },
    ],
  },
  {
    tier: 2,
    label: "Finance Director",
    threshold: "≥ RM 50,000",
    status: "active",
    approvers: [
      {
        id: "u-003",
        name: "Thony Wong",
        role: "Finance Director",
        avatar: "TW",
        status: "pending",
        timestamp: null,
        comment: null,
        is_current_user: true,
        sod_conflict: false,
      },
    ],
  },
  {
    tier: 3,
    label: "CFO",
    threshold: "≥ RM 100,000",
    status: "pending",
    approvers: [
      {
        id: "u-004",
        name: "Raymond Koh",
        role: "Chief Financial Officer",
        avatar: "RK",
        status: "awaiting",
        timestamp: null,
        comment: null,
        is_current_user: false,
        sod_conflict: false,
      },
    ],
  },
]

const DEMO_THREAD = [
  {
    author: "Sarah Lim",
    avatar: "SL",
    role: "AP Manager",
    time: "2 Jun 2024, 9:45 AM",
    isAI: false,
    text: "Submitted for approval. Invoice matched to PO-2024-0056. Line item 3 (server setup, RM 14k) may require CAPEX classification — flagged for CFO review.",
  },
  {
    author: "Jomie AI",
    avatar: "✦",
    role: "AI Assistant",
    time: "2 Jun 2024, 9:45 AM",
    isAI: true,
    text: "SOD rule applied: Sarah Lim (submitter) is blocked from Tier 1 approval. David Tan is the designated approver for this tier. Invoice is OVERDUE — escalation recommended if not approved by EOD.",
    source: "jomie-sod-policy.md:v1.0 · approval-matrix.md:v2.3",
  },
  {
    author: "David Tan",
    avatar: "DT",
    role: "Finance Manager",
    time: "3 Jun 2024, 11:02 AM",
    isAI: false,
    text: "Reviewed and confirmed PO match. Approved for next tier.",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-MY", { minimumFractionDigits: 2 })
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"

const URGENCY_CONFIG = {
  overdue:  { label: "Overdue",  color: T.red,     bg: T.redLight   },
  due_3d:   { label: "Due ≤3d",  color: T.amber,   bg: T.amberLight },
  due_7d:   { label: "Due ≤7d",  color: T.amber,   bg: T.amberLight },
  due_30d:  { label: "Due ≤30d", color: T.dimText, bg: "rgba(255,255,255,0.04)" },
  future:   { label: "Future",   color: T.dimText, bg: "rgba(255,255,255,0.04)" },
}

const APPROVER_STATUS_CONFIG: Record<ApproverStatus, {
  label: string; color: string; bg: string; border: string; icon: React.ReactNode
}> = {
  approved:     { label: "Approved",     color: T.tealText, bg: T.tealLight,   border: T.teal,   icon: <CheckCircle2 size={13} strokeWidth={2}/> },
  rejected:     { label: "Rejected",     color: T.redText,  bg: T.redLight,    border: T.red,    icon: <XCircle size={13} strokeWidth={2}/> },
  pending:      { label: "Pending",      color: "#92400E",  bg: "#FEF3C7",     border: "#D97706", icon: <Clock size={13} strokeWidth={2}/> },
  blocked_sod:  { label: "SOD Blocked",  color: T.redText,  bg: T.redLight,    border: T.red,    icon: <ShieldAlert size={13} strokeWidth={2}/> },
  awaiting:     { label: "Awaiting",     color: T.dimText,  bg: "rgba(255,255,255,0.5)", border: "#E5E7EB", icon: <Lock size={13} strokeWidth={2}/> },
}

const TIER_STATUS_CONFIG = {
  completed: { color: T.teal,    border: T.teal,   bg: T.tealLight   },
  active:    { color: T.purple,  border: T.purple, bg: T.purpleLight },
  pending:   { color: T.dimText, border: "#E5E7EB", bg: "#F9FAFB"    },
}

// ─── Invoice summary card ─────────────────────────────────────────────────────

function InvoiceSummaryCard({ invoice }: { invoice: InvoiceSummary }) {
  const urgency = URGENCY_CONFIG[invoice.urgency_bucket]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(103,100,136,0.3)" }}>
      {/* Urgency banner */}
      {invoice.urgency_bucket === "overdue" && (
        <div className="px-4 py-2 flex items-center gap-2"
          style={{ background: "rgba(226,75,74,0.15)", borderBottom: "0.5px solid rgba(226,75,74,0.3)" }}>
          <AlertTriangle size={12} style={{ color: T.red }} strokeWidth={2}/>
          <span className="text-[11px] font-semibold" style={{ color: T.red }}>
            This invoice is overdue — expedited approval required
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Vendor + amount */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[15px] font-bold text-white leading-snug">{invoice.vendor_name_raw}</div>
            <div className="text-[11px] font-mono mt-0.5" style={{ color: T.dimText }}>{invoice.invoice_number}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: T.dimText }}>Total (MYR)</div>
            <div className="text-[20px] font-bold tabular-nums font-mono" style={{ color: urgency.color }}>
              {fmt(invoice.total_myr)}
            </div>
          </div>
        </div>

        {/* Key fields */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
          {[
            { label: "Due Date",  value: fmtDate(invoice.due_date), highlight: invoice.urgency_bucket === "overdue" },
            { label: "PO Ref",    value: invoice.po_reference ?? "—", highlight: false },
            { label: "Origin",    value: invoice.origin === "foreign" ? "Foreign" : "Local (MY)", highlight: false },
            { label: "e-Invoice", value: invoice.is_einvoice_verified ? "Verified ✓" : "Not verified", highlight: invoice.is_einvoice_verified },
          ].map((f, i) => (
            <div key={i}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: T.dimText }}>{f.label}</div>
              <div className="text-[11px] font-medium" style={{ color: f.highlight ? T.teal : "rgba(255,255,255,0.75)" }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>

        {/* Submitted by */}
        <div className="pt-3 mt-1 flex items-center gap-2" style={{ borderTop: "0.5px solid rgba(103,100,136,0.25)" }}>
          <div className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: "#475569" }}>
            {invoice.submitted_by.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <span className="text-[10px]" style={{ color: T.dimText }}>Submitted by </span>
            <span className="text-[10px] font-semibold text-white">{invoice.submitted_by}</span>
            <span className="text-[10px]" style={{ color: T.dimText }}> · {invoice.submitted_at}</span>
          </div>
        </div>
      </div>

      {/* AI recommendation */}
      <div className="px-5 py-3.5" style={{ borderTop: "0.5px solid rgba(93,94,244,0.2)", background: "rgba(93,94,244,0.06)" }}>
        <div className="flex items-start gap-2">
          <div className="size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <div>
            <div className="text-[10px] font-semibold mb-1" style={{ color: "#9EACFE" }}>Jomie Recommendation</div>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Invoice overdue since 18 Jun. PO matched and Tier 1 approved. Recommend expedited Tier 2 approval today — payment can be initiated immediately after CFO sign-off.
            </p>
            <code className="text-[9px] font-mono mt-1.5 block" style={{ color: "rgba(255,255,255,0.25)" }}>
              approval-matrix.md:v2.3 · payment-terms.md
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Approver node ────────────────────────────────────────────────────────────

function ApproverNode({ approver, isLast }: { approver: Approver; isLast: boolean }) {
  const cfg = APPROVER_STATUS_CONFIG[approver.status]
  const [showComment, setShowComment] = React.useState(!!approver.comment)

  return (
    <div className="flex gap-3">
      {/* Connector line */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
        <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 z-10"
          style={{
            background: approver.status === "approved" ? T.teal
              : approver.status === "blocked_sod" ? T.red
              : approver.status === "pending" ? T.purple
              : "#94A3B8",
          }}>
          {approver.avatar}
        </div>
        {!isLast && (
          <div className="flex-1 w-px mt-1" style={{ background: "rgba(229,231,235,0.5)", minHeight: 20 }}/>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-900">{approver.name}</span>
              {approver.is_current_user && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: T.purpleLight, color: T.purple }}>You</span>
              )}
            </div>
            <div className="text-[10px] text-gray-500">{approver.role}</div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}` }}>
              {cfg.icon} {cfg.label}
            </span>
            {approver.timestamp && (
              <span className="text-[9px] text-gray-400">{approver.timestamp}</span>
            )}
          </div>
        </div>

        {/* SOD warning */}
        {approver.sod_conflict && (
          <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg"
            style={{ background: T.redLight, border: `0.5px solid ${T.red}44` }}>
            <ShieldAlert size={11} style={{ color: T.red, flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
            <p className="text-[10px] leading-relaxed" style={{ color: T.redText }}>
              <strong>SOD enforced</strong> — this approver submitted the invoice and cannot approve it. Segregation of duties policy applies.
            </p>
          </div>
        )}

        {/* Approver comment */}
        {approver.comment && (
          <div className="mt-2 px-3 py-2 rounded-lg text-[11px] text-gray-600 leading-relaxed"
            style={{ background: "#F9FAFB", border: "0.5px solid #E5E7EB" }}>
            {approver.comment}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Approval tier ────────────────────────────────────────────────────────────

function ApprovalTierBlock({ tier }: { tier: ApprovalTier }) {
  const cfg = TIER_STATUS_CONFIG[tier.status]

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: `0.5px solid ${cfg.border}` }}>
      {/* Tier header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: cfg.bg, borderBottom: `0.5px solid ${cfg.border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: cfg.color }}>
            {tier.tier}
          </div>
          <div>
            <div className="text-[12px] font-semibold" style={{ color: tier.status === "pending" ? "#9CA3AF" : "#111827" }}>
              {tier.label}
            </div>
            <div className="text-[9px] font-medium" style={{ color: tier.status === "pending" ? "#D1D5DB" : "#6B7280" }}>
              Required for {tier.threshold}
            </div>
          </div>
        </div>
        <div>
          {tier.status === "completed" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: T.teal }}>
              <CheckCircle2 size={12} strokeWidth={2}/> Completed
            </span>
          )}
          {tier.status === "active" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold animate-pulse"
              style={{ color: T.purple }}>
              <Clock size={12} strokeWidth={2}/> In progress
            </span>
          )}
          {tier.status === "pending" && (
            <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: "#D1D5DB" }}>
              <Lock size={12} strokeWidth={2}/> Locked
            </span>
          )}
        </div>
      </div>

      {/* Approvers */}
      <div className="px-4 pt-4 pb-1" style={{ background: "#fff" }}>
        {tier.approvers.map((approver, i) => (
          <ApproverNode
            key={approver.id}
            approver={approver}
            isLast={i === tier.approvers.length - 1}/>
        ))}
      </div>
    </div>
  )
}

// ─── Action panel (for current user's pending approval) ──────────────────────

function ActionPanel({ invoiceId }: { invoiceId: string }) {
  const [comment, setComment] = React.useState("")
  const [action, setAction] = React.useState<"approve" | "reject" | null>(null)

  if (action) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${action === "approve" ? T.teal : T.red}` }}>
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ background: action === "approve" ? T.tealLight : T.redLight, borderBottom: `0.5px solid ${action === "approve" ? T.teal : T.red}44` }}>
          {action === "approve"
            ? <ThumbsUp size={13} style={{ color: T.teal }} strokeWidth={2}/>
            : <ThumbsDown size={13} style={{ color: T.red }} strokeWidth={2}/>}
          <span className="text-[12px] font-semibold" style={{ color: action === "approve" ? T.tealText : T.redText }}>
            {action === "approve" ? "Approve Invoice" : "Reject Invoice"}
          </span>
        </div>
        <div className="p-4" style={{ background: "#fff" }}>
          <textarea
            rows={3}
            placeholder={action === "approve"
              ? "Add an approval comment (optional)…"
              : "Please provide a reason for rejection…"}
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full text-[11px] text-gray-700 px-3 py-2 rounded-lg resize-none focus:outline-none mb-3"
            style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.purple}`)}
            onBlur={e => (e.currentTarget.style.border = "1px solid #E5E7EB")}
          />
          <div className="flex gap-2">
            <button onClick={() => setAction(null)}
              className="flex-1 h-8 rounded-lg text-[12px] font-medium border cursor-pointer"
              style={{ color: "#374151", borderColor: "#D1D5DB", background: "#F9FAFB" }}>
              Cancel
            </button>
            <button
              className="flex-1 h-8 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
              style={{ background: action === "approve" ? T.teal : T.red }}>
              Confirm {action === "approve" ? "Approval" : "Rejection"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-4" style={{ background: T.purpleLight, border: `0.5px solid rgba(93,94,244,0.3)` }}>
      <div className="flex items-center gap-2 mb-3">
        <Unlock size={13} style={{ color: T.purple }} strokeWidth={2}/>
        <span className="text-[12px] font-semibold" style={{ color: T.purpleText }}>Your approval is required</span>
      </div>
      <p className="text-[11px] mb-4 leading-relaxed" style={{ color: T.purpleText }}>
        You are the designated approver for Tier 2 (Finance Director). Review the invoice details before making a decision.
      </p>
      <div className="flex gap-2">
        <button onClick={() => setAction("reject")}
          className="flex-1 h-9 rounded-lg text-[12px] font-medium cursor-pointer border flex items-center justify-center gap-1.5"
          style={{ color: T.red, borderColor: T.red + "44", background: T.redLight }}>
          <ThumbsDown size={12} strokeWidth={2}/> Reject
        </button>
        <button onClick={() => setAction("approve")}
          className="flex-1 h-9 rounded-lg text-[12px] font-semibold text-white cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: T.teal }}>
          <ThumbsUp size={12} strokeWidth={2}/> Approve
        </button>
      </div>
    </div>
  )
}

// ─── Comment thread ───────────────────────────────────────────────────────────

function CommentThread() {
  const [comment, setComment] = React.useState("")

  return (
    <div className="space-y-3">
      <div className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.dimText }}>
        Approval Thread
      </div>

      {DEMO_THREAD.map((c, i) => (
        <div key={i} className="flex gap-2.5">
          <div className="size-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white mt-0.5"
            style={{ background: c.isAI ? T.purple : "#475569" }}>
            {c.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold text-gray-900">{c.author}</span>
              <span className="text-[9px]" style={{ color: T.dimText }}>{c.role}</span>
              <span className="text-[9px] text-gray-400 ml-auto">{c.time}</span>
            </div>
            <div className={cn("rounded-xl px-3 py-2.5 text-[11px] leading-relaxed")}
              style={{
                background: c.isAI ? "rgba(93,94,244,0.06)" : "#F9FAFB",
                border: c.isAI ? "0.5px solid rgba(93,94,244,0.15)" : "0.5px solid #E5E7EB",
                color: c.isAI ? T.purpleText : "#374151",
              }}>
              {c.isAI && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Sparkles size={10} style={{ color: T.purple }} strokeWidth={2}/>
                  <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: T.purple }}>
                    Jomie Insight
                  </span>
                </div>
              )}
              {c.text}
              {c.isAI && "source" in c && (
                <code className="text-[9px] font-mono mt-1.5 block" style={{ color: "#9CA3AF" }}>
                  {(c as any).source}
                </code>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Comment input */}
      <div className="flex gap-2 pt-2">
        <div className="size-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
          style={{ background: T.purple }}>TW</div>
        <div className="flex-1 relative">
          <textarea rows={2} placeholder="Add a comment to the approval thread…"
            value={comment} onChange={e => setComment(e.target.value)}
            className="w-full text-[11px] text-gray-700 px-3 py-2 rounded-xl resize-none focus:outline-none"
            style={{ border: "1px solid #E5E7EB", background: "#fff" }}
            onFocus={e => (e.currentTarget.style.border = `1px solid ${T.purple}`)}
            onBlur={e => (e.currentTarget.style.border = "1px solid #E5E7EB")}/>
          <button className="absolute bottom-2 right-2 size-6 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: comment ? T.purple : "#E5E7EB" }}>
            <Send size={10} color={comment ? "#fff" : "#9CA3AF"} strokeWidth={2}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function ApprovalClient({ id }: { id: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-0" style={{ height: "calc(100vh - 20px)" }}>

      {/* Header */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/ap/invoices/${id}`)}
            className="flex items-center gap-1 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft size={13} strokeWidth={2}/> Invoice Detail
          </button>
          <div className="w-px h-4" style={{ background: "rgba(103,100,136,0.5)" }}/>
          <nav className="flex items-center gap-1">
            <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.45)" }}>AP</span>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <button onClick={() => router.push("/ap/invoices")}
              className="text-[12px] font-light cursor-pointer hover:text-white transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}>Invoice Inbox</button>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <button onClick={() => router.push(`/ap/invoices/${id}`)}
              className="text-[12px] font-light cursor-pointer hover:text-white transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              {DEMO_INVOICE.invoice_number}
            </button>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <span className="text-[12px] font-medium text-white">Approval</span>
          </nav>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: T.dimText }}>Tier progress:</span>
          <div className="flex items-center gap-1">
            {DEMO_TIERS.map((t, i) => (
              <React.Fragment key={t.tier}>
                <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: t.status === "completed" ? T.teal : t.status === "active" ? T.purple : "rgba(255,255,255,0.1)",
                    color: t.status === "pending" ? T.dimText : "#fff",
                  }}>
                  {t.status === "completed" ? "✓" : t.tier}
                </div>
                {i < DEMO_TIERS.length - 1 && (
                  <div className="w-4 h-px" style={{ background: t.status === "completed" ? T.teal : "rgba(255,255,255,0.15)" }}/>
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="text-[11px] font-semibold" style={{ color: T.amber }}>1 / 3 complete</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Left: invoice summary + action panel */}
        <div className="flex flex-col gap-4 shrink-0" style={{ width: 340 }}>
          <InvoiceSummaryCard invoice={DEMO_INVOICE}/>
          <ActionPanel invoiceId={id}/>
        </div>

        {/* Right: #F7F7FE — approval chain + thread */}
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden flex flex-col"
          style={{ background: "#F7F7FE" }}>

          <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between"
            style={{ borderBottom: "0.5px solid #E5E7EB" }}>
            <div>
              <div className="text-[13px] font-bold text-gray-900">Approval Chain</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                3-tier approval required · Amount ≥ RM 100,000
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: T.amberLight, border: `0.5px solid ${T.amber}44` }}>
              <AlertTriangle size={11} style={{ color: T.amber }} strokeWidth={2}/>
              <span className="text-[10px] font-semibold" style={{ color: T.amberText }}>Overdue</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-5">

              {/* Approval tiers */}
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.dimText }}>
                  Approval Tiers
                </div>
                {DEMO_TIERS.map(tier => (
                  <ApprovalTierBlock key={tier.tier} tier={tier}/>
                ))}
              </div>

              {/* Comment thread */}
              <div>
                <CommentThread/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
