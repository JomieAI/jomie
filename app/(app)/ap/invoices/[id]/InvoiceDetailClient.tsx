"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Globe, Building2, Star, Edit3, Send, Paperclip, Mail, MessageSquare,
  FileText, ZoomIn, ZoomOut, RotateCcw, Download, ThumbsUp, ThumbsDown,
  Link2, ListChecks, Info, Check, X, Minus, ChevronDown, ChevronUp, CreditCard,
} from "lucide-react"
import { getInvoice, updateLineItemGL, type InvoiceDetailResponse, type PaymentVoucher } from "@/lib/api"
import {
  isMockMode, getMockInvoiceDetail, getMockCompliance, getMockContractByRef,
  getMockProject, type ComplianceCheck,
} from "@/lib/mock"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ─── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  purple:     "#5D5EF4",
  purpleLight:"#EEEDFE",
  purpleText: "#3C3489",
  teal:       "#1D9E75",
  tealLight:  "#E1F5EE",
  tealText:   "#085041",
  amber:      "#BA7517",
  amberLight: "#FAEEDA",
  amberText:  "#633806",
  red:        "#E24B4A",
  redLight:   "#FCEBEB",
  redText:    "#791F1F",
  border:     "#676488",
  dimText:    "#98A2B3",
  blue:       "#185FA5",
  blueLight:  "#E6F1FB",
  blueBorder: "#85B7EB",
  blueText:   "#0C447C",
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LineItem {
  description: string
  qty: number | null
  uom: string | null
  unit_price: number | null
  amount: number
  gl_code: string | null
  gl_desc: string | null
  confidence: number
  gl_confidence?: number | null
  sst_claimable?: boolean | null
}

export interface InvoiceDetail {
  id: string
  vendor_name_raw: string
  vendor_tin: string | null
  vendor_reg_no: string | null
  vendor_address: string | null
  vendor_country: string
  invoice_number: string
  invoice_date: string | null
  due_date: string | null
  payment_terms: string | null
  currency: string
  subtotal: number
  tax_amount: number | null
  tax_type: string | null
  total_myr: number
  urgency_bucket: "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
  status: "pending_review" | "approved" | "rejected" | "paid" | "overdue" | "partially_paid"
  origin: "local" | "foreign" | "unknown"
  is_einvoice_verified: boolean
  discount_available: boolean
  discount_savings_myr: number | null
  duplicate_risk: "none" | "possible" | "exact"
  source: string
  project_code: string | null
  project_id?: string | null
  cost_centre: string | null
  po_reference: string | null
  bill_to_name: string
  bill_to_address: string | null
  bill_to_tin: string | null
  confidence_scores: Record<string, number>
  line_items: LineItem[]
  ai_insight: string
  ai_source: string
  created_at: string
  // Extended fields
  payment_type?: string | null
  work_order_ref?: string | null
  milestone_sequence?: number | null
  milestone_description?: string | null
  milestone_percentage?: number | null
  amount_paid?: number | null
  amount_outstanding?: number | null
  po_substitute_type?: string | null
  do_number?: string | null
  do_received?: boolean | null
  do_signed_returned?: boolean | null
  payment_vouchers?: PaymentVoucher[]
  payment_series_id?: string | null
  payment_series_sequence?: number | null
  total_contract_value?: number | null
  quotation_ref?: string | null
  email_from?: string | null
  email_subject?: string | null
  email_body_html?: string | null
}

// ─── Demo data (legacy fallback) ──────────────────────────────────────────────

export const DEMO_DETAILS: Record<string, InvoiceDetail> = {
  "inv-001": {
    id: "inv-001",
    vendor_name_raw: "Tech Solutions MY Sdn Bhd",
    vendor_tin: "C20194012345",
    vendor_reg_no: "202001034567-A",
    vendor_address: "Unit 12-3, Menara IMC, 8 Jalan Sultan Ismail, 50250 Kuala Lumpur",
    vendor_country: "MY",
    invoice_number: "INV-2024-0891",
    invoice_date: "2024-05-20",
    due_date: "2024-06-18",
    payment_terms: "Net 30",
    currency: "MYR",
    subtotal: 135000,
    tax_amount: 7800,
    tax_type: "SST",
    total_myr: 142800,
    urgency_bucket: "overdue",
    status: "pending_review",
    origin: "local",
    is_einvoice_verified: true,
    discount_available: false,
    discount_savings_myr: null,
    duplicate_risk: "none",
    source: "email_gmail",
    project_code: "PROJ-2024-01",
    cost_centre: "IT-OPS",
    po_reference: "PO-2024-0056",
    bill_to_name: "ABC Retails Sdn Bhd",
    bill_to_address: "Level 8, Wisma ABC, 88 Jalan Ampang, 50450 Kuala Lumpur",
    bill_to_tin: "C20050087654",
    confidence_scores: {
      vendor_name: 0.99, vendor_tin: 0.95, invoice_number: 0.99,
      invoice_date: 0.97, due_date: 0.82, total: 0.99, line_items: 0.91,
    },
    line_items: [
      { description: "Software Development Services — Phase 2", qty: 1, uom: "lot", unit_price: 85000, amount: 85000, gl_code: "5210", gl_desc: "IT Consulting Services", confidence: 0.94 },
      { description: "Annual Maintenance & Support", qty: 12, uom: "months", unit_price: 3000, amount: 36000, gl_code: "5215", gl_desc: "Software Maintenance", confidence: 0.91 },
      { description: "Server Infrastructure Setup", qty: 1, uom: "lot", unit_price: 14000, amount: 14000, gl_code: "1410", gl_desc: "Capital Expenditure — Equipment", confidence: 0.76 },
    ],
    ai_insight: "e-Invoice verified via MyInvois. SST input tax RM 7,800 claimable against SST registration. Line item 3 flagged as potential CAPEX — verify capitalisation threshold (RM 10,000). PO-2024-0056 matched.",
    ai_source: "jomie-sst-baseline.md:v1.5 → SST18:S38 · lhdn-capex-threshold.md:v2.1",
    created_at: "2024-06-01T08:00:00Z",
    payment_vouchers: [],
  },
}

const DEFAULT_DETAIL = DEMO_DETAILS["inv-001"]

// ─── Mock email thread data ───────────────────────────────────────────────────

type EmailTier = 1 | 2 | 3

interface MockEmail {
  id: string
  from_name: string
  from_email: string
  to_label: string
  date: string
  subject: string
  body: string
  tier: EmailTier
  tier_reason: string
  attachments?: string[]
}

