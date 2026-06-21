"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle,
  Globe, Building2, Package, FolderOpen, User, Edit3, Search,
  ChevronDown, FileText, Tag, Layers, BookOpen, Send,
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

type RegStatus  = "pending" | "approved" | "rejected"
type ItemType   = "standard" | "capex" | "service" | "bom_component" | "project_cost"
type ActiveTab  = "vendor" | "item" | "project"

interface VendorReg {
  id: string; type: "vendor"
  vendor_name: string
  vendor_tin: string | null
  vendor_reg_no: string | null
  vendor_country: string
  vendor_address: string | null
  payment_terms: string | null
  bank_name: string | null
  bank_account: string | null
  source_invoice: string
  source_invoice_id: string
  status: RegStatus
  created_at: string
  ai_note: string
}

interface ItemReg {
  id: string; type: "item"
  description: string
  item_type: ItemType
  uom: string | null
  unit_price: number | null
  gl_code: string | null
  gl_desc: string | null
  bom_signal: string | null
  project_signal: string | null
  source_invoice: string
  source_invoice_id: string
  status: RegStatus
  created_at: string
  ai_note: string
}

interface ProjectReg {
  id: string; type: "project"
  project_name: string
  project_code: string | null
  cost_centre: string | null
  budget_myr: number | null
  source_invoice: string
  source_invoice_id: string
  status: RegStatus
  created_at: string
  ai_note: string
}

type RegItem = VendorReg | ItemReg | ProjectReg

// ─── Demo data ────────────────────────────────────────────────────────────────

const VENDOR_REGS: VendorReg[] = [
  {
    id: "vreg-001", type: "vendor",
    vendor_name: "SKY Renovation Sdn Bhd",
    vendor_tin: "C19981234567",
    vendor_reg_no: "199801056789-B",
    vendor_country: "MY",
    vendor_address: "No 5, Jalan Kilang Midah, Cheras, 56100 Kuala Lumpur",
    payment_terms: "2/10 Net 20",
    bank_name: null,
    bank_account: null,
    source_invoice: "SKY-2024-0234",
    source_invoice_id: "inv-002",
    status: "pending",
    created_at: "10 Jun 2024",
    ai_note: "New vendor — first invoice received. No existing master record found. Payment terms include 2% early discount. Bank details not on invoice — request from vendor before first payment.",
  },
  {
    id: "vreg-002", type: "vendor",
    vendor_name: "AWS Singapore Pte Ltd",
    vendor_tin: null,
    vendor_reg_no: "201625990E",
    vendor_country: "SG",
    vendor_address: "23 Church Street, #10-01 Capital Square, Singapore 049481",
    payment_terms: "Net 30",
    bank_name: null,
    bank_account: null,
    source_invoice: "AWS-AWS-MYJ4-C8RX",
    source_invoice_id: "inv-003",
    status: "pending",
    created_at: "12 Jun 2024",
    ai_note: "Foreign vendor (Singapore). No Malaysian TIN — self-billed e-invoice required under LHDN rules for foreign service providers. Currency: USD. FX rate required for MYR reporting.",
  },
  {
    id: "vreg-003", type: "vendor",
    vendor_name: "Adobe Systems Inc",
    vendor_tin: null,
    vendor_reg_no: null,
    vendor_country: "US",
    vendor_address: "345 Park Avenue, San Jose, CA 95110, United States",
    payment_terms: "Net 30",
    bank_name: null,
    bank_account: null,
    source_invoice: "ADO-MY-2024-5511",
    source_invoice_id: "inv-005",
    status: "approved",
    created_at: "15 Jun 2024",
    ai_note: "Foreign vendor (USA). Self-billed e-invoice required. Software subscription — recurrence expected monthly. Suggest setting up standing order.",
  },
]

