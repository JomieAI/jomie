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

export type UrgencyBucket = "overdue" | "due_3d" | "due_7d" | "due_30d" | "future"
export type InvoiceStatus  = "pending_review" | "approved" | "rejected" | "paid" | "overdue"
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
  bom_signal: boolean
  project_code: string | null
  gl_code: string | null
  gl_desc: string | null
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