const MOCK_EMAIL_THREADS: Record<string, MockEmail[]> = {
  // Sorted newest first (descending by date)
  "00000000-0000-0000-0000-000000000001": [
    {
      id: "e-012", from_name: "Woon Weng Sing", from_email: "wengsing@mynetassist.com",
      to_label: "me, chanheng@jomeinvoice.my, Thomas, Finance", date: "18 Jun 2026, 11:41",
      subject: "Invoice NA0626-0023, dated 16/06/2026, for JOM EINVOICE SDN BHD | WO 2026-0264",
      body: "Dear Our Value Customers,\n\nGood day!\n\nEnclosed herewith Invoice.-NA0626-0023 & DO.-DO0626-0020 for RM 8,164.80. Please remit payment at your earliest convenience.\n\nAppreciate if you could sign & return the DO for our Audit purposes.",
      tier: 1, tier_reason: "Invoice submission — RM 8,164.80",
      attachments: ["NA0626-0023.pdf", "DO0626-0020.pdf"],
    },
    {
      id: "e-011", from_name: "Thony Chwa", from_email: "thony@jomeinvoice.my",
      to_label: "Woon Weng Sing", date: "17 Jun 2026, 10:30",
      subject: "Re: VAPT Final Report — Sign-off",
      body: "Hi Woon,\n\nReports received and reviewed. Management has signed off. Please go ahead and issue the final invoice.\n\nRegards,\nThony",
      tier: 3, tier_reason: "Internal sign-off",
    },
    {
      id: "e-010", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "15 Jun 2026, 14:20",
      subject: "VAPT Final Assessment Report Delivered",
      body: "Hi Thony,\n\nFinal Assessment Report attached. All critical and high findings from M2 are confirmed remediated.\n\nThis completes our VAPT engagement per quotation NASB-Q-TT-20260423-AGMO-CSPS-SPA-VAPT-001v0.1.\n\nOur finance team will issue the final invoice shortly.\n\nBest,\nThomas",
      tier: 3, tier_reason: "Final report delivery",
      attachments: ["VAPT-Final-Assessment-AGMO-CSPS-SPA-v1.0.pdf"],
    },
    {
      id: "e-009", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "5 Jun 2026, 09:45",
      subject: "VAPT Initial Assessment Report Delivered",
      body: "Hi Thony,\n\nAttached: VAPT Initial Assessment Report for AGMO CSPS SPA.\n\nHighlights: 2 Critical (patched), 3 High, 7 Medium, 12 Low/Info. All critical findings verified as fixed in re-test.\n\nFinal Report to follow within 2 weeks.\n\nBest,\nThomas",
      tier: 3, tier_reason: "Report delivery",
      attachments: ["VAPT-Initial-Assessment-AGMO-CSPS-SPA-v1.0.pdf"],
    },
    {
      id: "e-008", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "20 May 2026, 11:00",
      subject: "VAPT Week 2 — Findings Summary",
      body: "Hi Thony,\n\nWeek 2 complete. Findings to date:\n- 2 High (SQL injection, broken auth)\n- 5 Medium\n- 8 Informational\n\nFull remediation guidance in the initial report. Expected delivery: end of May.\n\nBest,\nThomas",
      tier: 3, tier_reason: "Technical progress update",
    },
    {
      id: "e-007", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "12 May 2026, 16:30",
      subject: "VAPT Week 1 Update",
      body: "Hi Thony,\n\nCompleted external network discovery and initial reconnaissance. No critical findings so far. Web application testing commences tomorrow.\n\nNext update: end of week 2.\n\nBest,\nThomas",
      tier: 3, tier_reason: "Technical progress update",
    },
    {
      id: "e-006", from_name: "Woon Weng Sing", from_email: "wengsing@mynetassist.com",
      to_label: "me, chanheng@jomeinvoice.my, Thomas, Finance", date: "8 May 2026, 15:44",
      subject: "Invoice NA0526-0010, dated 26/05/2026, for JOM EINVOICE SDN BHD | WO 2026-0264",
      body: "Dear Our Value Customers,\n\nGood day!\n\nEnclosed herewith Invoice.-NA0526-0010 & DO.-DO0526-0010 for RM 8,164.80. Please remit payment at your earliest convenience.\n\nAppreciate if you could sign & return the DO for our Audit purposes.",
      tier: 1, tier_reason: "Invoice submission — RM 8,164.80",
      attachments: ["NA0526-0010.pdf", "DO0526-0010.pdf"],
    },
    {
      id: "e-005", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "29 Apr 2026, 09:15",
      subject: "Received — VAPT Kick-off",
      body: "Hi Thony,\n\nThank you. Signed quotation received. Let us schedule a kick-off meeting this week.\n\nProposed: Thursday 2 May, 10am via Teams?\n\nBest,\nThomas",
      tier: 3, tier_reason: "Meeting scheduling",
    },
    {
      id: "e-004", from_name: "Thony Chwa", from_email: "thony@jomeinvoice.my",
      to_label: "Thomas Tay", date: "28 Apr 2026, 22:47",
      subject: "Signed Quotation — WO 2026-0264",
      body: "Hi Thomas,\n\nPlease find the signed quotation. Please proceed with the engagement.\n\nWO reference: WO-2026-0264\n\nRegards,\nThony",
      tier: 2, tier_reason: "Signed PO — contract confirmation",
      attachments: ["NASB-Q-TT-20260423-AGMO-CSPS-SPA-VAPT-001v0.1 (signed).pdf"],
    },
    {
      id: "e-003", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "24 Apr 2026, 15:30",
      subject: "Re: VAPT Quotation — Answers",
      body: "Hi Thony,\n\n1. Timeline: 3–4 weeks from kick-off\n2. Mobile apps out of scope\n3. Report per OWASP/CVSSv3 with executive summary\n\nBest,\nThomas",
      tier: 3, tier_reason: "Scope clarification reply",
    },
    {
      id: "e-002", from_name: "Thony Chwa", from_email: "thony@jomeinvoice.my",
      to_label: "Thomas Tay", date: "24 Apr 2026, 10:05",
      subject: "Re: VAPT Quotation — Questions",
      body: "Hi Thomas,\n\nA few clarifying questions on scope:\n1. Estimated timeline?\n2. Mobile apps in scope?\n3. Report format?\n\nThanks,\nThony",
      tier: 3, tier_reason: "Scope clarification",
    },
    {
      id: "e-001", from_name: "Thomas Tay", from_email: "thomas.tay@mynetassist.com",
      to_label: "Thony Chwa", date: "22 Apr 2026, 14:22",
      subject: "VAPT Quotation — AGMO CSPS SPA",
      body: "Dear Thony,\n\nPlease find attached our quotation for VAPT services for the AGMO CSPS SPA project.\n\nTotal: RM 16,329.60 (incl. 8% SST)\nPayment terms: 50% on PO, 40% on initial report, 10% on final report\n\nBest regards,\nThomas Tay",
      tier: 3, tier_reason: "Quotation — pre-contract",
      attachments: ["NASB-Q-TT-20260423-AGMO-CSPS-SPA-VAPT-001v0.1.pdf"],
    },
  ],
}

// ─── Mock AI findings per invoice ─────────────────────────────────────────────

type FindingLevel = "blue" | "amber" | "green"

interface AIFinding {
  level: FindingLevel
  title: string
  description: string
  citation?: string
}

const MOCK_AI_FINDINGS: Record<string, AIFinding[]> = {
  "00000000-0000-0000-0000-000000000001": [
    {
      level: "blue",
      title: "Final payment — contract series",
      description: "BEING FINAL 50% PAYMENT detected. Milestone 2 of 2. Contract NASB-Q-TT-20260423 · Total RM 16,329.60",
      citation: "invoiceClassification.md@v1.2",
    },
    {
      level: "green",
      title: "MyInvois validated — LHDN compliant",
      description: "QR code present and verified.",
      citation: "jomie-sst-baseline.md@v1.5",
    },
    {
      level: "amber",
      title: "Possible duplicate — same amount as prior invoice",
      description: "Both NA0526-0010 and this invoice are RM 8,164.80. Expected for milestone payments — confirm before approving.",
      citation: "duplicateDetection.md@v1.1",
    },
    {
      level: "amber",
      title: "SST not claimable — blocked input category",
      description: "Service Tax RM 464.80 cannot be claimed as input tax. Professional IT security services are a blocked input.",
      citation: "jomie-sst-baseline.md@v1.5 · SST18:S38",
    },
    {
      level: "blue",
      title: "Project assigned — WO 2026-0264 (82% of budget)",
      description: "Matched from email subject. RM 3,670 remaining.",
      citation: "invoiceClassification.md@v1.2",
    },
    {
      level: "blue",
      title: "2 items ready to add to item master",
      description: "External Network Penetration Testing and VAPT Assessment Reports not in item master.",
      citation: "itemMaster.md@v1.3",
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 2) => n.toLocaleString("en-MY", { minimumFractionDigits: dec })
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"

const URGENCY_CONFIG = {
  overdue: { label: "Overdue",  color: T.red,     bg: T.redLight,   border: T.red   },
  due_3d:  { label: "Due ≤3d",  color: T.amber,   bg: T.amberLight, border: T.amber },
  due_7d:  { label: "Due ≤7d",  color: T.amber,   bg: T.amberLight, border: T.amber },
  due_30d: { label: "Due ≤30d", color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border },
  future:  { label: "Future",   color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border },
}

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "#92400E",  bg: "#FEF3C7" },
  approved:       { label: "Approved",       color: T.tealText, bg: T.tealLight },
  rejected:       { label: "Rejected",       color: T.redText,  bg: T.redLight },
  paid:           { label: "Paid",           color: T.dimText,  bg: "rgba(255,255,255,0.06)" },
  overdue:        { label: "Overdue",        color: T.redText,  bg: T.redLight },
  partially_paid: { label: "Partial",        color: T.tealText, bg: T.tealLight },
}

const STATUS_BADGE_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  pending_review: "status-pending",
  approved:       "status-approved",
  paid:           "status-paid",
  overdue:        "status-overdue",
  partially_paid: "status-partial",
  rejected:       "status-rejected",
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.80) return null
  return (
    <Badge variant="urgency-7d" className="ml-1.5 gap-0.5 h-4 text-[9px]">
      <AlertTriangle size={8} strokeWidth={2}/> {Math.round(score * 100)}%
    </Badge>
  )
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

