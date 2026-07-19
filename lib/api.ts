// Typed fetch helpers for the Jomie backend API.
// Base URL comes from NEXT_PUBLIC_API_URL (.env.local).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── AP Invoice types (mirrors backend models/invoice.py) ────────────────────

export interface PaymentVoucher {
  pv_number: string
  amount: number
  status: string
  payment_date: string
  payment_method: string
  payment_ref: string | null
  bank_name: string | null
  bank_account_no: string | null
}

export type UrgencyBucket = "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
export type InvoiceStatus  = "pending_review" | "approved" | "rejected" | "paid" | "overdue" | "partially_paid"
export type InvoiceOrigin  = "local" | "foreign" | "unknown"
export type DuplicateRisk  = "none" | "possible" | "exact"

export interface InvoiceListItem {
  id: string
  vendor_name_raw: string | null
  invoice_number: string | null
  total_myr: number | null
  due_date: string | null
  urgency_bucket: UrgencyBucket | null
  status: InvoiceStatus
  origin: InvoiceOrigin | null
  is_einvoice_verified: boolean
  discount_available: boolean
  discount_savings_myr: number | null
  duplicate_risk: DuplicateRisk
  source: string
  created_at: string
  // Phase 2 fields (optional — backend populates when supported)
  payment_type?: string | null
  work_order_ref?: string | null
  low_gl_confidence_count?: number  // count of line items with gl_confidence < 0.85
  invoice_category?: string | null
  risk_level?: "pass" | "warning" | "fail" | "none"
  risk_count?: number
  // Payment Request fields
  pr_number?: string
  requestor_name?: string
  payment_needed_by?: string
  urgency_level?: 'normal' | 'urgent' | 'critical'
  intake_channel?: 'form' | 'email'
  is_recurring?: boolean
  recurring_frequency?: string
  sla_warning?: string
  comment_thread?: CommentThreadItem[]
  approval_steps?: ApprovalStep[]
}

export interface CommentThreadItem {
  id: string
  type: 'activity' | 'comment'
  timestamp: string
  description?: string
  author?: string
  role?: string
  message?: string
  is_query?: boolean
  resolved?: boolean
  resolved_by?: string
  attachment?: string
}

export interface ApprovalStep {
  title: string
  status: 'completed' | 'current' | 'pending' | 'skipped'
  assignee?: string
  timestamp?: string
  note?: string
  sla?: string
  sla_at_risk?: boolean
  skip_reason?: string
}

export interface LineItemRow {
  seq: number
  description: string
  qty: number | null
  uom: string | null
  unit_price: number | null
  amount: number
  tax_code: string | null
  tax_amount: number | null
  item_type: string | null
  bom_signal?: boolean | string | null
  project_code: string | null
  gl_code: string | null
  gl_desc: string | null
  // Phase 2 GL audit fields
  gl_confidence?: number | null
  gl_confirmed_at?: string | null
  gl_overridden?: boolean | null
  sst_claimable?: boolean | null
}

export interface InvoiceDetailResponse extends InvoiceListItem {
  vendor_tin: string | null
  vendor_reg_no: string | null
  vendor_address: string | null
  vendor_country: string | null
  invoice_date: string | null
  payment_terms: string | null
  currency: string
  subtotal_myr: number | null
  tax_amount_myr: number | null
  tax_type: string | null
  po_reference: string | null
  bill_to_name: string | null
  bill_to_address: string | null
  bill_to_tin: string | null
  storage_path: string | null   // signed URL from Supabase Storage
  confidence_flags: Record<string, number>
  email_subject: string | null
  email_from: string | null
  email_body_html: string | null
  project_reference: string | null
  line_items: LineItemRow[]
  // Phase 2 fields
  payment_series_id?: string | null
  payment_series_sequence?: number | null
  total_contract_value?: number | null
  project_id?: string | null
  project_assigned_by?: string | null
  project_confidence?: number | null
  quotation_ref?: string | null
  discount_amount?: number | null
  gross_before_discount?: number | null
  // Milestone / payment tracking
  milestone_sequence?: number | null
  milestone_description?: string | null
  milestone_percentage?: number | null
  amount_paid?: number | null
  amount_outstanding?: number | null
  // Document tracking
  po_substitute_type?: string | null
  do_number?: string | null
  do_received?: boolean | null
  do_signed_returned?: boolean | null
  payment_vouchers?: PaymentVoucher[]
}

// ─── AP Invoice endpoints ─────────────────────────────────────────────────────

export interface ListInvoicesParams {
  status?: string
  urgency?: string
  limit?: number
  offset?: number
}

export function listInvoices(params: ListInvoicesParams = {}): Promise<InvoiceListItem[]> {
  const q = new URLSearchParams()
  if (params.status)  q.set("status", params.status)
  if (params.urgency) q.set("urgency", params.urgency)
  if (params.limit)   q.set("limit", String(params.limit))
  if (params.offset)  q.set("offset", String(params.offset))
  const qs = q.toString()
  return apiFetch<InvoiceListItem[]>(`/api/v1/ap/invoices${qs ? `?${qs}` : ""}`)
}

export function getInvoice(id: string): Promise<InvoiceDetailResponse> {
  return apiFetch<InvoiceDetailResponse>(`/api/v1/ap/invoices/${id}`)
}

export function updateLineItemGL(invoiceId: string, seq: number, gl_code: string, gl_desc: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/v1/ap/invoices/${invoiceId}/line-items/${seq}`, {
    method: "PATCH",
    body: JSON.stringify({ gl_code, gl_desc }),
  })
}

export async function uploadInvoice(file: File): Promise<{ invoice_id: string; message: string }> {
  const body = new FormData()
  body.append("file", file)
  const res = await fetch(`${BASE}/api/v1/ap/invoices/upload`, { method: "POST", body })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Upload ${res.status}: ${text}`)
  }
  return res.json()
}
