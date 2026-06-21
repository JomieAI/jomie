"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Globe, Building2, Star, Edit3, Send, Paperclip, Mail, MessageSquare,
  FileText, ZoomIn, ZoomOut, RotateCcw, Download, ThumbsUp, ThumbsDown,
} from "lucide-react"
import { getInvoice, updateLineItemGL, type InvoiceDetailResponse } from "@/lib/api"

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

interface LineItem {
  description: string
  qty: number | null
  uom: string | null
  unit_price: number | null
  amount: number
  gl_code: string | null
  gl_desc: string | null
  confidence: number
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
  status: "pending_review" | "approved" | "rejected" | "paid" | "overdue"
  origin: "local" | "foreign" | "unknown"
  is_einvoice_verified: boolean
  discount_available: boolean
  discount_savings_myr: number | null
  duplicate_risk: "none" | "possible" | "exact"
  source: string
  project_code: string | null
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
}

// ─── Demo data ────────────────────────────────────────────────────────────────

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
  },
  "inv-002": {
    id: "inv-002",
    vendor_name_raw: "SKY Renovation Sdn Bhd",
    vendor_tin: "C19981234567",
    vendor_reg_no: "199801056789-B",
    vendor_address: "No 5, Jalan Kilang Midah, Cheras, 56100 Kuala Lumpur",
    vendor_country: "MY",
    invoice_number: "SKY-2024-0234",
    invoice_date: "2024-06-01",
    due_date: "2024-06-21",
    payment_terms: "2/10 Net 20",
    currency: "MYR",
    subtotal: 35000,
    tax_amount: 3500,
    tax_type: "SST",
    total_myr: 38500,
    urgency_bucket: "due_3d",
    status: "pending_review",
    origin: "local",
    is_einvoice_verified: false,
    discount_available: true,
    discount_savings_myr: 770,
    duplicate_risk: "none",
    source: "manual_upload",
    project_code: "PROJ-2024-03",
    cost_centre: "ADMIN",
    po_reference: null,
    bill_to_name: "ABC Retails Sdn Bhd",
    bill_to_address: "Level 8, Wisma ABC, 88 Jalan Ampang, 50450 Kuala Lumpur",
    bill_to_tin: "C20050087654",
    confidence_scores: {
      vendor_name: 0.97, vendor_tin: 0.88, invoice_number: 0.99,
      invoice_date: 0.95, due_date: 0.91, total: 0.99, line_items: 0.85,
    },
    line_items: [
      { description: "Office Renovation — Partition Works", qty: 1, uom: "lot", unit_price: 22000, amount: 22000, gl_code: "1430", gl_desc: "Leasehold Improvements", confidence: 0.83 },
      { description: "Electrical Wiring & Fittings", qty: 1, uom: "lot", unit_price: 8000, amount: 8000, gl_code: "1410", gl_desc: "Capital Expenditure — Equipment", confidence: 0.79 },
      { description: "Painting & Finishing Works", qty: 1, uom: "lot", unit_price: 5000, amount: 5000, gl_code: "5310", gl_desc: "Building Maintenance", confidence: 0.89 },
    ],
    ai_insight: "Early payment discount: pay by 11 Jun to save RM 770 (2%). No MyInvois QR detected — request e-invoice from vendor before approving to comply with LHDN Phase 2 mandate. Renovation items may qualify as leasehold improvements (capital).",
    ai_source: "lhdn-einvoice-mandate.md:v3.0 → Phase2:para4 · jomie-capex-rules.md:v1.2",
    created_at: "2024-06-10T09:15:00Z",
  },
}

const DEFAULT_DETAIL = DEMO_DETAILS["inv-001"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 2) => n.toLocaleString("en-MY", { minimumFractionDigits: dec })
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"