const ITEM_REGS: ItemReg[] = [
  {
    id: "ireg-001", type: "item",
    description: "Software Development Services — Phase 2",
    item_type: "service",
    uom: "lot",
    unit_price: 85000,
    gl_code: "5210",
    gl_desc: "IT Consulting Services",
    bom_signal: null,
    project_signal: "PROJ-2024-01",
    source_invoice: "INV-2024-0891",
    source_invoice_id: "inv-001",
    status: "pending",
    created_at: "1 Jun 2024",
    ai_note: "Professional service item linked to project PROJ-2024-01. GL 5210 suggested based on vendor history. Mark as project_cost type to enable project burn tracking.",
  },
  {
    id: "ireg-002", type: "item",
    description: "Server Infrastructure Setup",
    item_type: "capex",
    uom: "lot",
    unit_price: 14000,
    gl_code: "1410",
    gl_desc: "Capital Expenditure — Equipment",
    bom_signal: null,
    project_signal: null,
    source_invoice: "INV-2024-0891",
    source_invoice_id: "inv-001",
    status: "pending",
    created_at: "1 Jun 2024",
    ai_note: "Amount RM 14,000 exceeds CAPEX threshold (RM 10,000). Classified as CAPEX — Equipment. Requires CFO sign-off for capitalisation. Asset tag to be assigned upon receipt.",
  },
  {
    id: "ireg-003", type: "item",
    description: "Office Renovation — Partition Works",
    item_type: "capex",
    uom: "lot",
    unit_price: 22000,
    gl_code: "1430",
    gl_desc: "Leasehold Improvements",
    bom_signal: null,
    project_signal: null,
    source_invoice: "SKY-2024-0234",
    source_invoice_id: "inv-002",
    status: "pending",
    created_at: "10 Jun 2024",
    ai_note: "Renovation scope qualifies as leasehold improvement. Capitalise and amortise over remaining lease term. Confirm lease expiry date with admin for depreciation schedule.",
  },
  {
    id: "ireg-004", type: "item",
    description: "Annual Maintenance & Support",
    item_type: "service",
    uom: "months",
    unit_price: 3000,
    gl_code: "5215",
    gl_desc: "Software Maintenance",
    bom_signal: null,
    project_signal: null,
    source_invoice: "INV-2024-0891",
    source_invoice_id: "inv-001",
    status: "approved",
    created_at: "1 Jun 2024",
    ai_note: "Recurring annual maintenance item. Suggest setting up as a contract item with 12-month amortisation schedule for prepayment tracking.",
  },
]

const PROJECT_REGS: ProjectReg[] = [
  {
    id: "preg-001", type: "project",
    project_name: "ERP System Implementation Phase 2",
    project_code: "PROJ-2024-01",
    cost_centre: "IT-OPS",
    budget_myr: null,
    source_invoice: "INV-2024-0891",
    source_invoice_id: "inv-001",
    status: "pending",
    created_at: "1 Jun 2024",
    ai_note: "Project code PROJ-2024-01 detected on invoice reference field. No existing project master found. Create project record to enable cost tracking for RM 99,000 in committed spend so far.",
  },
  {
    id: "preg-002", type: "project",
    project_name: "HQ Office Renovation FY2024",
    project_code: "PROJ-2024-03",
    cost_centre: "ADMIN",
    budget_myr: 80000,
    source_invoice: "SKY-2024-0234",
    source_invoice_id: "inv-002",
    status: "pending",
    created_at: "10 Jun 2024",
    ai_note: "Renovation project referenced across 3 line items. Estimated total: RM 35,000. Register project to track remaining budget vs committed spend. Suggested budget: RM 80,000 based on scope.",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-MY", { minimumFractionDigits: 2 })

const STATUS_CONFIG: Record<RegStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  color: "#92400E",  bg: "#FEF3C7",  border: "#D97706", icon: <Clock size={11} strokeWidth={2}/> },
  approved: { label: "Approved", color: T.tealText, bg: T.tealLight, border: T.teal,   icon: <CheckCircle2 size={11} strokeWidth={2}/> },
  rejected: { label: "Rejected", color: T.redText,  bg: T.redLight,  border: T.red,    icon: <XCircle size={11} strokeWidth={2}/> },
}

const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; color: string; bg: string }> = {
  standard:      { label: "Standard",      color: T.dimText,  bg: "rgba(255,255,255,0.5)" },
  capex:         { label: "CAPEX",         color: T.purpleText, bg: T.purpleLight },
  service:       { label: "Service",       color: T.tealText,  bg: T.tealLight },
  bom_component: { label: "BOM Component", color: T.amberText, bg: T.amberLight },
  project_cost:  { label: "Project Cost",  color: "#1E40AF",   bg: "#DBEAFE" },
}