function PDFViewer({ invoice, signedUrl }: { invoice: InvoiceDetail; signedUrl?: string | null }) {
  const [zoom, setZoom] = React.useState(100)

  return (
    <div className="flex flex-col h-full" style={{ background: "#1a1740" }}>
      <div className="shrink-0 flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(103,100,136,0.3)" }}>
        <div className="flex items-center gap-2">
          <div className="size-5 rounded flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <FileText size={11} color="rgba(255,255,255,0.6)" strokeWidth={1.8}/>
          </div>
          <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
            {invoice.invoice_number}.pdf
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => setZoom(z => Math.max(50, z - 10))}
            variant="ghost" size="icon"
            className="size-6 rounded text-white/50 hover:bg-white/12 hover:text-white/70">
            <ZoomOut size={11} strokeWidth={2}/>
          </Button>
          <span className="text-[10px] font-mono w-10 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            {zoom}%
          </span>
          <Button onClick={() => setZoom(z => Math.min(200, z + 10))}
            variant="ghost" size="icon"
            className="size-6 rounded text-white/50 hover:bg-white/12 hover:text-white/70">
            <ZoomIn size={11} strokeWidth={2}/>
          </Button>
          <Button onClick={() => setZoom(100)}
            variant="ghost" size="icon"
            className="size-6 rounded ml-1 text-white/50 hover:bg-white/12 hover:text-white/70">
            <RotateCcw size={10} strokeWidth={2}/>
          </Button>
          <Button variant="ghost" size="icon"
            className="size-6 rounded ml-1 text-white/50 hover:bg-white/12 hover:text-white/70">
            <Download size={11} strokeWidth={2}/>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto flex items-start justify-center p-6">
        {signedUrl ? (
          <iframe src={signedUrl} title="Invoice document"
            className="w-full h-full rounded-lg shadow-2xl"
            style={{ minHeight: 720, border: "none", background: "#fff" }}/>
        ) : (
          <div style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease",
            width: "520px",
            flexShrink: 0,
          }}>
            <div className="rounded-lg shadow-2xl overflow-hidden" style={{ background: "#fff", minHeight: 720 }}>
              <div className="px-10 pt-10 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-[13px] font-semibold text-gray-500 tracking-wide uppercase">
                    {invoice.vendor_name_raw}
                  </div>
                  <div className="text-right">
                    <div className="text-[28px] font-black tracking-tight text-gray-900">INVOICE</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{invoice.invoice_number}</div>
                    {invoice.is_einvoice_verified && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold"
                        style={{ background: "#E1F5EE", color: "#085041" }}>
                        <CheckCircle2 size={8} strokeWidth={2}/> MyInvois Verified
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6 pb-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">From</div>
                    <div className="text-[11px] font-bold text-gray-800">{invoice.vendor_name_raw}</div>
                    {invoice.vendor_tin && <div className="text-[10px] text-gray-500 mt-0.5">TIN: {invoice.vendor_tin}</div>}
                    {invoice.vendor_reg_no && <div className="text-[10px] text-gray-500">Reg: {invoice.vendor_reg_no}</div>}
                    {invoice.vendor_address && <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{invoice.vendor_address}</div>}
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Bill To</div>
                    <div className="text-[11px] font-bold text-gray-800">{invoice.bill_to_name}</div>
                    {invoice.bill_to_tin && <div className="text-[10px] text-gray-500 mt-0.5">TIN: {invoice.bill_to_tin}</div>}
                    {invoice.bill_to_address && <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{invoice.bill_to_address}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8 pb-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Invoice Date</div>
                    <div className="text-[11px] font-medium text-gray-800">{fmtDate(invoice.invoice_date)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Due Date</div>
                    <div className="text-[11px] font-medium text-gray-800">{fmtDate(invoice.due_date)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Payment Terms</div>
                    <div className="text-[11px] font-medium text-gray-800">{invoice.payment_terms ?? "—"}</div>
                  </div>
                  {invoice.po_reference && (
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">PO Reference</div>
                      <div className="text-[11px] font-medium text-gray-800">{invoice.po_reference}</div>
                    </div>
                  )}
                  {invoice.vendor_tin && (
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">TIN</div>
                      <div className="text-[11px] font-medium text-gray-800">{invoice.vendor_tin}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Currency</div>
                    <div className="text-[11px] font-medium text-gray-800">{invoice.currency}</div>
                  </div>
                </div>

                <table className="w-full mb-6">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <th className="text-left py-2 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Description</th>
                      <th className="text-right py-2 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Qty</th>
                      <th className="text-right py-2 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Unit Price</th>
                      <th className="text-right py-2 text-[9px] font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((li, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #F3F4F6" }}>
                        <td className="py-2.5 text-[10px] text-gray-700 pr-4 leading-relaxed">{li.description}</td>
                        <td className="py-2.5 text-[10px] text-gray-600 text-right tabular-nums whitespace-nowrap">
                          {li.qty !== null ? li.qty : "—"}{li.uom ? ` ${li.uom}` : ""}
                        </td>
                        <td className="py-2.5 text-[10px] text-gray-600 text-right tabular-nums whitespace-nowrap">
                          {li.unit_price !== null ? fmt(li.unit_price) : "—"}
                        </td>
                        <td className="py-2.5 text-[10px] font-semibold text-gray-800 text-right tabular-nums whitespace-nowrap">
                          {fmt(li.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-52">
                    <div className="flex justify-between py-1.5 text-[10px]">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800 tabular-nums font-medium">{fmt(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax_amount != null && (
                      <div className="flex justify-between py-1.5 text-[10px]">
                        <span className="text-gray-500">{invoice.tax_type ?? "Tax"}</span>
                        <span className="text-gray-800 tabular-nums font-medium">{fmt(invoice.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-[13px] font-bold mt-1"
                      style={{ borderTop: "2px solid #111" }}>
                      <span className="text-gray-900">Total ({invoice.currency})</span>
                      <span className="text-gray-900 tabular-nums">{fmt(invoice.total_myr)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Payment type banner ─────────────────────────────────────────────

function PaymentTypeBanner({ invoice }: { invoice: InvoiceDetail }) {
  const pt = invoice.payment_type
  if (!pt || pt === "standard") return null

  const contract = invoice.quotation_ref ? getMockContractByRef(invoice.quotation_ref) : null
  const totalMilestones = contract?.milestones.length ?? 2

  if (pt === "final") {
    const m1 = contract?.milestones.find(m => m.sequence === 1)
    const priorRaw = m1 ? getMockInvoiceDetail(m1.invoice_id) : null
    const priorNum = priorRaw?.invoice_number ?? null
    const pv0 = priorRaw?.payment_vouchers?.[0]
    const shortRef = invoice.quotation_ref
      ? invoice.quotation_ref.split("-").slice(0, 3).join("-") + "…"
      : null

    return (
      <div className="rounded-lg p-3.5" style={{ background: "#EEEDFE", border: "0.5px solid #AFA9EC" }}>
        <div className="flex items-start gap-2.5">
          <Link2 size={14} style={{ color: "#534AB7", marginTop: 1, flexShrink: 0 }} strokeWidth={2}/>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold mb-1" style={{ color: "#3C3489" }}>
              Final payment — milestone series
            </div>
            <div className="text-[11px] leading-relaxed mb-1" style={{ color: "#534AB7" }}>
              Milestone {invoice.milestone_sequence ?? "—"} of {totalMilestones} · {invoice.milestone_description ?? "—"} · RM {fmt(invoice.total_myr)}
            </div>
            {priorNum && (
              <div className="text-[11px] mb-1" style={{ color: "#534AB7" }}>
                Prior payment: {priorNum} · RM {fmt(m1?.amount ?? 0)} · Paid {pv0 ? fmtDate(pv0.payment_date) : "—"}
                <span className="ml-1.5 underline cursor-pointer" style={{ color: "#3C3489" }}>View →</span>
              </div>
            )}
            {contract && shortRef && (
              <div className="text-[10px]" style={{ color: "#7B75C1" }}>
                Total contract value: RM {fmt(contract.total_value)} · Contract: {shortRef}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // progress
  if (pt === "progress") {
    return (
      <div className="rounded-lg p-3.5" style={{ background: T.blueLight, border: `0.5px solid ${T.blueBorder}` }}>
        <div className="flex items-start gap-2.5">
          <ListChecks size={14} style={{ color: T.blue, marginTop: 1, flexShrink: 0 }} strokeWidth={2}/>
          <div>
            <div className="text-[12px] font-semibold mb-1" style={{ color: T.blueText }}>
              Progress payment — milestone {invoice.milestone_sequence ?? 1} of {totalMilestones}
            </div>
            <div className="text-[11px]" style={{ color: T.blue }}>
              {invoice.milestone_description ?? "—"} · RM {fmt(invoice.total_myr)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // advance
  return (
    <div className="rounded-lg p-3.5" style={{ background: T.blueLight, border: `0.5px solid ${T.blueBorder}` }}>
      <div className="flex items-start gap-2.5">
        <Info size={14} style={{ color: T.blue, marginTop: 1, flexShrink: 0 }} strokeWidth={2}/>
        <div>
          <div className="text-[12px] font-semibold mb-1" style={{ color: T.blueText }}>
            Advance / Deposit Payment
          </div>
          <div className="text-[11px] whitespace-pre-line" style={{ color: T.blue }}>
            {"Posted to Balance Sheet GL 1300 — not P&L.\nConfirm recovery schedule with vendor."}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Compliance trail ────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  document_completeness: "Document Completeness",
  vendor_integrity:      "Vendor Integrity",
  financial_accuracy:    "Financial Accuracy",
  tax_compliance:        "Tax Compliance",
  project_costing:       "Project & Costing",
}
const CATEGORY_ORDER = [
  "document_completeness", "vendor_integrity",
  "financial_accuracy", "tax_compliance", "project_costing",
]

function ComplianceSection({ invoiceId }: { invoiceId: string }) {
  const checks = getMockCompliance(invoiceId)
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  if (checks.length === 0) return null

  const grouped: Record<string, ComplianceCheck[]> = {}
  CATEGORY_ORDER.forEach(cat => {
    const items = checks.filter(c => c.category === cat)
    if (items.length > 0) grouped[cat] = items
  })

  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  return (
    <section>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>
        Compliance Checks
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 4px 0 rgba(0,0,0,0.07)" }}>
        {Object.entries(grouped).map(([cat, catChecks], catIdx) => (
          <div key={cat}>
            <div className="px-4 py-2" style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
            {catChecks.map((check, idx) => {
              const isLast = idx === catChecks.length - 1 && catIdx === Object.keys(grouped).length - 1
              const key = `${cat}-${idx}`
              const isOpen = expanded.has(key)
              const hasDetail = !!(check.description || check.skill_citation)

              return (
                <div key={key}
                  className={hasDetail ? "cursor-pointer" : ""}
                  style={{ borderBottom: isLast ? undefined : "1px solid #F3F4F6" }}
                  onClick={() => hasDetail && toggle(key)}>
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {check.result === "pass"           && <Check size={13} strokeWidth={2.5} style={{ color: T.teal, flexShrink: 0 }}/>}
                      {check.result === "warning"        && <AlertTriangle size={13} strokeWidth={2} style={{ color: T.amber, flexShrink: 0 }}/>}
                      {check.result === "fail"           && <X size={13} strokeWidth={2.5} style={{ color: T.red, flexShrink: 0 }}/>}
                      {check.result === "not_applicable" && <Minus size={13} strokeWidth={2} style={{ color: "#888780", flexShrink: 0 }}/>}
                      <span className="text-[12px] text-gray-700">{check.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {check.result === "warning" && (
                        <Badge variant="urgency-7d" className="h-5 text-[10px]">Warning</Badge>
                      )}
                      {check.result === "fail" && (
                        <Badge variant="status-rejected" className="h-5 text-[10px]">Failed</Badge>
                      )}
                      {check.result === "not_applicable" && (
                        <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">N/A</Badge>
                      )}
                      {hasDetail && (
                        isOpen
                          ? <ChevronUp size={12} style={{ color: "#9CA3AF" }}/>
                          : <ChevronDown size={12} style={{ color: "#9CA3AF" }}/>
                      )}
                    </div>
                  </div>
                  {isOpen && hasDetail && (
                    <div className="px-4 pb-3 pl-11">
                      {check.description && (
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-1">{check.description}</p>
                      )}
                      {check.skill_citation && (
                        <code className="text-[10px] font-mono block" style={{ color: "#9CA3AF" }}>{check.skill_citation}</code>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Section: Contract & milestones ──────────────────────────────────────────

const M_STATUS: Record<string, { dot: string; label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  paid:     { dot: T.teal,    label: "Paid",     variant: "status-paid"     },
  invoiced: { dot: T.purple,  label: "Invoiced", variant: "status-approved" },
  pending:  { dot: "#D1D5DB", label: "Pending",  variant: "urgency-future"  },
}

function ContractMilestonesSection({ invoice }: { invoice: InvoiceDetail }) {
  const contract = invoice.quotation_ref ? getMockContractByRef(invoice.quotation_ref) : null
  if (!contract) return null

  return (
    <section>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>
        Contract & Milestones
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
        {/* Contract header */}
        <div className="px-4 py-3" style={{ borderBottom: "0.5px solid #F3F4F6" }}>
          <code className="text-[9px] font-mono block mb-1.5 truncate" style={{ color: T.purple }}>
            {contract.contract_ref}
          </code>
          <div className="flex items-center justify-between text-[12px] mb-0.5">
            <span className="text-gray-500">Total contract value</span>
            <span className="font-semibold font-mono text-gray-900">RM {fmt(contract.total_value)}</span>
          </div>
          <div className="text-[10px]" style={{ color: T.dimText }}>
            Signed by {contract.our_signed_by} · {fmtDate(contract.our_signed_at)}
          </div>
        </div>

        {/* Milestones */}
        {contract.milestones.map((m, idx) => {
          const sc = M_STATUS[m.status] ?? M_STATUS.pending
          const isThis = m.invoice_id === invoice.id
          const mInv = getMockInvoiceDetail(m.invoice_id)
          const pv0 = mInv?.payment_vouchers?.[0]
          const isLast = idx === contract.milestones.length - 1

          return (
            <div key={m.id} className="flex gap-3 px-4 py-3"
              style={{
                borderBottom: isLast ? undefined : "0.5px solid #F3F4F6",
                background: isThis ? "rgba(93,94,244,0.03)" : undefined,
              }}>
              <div className="flex flex-col items-center pt-1">
                <div className="size-2.5 rounded-full shrink-0" style={{ background: sc.dot }}/>
                {!isLast && <div className="w-px flex-1 min-h-[18px] mt-1" style={{ background: "#E5E7EB" }}/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className="text-[12px] font-medium text-gray-700 flex-1 leading-snug">{m.description}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[12px] font-mono font-semibold text-gray-800">RM {fmt(m.amount)}</span>
                    <Badge variant={sc.variant} className="h-5 text-[10px]">{sc.label}</Badge>
                  </div>
                </div>
                <div className="text-[9.5px]" style={{ color: "#9CA3AF" }}>
                  {mInv
                    ? <>Invoice: {mInv.invoice_number}{isThis ? " (this invoice)" : ""}{pv0 ? ` · ${pv0.pv_number} · ${fmtDate(pv0.payment_date)}` : " · Pending payment"}</>
                    : "—"
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Section: Payment vouchers ────────────────────────────────────────────────

function PaymentVouchersSection({ invoice }: { invoice: InvoiceDetail }) {
  const pvs = invoice.payment_vouchers ?? []
  const amountPaid = invoice.amount_paid ?? 0
  const amountOut  = invoice.amount_outstanding ?? invoice.total_myr
  const isFullPaid = amountOut === 0

  return (
    <section>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>
        Payment Vouchers
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
        {/* Balance summary */}
        <div className="px-4 py-3" style={{ borderBottom: pvs.length > 0 ? "0.5px solid #F3F4F6" : undefined }}>
          {([
            { label: "Invoice total", value: invoice.total_myr, bold: false, color: "#374151" },
            { label: "Amount paid",   value: amountPaid,        bold: false, color: amountPaid > 0 ? T.teal : "#374151" },
            { label: "Outstanding",   value: amountOut,         bold: true,  color: amountOut > 0 ? T.amber : T.teal },
          ] as const).map((row, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-[12px]">
              <span className="text-gray-500">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums" style={{ color: row.color, fontWeight: row.bold ? 700 : 400 }}>
                  RM {fmt(row.value)}
                </span>
                {i === 2 && isFullPaid && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold" style={{ color: T.teal }}>
                    <CheckCircle2 size={9} strokeWidth={2}/> Fully paid
                  </span>
                )}
              </div>
            </div>
          ))}
          {!isFullPaid && (
            <div className="flex justify-end mt-2">
              <Button size="sm" className="h-6 px-2.5 text-[10px] bg-success text-white hover:bg-success/90 gap-1">
                <CreditCard size={10} strokeWidth={2}/> Create PV
              </Button>
            </div>
          )}
        </div>

        {/* PV rows */}
        {pvs.map((pv, idx) => (
          <div key={pv.pv_number} className="px-4 py-3"
            style={{ borderBottom: idx < pvs.length - 1 ? "0.5px solid #F3F4F6" : undefined }}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold font-mono text-gray-800">{pv.pv_number}</span>
                <span className="text-[10px]" style={{ color: T.dimText }}>{fmtDate(pv.payment_date)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono font-semibold text-gray-800">RM {fmt(pv.amount)}</span>
                <span className="text-[10px] text-gray-500">
                  {pv.payment_method === "bank_transfer" ? "Bank Transfer" : pv.payment_method}
                </span>
                <Badge variant="status-paid" className="h-4 text-[9px]">
                  {pv.status === "paid" ? "Paid" : pv.status}
                </Badge>
              </div>
            </div>
            {(pv.bank_name || pv.payment_ref) && (
              <div className="text-[9.5px]" style={{ color: "#9CA3AF" }}>
                {[pv.bank_name, pv.payment_ref].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        ))}

        {pvs.length === 0 && (
          <div className="px-4 py-3 text-[11px]" style={{ color: T.dimText }}>No payment vouchers yet.</div>
        )}
      </div>
    </section>
  )
}

// ─── Section: AI Analysis (structured findings) ───────────────────────────────

const FINDING_DOT: Record<FindingLevel, string> = {
  blue:  T.blue,
  amber: T.amber,
  green: T.teal,
}

function AIAnalysisSection({ invoice }: { invoice: InvoiceDetail }) {
  const findings = MOCK_AI_FINDINGS[invoice.id]

  if (findings) {
    return (
      <section>
        <div className="rounded-xl p-4" style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-5 rounded-md flex items-center justify-center shrink-0"
              style={{ background: T.purpleLight }}>
              <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
            </div>
            <div className="text-[11px] font-semibold" style={{ color: T.purpleText }}>AI Analysis</div>
          </div>
          <div className="space-y-3">
            {findings.map((f, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: FINDING_DOT[f.level] }}/>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-gray-800 mb-0.5">{f.title}</div>
                  <div className="text-[12px] text-gray-600 leading-relaxed">{f.description}</div>
                  {f.citation && (
                    <code className="text-[10px] font-mono mt-0.5 block" style={{ color: "#9CA3AF" }}>{f.citation}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Generic fallback
  return (
    <section>
      <div className="rounded-xl p-4" style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
        <div className="flex items-start gap-2.5">
          <div className="size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold mb-1.5" style={{ color: T.purpleText }}>AI Analysis</div>
            <p className="text-[11px] text-gray-600 leading-relaxed">{invoice.ai_insight}</p>
            <code className="text-[9px] font-mono mt-2 block" style={{ color: "#9CA3AF" }}>{invoice.ai_source}</code>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Fields tab ───────────────────────────────────────────────────────────────

function splitDescription(description: string): { title: string; details: string | null } {
  const trimmed = description.trim()
  const newlineIdx = trimmed.indexOf("\n")
  const dashIdx = trimmed.search(/ [-–—] /)
  let splitAt = -1
  if (newlineIdx !== -1) splitAt = newlineIdx
  if (dashIdx !== -1 && (splitAt === -1 || dashIdx < splitAt)) splitAt = dashIdx
  if (splitAt === -1 || splitAt > 80) {
    return { title: trimmed.slice(0, 80), details: trimmed.length > 80 ? trimmed.slice(80).trim() : null }
  }
  const title = trimmed.slice(0, splitAt).trim()
  const details = trimmed.slice(splitAt).replace(/^[\s\-–—]+/, "").trim()
  return { title, details: details || null }
}

function EditableGL({ code, desc, confidence, onSave }: {
  code: string | null; desc: string | null; confidence: number
  onSave: (code: string, desc: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [draftCode, setDraftCode] = React.useState(code ?? "")
  const [draftDesc, setDraftDesc] = React.useState(desc ?? "")

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input value={draftCode} onChange={e => setDraftCode(e.target.value)}
          className="w-14 h-6 text-[11px] px-1.5 font-mono bg-white text-gray-700"/>
        <Input value={draftDesc} onChange={e => setDraftDesc(e.target.value)}
          className="flex-1 h-6 text-[11px] px-1.5 bg-white text-gray-700"/>
        <Button size="sm" className="h-6 px-2 text-[10px]"
          onClick={() => { onSave(draftCode, draftDesc); setEditing(false) }}>Save</Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
          onClick={() => setEditing(false)}>✕</Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      {code
        ? <span className="text-[11px] font-mono font-semibold text-gray-800">{code}</span>
        : <span className="text-[11px] text-gray-400">Unassigned</span>}
      {desc && <span className="text-[11px] text-gray-500">— {desc}</span>}
      {confidence < 0.80 && <ConfidenceBadge score={confidence}/>}
      <button onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Edit3 size={10} style={{ color: T.purple }} strokeWidth={2}/>
      </button>
    </div>
  )
}

export function FieldsTab({ invoice }: { invoice: InvoiceDetail }) {
  const [lineItems, setLineItems] = React.useState(invoice.line_items)
  const cs = invoice.confidence_scores

  // Project data (mock mode only)
  const project = (isMockMode() && invoice.project_id)
    ? getMockProject(invoice.project_id)
    : null
  const budgetPct = project ? Math.round((project.committed_amount / project.budget_amount) * 100) : null
  const budgetRemaining = project ? project.budget_amount - project.committed_amount : null

  const updateGL = (idx: number, code: string, desc: string) => {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, gl_code: code, gl_desc: desc } : li))
    if (!isMockMode()) {
      updateLineItemGL(invoice.id, idx + 1, code, desc).catch(() => {})
    }
  }

  // Item master enrichment: show for line items where gl_confidence < 0.85 (not yet confirmed)
  const enrichItems = lineItems
    .filter(li => (li.gl_confidence ?? li.confidence) < 0.85)
    .slice(0, 2)

  // Vendor enrichment: show when TIN or reg missing
  const showVendorEnrichment = !invoice.vendor_tin || !invoice.vendor_reg_no

  return (
    <div className="space-y-6 pb-6">

      {/* Section 1: Payment type banner */}
      {invoice.payment_type && invoice.payment_type !== "standard" && (
        <PaymentTypeBanner invoice={invoice}/>
      )}

      {/* Section 2: Compliance trail */}
      <ComplianceSection invoiceId={invoice.id}/>

      {/* Section 3: Contract & milestones */}
      {invoice.quotation_ref && <ContractMilestonesSection invoice={invoice}/>}

      {/* Section 4: Payment vouchers */}
      <PaymentVouchersSection invoice={invoice}/>

      {/* Vendor */}
      <section>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>Vendor</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {[
            { label: "Name",    value: invoice.vendor_name_raw, conf: cs.vendor_name },
            { label: "TIN",     value: invoice.vendor_tin,      conf: cs.vendor_tin  },
            { label: "Reg No",  value: invoice.vendor_reg_no,   conf: null           },
            { label: "Country", value: invoice.vendor_country === "MY" ? "Malaysia" : invoice.vendor_country, conf: null },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-3 text-[12px]"
              style={{ borderBottom: i < 3 ? "1px solid #F3F4F6" : undefined }}>
              <span className="w-24 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium flex items-center">
                {f.value ?? <span className="text-gray-300">—</span>}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
          {/* Section 6: Vendor enrichment prompt */}
          {showVendorEnrichment && (
            <div className="mx-4 my-2 px-3 py-2.5 rounded-lg flex items-start justify-between gap-2"
              style={{ background: "#F0FDF4", border: "0.5px solid #86EFAC" }}>
              <div className="text-[11px] leading-relaxed" style={{ color: "#166534" }}>
                <span className="font-semibold">+ Update vendor record</span> — MyInvois registration missing
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-[#166534] font-semibold underline">Update</Button>
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-gray-400">Skip</Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bill To */}
      <section>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>Bill To</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {[
            { label: "Name",    value: invoice.bill_to_name    },
            { label: "TIN",     value: invoice.bill_to_tin     },
            { label: "Address", value: invoice.bill_to_address },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-3 text-[12px]"
              style={{ borderBottom: i < 2 ? "1px solid #F3F4F6" : undefined }}>
              <span className="w-24 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium leading-relaxed">
                {f.value ?? <span className="text-gray-300">—</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Invoice fields */}
      <section>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>Invoice</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {[
            { label: "Number",   value: invoice.invoice_number,  conf: cs.invoice_number },
            { label: "Date",     value: fmtDate(invoice.invoice_date), conf: cs.invoice_date },
            { label: "Due Date", value: fmtDate(invoice.due_date), conf: cs.due_date    },
            { label: "Terms",    value: invoice.payment_terms,   conf: null             },
            { label: "PO Ref",   value: invoice.po_reference,    conf: null             },
            { label: "Source",   value: invoice.source === "email_gmail" ? "Gmail" : invoice.source === "email" ? "Email" : "Manual Upload", conf: null },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-3 text-[12px]"
              style={{ borderBottom: i < 5 ? "1px solid #F3F4F6" : undefined }}>
              <span className="w-24 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium flex items-center">
                {f.value ?? <span className="text-gray-300">—</span>}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Amounts */}
      <section>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>Amounts</div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {[
            { label: "Subtotal", value: `${invoice.currency} ${fmt(invoice.subtotal)}`, conf: null, bold: false },
            { label: invoice.tax_type ?? "Tax", value: invoice.tax_amount != null ? `${invoice.currency} ${fmt(invoice.tax_amount)}` : "—", conf: null, bold: false },
            { label: "Total",    value: `${invoice.currency} ${fmt(invoice.total_myr)}`, conf: cs.total, bold: true },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-3 text-[12px]"
              style={{ borderBottom: i < 2 ? "1px solid #F3F4F6" : undefined }}>
              <span className="w-24 shrink-0 font-medium" style={{ color: f.bold ? "#111" : "#9CA3AF" }}>{f.label}</span>
              <span className="flex items-center tabular-nums font-mono"
                style={{ color: f.bold ? "#111" : "#374151", fontWeight: f.bold ? 700 : 400 }}>
                {f.value}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* GL Coding */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.dimText }}>GL Coding</div>
          <Badge variant="status-approved" className="h-4 text-[9px]">Hover to edit</Badge>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {lineItems.map((li, i) => {
            const { title, details } = splitDescription(li.description)
            return (
              <div key={i} className="px-4 py-3"
                style={{ borderBottom: i < lineItems.length - 1 ? "0.5px solid #F3F4F6" : undefined }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[12px] font-semibold text-gray-800 leading-tight flex-1">{title}</div>
                  <div className="text-[12px] font-mono font-semibold text-gray-800 shrink-0 tabular-nums">
                    {li.amount != null ? fmt(li.amount) : "—"}
                  </div>
                </div>
                {details && (
                  <div className="text-[9.5px] text-gray-400 mb-1.5 leading-relaxed line-clamp-2">{details}</div>
                )}
                <EditableGL code={li.gl_code} desc={li.gl_desc} confidence={li.confidence}
                  onSave={(code, desc) => updateGL(i, code, desc)}/>
              </div>
            )
          })}
        </div>

        {/* Section 7: Item master enrichment */}
        {enrichItems.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {enrichItems.map((li, idx) => {
              const { title } = splitDescription(li.description)
              return (
                <div key={idx} className="px-3 py-2.5 rounded-lg flex items-start justify-between gap-2"
                  style={{ background: T.purpleLight, border: `0.5px solid rgba(93,94,244,0.2)` }}>
                  <div className="text-[11px] leading-relaxed" style={{ color: T.purpleText }}>
                    <span className="font-semibold">+ Add to item master:</span>{" "}
                    {title.length > 40 ? title.slice(0, 40) + "…" : title}
                    <br/>
                    <span className="text-[9.5px]" style={{ color: "#7B75C1" }}>
                      GL {li.gl_code ?? "—"} · {invoice.vendor_name_raw} · RM {fmt(li.amount)}/{li.uom ?? "lot"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-primary font-semibold">Add</Button>
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground">Skip</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Section 5: Project & cost centre (enhanced) */}
      <section>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: T.dimText }}>
          Project & Cost Centre
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
          {project ? (
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="text-[11px] font-semibold text-gray-800">
                    {project.name}
                    {invoice.work_order_ref && (
                      <span className="ml-1.5 text-[10px] font-mono font-normal" style={{ color: T.dimText }}>
                        ({invoice.work_order_ref})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dimText }}>
                    {project.project_code}
                  </div>
                </div>
              </div>
              {budgetPct !== null && budgetRemaining !== null && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-500">Budget remaining</span>
                    <span className="font-mono font-semibold" style={{ color: budgetPct >= 80 ? T.amber : T.teal }}>
                      RM {fmt(budgetRemaining, 0)} of RM {fmt(project.budget_amount, 0)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(budgetPct, 100)}%`,
                        background: budgetPct >= 80 ? T.amber : T.teal,
                      }}/>
                  </div>
                  <div className="text-[9px] mt-0.5 text-right" style={{ color: budgetPct >= 80 ? T.amberText : T.dimText }}>
                    {budgetPct}% committed
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {[
                { label: "Project", value: invoice.project_code },
                { label: "CC",      value: invoice.cost_centre  },
              ].map((f, i) => (
                <div key={i} className="flex items-center px-4 py-2.5 text-[11px]"
                  style={{ borderBottom: i < 1 ? "0.5px solid #F3F4F6" : undefined }}>
                  <span className="w-20 text-gray-400 shrink-0 font-medium">{f.label}</span>
                  <span className="text-gray-800 font-semibold font-mono">
                    {f.value ?? <span className="font-normal text-gray-300">—</span>}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Section 8: AI Analysis */}
      <AIAnalysisSection invoice={invoice}/>
    </div>
  )
}

// ─── Email Thread tab (with intelligent filtering) ────────────────────────────

const TIER_BADGE: Record<EmailTier, { label: string; bg: string; color: string } | null> = {
  1: null,
  2: { label: "Context", bg: "#EFF6FF", color: "#1D4ED8" },
  3: { label: "Operational", bg: "#F3F4F6", color: "#6B7280" },
}

export function EmailThreadTab({ invoice }: { invoice: InvoiceDetail }) {
  const [showAll, setShowAll] = React.useState(false)
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState("")
  // Finance (tier 1) expanded by default; Context (tier 2) and Operational (tier 3) collapsed
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(["e-012", "e-006"]))

  const thread = MOCK_EMAIL_THREADS[invoice.id]

  const toggleExpand = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  if (!thread) {
    // Generic single-email fallback for invoices without a thread
    const genericEmails = invoice.email_from ? [{
      id: "generic",
      from_name: invoice.email_from.split("@")[0],
      from_email: invoice.email_from,
      to_label: "Finance",
      date: fmtDate(invoice.created_at),
      subject: invoice.email_subject ?? `Invoice ${invoice.invoice_number}`,
      body: invoice.email_body_html
        ? invoice.email_body_html.replace(/<[^>]+>/g, "").trim()
        : "Invoice received via email.",
      tier: 1 as EmailTier,
      tier_reason: "Invoice email",
      attachments: [`${invoice.invoice_number}.pdf`],
    }] : []

    return (
      <div className="space-y-3 pb-4">
        {genericEmails.map(email => (
          <div key={email.id} className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
            <div className="px-4 py-3" style={{ background: "#FAFAFA" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: T.purpleLight }}>
                    <span className="text-[10px] font-bold" style={{ color: T.purple }}>
                      {email.from_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-800">{email.from_email}</div>
                    <div className="text-[9px] text-gray-400">to {email.to_label}</div>
                  </div>
                </div>
                <span className="text-[9px] text-gray-400 shrink-0">{email.date}</span>
              </div>
              <div className="text-[11px] font-medium text-gray-700 mt-1">{email.subject}</div>
              {email.attachments && email.attachments.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Paperclip size={10} style={{ color: T.dimText }} strokeWidth={2}/>
                  {email.attachments.map(a => (
                    <span key={a} className="text-[10px] font-medium" style={{ color: T.purple }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              <pre className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full h-9 text-[11px] text-primary border-border"
          onClick={() => setReplyOpen(r => !r)}>
          <Mail size={12} strokeWidth={2} data-icon="inline-start"/> Reply to vendor
        </Button>
      </div>
    )
  }

  const financeRelevant = thread.filter(e => e.tier === 1 || e.tier === 2)
  const displayed = showAll ? thread : financeRelevant

  return (
    <div className="space-y-3 pb-4">
      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
          style={{
            background: !showAll ? T.purpleLight : "transparent",
            color: !showAll ? T.purpleText : T.dimText,
            border: `0.5px solid ${!showAll ? "#AFA9EC" : "#E5E7EB"}`,
          }}>
          Finance-relevant {financeRelevant.length}
        </button>
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
          style={{
            background: showAll ? "#F3F4F6" : "transparent",
            color: showAll ? "#374151" : T.dimText,
            border: `0.5px solid ${showAll ? "#D1D5DB" : "#E5E7EB"}`,
          }}>
          All emails {thread.length}
          <ChevronDown size={10} strokeWidth={2}/>
        </button>
      </div>

      {/* Email cards */}
      {displayed.map(email => {
        const badge = TIER_BADGE[email.tier]
        // Tier 1 (Finance): always expanded, not collapsible
        // Tier 2 (Context) & Tier 3 (Operational): collapsible, collapsed by default
        const isTier1 = email.tier === 1
        const isTier2 = email.tier === 2
        const isTier3 = email.tier === 3
        const isCollapsible = isTier2 || isTier3
        const isExpanded = isTier1 || expandedIds.has(email.id)

        return (
          <div key={email.id} className="rounded-xl overflow-hidden"
            style={{ border: "0.5px solid #E5E7EB", opacity: isTier3 ? 0.8 : 1 }}>
            {/* Email header — always visible */}
            <div
              className={isCollapsible ? "cursor-pointer" : ""}
              onClick={() => isCollapsible && toggleExpand(email.id)}
              style={{ borderBottom: isExpanded ? "0.5px solid #F3F4F6" : undefined, background: "#FAFAFA" }}>
              <div className="flex items-start justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: email.tier === 1 ? T.purpleLight : "#F3F4F6" }}>
                    <span className="text-[10px] font-bold"
                      style={{ color: email.tier === 1 ? T.purple : "#6B7280" }}>
                      {email.from_name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800">{email.from_name}</div>
                    <div className="text-[9px] text-gray-400">to {email.to_label} · {email.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {badge && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  )}
                  {email.tier === 1 && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: T.purpleLight, color: T.purpleText }}>Finance</span>
                  )}
                  {isCollapsible && (
                    isExpanded
                      ? <ChevronUp size={10} style={{ color: T.dimText }}/>
                      : <ChevronDown size={10} style={{ color: T.dimText }}/>
                  )}
                </div>
              </div>
              <div className="px-4 pb-2.5 -mt-1">
                <div className="text-[11px] font-medium text-gray-700">{email.subject}</div>
                {email.attachments && email.attachments.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Paperclip size={10} style={{ color: T.dimText }} strokeWidth={2}/>
                    {email.attachments.map(a => (
                      <span key={a} className="text-[10px] font-medium" style={{ color: T.purple }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email body — expanded */}
            {isExpanded && (
              <div className="px-4 py-3">
                <pre className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
              </div>
            )}
          </div>
        )
      })}

      {/* Reply */}
      {replyOpen ? (
        <div className="rounded-xl overflow-hidden border border-primary">
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border bg-[#FAFAFA]">
            <span className="text-[10px] font-medium text-gray-600">To:</span>
            <span className="text-[10px] text-gray-800">{invoice.email_from ?? "vendor"}</span>
          </div>
          <Textarea rows={4} placeholder="Type your reply…" value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="w-full px-4 py-3 text-[11px] text-gray-700 resize-none rounded-none border-0 focus-visible:ring-0 bg-white"/>
          <div className="px-4 py-2.5 flex items-center justify-between border-t border-border bg-[#FAFAFA]">
            <Button variant="ghost" size="sm" className="text-[11px] text-gray-500"
              onClick={() => setReplyOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-7 px-3 text-[11px] gap-1.5">
              <Send size={10} strokeWidth={2} data-icon="inline-start"/> Send Reply
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full h-9 text-[11px] text-primary border-border"
          onClick={() => setReplyOpen(true)}>
          <Mail size={12} strokeWidth={2} data-icon="inline-start"/> Reply to vendor
        </Button>
      )}
    </div>
  )
}

// ─── Comments tab ─────────────────────────────────────────────────────────────

const DEMO_COMMENTS = [
  {
    author: "Sarah Lim", avatar: "SL", role: "AP Manager",
    time: "2 Jun 2024, 10:14 AM",
    text: "Please confirm if PO-2024-0056 covers the full amount. Server setup line item looks like capital expenditure — get approval from CFO before coding to CAPEX.",
    isAI: false,
  },
  {
    author: "Jomie AI", avatar: "✦", role: "AI Assistant",
    time: "2 Jun 2024, 10:14 AM",
    text: "Line item 3 (Server Infrastructure Setup, RM 14,000) exceeds the CAPEX capitalisation threshold of RM 10,000 per company policy (ref: jomie-capex-rules.md:v1.2). Recommend reclassifying GL from 5210 to 1410 and obtaining CFO approval.",
    isAI: true,
  },
]

export const DEMO_COMMENTS_COUNT = DEMO_COMMENTS.length

export function CommentsTab() {
  const [comment, setComment] = React.useState("")

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 pb-4">
        {DEMO_COMMENTS.map((c, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="size-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white mt-0.5"
              style={{ background: c.isAI ? T.purple : "#475569" }}>
              {c.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[11px] font-semibold text-gray-800">{c.author}</span>
                <span className="text-[9px]" style={{ color: T.dimText }}>{c.role}</span>
                <span className="text-[9px] text-gray-400 ml-auto">{c.time}</span>
              </div>
              <div className={cn("rounded-xl px-3 py-2.5 text-[11px] leading-relaxed",
                c.isAI ? "text-purple-800" : "text-gray-700")}
                style={{
                  background: c.isAI ? "rgba(93,94,244,0.06)" : "#F9FAFB",
                  border: c.isAI ? "0.5px solid rgba(93,94,244,0.15)" : "0.5px solid #E5E7EB",
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
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 mt-3" style={{ borderTop: "0.5px solid #E5E7EB", paddingTop: 12 }}>
        <div className="flex gap-2">
          <div className="size-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
            style={{ background: "#475569" }}>T</div>
          <div className="flex-1 relative">
            <Textarea rows={2} placeholder="Add a comment…" value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full text-[11px] text-gray-700 px-3 py-2 rounded-xl resize-none bg-white pr-9"/>
            <Button size="icon" variant={comment ? "default" : "ghost"}
              className="absolute bottom-2 right-2 size-6 rounded-lg">
              <Send size={10} strokeWidth={2}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Map API response → InvoiceDetail ────────────────────────────────────────

export function mapApiResponse(raw: InvoiceDetailResponse): InvoiceDetail {
  return {
    id: raw.id,
    vendor_name_raw: raw.vendor_name_raw ?? "Unknown Vendor",
    vendor_tin: raw.vendor_tin ?? null,
    vendor_reg_no: raw.vendor_reg_no ?? null,
    vendor_address: raw.vendor_address ?? null,
    vendor_country: raw.vendor_country ?? "MY",
    invoice_number: raw.invoice_number ?? "—",
    invoice_date: raw.invoice_date ?? null,
    due_date: raw.due_date ?? null,
    payment_terms: raw.payment_terms ?? null,
    currency: raw.currency ?? "MYR",
    subtotal: raw.subtotal_myr ?? 0,
    tax_amount: raw.tax_amount_myr ?? null,
    tax_type: raw.tax_type ?? null,
    total_myr: raw.total_myr ?? 0,
    urgency_bucket: raw.urgency_bucket ?? "future",
    status: raw.status,
    origin: raw.origin ?? "unknown",
    is_einvoice_verified: raw.is_einvoice_verified,
    discount_available: raw.discount_available,
    discount_savings_myr: raw.discount_savings_myr ?? null,
    duplicate_risk: raw.duplicate_risk,
    source: raw.source,
    project_code: raw.project_reference ?? null,
    project_id: raw.project_id ?? null,
    cost_centre: null,
    po_reference: raw.po_reference ?? null,
    bill_to_name: raw.bill_to_name ?? "—",
    bill_to_address: raw.bill_to_address ?? null,
    bill_to_tin: raw.bill_to_tin ?? null,
    confidence_scores: raw.confidence_flags ?? {},
    line_items: (raw.line_items ?? []).map(l => ({
      description: l.description,
      qty: l.qty ?? null,
      uom: l.uom ?? null,
      unit_price: l.unit_price ?? null,
      amount: l.amount,
      gl_code: l.gl_code ?? null,
      gl_desc: l.gl_desc ?? null,
      confidence: l.gl_confidence ?? 1,
      gl_confidence: l.gl_confidence ?? null,
      sst_claimable: l.sst_claimable ?? null,
    })),
    ai_insight: raw.email_body_html
      ? "Invoice received via email. Review extracted fields below."
      : "Invoice processed. Review extracted fields and GL codes below.",
    ai_source: "jomie-ocr-engine:v1",
    created_at: raw.created_at,
    // Extended fields
    payment_type: raw.payment_type ?? null,
    work_order_ref: raw.work_order_ref ?? null,
    milestone_sequence: raw.milestone_sequence ?? null,
    milestone_description: raw.milestone_description ?? null,
    milestone_percentage: raw.milestone_percentage ?? null,
    amount_paid: raw.amount_paid ?? null,
    amount_outstanding: raw.amount_outstanding ?? null,
    po_substitute_type: raw.po_substitute_type ?? null,
    do_number: raw.do_number ?? null,
    do_received: raw.do_received ?? null,
    do_signed_returned: raw.do_signed_returned ?? null,
    payment_vouchers: raw.payment_vouchers ?? [],
    payment_series_id: raw.payment_series_id ?? null,
    payment_series_sequence: raw.payment_series_sequence ?? null,
    total_contract_value: raw.total_contract_value ?? null,
    quotation_ref: raw.quotation_ref ?? null,
    email_from: raw.email_from ?? null,
    email_subject: raw.email_subject ?? null,
    email_body_html: raw.email_body_html ?? null,
  }
}

// ─── Main client component ────────────────────────────────────────────────────

type Tab = "fields" | "email" | "comments"

export function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice]     = React.useState<InvoiceDetail | null>(null)
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null)
  const [loading, setLoading]     = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<Tab>("fields")

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (isMockMode()) {
      const raw = getMockInvoiceDetail(id)
      if (!cancelled) {
        setInvoice(raw ? mapApiResponse(raw) : DEMO_DETAILS[id] ?? DEFAULT_DETAIL)
        setSignedUrl(null)
        setLoading(false)
      }
      return () => { cancelled = true }
    }

    getInvoice(id)
      .then(raw => {
        if (!cancelled) {
          setInvoice(mapApiResponse(raw))
          setSignedUrl(raw.storage_path ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvoice(DEMO_DETAILS[id] ?? DEFAULT_DETAIL)
          setSignedUrl(null)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 20px)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: "rgba(93,94,244,0.15)" }}>
            <Sparkles size={16} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Loading invoice…</span>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 20px)" }}>
        <div className="text-center">
          <div className="text-[13px] font-medium mb-1 text-destructive">Invoice not found</div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground underline"
            onClick={() => router.push("/ap/invoices")}>
            Back to inbox
          </Button>
        </div>
      </div>
    )
  }

  const urgency = URGENCY_CONFIG[invoice.urgency_bucket]
  const status  = STATUS_CONFIG[invoice.status]

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "fields",   label: "Fields",       icon: <FileText size={12} strokeWidth={2}/> },
    { key: "email",    label: "Email Thread",  icon: <Mail size={12} strokeWidth={2}/> },
    { key: "comments", label: "Comments",      icon: <MessageSquare size={12} strokeWidth={2}/> },
  ]

  return (
    <div className="flex flex-col min-h-0" style={{ height: "calc(100vh - 20px)" }}>

      {/* Header */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1 text-[11px] text-white/45 hover:text-white/70 h-7 px-2"
            onClick={() => router.back()}>
            <ArrowLeft size={13} strokeWidth={2} data-icon="inline-start"/> Back
          </Button>
          <div className="w-px h-4" style={{ background: "rgba(103,100,136,0.5)" }}/>
          <nav className="flex items-center gap-1">
            <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.45)" }}>AP</span>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-[12px] font-light text-white/45 hover:text-white"
              onClick={() => router.push("/ap/invoices")}>Invoice Inbox</Button>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <span className="text-[12px] font-medium text-white font-mono">{invoice.invoice_number}</span>
          </nav>
        </div>

        {invoice.status === "pending_review" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              className="h-8 px-3.5 text-[12px] text-destructive border-destructive/40 bg-destructive/10 hover:bg-destructive/20 gap-1.5">
              <ThumbsDown size={12} strokeWidth={2} data-icon="inline-start"/> Reject
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3.5 text-[12px] gap-1.5">
              <MessageSquare size={12} strokeWidth={2} data-icon="inline-start"/> Query
            </Button>
            <Button size="sm"
              className="h-8 px-3.5 text-[12px] gap-1.5 bg-success text-white hover:bg-success/90"
              onClick={() => router.push(`/ap/invoices/${id}/approval`)}>
              <ThumbsUp size={12} strokeWidth={2} data-icon="inline-start"/> Approve
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* PDF viewer */}
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden"
          style={{ border: "0.5px solid rgba(103,100,136,0.3)" }}>
          <PDFViewer invoice={invoice} signedUrl={signedUrl}/>
        </div>

        {/* Right panel */}
        <div className="flex flex-col shrink-0 rounded-xl overflow-hidden"
          style={{ width: 380, background: "#F7F7FE" }}>

          {/* Summary strip */}
          <div className="shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: "0.5px solid #E5E7EB" }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-[14px] font-bold text-gray-900 leading-snug">{invoice.vendor_name_raw}</div>
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">{invoice.invoice_number}</div>
              </div>
              <Badge variant={STATUS_BADGE_VARIANT[invoice.status]} className="shrink-0 ml-2">
                {status.label}
              </Badge>
            </div>

            <div className="flex items-end justify-between mt-2.5">
              <div>
                <div className="text-[8px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: T.dimText }}>Total (MYR)</div>
                <div className="text-[22px] font-bold text-gray-900 tabular-nums font-mono">{fmt(invoice.total_myr)}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: T.dimText }}>Due</div>
                <div className="text-[11px] font-semibold" style={{ color: urgency.color }}>{urgency.label}</div>
                <div className="text-[10px] font-mono mt-0.5 text-gray-500">{fmtDate(invoice.due_date)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1 text-[10px]"
                style={{ color: invoice.is_einvoice_verified ? T.teal : "#9CA3AF" }}>
                <CheckCircle2 size={10} strokeWidth={2}/> e-Invoice
              </div>
              <div className="flex items-center gap-1 text-[10px]"
                style={{ color: invoice.origin === "foreign" ? T.purple : T.teal }}>
                {invoice.origin === "foreign" ? <Globe size={10}/> : <Building2 size={10}/>}
                {invoice.origin.charAt(0).toUpperCase() + invoice.origin.slice(1)}
              </div>
              {invoice.duplicate_risk !== "none" && (
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: T.amber }}>
                  <AlertTriangle size={10} strokeWidth={2}/> Duplicate risk
                </div>
              )}
              {invoice.discount_available && (
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: T.purple }}>
                  <Star size={10} strokeWidth={2}/> Discount
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 px-5 pt-3 border-b border-[#E5E7EB]">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as Tab)}>
              <TabsList variant="line" className="h-auto gap-0 bg-transparent p-0 border-0 rounded-none">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.key} value={tab.key}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg rounded-b-none border border-transparent text-gray-500 hover:text-gray-700 data-active:text-gray-900 data-active:bg-white data-active:border-[#E5E7EB] data-active:border-b-white data-active:-mb-px data-active:shadow-none after:hidden">
                    {tab.icon}
                    {tab.label}
                    {tab.key === "comments" && (
                      <Badge variant="status-approved" className="h-4 text-[9px] tabular-nums px-1">
                        {DEMO_COMMENTS_COUNT}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4"
            style={{ background: activeTab === "comments" ? "#fff" : "#F7F7FE" }}>
            {activeTab === "fields"   && <FieldsTab invoice={invoice}/>}
            {activeTab === "email"    && <EmailThreadTab invoice={invoice}/>}
            {activeTab === "comments" && <CommentsTab/>}
          </div>
        </div>
      </div>
    </div>
  )
}