const URGENCY_CONFIG = {
  overdue:  { label: "Overdue",  color: T.red,     bg: T.redLight,   border: T.red   },
  due_3d:   { label: "Due ≤3d",  color: T.amber,   bg: T.amberLight, border: T.amber },
  due_7d:   { label: "Due ≤7d",  color: T.amber,   bg: T.amberLight, border: T.amber },
  due_30d:  { label: "Due ≤30d", color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border },
  future:   { label: "Future",   color: T.dimText, bg: "rgba(255,255,255,0.04)", border: T.border },
}

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "#92400E",  bg: "#FEF3C7" },
  approved:       { label: "Approved",       color: T.tealText, bg: T.tealLight },
  rejected:       { label: "Rejected",       color: T.redText,  bg: T.redLight },
  paid:           { label: "Paid",           color: T.dimText,  bg: "rgba(255,255,255,0.06)" },
  overdue:        { label: "Overdue",        color: T.redText,  bg: T.redLight },
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.80) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ml-1.5"
      style={{ background: T.amberLight, color: T.amberText }}>
      <AlertTriangle size={8} strokeWidth={2}/> {Math.round(score * 100)}%
    </span>
  )
}

// ─── Mock PDF Viewer ──────────────────────────────────────────────────────────

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
          <button onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="size-6 rounded flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.06)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <ZoomOut size={11} color="rgba(255,255,255,0.5)" strokeWidth={2}/>
          </button>
          <span className="text-[10px] font-mono w-10 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            {zoom}%
          </span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="size-6 rounded flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.06)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <ZoomIn size={11} color="rgba(255,255,255,0.5)" strokeWidth={2}/>
          </button>
          <button onClick={() => setZoom(100)}
            className="size-6 rounded flex items-center justify-center cursor-pointer ml-1"
            style={{ background: "rgba(255,255,255,0.06)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <RotateCcw size={10} color="rgba(255,255,255,0.5)" strokeWidth={2}/>
          </button>
          <button className="size-6 rounded flex items-center justify-center cursor-pointer ml-1"
            style={{ background: "rgba(255,255,255,0.06)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <Download size={11} color="rgba(255,255,255,0.5)" strokeWidth={2}/>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto flex items-start justify-center p-6">
        {signedUrl ? (
          <iframe
            src={signedUrl}
            title="Invoice document"
            className="w-full h-full rounded-lg shadow-2xl"
            style={{ minHeight: 720, border: "none", background: "#fff" }}
          />
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

              {/* Bill To */}
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

// ─── Fields tab ───────────────────────────────────────────────────────────────

function splitDescription(description: string): { title: string; details: string | null } {
  const trimmed = description.trim()
  // Split on first newline, " - ", " – ", or " — "
  const newlineIdx = trimmed.indexOf("\n")
  const dashIdx = trimmed.search(/ [-–—] /)
  let splitAt = -1
  if (newlineIdx !== -1) splitAt = newlineIdx
  if (dashIdx !== -1 && (splitAt === -1 || dashIdx < splitAt)) splitAt = dashIdx
  if (splitAt === -1 || splitAt > 80) {
    // No delimiter found or title is very long — use first 80 chars or whole thing
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
        <input value={draftCode} onChange={e => setDraftCode(e.target.value)}
          className="w-14 text-[11px] px-1.5 py-0.5 rounded border focus:outline-none font-mono"
          style={{ border: `1px solid ${T.purple}`, color: "#374151", background: "#fff" }}/>
        <input value={draftDesc} onChange={e => setDraftDesc(e.target.value)}
          className="flex-1 text-[11px] px-1.5 py-0.5 rounded border focus:outline-none"
          style={{ border: `1px solid ${T.purple}`, color: "#374151", background: "#fff" }}/>
        <button onClick={() => { onSave(draftCode, draftDesc); setEditing(false) }}
          className="text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer"
          style={{ background: T.purple, color: "#fff" }}>Save</button>
        <button onClick={() => setEditing(false)}
          className="text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer border text-gray-500">✕</button>
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

function FieldsTab({ invoice }: { invoice: InvoiceDetail }) {
  const [lineItems, setLineItems] = React.useState(invoice.line_items)
  const cs = invoice.confidence_scores

  const updateGL = (idx: number, code: string, desc: string) => {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, gl_code: code, gl_desc: desc } : li))
    const seq = lineItems[idx] ? idx + 1 : idx + 1
    updateLineItemGL(invoice.id, seq, code, desc).catch(() => {/* non-fatal — UI already updated */})
  }

  return (
    <div className="space-y-5 pb-4">
      <section>
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Vendor</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          {[
            { label: "Name",    value: invoice.vendor_name_raw, conf: cs.vendor_name },
            { label: "TIN",     value: invoice.vendor_tin,      conf: cs.vendor_tin  },
            { label: "Reg No",  value: invoice.vendor_reg_no,   conf: null           },
            { label: "Country", value: invoice.vendor_country === "MY" ? "Malaysia" : invoice.vendor_country, conf: null },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-2.5 text-[11px]"
              style={{ borderBottom: i < 3 ? "0.5px solid #F3F4F6" : undefined }}>
              <span className="w-20 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium flex items-center">
                {f.value ?? <span className="text-gray-300">—</span>}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Bill To</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          {[
            { label: "Name",    value: invoice.bill_to_name    },
            { label: "TIN",     value: invoice.bill_to_tin     },
            { label: "Address", value: invoice.bill_to_address },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-2.5 text-[11px]"
              style={{ borderBottom: i < 2 ? "0.5px solid #F3F4F6" : undefined }}>
              <span className="w-20 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium leading-relaxed">
                {f.value ?? <span className="text-gray-300">—</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Invoice</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          {[
            { label: "Number",   value: invoice.invoice_number,  conf: cs.invoice_number },
            { label: "Date",     value: fmtDate(invoice.invoice_date), conf: cs.invoice_date },
            { label: "Due Date", value: fmtDate(invoice.due_date), conf: cs.due_date    },
            { label: "Terms",    value: invoice.payment_terms,   conf: null             },
            { label: "PO Ref",   value: invoice.po_reference,    conf: null             },
            { label: "Source",   value: invoice.source === "email_gmail" ? "Gmail" : "Manual Upload", conf: null },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-2.5 text-[11px]"
              style={{ borderBottom: i < 5 ? "0.5px solid #F3F4F6" : undefined }}>
              <span className="w-20 text-gray-400 shrink-0 font-medium">{f.label}</span>
              <span className="text-gray-800 font-medium flex items-center">
                {f.value ?? <span className="text-gray-300">—</span>}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Amounts</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          {[
            { label: "Subtotal", value: `${invoice.currency} ${fmt(invoice.subtotal)}`, conf: null, bold: false },
            { label: invoice.tax_type ?? "Tax", value: invoice.tax_amount != null ? `${invoice.currency} ${fmt(invoice.tax_amount)}` : "—", conf: null, bold: false },
            { label: "Total",    value: `${invoice.currency} ${fmt(invoice.total_myr)}`, conf: cs.total, bold: true },
          ].map((f, i) => (
            <div key={i} className="flex items-start px-4 py-2.5 text-[11px]"
              style={{ borderBottom: i < 2 ? "0.5px solid #F3F4F6" : undefined }}>
              <span className="w-20 shrink-0 font-medium" style={{ color: f.bold ? "#111" : "#9CA3AF" }}>{f.label}</span>
              <span className="flex items-center tabular-nums font-mono" style={{ color: f.bold ? "#111" : "#374151", fontWeight: f.bold ? 700 : 400 }}>
                {f.value}
                {f.conf != null && f.conf < 0.80 && <ConfidenceBadge score={f.conf}/>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: T.dimText }}>GL Coding</div>
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: T.purpleLight, color: T.purpleText }}>Hover to edit</span>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          {lineItems.map((li, i) => {
            const { title, details } = splitDescription(li.description)
            return (
              <div key={i} className="px-4 py-3"
                style={{ borderBottom: i < lineItems.length - 1 ? "0.5px solid #F3F4F6" : undefined }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[11px] font-semibold text-gray-800 leading-tight flex-1">{title}</div>
                  <div className="text-[11px] font-mono font-semibold text-gray-800 shrink-0 tabular-nums">
                    {li.amount != null ? `${fmt(li.amount)}` : "—"}
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
      </section>

      <section>
        <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Project & Cost Centre</div>
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
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
        </div>
      </section>

      <section>
        <div className="rounded-xl p-4"
          style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
          <div className="flex items-start gap-2.5">
            <div className="size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: T.purpleLight }}>
              <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold mb-1.5" style={{ color: T.purpleText }}>AI Analysis</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{invoice.ai_insight}</p>
              <code className="text-[9px] font-mono mt-2 block" style={{ color: "#9CA3AF" }}>
                {invoice.ai_source}
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Email Thread tab ─────────────────────────────────────────────────────────

function EmailThreadTab({ invoice }: { invoice: InvoiceDetail }) {
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyText, setReplyText] = React.useState("")

  const emails = [{
    from: "accounts@techsolutionsmy.com",
    to: "ap@abcretails.com.my",
    subject: `Invoice ${invoice.invoice_number} from ${invoice.vendor_name_raw}`,
    body: `Dear ABC Retails Finance Team,\n\nPlease find attached invoice ${invoice.invoice_number} for services rendered in May 2024.\n\nTotal amount: ${invoice.currency} ${fmt(invoice.total_myr)}\nDue date: ${fmtDate(invoice.due_date)}\nPayment terms: ${invoice.payment_terms}\n\nKindly arrange payment accordingly. Please contact us if you need any clarification.\n\nBest regards,\nAccounts Department\n${invoice.vendor_name_raw}`,
    date: "1 Jun 2024, 8:04 AM",
    hasAttachment: true,
  }]

  return (
    <div className="space-y-3 pb-4">
      {emails.map((email, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
          <div className="px-4 py-3" style={{ borderBottom: "0.5px solid #F3F4F6", background: "#FAFAFA" }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: T.purpleLight }}>
                  <span className="text-[10px] font-bold" style={{ color: T.purple }}>
                    {email.from[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-800">{email.from}</div>
                  <div className="text-[9px] text-gray-400">to {email.to}</div>
                </div>
              </div>
              <span className="text-[9px] text-gray-400 shrink-0">{email.date}</span>
            </div>
            <div className="text-[11px] font-medium text-gray-700">{email.subject}</div>
            {email.hasAttachment && (
              <div className="flex items-center gap-1.5 mt-2">
                <Paperclip size={10} style={{ color: T.dimText }} strokeWidth={2}/>
                <span className="text-[10px] font-medium" style={{ color: T.purple }}>
                  {invoice.invoice_number}.pdf
                </span>
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <pre className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
          </div>
        </div>
      ))}

      {replyOpen ? (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.purple}` }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "0.5px solid #E5E7EB", background: "#FAFAFA" }}>
            <span className="text-[10px] font-medium text-gray-600">To:</span>
            <span className="text-[10px] text-gray-800">accounts@techsolutionsmy.com</span>
          </div>
          <textarea rows={4} placeholder="Type your reply…" value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="w-full px-4 py-3 text-[11px] text-gray-700 resize-none focus:outline-none"
            style={{ background: "#fff" }}/>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: "0.5px solid #E5E7EB", background: "#FAFAFA" }}>
            <button onClick={() => setReplyOpen(false)} className="text-[11px] text-gray-500 cursor-pointer">Cancel</button>
            <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold text-white cursor-pointer"
              style={{ background: T.purple }}>
              <Send size={10} strokeWidth={2}/> Send Reply
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setReplyOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-medium cursor-pointer"
          style={{ border: "0.5px solid #E5E7EB", color: T.purple, background: "#fff" }}
          onMouseEnter={e => (e.currentTarget.style.background = T.purpleLight)}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
          <Mail size={12} strokeWidth={2}/> Reply to vendor
        </button>
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

function CommentsTab() {
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
            <textarea rows={2} placeholder="Add a comment…" value={comment}
              onChange={e => setComment(e.target.value)}
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
    </div>
  )
}

// ─── Map API response → InvoiceDetail ────────────────────────────────────────

function mapApiResponse(raw: InvoiceDetailResponse): InvoiceDetail {
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
    cost_centre: null,
    po_reference: raw.po_reference ?? null,
    bill_to_name: raw.bill_to_name ?? "—",
    bill_to_address: raw.bill_to_address ?? null,
    bill_to_tin: raw.bill_to_tin ?? null,
    confidence_scores: raw.confidence_flags ?? {},
    line_items: (raw.line_items ?? []).map((l) => ({
      description: l.description,
      qty: l.qty ?? null,
      uom: l.uom ?? null,
      unit_price: l.unit_price ?? null,
      amount: l.amount,
      gl_code: l.gl_code ?? null,
      gl_desc: l.gl_desc ?? null,
      confidence: 1,
    })),
    ai_insight: raw.email_body_html
      ? "Invoice received via email. Review extracted fields below."
      : "Invoice processed. Review extracted fields and GL codes below.",
    ai_source: "jomie-ocr-engine:v1",
    created_at: raw.created_at,
  }
}

// ─── Main client component ────────────────────────────────────────────────────

type Tab = "fields" | "email" | "comments"

export function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [invoice, setInvoice]     = React.useState<InvoiceDetail | null>(null)
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null)
  const [loading, setLoading]     = React.useState(true)
  const [apiError, setApiError]   = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<Tab>("fields")

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setApiError(null)

    // Try real API first; fall back to demo data if API unavailable
    getInvoice(id)
      .then(raw => {
        if (!cancelled) {
          setInvoice(mapApiResponse(raw))
          setSignedUrl(raw.storage_path ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Graceful fallback to demo data while backend is being set up
          const demo = DEMO_DETAILS[id] ?? DEFAULT_DETAIL
          setInvoice(demo)
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
          <div className="text-[13px] font-medium mb-1" style={{ color: T.red }}>Invoice not found</div>
          <button onClick={() => router.push("/ap/invoices")}
            className="text-[11px] cursor-pointer underline" style={{ color: T.dimText }}>
            Back to inbox
          </button>
        </div>
      </div>
    )
  }

  const urgency = URGENCY_CONFIG[invoice.urgency_bucket]
  const status  = STATUS_CONFIG[invoice.status]

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "fields",   label: "Fields",      icon: <FileText size={12} strokeWidth={2}/> },
    { key: "email",    label: "Email Thread", icon: <Mail size={12} strokeWidth={2}/> },
    { key: "comments", label: "Comments",     icon: <MessageSquare size={12} strokeWidth={2}/> },
  ]

  return (
    <div className="flex flex-col min-h-0" style={{ height: "calc(100vh - 20px)" }}>

      {/* Header */}
      <div className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <ArrowLeft size={13} strokeWidth={2}/> Back
          </button>
          <div className="w-px h-4" style={{ background: "rgba(103,100,136,0.5)" }}/>
          <nav className="flex items-center gap-1">
            <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.45)" }}>AP</span>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <button onClick={() => router.push("/ap/invoices")}
              className="text-[12px] font-light cursor-pointer hover:text-white transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}>Invoice Inbox</button>
            <ChevronRight size={10} color="rgba(255,255,255,0.3)" strokeWidth={2}/>
            <span className="text-[12px] font-medium text-white font-mono">{invoice.invoice_number}</span>
          </nav>
        </div>

        {invoice.status === "pending_review" && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium cursor-pointer border"
              style={{ color: T.red, borderColor: T.red + "44", background: T.redLight }}>
              <ThumbsDown size={12} strokeWidth={2}/> Reject
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium cursor-pointer border"
              style={{ color: "#374151", borderColor: "#D1D5DB", background: "#fff" }}>
              <MessageSquare size={12} strokeWidth={2}/> Query
            </button>
            <button
              onClick={() => router.push(`/ap/invoices/${id}/approval`)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
              style={{ background: T.teal }}>
              <ThumbsUp size={12} strokeWidth={2}/> Approve
            </button>
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
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2"
                style={{ background: status.bg, color: status.color }}>{status.label}</span>
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

            <div className="flex items-center gap-3 mt-3">
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
          <div className="shrink-0 flex px-5 pt-3 gap-0.5" style={{ borderBottom: "0.5px solid #E5E7EB" }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-t-lg cursor-pointer transition-colors",
                  activeTab === tab.key ? "text-gray-900 bg-white border-t border-x" : "text-gray-500 hover:text-gray-700"
                )}
                style={activeTab === tab.key ? { borderColor: "#E5E7EB", marginBottom: -1 } : undefined}>
                {tab.icon}
                {tab.label}
                {tab.key === "comments" && (
                  <span className="text-[9px] tabular-nums px-1 rounded"
                    style={{ background: T.purpleLight, color: T.purple }}>
                    {DEMO_COMMENTS_COUNT}
                  </span>
                )}
              </button>
            ))}
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