const TAB_CONFIG: { key: ActiveTab; label: string; icon: React.ReactNode; data: RegItem[] }[] = [
  { key: "vendor",  label: "Vendors",  icon: <Building2 size={13} strokeWidth={2}/>,  data: VENDOR_REGS },
  { key: "item",    label: "Items",    icon: <Package size={13} strokeWidth={2}/>,     data: ITEM_REGS   },
  { key: "project", label: "Projects", icon: <FolderOpen size={13} strokeWidth={2}/>, data: PROJECT_REGS },
]

// ─── Right panel ──────────────────────────────────────────────────────────────

function VendorPanel({ reg, onClose }: { reg: VendorReg; onClose: () => void }) {
  const router = useRouter()
  const st = STATUS_CONFIG[reg.status]
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-3 mb-4" style={{ borderBottom: "0.5px solid #E5E7EB" }}>
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: reg.vendor_country === "MY" ? T.tealLight : T.purpleLight }}>
              {reg.vendor_country === "MY"
                ? <Building2 size={15} style={{ color: T.teal }} strokeWidth={1.8}/>
                : <Globe size={15} style={{ color: T.purple }} strokeWidth={1.8}/>}
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-900 leading-tight">{reg.vendor_name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{reg.vendor_country === "MY" ? "Local Vendor" : `Foreign Vendor · ${reg.vendor_country}`}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: st.bg, color: st.color, border: `0.5px solid ${st.border}` }}>
            {st.icon} {st.label}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {/* Fields */}
        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Vendor Details</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
            {[
              { label: "TIN",      value: reg.vendor_tin     },
              { label: "Reg No",   value: reg.vendor_reg_no  },
              { label: "Country",  value: reg.vendor_country },
              { label: "Address",  value: reg.vendor_address },
              { label: "Terms",    value: reg.payment_terms  },
              { label: "Bank",     value: reg.bank_name ?? "— Not provided" },
              { label: "Acc No",   value: reg.bank_account ?? "— Not provided" },
            ].map((f, i) => (
              <div key={i} className="flex items-start px-3 py-2 text-[11px]"
                style={{ borderBottom: i < 6 ? "0.5px solid #F3F4F6" : undefined }}>
                <span className="w-16 text-gray-400 shrink-0 font-medium">{f.label}</span>
                <span className={cn("font-medium leading-relaxed", !f.value || f.value.startsWith("—") ? "text-gray-300 italic" : "text-gray-800")}>
                  {f.value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Source</div>
          <button onClick={() => router.push(`/ap/invoices/${reg.source_invoice_id}`)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] cursor-pointer hover:bg-purple-50 transition-colors"
            style={{ border: "0.5px solid #E5E7EB", background: "#fff" }}>
            <div className="flex items-center gap-2">
              <FileText size={12} style={{ color: T.purple }} strokeWidth={2}/>
              <span className="font-semibold text-gray-800">{reg.source_invoice}</span>
            </div>
            <ChevronRight size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </button>
        </section>

        <section>
          <div className="rounded-xl p-3.5" style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={11} style={{ color: T.purple, flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
              <div>
                <div className="text-[10px] font-semibold mb-1" style={{ color: T.purpleText }}>Jomie Note</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{reg.ai_note}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {reg.status === "pending" && (
        <div className="shrink-0 pt-3 mt-3 flex gap-2" style={{ borderTop: "0.5px solid #E5E7EB" }}>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-medium cursor-pointer border"
            style={{ color: T.red, borderColor: T.red + "44", background: T.redLight }}>
            Reject
          </button>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
            style={{ background: T.teal }}>
            Approve & Register
          </button>
        </div>
      )}
    </div>
  )
}

function ItemPanel({ reg }: { reg: ItemReg }) {
  const router = useRouter()
  const st   = STATUS_CONFIG[reg.status]
  const itCfg = ITEM_TYPE_CONFIG[reg.item_type]
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-3 mb-4" style={{ borderBottom: "0.5px solid #E5E7EB" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: itCfg.bg }}>
              <Package size={15} style={{ color: itCfg.color }} strokeWidth={1.8}/>
            </div>
            <div>
              <div className="text-[12px] font-bold text-gray-900 leading-snug">{reg.description}</div>
              <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1"
                style={{ background: itCfg.bg, color: itCfg.color }}>{itCfg.label}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: st.bg, color: st.color, border: `0.5px solid ${st.border}` }}>
            {st.icon} {st.label}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Item Details</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
            {[
              { label: "Type",       value: itCfg.label },
              { label: "UOM",        value: reg.uom },
              { label: "Unit Price", value: reg.unit_price != null ? `MYR ${fmt(reg.unit_price)}` : null },
              { label: "GL Code",    value: reg.gl_code },
              { label: "GL Desc",    value: reg.gl_desc },
              { label: "BOM Signal", value: reg.bom_signal },
              { label: "Project",    value: reg.project_signal },
            ].map((f, i) => (
              <div key={i} className="flex items-start px-3 py-2 text-[11px]"
                style={{ borderBottom: i < 6 ? "0.5px solid #F3F4F6" : undefined }}>
                <span className="w-20 text-gray-400 shrink-0 font-medium">{f.label}</span>
                <span className={cn("font-medium", !f.value ? "text-gray-300 italic" : "text-gray-800")}>
                  {f.value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Source</div>
          <button onClick={() => router.push(`/ap/invoices/${reg.source_invoice_id}`)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] cursor-pointer hover:bg-purple-50 transition-colors"
            style={{ border: "0.5px solid #E5E7EB", background: "#fff" }}>
            <div className="flex items-center gap-2">
              <FileText size={12} style={{ color: T.purple }} strokeWidth={2}/>
              <span className="font-semibold text-gray-800">{reg.source_invoice}</span>
            </div>
            <ChevronRight size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </button>
        </section>

        <section>
          <div className="rounded-xl p-3.5" style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={11} style={{ color: T.purple, flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
              <div>
                <div className="text-[10px] font-semibold mb-1" style={{ color: T.purpleText }}>Jomie Note</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{reg.ai_note}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {reg.status === "pending" && (
        <div className="shrink-0 pt-3 mt-3 flex gap-2" style={{ borderTop: "0.5px solid #E5E7EB" }}>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-medium cursor-pointer border"
            style={{ color: T.red, borderColor: T.red + "44", background: T.redLight }}>Reject</button>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
            style={{ background: T.teal }}>Approve & Register</button>
        </div>
      )}
    </div>
  )
}

function ProjectPanel({ reg }: { reg: ProjectReg }) {
  const router = useRouter()
  const st = STATUS_CONFIG[reg.status]
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-3 mb-4" style={{ borderBottom: "0.5px solid #E5E7EB" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="size-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#DBEAFE" }}>
              <FolderOpen size={15} style={{ color: "#1E40AF" }} strokeWidth={1.8}/>
            </div>
            <div>
              <div className="text-[13px] font-bold text-gray-900 leading-snug">{reg.project_name}</div>
              {reg.project_code && (
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">{reg.project_code}</div>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: st.bg, color: st.color, border: `0.5px solid ${st.border}` }}>
            {st.icon} {st.label}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Project Details</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid #E5E7EB" }}>
            {[
              { label: "Code",        value: reg.project_code },
              { label: "Cost Centre", value: reg.cost_centre  },
              { label: "Budget",      value: reg.budget_myr != null ? `MYR ${fmt(reg.budget_myr)}` : null },
              { label: "Created",     value: reg.created_at   },
            ].map((f, i) => (
              <div key={i} className="flex items-start px-3 py-2 text-[11px]"
                style={{ borderBottom: i < 3 ? "0.5px solid #F3F4F6" : undefined }}>
                <span className="w-24 text-gray-400 shrink-0 font-medium">{f.label}</span>
                <span className={cn("font-medium", !f.value ? "text-gray-300 italic" : "text-gray-800")}>
                  {f.value ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.dimText }}>Source</div>
          <button onClick={() => router.push(`/ap/invoices/${reg.source_invoice_id}`)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] cursor-pointer hover:bg-purple-50 transition-colors"
            style={{ border: "0.5px solid #E5E7EB", background: "#fff" }}>
            <div className="flex items-center gap-2">
              <FileText size={12} style={{ color: T.purple }} strokeWidth={2}/>
              <span className="font-semibold text-gray-800">{reg.source_invoice}</span>
            </div>
            <ChevronRight size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </button>
        </section>

        <section>
          <div className="rounded-xl p-3.5" style={{ background: "rgba(93,94,244,0.05)", border: "0.5px solid rgba(93,94,244,0.15)" }}>
            <div className="flex items-start gap-2">
              <Sparkles size={11} style={{ color: T.purple, flexShrink: 0, marginTop: 1 }} strokeWidth={2}/>
              <div>
                <div className="text-[10px] font-semibold mb-1" style={{ color: T.purpleText }}>Jomie Note</div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{reg.ai_note}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {reg.status === "pending" && (
        <div className="shrink-0 pt-3 mt-3 flex gap-2" style={{ borderTop: "0.5px solid #E5E7EB" }}>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-medium cursor-pointer border"
            style={{ color: T.red, borderColor: T.red + "44", background: T.redLight }}>Reject</button>
          <button className="flex-1 h-8 rounded-lg text-[12px] font-semibold text-white cursor-pointer"
            style={{ background: T.teal }}>Approve & Register</button>
        </div>
      )}
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function RegRow({ reg, selected, onSelect }: { reg: RegItem; selected: boolean; onSelect: () => void }) {
  const st = STATUS_CONFIG[reg.status]

  const icon = reg.type === "vendor"
    ? (reg.vendor_country === "MY"
        ? <Building2 size={14} style={{ color: T.teal }} strokeWidth={1.8}/>
        : <Globe size={14} style={{ color: T.purple }} strokeWidth={1.8}/>)
    : reg.type === "item"
    ? <Package size={14} style={{ color: T.amber }} strokeWidth={1.8}/>
    : <FolderOpen size={14} style={{ color: "#1E40AF" }} strokeWidth={1.8}/>

  const iconBg = reg.type === "vendor"
    ? (reg.vendor_country === "MY" ? T.tealLight : T.purpleLight)
    : reg.type === "item" ? T.amberLight : "#DBEAFE"

  const title = reg.type === "vendor" ? reg.vendor_name
    : reg.type === "item" ? reg.description
    : reg.project_name

  const sub = reg.type === "vendor"
    ? `${reg.vendor_country === "MY" ? "Local" : "Foreign · " + reg.vendor_country} · ${reg.source_invoice}`
    : reg.type === "item"
    ? `${ITEM_TYPE_CONFIG[reg.item_type].label} · ${reg.source_invoice}`
    : `${reg.project_code ?? "No code"} · ${reg.source_invoice}`

  return (
    <div onClick={onSelect}
      className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-all"
      style={{
        borderColor: "rgba(103,100,136,0.2)",
        background: selected ? "rgba(29,158,117,0.08)" : "transparent",
        borderLeft: selected ? `2px solid ${T.purple}` : "2px solid transparent",
      }}>
      <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white truncate">{title}</div>
        <div className="text-[10px] mt-0.5 truncate" style={{ color: T.dimText }}>{sub}</div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: st.bg, color: st.color }}>{st.label}</span>
        <span className="text-[9px]" style={{ color: T.dimText }}>{reg.created_at}</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegistrationsPage() {
  const router   = useRouter()
  const [tab, setTab]         = React.useState<ActiveTab>("vendor")
  const [selected, setSelected] = React.useState<RegItem | null>(VENDOR_REGS[0])
  const [search, setSearch]   = React.useState("")

  const currentTab = TAB_CONFIG.find(t => t.key === tab)!
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return currentTab.data.filter(r => {
      const title = r.type === "vendor" ? r.vendor_name
        : r.type === "item" ? r.description : r.project_name
      return title.toLowerCase().includes(q) || r.source_invoice.toLowerCase().includes(q)
    })
  }, [tab, search, currentTab.data])

  const pendingCount = (data: RegItem[]) => data.filter(r => r.status === "pending").length

  React.useEffect(() => {
    const data = TAB_CONFIG.find(t => t.key === tab)!.data
    setSelected(data[0] ?? null)
    setSearch("")
  }, [tab])

  return (
    <div className="flex min-h-0" style={{ height: "calc(100vh - 20px)" }}>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0" style={{ padding: 16, gap: 14 }}>

        {/* Header */}
        <div className="shrink-0 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.5)" }}>AP</span>
            <ChevronRight size={10} color="rgba(255,255,255,0.35)" strokeWidth={2}/>
            <span className="text-[12px] font-light text-white">Master Registration Queue</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold text-white">Master Registration Queue</h1>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(93,94,244,0.12)", border: "0.5px solid rgba(93,94,244,0.3)" }}>
              <Sparkles size={13} style={{ color: "#9EACFE" }} strokeWidth={2}/>
              <span className="text-[11px]" style={{ color: "#C4C9FF" }}>
                {pendingCount(VENDOR_REGS) + pendingCount(ITEM_REGS) + pendingCount(PROJECT_REGS)} registrations pending approval
              </span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="shrink-0 grid grid-cols-3 gap-3">
          {TAB_CONFIG.map(t => (
            <div key={t.key} onClick={() => setTab(t.key)}
              className="rounded-xl px-4 py-3 cursor-pointer transition-all"
              style={{
                background: tab === t.key ? "rgba(93,94,244,0.15)" : "rgba(255,255,255,0.05)",
                border: `0.5px solid ${tab === t.key ? "rgba(93,94,244,0.5)" : "rgba(103,100,136,0.3)"}`,
              }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-md flex items-center justify-center"
                  style={{ background: tab === t.key ? T.purpleLight : "rgba(255,255,255,0.08)" }}>
                  {React.cloneElement(t.icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>, {
                    size: 13,
                    style: { color: tab === t.key ? T.purple : T.dimText },
                  })}
                </div>
                <span className="text-[11px] font-semibold" style={{ color: tab === t.key ? "#fff" : T.dimText }}>
                  {t.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-[22px] font-bold tabular-nums" style={{ color: tab === t.key ? T.purple : "rgba(255,255,255,0.5)" }}>
                  {t.data.length}
                </div>
                <div className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: T.amberLight, color: T.amberText }}>
                  {pendingCount(t.data)} pending
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-0.5">
            {TAB_CONFIG.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] transition-colors cursor-pointer"
                style={{
                  background: tab === t.key ? "#1C184E" : "transparent",
                  color:      tab === t.key ? "#fff"    : T.dimText,
                  fontWeight: tab === t.key ? 600       : 500,
                }}>
                {t.icon}
                {t.label}
                <span className="text-[10px] tabular-nums"
                  style={{ color: tab === t.key ? "rgba(255,255,255,0.4)" : T.border }}>
                  {t.data.length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.border }}/>
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="h-8 pl-7 w-44 text-[12px] focus:outline-none rounded-lg"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: "white" }}/>
          </div>
        </div>

        {/* Column headers */}
        <div className="shrink-0 px-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#667085" }}>
            {tab === "vendor" ? "Vendor Name" : tab === "item" ? "Item Description" : "Project Name"}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.length === 0
            ? <div className="flex items-center justify-center h-32 text-[12px]" style={{ color: T.dimText }}>
                No results
              </div>
            : filtered.map(reg => (
                <RegRow key={reg.id} reg={reg} selected={selected?.id === reg.id}
                  onSelect={() => setSelected(reg)}/>
              ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col shrink-0" style={{ width: 340, background: "#F7F7FE", borderLeft: "1px solid #E5E7EB" }}>
        <div className="shrink-0 px-5 pt-4 pb-3 flex items-center gap-2"
          style={{ borderBottom: "0.5px solid #E5E7EB" }}>
          <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} strokeWidth={2}/>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">Registration Detail</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {!selected
            ? <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: T.purpleLight }}>
                  <Sparkles size={18} style={{ color: T.purple }} strokeWidth={2}/>
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-semibold text-gray-500 mb-1">Select a registration</div>
                  <div className="text-[11px] text-gray-400 max-w-[180px] leading-relaxed">
                    Review AI-detected registrations from processed invoices
                  </div>
                </div>
              </div>
            : selected.type === "vendor"  ? <VendorPanel  reg={selected} onClose={() => setSelected(null)}/>
            : selected.type === "item"    ? <ItemPanel    reg={selected}/>
            : <ProjectPanel reg={selected}/>
          }
        </div>
      </div>
    </div>
  )
}
