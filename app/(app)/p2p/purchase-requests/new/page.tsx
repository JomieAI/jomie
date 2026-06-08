"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronLeft, ChevronRight, Send, Plus, Check, CheckCircle2,
  Building2, TriangleAlert, ArrowRight, Loader2, ShieldCheck,
  CircleDot, Package, Briefcase, RefreshCw, ChevronDown, Pencil,
  Search, X, Minus, AlertCircle, Link2, Warehouse, ChevronUp,
} from "lucide-react"
import { InlineEditableTitle } from "@/components/ui/inline-editable-title"
import { savePR, buildNextPRId, getSavedPRs } from "@/lib/pr-store"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  purple:       "#5D5EF4",
  purpleLight:  "#EEEDFE",
  purpleText:   "#3C3489",
  purpleDark:   "#4243AD",
  teal:         "#1D9E75",
  tealLight:    "#E1F5EE",
  tealText:     "#085041",
  amber:        "#BA7517",
  amberLight:   "#FAEEDA",
  amberText:    "#633806",
  // dark chat theme
  border:       "#676488",
  activeBg:     "#0F0D2B",
  dimText:      "#98A2B3",
  indigoBadgeBg:"#EEF4FF",
  indigoBadgeFg:"#3538CD",
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  { label:"NLP parsing",        detail:"Extracted 3 items · quantities confirmed" },
  { label:"Item master lookup", detail:"Dell L5540 → NXG-IT-001 · LG 4K → NXG-IT-002 · WD22 → NXG-IT-003" },
  { label:"Purchase type",      detail:"Capex — IT Equipment (unit cost > RM 1,000)" },
  { label:"Budget check",       detail:"IT-CAPEX-2024: Active · RM 150,000 available" },
  { label:"Smart grouping",     detail:"2 sub-PRs by approval tier" },
]

const A2_STEPS = [
  { label:"Exact duplicate check",    detail:"No duplicate PRs found in last 7 days" },
  { label:"Split PR detection",       detail:"No split pattern detected" },
  { label:"Vendor concentration",     detail:"Tech Solutions MY — 1 PR this month, within limits" },
  { label:"Budget availability",      detail:"IT-CAPEX-2024 headroom RM 7,200 — above threshold" },
  { label:"New item gate",            detail:"All 3 items exist in master — gate open" },
]

const SUB_PRS = [
  {
    id:"PR-DRAFT-A", type:"capex" as const, title:"IT Hardware — Laptops & Docks",
    vendor:"Tech Solutions MY", vendorApproved:true,
    amount:"127,806", approvalTier:"FM + CFO", glCode:"GL-7200-CAPEX",
    budgetCode:"IT-CAPEX-2024", budgetOk:true,
    warnings:["Vendor not on MyInvois — request e-invoice before PO"],
    blocks:[], leftBorder:"#2563EB",
  },
  {
    id:"PR-DRAFT-B", type:"capex" as const, title:"IT Hardware — Monitors",
    vendor:"Tech Solutions MY", vendorApproved:true,
    amount:"15,000", approvalTier:"Dept Head", glCode:"GL-7200-CAPEX",
    budgetCode:"IT-CAPEX-2024", budgetOk:true,
    warnings:[], blocks:[], leftBorder:"#2563EB",
  },
]

const DELIVERY_OPTIONS = ["ASAP (< 2 weeks)", "End of June 2026", "End of July 2026", "End of Q3 2026", "Flexible"]
const BUDGET_OPTIONS   = ["IT-CAPEX-2024", "IT-OPEX-2024", "CORP-CAPEX-2024", "Other"]

// ─── Item Master & Vendor Master (mock) ──────────────────────────────────────

// itemType: semantic classification (Tier 1 — drives badge, GL logic, BOM slot reservation)
// purchaseType: financial classification (capex vs opex — drives approval tier)
type ItemType = "standard" | "service" | "capex" | "subscription"

interface ItemMasterEntry {
  code: string; name: string; spec: string; uom: string
  unitPrice: number; purchaseType: "capex" | "opex"
  itemType: ItemType
  glCode: string; vendorCode: string; moq: number
  renewalDate?: string          // subscription only — "YYYY-MM" format
  noPhysicalDelivery?: boolean  // service / subscription — skip delivery address in Round B
  bomReady?: boolean            // Phase B: item has a BOM defined (placeholder flag)
}

const ITEM_MASTER: ItemMasterEntry[] = [
  { code:"NXG-IT-001", name:"Dell Latitude 5540 Laptop",       spec:"Intel Core i7-13th Gen, 16GB RAM, 512GB SSD, 15.6\" FHD",   uom:"unit",    unitPrice:7200,  purchaseType:"capex", itemType:"capex",        glCode:"GL-7200-CAPEX", vendorCode:"V001", moq:1 },
  { code:"NXG-IT-002", name:"LG 27\" UltraFine 4K Monitor",    spec:"3840×2160, USB-C 96W PD, 60Hz, IPS panel",                  uom:"unit",    unitPrice:2500,  purchaseType:"capex", itemType:"capex",        glCode:"GL-7200-CAPEX", vendorCode:"V001", moq:1 },
  { code:"NXG-IT-003", name:"Dell WD22TB4 Thunderbolt Dock",   spec:"TB4, 130W PD, 5× USB-A, 2× Display out",                    uom:"unit",    unitPrice:1929,  purchaseType:"capex", itemType:"capex",        glCode:"GL-7200-CAPEX", vendorCode:"V001", moq:1 },
  { code:"NXG-IT-004", name:"Logitech MX Keys Keyboard",       spec:"Wireless, Multi-device, Bluetooth + USB receiver",           uom:"unit",    unitPrice:380,   purchaseType:"opex",  itemType:"standard",     glCode:"GL-6100-OPEX",  vendorCode:"V006", moq:1 },
  { code:"NXG-OFF-001", name:"HP LaserJet Pro M404dn Printer", spec:"Monochrome, 40ppm, duplex, LAN",                             uom:"unit",    unitPrice:1200,  purchaseType:"capex", itemType:"capex",        glCode:"GL-7200-CAPEX", vendorCode:"V002", moq:1 },
  { code:"NXG-OFF-002", name:"Ergonomic Office Chair",         spec:"Adjustable lumbar support, mesh back, armrests",             uom:"unit",    unitPrice:850,   purchaseType:"opex",  itemType:"standard",     glCode:"GL-6100-OPEX",  vendorCode:"V003", moq:1 },
  { code:"NXG-CONS-001", name:"A4 Copy Paper (Box)",           spec:"80gsm, 500 sheets/ream, 5 reams/box",                        uom:"box",     unitPrice:45,    purchaseType:"opex",  itemType:"standard",     glCode:"GL-6100-OPEX",  vendorCode:"V004", moq:5 },
  { code:"NXG-SW-001",  name:"Microsoft 365 Business Premium", spec:"Per user/year, Cloud, Teams + Office apps",                  uom:"license", unitPrice:1500,  purchaseType:"opex",  itemType:"subscription", glCode:"GL-6200-OPEX",  vendorCode:"V005", moq:1, renewalDate:"2026-09", noPhysicalDelivery:true },
  { code:"NXG-SVC-001", name:"IT Support Retainer",            spec:"Monthly on-site & remote support, 8h/month SLA",             uom:"month",   unitPrice:2500,  purchaseType:"opex",  itemType:"service",      glCode:"GL-6300-OPEX",  vendorCode:"V001", moq:1, noPhysicalDelivery:true },
  { code:"NXG-SVC-002", name:"Courier & Logistics Service",    spec:"Same-day & next-day delivery, peninsular MY",                uom:"trip",    unitPrice:80,    purchaseType:"opex",  itemType:"service",      glCode:"GL-6300-OPEX",  vendorCode:"",     moq:1, noPhysicalDelivery:true },
]

const VENDOR_MASTER = [
  { code:"V001", name:"Tech Solutions MY Sdn Bhd",      approved:true,  myInvois:false, terms:"Net 30",       lastOrder:"Dell L5540 @ RM 7,200 · Feb 2026" },
  { code:"V002", name:"Digital Hub Malaysia Sdn Bhd",   approved:true,  myInvois:true,  terms:"Net 14",       lastOrder:"HP LaserJet @ RM 1,180 · Jan 2026" },
  { code:"V003", name:"Office World Trading Sdn Bhd",   approved:true,  myInvois:true,  terms:"Net 30",       lastOrder:"Ergonomic Chair @ RM 820 · Mar 2025" },
  { code:"V004", name:"Paper Plus Trading",             approved:false, myInvois:false, terms:"COD",          lastOrder:"A4 Paper @ RM 42/box · Dec 2025" },
  { code:"V005", name:"Microsoft Malaysia Sdn Bhd",     approved:true,  myInvois:true,  terms:"Annual prepay",lastOrder:"M365 @ RM 1,500 · Jan 2026" },
  { code:"V006", name:"Logitech Authorised Reseller",   approved:true,  myInvois:true,  terms:"Net 14",       lastOrder:"MX Keys @ RM 365 · Oct 2025" },
]

type ChatState = "idle" | "questioning" | "processing" | "initial" | "confirmed" | "submitting" | "a2-pass"

interface FollowUpAnswers {
  delivery:   string
  budgetCode: string
  budgetCustom: string
}

interface ConfirmedItem extends ItemMasterEntry {
  qty: number
  stockSkipped: boolean
  isNew?: boolean
  preferredVendorCode?: string   // user-selected vendor override (per item)
  preferredVendorName?: string
}

// ─── Auto-generate project name from description ──────────────────────────────

function toTitleCase(s: string): string {
  const STOP = new Set(["a","an","the","and","or","for","of","to","in","on","at","by","with","from"])
  return s.split(" ").map((w, i) =>
    i === 0 || !STOP.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(" ")
}

function autoGenerateName(desc: string): string {
  const d = desc.toLowerCase()

  // ── Step 1: strip all intent/filler phrases from the front ──
  const INTENT = /^(i want to|we want to|i would like to|we would like to|i need to|we need to|i am looking to|we are looking to|please|kindly|i need|we need|we require|please purchase|please order|purchase|buy|order|request for|requesting|looking for|looking to buy|looking to order|looking to purchase|reorder\s+request\s+for|reorder\s+for)\s+/i
  let core = desc.trim()
  // Apply repeatedly in case of stacked phrases ("i want to reorder" → remove → "reorder raw material" → remove → "raw material")
  let prev = ""
  while (prev !== core) {
    prev = core
    core = core.replace(INTENT, "").trim()
  }

  // ── Step 2: strip trailing context ("for upcoming batch", "for the finance team") ──
  const deptMatch = desc.match(/\bfor\s+(?:the\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:team|dept|department|division)/i)
  core = core
    .replace(/\bfor\s+(?:the\s+)?[a-z\s]+?(team|dept|department|division)\b.*/i, "")
    .replace(/\bfor\s+(?:upcoming|the\s+next|next|our|an?)\b.*/i, "")
    .replace(/\bto\s+(?:support|prepare|use|be used|handle)\b.*/i, "")
    .trim()

  // ── Step 3: detect action verb left at the front (reorder, replenish, procure, source) ──
  const actionMatch = core.match(/^(reorder|replenish|procure|source|renew|replace|refill|top[\s-]?up)\s+(.+)/i)
  const action = actionMatch ? actionMatch[1].toLowerCase() : null
  if (actionMatch) core = actionMatch[2].trim()

  const actionLabel: Record<string, string> = {
    reorder: "Reorder", replenish: "Replenishment", procure: "Procurement",
    source: "Sourcing", renew: "Renewal", replace: "Replacement",
    refill: "Replenishment", "top-up": "Top-Up", "top up": "Top-Up",
  }

  // ── Step 4: quantity pattern ("5 laptops", "2 units of chairs") ──
  const qtyMatch = core.match(/^(\d+)\s+(?:units?\s+of\s+)?([a-z][a-z\s-]{2,30}?)(?:\s+for|\s+to|\s*[,.]|$)/i)
  if (qtyMatch) {
    const qty  = qtyMatch[1]
    const item = qtyMatch[2].trim()
    if (item.length >= 3) return toTitleCase(`${item} (×${qty})`)
  }

  // ── Step 5: specific item matching ──
  const deptSuffix = deptMatch ? ` — ${toTitleCase(deptMatch[1])} Team` : ""
  const suffix = (base: string) => action ? `${base} ${actionLabel[action] ?? "Reorder"}` : base

  // IT hardware
  const hwMatch = core.match(/\b(laptop|macbook|thinkpad|dell|hp|lenovo|desktop|workstation|server|monitor|keyboard|mouse|dock|docking station|webcam|headset|printer|scanner|projector|router|switch|nas|storage|ssd|hard drive)\b/i)
  if (hwMatch) return suffix(toTitleCase(hwMatch[1])) + (action ? "" : " Purchase") + deptSuffix

  // Software / SaaS
  const swMatch = core.match(/\b(adobe|microsoft 365|google workspace|slack|zoom|notion|figma|jira|confluence|salesforce|hubspot|quickbooks|xero|autocount|antivirus|vpn)\b/i)
  if (swMatch) return toTitleCase(swMatch[1]) + " Subscription"
  if (/software|licence|license|subscription|saas|cloud app/.test(d)) return "Software License Renewal"

  // Raw / production materials — capture keyword + up to 2 trailing qualifier words
  const rawMatch = core.match(/\b(raw material|component|spare part|packaging|chemical|resin|fabric|steel|aluminium|plastic|rubber|ink|solvent|lubricant|catalyst|part)(?:\s+([a-z]+(?:\s+[a-z]+)?))?\b/i)
  if (rawMatch) {
    const item = rawMatch[2]
      ? `${rawMatch[1]} ${rawMatch[2]}`.trim()
      : rawMatch[1]
    return suffix(toTitleCase(item))
  }

  // Office furniture / fit-out
  const furnMatch = core.match(/\b(chair|desk|table|cabinet|shelf|shelving|whiteboard|partition|locker|sofa|standing desk|ergonomic chair)\b/i)
  if (furnMatch) return toTitleCase(furnMatch[1]) + " Purchase"
  if (/renovation|fit-?out|flooring|ceiling|electrical|plumbing/.test(d)) return "Office Fit-Out Works"

  // Vehicles
  const vehMatch = core.match(/\b(car|van|truck|lorry|pickup|vehicle|motorcycle|mpv|suv)\b/i)
  if (vehMatch) return toTitleCase(vehMatch[1]) + " Purchase"

  // Training
  const trainMatch = core.match(/\b(.+?)\s+(?:training|course|workshop|seminar|certification|conference)\b/i)
  if (trainMatch) return toTitleCase(trainMatch[1].trim()) + " Training"
  if (/training|seminar|workshop|conference/.test(d)) return "Staff Training Program"

  // Marketing
  const mktMatch = core.match(/\b(.+?)\s+(?:banner|booth|brochure|flyer|signage|display|campaign)\b/i)
  if (mktMatch) return toTitleCase(mktMatch[1].trim()) + " Marketing Materials"
  if (/marketing|brand|promotion|exhibition|trade fair/.test(d)) return "Marketing & Promotional Materials"

  // Maintenance / services
  const svcMatch = core.match(/\b(.+?)\s+(?:maintenance|repair|servicing|cleaning|inspection|installation)\b/i)
  if (svcMatch) return toTitleCase(svcMatch[1].trim()) + " Maintenance"
  if (/maintenance|repair|service|cleaning|inspection/.test(d)) return "Maintenance Services"

  // Stationery / consumables
  if (/stationery|paper|toner|cartridge|envelope|folder|file/.test(d)) return "Office Stationery & Supplies"
  if (/consumable|supplies/.test(d)) return "Office Consumables"

  // ── Step 6: smart fallback — take meaningful words from stripped core ──
  const words = core.split(/\s+/).slice(0, 4).filter(w => w.length > 2)
  if (words.length >= 2) {
    const name = toTitleCase(words.join(" "))
    return action ? `${name} ${actionLabel[action] ?? "Reorder"}` : name
  }

  // Last resort — take first 3 meaningful words from original
  const fallback = desc.trim().split(/\s+/)
    .filter(w => !/^(i|we|a|an|the|to|for|of|and|or|is|are|was|were|be|been|being)$/i.test(w))
    .slice(0, 3)
  return toTitleCase(fallback.join(" "))
}

// ─── Jomie contextual reply generator ────────────────────────────────────────

interface ChatMsg { role: "user" | "ai"; text: string }

function generateReply(msg: string): string {
  const m = msg.toLowerCase()
  if (/vendor|supplier|tech solution/.test(m))
    return "Tech Solutions MY is on the approved vendor list with a current unit price of RM 7,200 for the Dell Latitude 5540. They've fulfilled 3 orders in the past 12 months — no delivery issues flagged. MyInvois registration is still pending; request a validated e-invoice before the PO is issued."
  if (/budget|cost|price|amount|total|rm/.test(m))
    return "The RM 142,806 commitment sits at 95.2% of IT-CAPEX-2024 (RM 150,000). Remaining headroom is RM 7,194 — below the 10% threshold, which triggers CFO co-approval per approvalMatrix.md:v1.2. No override is needed, but the low headroom will be flagged to the CFO."
  if (/deliver|when|date|timeline|urgent|july|june/.test(m))
    return "Delivery is targeted for End of July 2026. Tech Solutions MY has a 14–21 day standard lead time for this order size. I'd recommend issuing the PO by 10 July to allow buffer for logistics and goods receipt."
  if (/approv|who|sign|authoris|razif|siti|chong/.test(m))
    return "3 approvals are required: Siti Aisyah (Dept Head, L1) — ✓ approved. Razif Abdullah (Finance Mgr, L2) — pending, 18h elapsed of 48h SLA. Chong Mei Ling (CFO, L3) — waiting on L2. SOD rules exclude you from all approval steps."
  if (/cancel|delete|withdraw|remove|stop/.test(m))
    return "To cancel this PR you'll need to withdraw it before Phase C (Quotation). I can draft a withdrawal memo for you — just confirm and I'll initiate the recall and notify the pending approvers."
  if (/gl|code|account|chart/.test(m))
    return "All 3 line items are mapped to GL-7200-CAPEX under the IT Department cost centre (IT-CAPEX-2024). Capital allowance applies: IA 20% + AA 14% under Schedule 3, ITA 1967. Tag as IT Equipment in the fixed asset register before period close."
  if (/tax|sst|gst|invoice|myinvois/.test(m))
    return "Tech Solutions MY is not yet registered on MyInvois. SST input credit under S38 of the SST Act 2018 requires a validated e-invoice. I've flagged this — request the registration confirmation before the PO is raised to protect the RM 8,568 SST claim."
  if (/split|duplicate|fraud|risk/.test(m))
    return "A2 checks confirmed no split-PR pattern and no duplicates in the last 7 days. Vendor concentration is within limits (1 PR this month for Tech Solutions MY). All integrity checks passed."
  if (/po|purchase order|when.*po|generate/.test(m))
    return "The PO will be auto-generated by Jomie once all approvals are complete (Phase B → Phase C). You'll receive a notification. The PO will reference both sub-PRs and consolidate to a single vendor order for Tech Solutions MY."
  return "Noted. Is there anything specific you'd like me to look into — vendor options, budget headroom, approval status, compliance flags, or delivery timeline?"
}

// ─── Sub-PR grouping (dynamic, from confirmed items) ─────────────────────────

interface SubPRGroup {
  id: string
  items: ConfirmedItem[]
  total: number
  tier: "Dept Head" | "Finance Manager" | "FM + CFO"
  vendorCode: string
  vendorName: string
  isApproved: boolean
  myInvois: boolean
  lastOrder: string
}

function buildSubPRGroups(items: ConfirmedItem[]): SubPRGroup[] {
  const groups: SubPRGroup[] = []
  let letterIdx = 0

  // Effective vendor = user's per-item preference, else item master default
  const effectiveVendorCode = (i: ConfirmedItem) =>
    i.preferredVendorCode ?? (i.isNew ? "" : i.vendorCode)
  const effectiveVendorName = (i: ConfirmedItem) => {
    if (i.preferredVendorCode) return i.preferredVendorName ?? i.preferredVendorCode
    const v = VENDOR_MASTER.find(v => v.code === i.vendorCode)
    return v?.name ?? i.vendorCode
  }

  // Separate items-with-vendor from new/unassigned items
  const regular = items.filter(i => !!effectiveVendorCode(i))
  const newItems = items.filter(i => !effectiveVendorCode(i))

  // Group regular items by effective vendor code
  const vendorMap = new Map<string, ConfirmedItem[]>()
  for (const item of regular) {
    const vc = effectiveVendorCode(item)
    vendorMap.set(vc, [...(vendorMap.get(vc) || []), item])
  }

  for (const [vc, vItems] of vendorMap) {
    // Resolve vendor — first item in group may have a preferredVendorName if it's a custom entry
    const masterVendor = VENDOR_MASTER.find(v => v.code === vc)
    const firstItem = vItems[0]
    const resolvedName = masterVendor?.name ?? firstItem.preferredVendorName ?? vc
    const vendor = masterVendor ?? {
      code: vc, name: resolvedName, approved: false, myInvois: false, terms: "", lastOrder: "",
    }
    // Split into: items whose individual line total > RM 50k (need higher approval) vs the rest
    const highValue = vItems.filter(i => i.qty * i.unitPrice > 50000)
    const standard  = vItems.filter(i => i.qty * i.unitPrice <= 50000)

    if (highValue.length > 0) {
      const t = highValue.reduce((s, i) => s + i.qty * i.unitPrice, 0)
      groups.push({
        id: `PR-DRAFT-${String.fromCharCode(65 + letterIdx++)}`,
        items: highValue, total: t,
        tier: t > 100000 ? "FM + CFO" : "Finance Manager",
        vendorCode: vc, vendorName: vendor.name, isApproved: vendor.approved,
        myInvois: vendor.myInvois, lastOrder: vendor.lastOrder,
      })
    }
    if (standard.length > 0) {
      const t = standard.reduce((s, i) => s + i.qty * i.unitPrice, 0)
      groups.push({
        id: `PR-DRAFT-${String.fromCharCode(65 + letterIdx++)}`,
        items: standard, total: t,
        tier: t > 50000 ? "Finance Manager" : "Dept Head",
        vendorCode: vc, vendorName: vendor.name, isApproved: vendor.approved,
        myInvois: vendor.myInvois, lastOrder: vendor.lastOrder,
      })
    }
  }

  // New / unassigned items → "Vendor TBD" group
  if (newItems.length > 0) {
    const t = newItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    groups.push({
      id: `PR-DRAFT-${String.fromCharCode(65 + letterIdx++)}`,
      items: newItems, total: t,
      tier: t > 50000 ? "FM + CFO" : "Dept Head",
      vendorCode: "", vendorName: "Vendor TBD", isApproved: false, myInvois: false, lastOrder: "",
    })
  }

  return groups
}

// ─── Item detection from description ─────────────────────────────────────────

function detectItemsFromDescription(desc: string): ConfirmedItem[] {
  const lower = desc.toLowerCase()
  const detected: ConfirmedItem[] = []

  function extractQty(name: string): number {
    const tokens = desc.replace(/[,]/g, " ").split(/\s+/)
    const keywords = name.toLowerCase().split(" ").filter(w => w.length > 3)
    for (let i = 0; i < tokens.length; i++) {
      const n = parseInt(tokens[i])
      if (!isNaN(n) && n > 0) {
        const window = tokens.slice(i + 1, i + 5).join(" ").toLowerCase()
        if (keywords.some(k => window.includes(k))) return n
      }
    }
    return 1
  }

  for (const item of ITEM_MASTER) {
    const keywords = item.name.toLowerCase().split(" ").filter(w => w.length > 3)
    const hits = keywords.filter(k => lower.includes(k)).length
    if (hits >= 2) {
      detected.push({ ...item, qty: extractQty(item.name), stockSkipped: false })
    }
  }
  return detected
}

// ─── Progress strip ────────────────────────────────────────────────────────────

function ProgressStrip({ roundADone, roundBDone }: { roundADone: boolean; roundBDone: boolean }) {
  const rounds = [
    { key:"A", label:"Items",   done:roundADone, active:!roundADone },
    { key:"B", label:"Vendor",  done:roundBDone, active:roundADone && !roundBDone },
    { key:"C", label:"Budget",  done:false, active:false },
    { key:"D", label:"Context", done:false, active:false },
    { key:"E", label:"Review",  done:false, active:false },
  ]
  return (
    <div className="flex items-center gap-1.5 px-1">
      {rounds.map((r, i) => (
        <React.Fragment key={r.key}>
          <div className="flex items-center gap-1">
            <div className="size-4 rounded-full flex items-center justify-center"
              style={{
                background: r.done ? "#1D9E75" : r.active ? "#5D5EF4" : "rgba(255,255,255,0.08)",
                border: r.done || r.active ? "none" : "1px solid rgba(103,100,136,0.4)",
              }}>
              {r.done
                ? <Check size={8} color="#fff" strokeWidth={3}/>
                : <span className="text-[8px] font-bold" style={{ color: r.active ? "#fff" : "rgba(255,255,255,0.3)" }}>{r.key}</span>
              }
            </div>
            <span className="text-[9px] font-semibold"
              style={{ color: r.done ? "#1D9E75" : r.active ? "#A5A6F6" : "rgba(255,255,255,0.25)" }}>
              {r.label}
            </span>
          </div>
          {i < rounds.length - 1 && (
            <div className="flex-1 h-px" style={{ background: i < (roundBDone ? 1 : roundADone ? 0 : -1) + 1 ? "#1D9E75" : "rgba(103,100,136,0.25)", maxWidth:20 }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Item card (Round A) ───────────────────────────────────────────────────────

interface ItemCardProps {
  item: ConfirmedItem
  inventorySkipped: boolean
  onQtyChange: (code: string, qty: number) => void
  onRemove: (code: string) => void
  onSkipInventory: () => void
}

function ItemCard({ item, inventorySkipped, onQtyChange, onRemove, onSkipInventory }: ItemCardProps) {
  const moqOk = item.qty >= item.moq
  const subtotal = item.qty * item.unitPrice
  const isNew = item.isNew

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: isNew ? "rgba(186,117,23,0.06)" : "rgba(255,255,255,0.05)",
        border: isNew ? "0.5px solid rgba(186,117,23,0.45)" : "0.5px solid rgba(103,100,136,0.35)",
      }}>
      {/* New item warning stripe */}
      {isNew && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor:"rgba(186,117,23,0.3)", background:"rgba(186,117,23,0.12)" }}>
          <AlertCircle size={10} style={{ color:"#BA7517", flexShrink:0 }}/>
          <span className="text-[10px] font-semibold" style={{ color:"#BA7517" }}>
            New item — pending item master approval · may delay this PR
          </span>
        </div>
      )}
      {/* Item header */}
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
        <div className="size-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: isNew ? "rgba(186,117,23,0.2)" : item.purchaseType === "capex" ? "#EFF6FF" : "#F0FDF4" }}>
          <Package size={13} style={{ color: isNew ? "#BA7517" : item.purchaseType === "capex" ? "#1D4ED8" : "#16A34A" }}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] font-mono" style={{ color:"rgba(255,255,255,0.35)" }}>{item.code}</span>
            {isNew ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:"#FAEEDA", color:"#633806" }}>
                NEW REQUEST
              </span>
            ) : (() => {
              const typeConfig: Record<ItemType,{label:string;bg:string;fg:string}> = {
                standard:     { label:"STANDARD",     bg:"rgba(255,255,255,0.1)",  fg:"rgba(255,255,255,0.5)" },
                capex:        { label:"CAPEX",         bg:"#EFF6FF",               fg:"#1D4ED8" },
                service:      { label:"SERVICE",       bg:"rgba(29,158,117,0.15)", fg:"#1D9E75" },
                subscription: { label:"SUBSCRIPTION",  bg:"rgba(93,94,244,0.18)",  fg:"#A5A6F6" },
              }
              const t = typeConfig[item.itemType ?? "standard"]
              return (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:t.bg, color:t.fg }}>
                  {t.label}
                </span>
              )
            })()}
            {item.renewalDate && (
              <span className="text-[8px] font-semibold px-1 py-0.5 rounded" style={{ background:"rgba(93,94,244,0.15)", color:"#A5A6F6" }}>
                Renews {item.renewalDate}
              </span>
            )}
            {item.noPhysicalDelivery && (
              <span className="text-[8px] px-1 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.3)" }}>
                No delivery
              </span>
            )}
          </div>
          <div className="text-[12px] font-semibold text-white leading-tight">{item.name}</div>
          <div className="text-[10px] mt-0.5 leading-snug" style={{ color:"rgba(255,255,255,0.4)" }}>{item.spec || "No spec provided"}</div>
        </div>
        <button onClick={() => onRemove(item.code)}
          className="size-5 rounded flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors hover:bg-red-500/20">
          <X size={11} style={{ color:"rgba(255,255,255,0.4)" }}/>
        </button>
      </div>

      {/* Qty + price row */}
      <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor:"rgba(103,100,136,0.2)" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>Qty</span>
          <div className="flex items-center gap-0.5 rounded-lg overflow-hidden" style={{ border:"0.5px solid rgba(103,100,136,0.4)" }}>
            <button onClick={() => onQtyChange(item.code, Math.max(0, item.qty - 1))}
              className="size-6 flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10">
              <Minus size={10} color="rgba(255,255,255,0.6)"/>
            </button>
            <input
              type="number"
              value={item.qty}
              onChange={e => onQtyChange(item.code, Math.max(0, parseInt(e.target.value) || 0))}
              className="w-10 text-center text-[12px] font-mono font-semibold text-white bg-transparent border-0 focus:outline-none"
              style={{ height:24 }}
            />
            <button onClick={() => onQtyChange(item.code, item.qty + 1)}
              className="size-6 flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10">
              <Plus size={10} color="rgba(255,255,255,0.6)"/>
            </button>
          </div>
          <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>{item.uom}</span>
          {!moqOk && item.qty > 0 && (
            <span className="text-[9px] font-semibold" style={{ color:"#BA7517" }}>MOQ: {item.moq}</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[11px] font-mono font-semibold text-white">RM {subtotal.toLocaleString()}</div>
          <div className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.35)" }}>@ RM {item.unitPrice.toLocaleString()}/{item.uom}</div>
        </div>
      </div>

      {/* Stock check */}
      {!inventorySkipped && (
        <div className="flex items-center justify-between px-3 py-2 border-t gap-2" style={{ borderColor:"rgba(103,100,136,0.2)", background:"rgba(0,0,0,0.12)" }}>
          <div className="flex items-center gap-1.5">
            <Warehouse size={10} style={{ color:"rgba(255,255,255,0.3)" }}/>
            <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>Inventory not connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onSkipInventory}
              className="text-[9px] px-2 py-1 rounded cursor-pointer transition-colors hover:bg-white/10"
              style={{ color:"rgba(255,255,255,0.4)" }}>
              Skip for now
            </button>
            <button className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded cursor-pointer transition-colors"
              style={{ background:"rgba(93,94,244,0.15)", color:"#A5A6F6", border:"0.5px solid rgba(93,94,244,0.35)" }}>
              <Link2 size={8}/> Connect
            </button>
          </div>
        </div>
      )}
      {inventorySkipped && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t" style={{ borderColor:"rgba(103,100,136,0.2)", background:"rgba(0,0,0,0.08)" }}>
          <Warehouse size={9} style={{ color:"rgba(255,255,255,0.2)" }}/>
          <span className="text-[9px]" style={{ color:"rgba(255,255,255,0.25)" }}>Stock check skipped</span>
        </div>
      )}
    </div>
  )
}

// ─── Item picker popup ─────────────────────────────────────────────────────────

interface NewItemFormData { name: string; spec: string; unitPrice: string; uom: string; itemType: ItemType }

interface ItemPickerProps {
  query: string
  onQueryChange: (q: string) => void
  onSelect: (item: ItemMasterEntry) => void
  onRequestNew: (data: NewItemFormData) => void
  onClose: () => void
  confirmedCodes: Set<string>
}

function ItemPickerPopup({ query, onQueryChange, onSelect, onRequestNew, onClose, confirmedCodes }: ItemPickerProps) {
  const [showNewForm, setShowNewForm] = React.useState(false)
  const [newForm, setNewForm] = React.useState<NewItemFormData>({ name: query, spec: "", unitPrice: "", uom: "unit", itemType: "standard" })

  React.useEffect(() => {
    if (showNewForm) setNewForm(f => ({ ...f, name: query }))
  }, [showNewForm, query])

  const lower = query.toLowerCase()
  const filtered = ITEM_MASTER.filter(item =>
    item.name.toLowerCase().includes(lower) ||
    item.code.toLowerCase().includes(lower) ||
    item.spec.toLowerCase().includes(lower)
  )

  // Item type display config
  const ITEM_TYPE_META: Record<ItemType, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
    standard:     { label:"STANDARD",     bg:"rgba(255,255,255,0.08)", fg:"rgba(255,255,255,0.45)", icon:<Package size={10}/> },
    capex:        { label:"CAPEX",        bg:"#EFF6FF",                fg:"#1D4ED8",                icon:<Briefcase size={10}/> },
    service:      { label:"SERVICE",      bg:"rgba(29,158,117,0.15)",  fg:"#1D9E75",                icon:<Link2 size={10}/> },
    subscription: { label:"SUBSCRIPTION", bg:"rgba(93,94,244,0.15)",   fg:"#A5A6F6",                icon:<RefreshCw size={10}/> },
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl"
      style={{ background:"#1A1740", border:"1px solid rgba(103,100,136,0.6)" }}>
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor:"rgba(103,100,136,0.3)" }}>
        <Search size={13} style={{ color:"rgba(255,255,255,0.4)", flexShrink:0 }}/>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => { onQueryChange(e.target.value); setShowNewForm(false) }}
          placeholder="Search by name, code, or item type…"
          className="flex-1 bg-transparent text-[13px] text-white placeholder-gray-500 border-0 focus:outline-none"
        />
        <button onClick={onClose} className="cursor-pointer hover:opacity-70">
          <X size={13} style={{ color:"rgba(255,255,255,0.4)" }}/>
        </button>
      </div>

      {/* BOM placeholder banner */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor:"rgba(103,100,136,0.15)", background:"rgba(93,94,244,0.06)" }}>
        <div className="size-4 rounded flex items-center justify-center shrink-0" style={{ background:"rgba(93,94,244,0.2)" }}>
          <Package size={9} style={{ color:"#A5A6F6" }}/>
        </div>
        <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>
          Manufacturing / F&B / Construction?
        </span>
        <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0"
          style={{ background:"rgba(93,94,244,0.15)", color:"#A5A6F6" }}>
          BOM / BOQ — Phase B
        </span>
      </div>

      {/* Results list */}
      {!showNewForm && (
        <div className="overflow-y-auto" style={{ maxHeight:256 }}>
          {filtered.length === 0 ? (
            <div className="px-4 pt-5 pb-4 flex flex-col items-center gap-3">
              <div className="size-8 rounded-full flex items-center justify-center" style={{ background:"rgba(255,255,255,0.06)" }}>
                <Search size={14} style={{ color:"rgba(255,255,255,0.3)" }}/>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-medium text-white mb-0.5">
                  {query ? `No item matching "${query}"` : "Start typing to search items"}
                </div>
                <div className="text-[11px]" style={{ color:"rgba(255,255,255,0.35)" }}>
                  Not in the master list? Request it for addition.
                </div>
              </div>
              {query.length > 0 && (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
                  style={{ background:"rgba(186,117,23,0.15)", color:"#BA7517", border:"0.5px solid rgba(186,117,23,0.4)" }}>
                  <Plus size={12}/> Request new item: "{query}"
                </button>
              )}
            </div>
          ) : (
            <>
              {filtered.map(item => {
                const already = confirmedCodes.has(item.code)
                const typeMeta = ITEM_TYPE_META[item.itemType]
                const isSubscription = item.itemType === "subscription"
                return (
                  <button key={item.code}
                    onClick={() => !already && onSelect(item)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ background:"transparent", cursor:already?"default":"pointer", opacity:already?0.4:1 }}
                    onMouseEnter={e => { if (!already) e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                    <div className="size-6 rounded-md shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: typeMeta.bg }}>
                      <span style={{ color: typeMeta.fg }}>{typeMeta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-white truncate">{item.name}</span>
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                          style={{ background: typeMeta.bg, color: typeMeta.fg }}>
                          {typeMeta.label}
                        </span>
                        {already && <span className="text-[9px] shrink-0" style={{ color:"rgba(255,255,255,0.35)" }}>Added</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.35)" }}>{item.code}</span>
                        <span className="text-[9px]" style={{ color:"rgba(255,255,255,0.3)" }}>·</span>
                        <span className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.5)" }}>
                          RM {item.unitPrice.toLocaleString()}/{item.uom}
                        </span>
                        {isSubscription && item.renewalDate && (
                          <span className="text-[8px] font-semibold px-1 py-0.5 rounded"
                            style={{ background:"rgba(93,94,244,0.15)", color:"#A5A6F6" }}>
                            Renews {item.renewalDate}
                          </span>
                        )}
                        {item.noPhysicalDelivery && (
                          <span className="text-[8px]" style={{ color:"rgba(255,255,255,0.25)" }}>No delivery</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {/* Always show "request new" at the bottom */}
              <div className="border-t px-3 py-2" style={{ borderColor:"rgba(103,100,136,0.2)" }}>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex items-center gap-1.5 text-[11px] cursor-pointer transition-opacity hover:opacity-70"
                  style={{ color:"rgba(255,255,255,0.35)" }}>
                  <Plus size={10}/> Can{"'"}t find what you need? Request a new item
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* New item form */}
      {showNewForm && (
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold" style={{ color:"#BA7517" }}>Request new item</span>
            <button onClick={() => setShowNewForm(false)} className="cursor-pointer hover:opacity-70">
              <ChevronUp size={13} style={{ color:"rgba(255,255,255,0.4)" }}/>
            </button>
          </div>
          <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>
            This will be submitted for item master approval. Your PR may be delayed until approved.
          </div>
          {/* Item type selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.35)" }}>Item type</span>
            <div className="flex gap-1.5 flex-wrap">
              {(["standard","capex","service","subscription"] as ItemType[]).map(t => {
                const labels: Record<ItemType,string> = { standard:"Standard", capex:"Capex / Asset", service:"Service", subscription:"Subscription" }
                const colors: Record<ItemType,{bg:string,fg:string,activeBg:string}> = {
                  standard:     { bg:"rgba(255,255,255,0.06)", fg:"rgba(255,255,255,0.4)",  activeBg:"rgba(255,255,255,0.14)" },
                  capex:        { bg:"rgba(29,77,216,0.1)",    fg:"#6FA3F8",                activeBg:"rgba(29,77,216,0.25)"   },
                  service:      { bg:"rgba(29,158,117,0.1)",   fg:"#1D9E75",                activeBg:"rgba(29,158,117,0.25)"  },
                  subscription: { bg:"rgba(93,94,244,0.1)",    fg:"#A5A6F6",                activeBg:"rgba(93,94,244,0.25)"   },
                }
                const c = colors[t]
                const active = newForm.itemType === t
                return (
                  <button key={t}
                    onClick={() => setNewForm(prev => ({ ...prev, itemType: t }))}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                    style={{ background: active ? c.activeBg : c.bg, color: active ? c.fg : "rgba(255,255,255,0.35)",
                      border: `0.5px solid ${active ? c.fg + "66" : "transparent"}` }}>
                    {labels[t]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fields */}
          {[
            { label:"Item name", key:"name" as const, placeholder:"e.g. Standing Desk 140cm" },
            { label:"Spec / description", key:"spec" as const, placeholder:"e.g. Electric height adj, 60kg load" },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.35)" }}>{f.label}</span>
              <input
                type="text"
                value={newForm[f.key]}
                onChange={e => setNewForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 h-8 rounded-lg text-[12px] text-white focus:outline-none"
                style={{ background:"rgba(255,255,255,0.07)", border:"0.5px solid rgba(103,100,136,0.4)" }}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.35)" }}>Est. unit price (RM)</span>
              <input
                type="number"
                value={newForm.unitPrice}
                onChange={e => setNewForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 h-8 rounded-lg text-[12px] font-mono text-white focus:outline-none"
                style={{ background:"rgba(255,255,255,0.07)", border:"0.5px solid rgba(103,100,136,0.4)" }}
              />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.35)" }}>UOM</span>
              <select
                value={newForm.uom}
                onChange={e => setNewForm(prev => ({ ...prev, uom: e.target.value }))}
                className="w-full px-2 h-8 rounded-lg text-[12px] text-white focus:outline-none cursor-pointer"
                style={{ background:"rgba(255,255,255,0.07)", border:"0.5px solid rgba(103,100,136,0.4)" }}>
                {["unit","box","set","kg","litre","license","month","trip","lot"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => newForm.name.trim() && onRequestNew(newForm)}
            disabled={!newForm.name.trim()}
            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold cursor-pointer transition-opacity"
            style={{
              background: newForm.name.trim() ? "rgba(186,117,23,0.25)" : "rgba(255,255,255,0.05)",
              color: newForm.name.trim() ? "#BA7517" : "rgba(255,255,255,0.3)",
              border: `0.5px solid ${newForm.name.trim() ? "rgba(186,117,23,0.5)" : "rgba(103,100,136,0.3)"}`,
            }}>
            <AlertCircle size={12}/> Add to PR — flag for item master approval
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-PR card (right panel) ─────────────────────────────────────────────────

function SubPRCard({ sub }: { sub: typeof SUB_PRS[0] }) {
  const [open, setOpen] = React.useState(true)
  return (
    <div className="rounded-lg border bg-white overflow-hidden"
      style={{ borderColor:"#E0DED8", borderWidth:"0.5px", borderLeftWidth:3, borderLeftColor: sub.leftBorder }}>
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="size-5 rounded flex items-center justify-center shrink-0" style={{ background: T.purpleLight }}>
          <Building2 size={11} style={{ color: T.purple }} strokeWidth={1.6}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-gray-300">{sub.id}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:"#EFF6FF", color:"#1D4ED8" }}>Capex</span>
          </div>
          <div className="text-[11px] font-semibold text-gray-800">{sub.title}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[12px] font-bold font-mono text-gray-900">RM {sub.amount}</div>
          <div className="text-[9px] text-gray-400">{sub.approvalTier}</div>
        </div>
      </div>
      {open && (
        <div className="border-t px-3 py-2.5 space-y-2" style={{ borderColor:"#F0EEE8" }}>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-gray-50 px-2 py-1.5">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Vendor</div>
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full shrink-0" style={{ background: sub.vendorApproved ? T.teal : T.amber }}/>
                <span className="text-[10px] font-medium text-gray-700 truncate">{sub.vendor}</span>
              </div>
            </div>
            <div className="rounded bg-gray-50 px-2 py-1.5">
              <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">GL Code</div>
              <div className="text-[10px] font-mono text-gray-700">{sub.glCode}</div>
            </div>
          </div>
          <div className="rounded bg-gray-50 px-2 py-1.5 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">Budget</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-700">{sub.budgetCode}</span>
              {sub.budgetOk && (
                <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: T.teal }}>
                  <Check size={9} strokeWidth={2.5}/> Active
                </span>
              )}
            </div>
          </div>
          {sub.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 rounded px-2 py-1.5"
              style={{ background: T.amberLight, border:`0.5px solid ${T.amber}55` }}>
              <TriangleAlert size={10} style={{ color:T.amber, flexShrink:0, marginTop:1 }}/>
              <span className="text-[10px]" style={{ color: T.amberText }}>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NewPRPage() {
  const router = useRouter()
  const [chatState, setChatState] = React.useState<ChatState>("idle")
  const [inputValue, setInputValue] = React.useState("")
  const [projectName, setProjectName] = React.useState("")
  const [isNameAutoGen, setIsNameAutoGen] = React.useState(false)
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [processStep, setProcessStep] = React.useState(-1)
  const [submittedMessage, setSubmittedMessage] = React.useState("")
  const [submittedProject, setSubmittedProject] = React.useState("")

  const [activeTab, setActiveTab] = React.useState("ai")
  const [savedPRId, setSavedPRId] = React.useState("")
  const [chatMessages, setChatMessages] = React.useState<ChatMsg[]>([])
  const [isChatThinking, setIsChatThinking] = React.useState(false)
  const [followUp, setFollowUp] = React.useState<FollowUpAnswers>({
    delivery: "", budgetCode: "", budgetCustom: "",
  })

  // ── Round A + B state ──
  const [draftPRId, setDraftPRId]           = React.useState("")
  const [confirmedItems, setConfirmedItems] = React.useState<ConfirmedItem[]>([])
  const [roundAComplete, setRoundAComplete] = React.useState(false)
  const [roundBComplete, setRoundBComplete] = React.useState(false)
  const [showItemPicker, setShowItemPicker] = React.useState(false)
  const [itemPickerQuery, setItemPickerQuery] = React.useState("")
  const [inventorySkipped, setInventorySkipped] = React.useState(false)
  const [questioningInput, setQuestioningInput] = React.useState("")
  const [newItemCounter, setNewItemCounter] = React.useState(0)
  // vendorOverrides: subPRId → { vendorName, isApproved }
  const [vendorOverrides, setVendorOverrides] = React.useState<Record<string, { name: string; approved: boolean }>>({})
  const [vendorPickerOpen, setVendorPickerOpen]         = React.useState<string | null>(null)
  const [vendorSearchQuery, setVendorSearchQuery]         = React.useState("")
  const [itemVendorPickerOpen, setItemVendorPickerOpen]   = React.useState<string | null>(null)  // item code
  const [itemVendorSearchQuery, setItemVendorSearchQuery] = React.useState("")
  const [browseItem, setBrowseItem]                       = React.useState<ConfirmedItem | null>(null)
  const [browsePlatform, setBrowsePlatform]               = React.useState<"google" | "shopee" | "lazada" | "1688">("shopee")
  const [browseLoading, setBrowseLoading]                 = React.useState(false)

  // null = fill remaining space | 0 = closed | >0 = fixed px width
  const [rightWidth, setRightWidth] = React.useState<number | null>(0)
  const [isPanelLoading, setIsPanelLoading] = React.useState(false)
  const endRef     = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const dragging   = React.useRef(false)

  const rightOpen = rightWidth !== 0

  // ── Auto-generate project name with debounce ──
  React.useEffect(() => {
    if (projectName && !isNameAutoGen) return          // user typed a name — don't override
    if (inputValue.trim().length < 20) {
      if (isNameAutoGen) { setProjectName(""); setIsNameAutoGen(false) }
      return
    }
    const timer = setTimeout(() => {
      const generated = autoGenerateName(inputValue)
      setProjectName(generated)
      setIsNameAutoGen(true)
    }, 700)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  // When user manually edits the name field, stop auto-gen
  const handleNameChange = (v: string) => {
    setProjectName(v)
    setIsNameAutoGen(false)
  }

  // ── Drag: width = distance from cursor to wrapper's right edge ──
  const onDragMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    e.preventDefault()
  }

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const newW = Math.max(0, Math.min(rect.width - 16 - 500, rect.right - e.clientX))
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
    window.addEventListener("mouseup",   onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
  }, [])

  const totalBlocks   = SUB_PRS.reduce((n, s) => n + s.blocks.length, 0)
  const totalWarnings = SUB_PRS.reduce((n, s) => n + s.warnings.length, 0)

  const resolvedBudgetCode = followUp.budgetCode === "Other" ? followUp.budgetCustom : followUp.budgetCode
  const allQuestionsAnswered = !!followUp.delivery && !!resolvedBudgetCode

  // ── Kick off the processing animation (called from questioning state) ──
  const startProcessing = () => {
    setChatState("processing")
    setProcessStep(-1)
    PROCESSING_STEPS.forEach((_, i) => {
      setTimeout(() => setProcessStep(i), 400 + i * 400)
    })
    setTimeout(() => {
      setChatState("confirmed")
      setProcessStep(-1)
      setIsPanelLoading(true)
      setRightWidth(null)                                  // expand right panel when PR is confirmed
      setTimeout(() => setIsPanelLoading(false), 1200)    // skeleton while panel populates
    }, 400 + PROCESSING_STEPS.length * 400 + 500)
  }

  const handleSubmit = () => {
    if (chatState !== "confirmed") return
    const newId = draftPRId || buildNextPRId(getSavedPRs().length)
    savePR({
      id:                newId,
      title:             submittedProject || "New Purchase Request",
      sub:               (submittedMessage.slice(0, 70) + (submittedMessage.length > 70 ? "…" : "")).trim(),
      message:           submittedMessage,
      requester:         "Lim Wei Xiang",
      requesterInitials: "LW",
      date:              "Today",
      dept:              "IT",
      amount:            "142,806",
      budget:            "150,000",
      status:            "pending",
      phase:             "B",
      purchaseType:      "capex",
      aiFlags:           1,
      createdAt:         Date.now(),
    })
    setSavedPRId(newId)
    if (!draftPRId) setDraftPRId(newId)
    setChatState("submitting")
    setTimeout(() => setChatState("a2-pass"), 2200)
  }

  const handleCreate = () => {
    if (!inputValue.trim()) return
    // ── Assign draft PR ID immediately ──
    const saved = getSavedPRs()
    const newDraftId = buildNextPRId(saved.length)
    setDraftPRId(newDraftId)
    savePR({
      id: newDraftId,
      title: projectName.trim() || autoGenerateName(inputValue) || "New Purchase Request",
      sub: inputValue.slice(0, 70).trim(),
      message: inputValue,
      requester: "Lim Wei Xiang", requesterInitials: "LW",
      date: "Today", dept: "IT",
      amount: "0", budget: "0",
      status: "draft", phase: "A1",
      purchaseType: "capex", aiFlags: 0,
      createdAt: Date.now(),
    })
    // ── Detect items from description ──
    const detected = detectItemsFromDescription(inputValue)
    setConfirmedItems(detected)
    setRoundAComplete(false)
    setRoundBComplete(false)
    setInventorySkipped(false)
    setRightWidth(0)
    setSubmittedMessage(inputValue)
    const finalProject = projectName.trim() || autoGenerateName(inputValue) || "New Purchase Request"
    setSubmittedProject(finalProject)
    setInputValue("")
    setChatMessages([])
    setFollowUp({ delivery: "", budgetCode: "", budgetCustom: "" })
    setChatState("questioning")
  }

  const handleSend = () => {
    const msg = inputValue.trim()
    if (!msg || isChatThinking) return
    setInputValue("")
    setChatMessages(prev => [...prev, { role: "user", text: msg }])
    setIsChatThinking(true)
    // Simulate Jomie thinking, then reply
    const delay = 1200 + Math.floor(msg.length * 8)       // longer msgs get slightly longer "think"
    setTimeout(() => {
      setIsChatThinking(false)
      setChatMessages(prev => [...prev, { role: "ai", text: generateReply(msg) }])
    }, Math.min(delay, 2400))
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Round A item handlers ──
  const handleItemQtyChange = (code: string, qty: number) => {
    setConfirmedItems(prev => prev.map(item => item.code === code ? { ...item, qty } : item))
  }
  const handleItemRemove = (code: string) => {
    setConfirmedItems(prev => prev.filter(item => item.code !== code))
  }
  const handleItemAdd = (master: ItemMasterEntry) => {
    const already = confirmedItems.some(i => i.code === master.code)
    if (!already) {
      setConfirmedItems(prev => [...prev, { ...master, qty: master.moq, stockSkipped: false }])
    }
    setShowItemPicker(false)
    setItemPickerQuery("")
  }
  const handleRequestNew = (data: NewItemFormData) => {
    const counter = newItemCounter + 1
    setNewItemCounter(counter)
    const code = `NEW-${String(counter).padStart(3, "0")}`
    const price = parseFloat(data.unitPrice) || 0
    const isCapex = data.itemType === "capex" || (data.itemType === "standard" && price >= 1000)
    const isService = data.itemType === "service" || data.itemType === "subscription"
    const newItem: ConfirmedItem = {
      code, name: data.name, spec: data.spec,
      uom: data.uom, unitPrice: price,
      itemType: data.itemType,
      purchaseType: isCapex ? "capex" : "opex",
      glCode: isCapex ? "GL-7200-CAPEX" : isService ? "GL-6300-OPEX" : "GL-6100-OPEX",
      vendorCode: "",
      noPhysicalDelivery: isService,
      moq: 1, qty: 1, stockSkipped: true, isNew: true,
    }
    setConfirmedItems(prev => [...prev, newItem])
    setShowItemPicker(false)
    setItemPickerQuery("")
  }
  const handleItemVendorOverride = (itemCode: string, vendorCode: string, vendorName: string, approved: boolean) => {
    setConfirmedItems(prev => prev.map(i => i.code === itemCode
      ? { ...i, preferredVendorCode: vendorCode || vendorName, preferredVendorName: vendorName }
      : i
    ))
    setItemVendorPickerOpen(null)
    setItemVendorSearchQuery("")
    // Reset group-level vendor overrides since grouping has changed
    setVendorOverrides({})
  }
  // Sub-PR level vendor change → propagates preferred vendor to ALL items in that group
  // so buildSubPRGroups naturally re-evaluates and merges/splits accordingly
  const handleVendorOverride = (subPRId: string, vendorCode: string, vendorName: string) => {
    const currentGroups = buildSubPRGroups(confirmedItems)
    const group = currentGroups.find(g => g.id === subPRId)
    if (group) {
      const itemCodesInGroup = new Set(group.items.map(i => i.code))
      setConfirmedItems(prev => prev.map(i =>
        itemCodesInGroup.has(i.code)
          ? { ...i, preferredVendorCode: vendorCode || vendorName, preferredVendorName: vendorName }
          : i
      ))
    }
    setVendorPickerOpen(null)
    setVendorSearchQuery("")
    setVendorOverrides({})
  }
  const handleConfirmAllItems = () => {
    const valid = confirmedItems.filter(i => i.qty >= i.moq)
    setConfirmedItems(valid)
    setRoundAComplete(true)
  }
  const handleConfirmVendors = () => {
    setRoundBComplete(true)
  }

  // ── Questioning input handler (detects /item command) ──
  const handleQuestioningInput = (val: string) => {
    setQuestioningInput(val)
    if (val.endsWith("/item") || val.endsWith("@item")) {
      setShowItemPicker(true)
      setItemPickerQuery("")
      setQuestioningInput("")
    }
  }

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [chatState, processStep, chatMessages])

  const tabs = [
    { key:"ai",      label:"AI Chat" },
    { key:"form",    label:"Form" },
    { key:"upload",  label:"Upload/Import" },
    { key:"reorder", label:"Auto Reorder" },
  ]

  // ── Browse results mock data ──────────────────────────────────────────────
  type BrowseResult = {
    id: string; title: string; seller: string; price: string; priceNum: number
    rating: string; sold: string; delivery: string; badge?: string; url: string
  }

  const getBrowseResults = (item: ConfirmedItem, platform: "google" | "shopee" | "lazada" | "1688"): BrowseResult[] => {
    const kw = item.name.toLowerCase()
    const isLaptop   = /laptop|latitude|thinkpad|macbook/.test(kw)
    const isMonitor  = /monitor|display|screen/.test(kw)
    const isDock     = /dock|thunderbolt|hub/.test(kw)
    const isKeyboard = /keyboard|keys/.test(kw)
    const isPrinter  = /printer|laserjet/.test(kw)
    const isChair    = /chair|ergonomic/.test(kw)
    const isPaper    = /paper|a4/.test(kw)
    const isSoftware = /microsoft|365|software|license/.test(kw)

    const basePrice = item.unitPrice
    const vary = (pct: number) => Math.round(basePrice * pct / 100) * 100

    if (platform === "shopee") {
      if (isLaptop) return [
        { id:"s1", title:"Dell Latitude 5540 i7-13th 16GB 512GB – Local Set + Warranty",  seller:"TechMall_MY",          price:`RM ${(vary(88)).toLocaleString()}`,  priceNum:vary(88),  rating:"4.9", sold:"312 sold",   delivery:"Shipping from KL · Free",    badge:"Preferred", url:"#" },
        { id:"s2", title:"Dell Latitude 5540 Laptop i7 16GB SSD Business – Sealed Box",    seller:"BizTech_Official",     price:`RM ${(vary(92)).toLocaleString()}`,  priceNum:vary(92),  rating:"4.8", sold:"88 sold",    delivery:"Shipping from Selangor",     badge:"Mall",      url:"#" },
        { id:"s3", title:"Dell L5540 13th Gen Laptop – Ready Stock MY",                     seller:"digitalzone_my",       price:`RM ${(vary(85)).toLocaleString()}`,  priceNum:vary(85),  rating:"4.6", sold:"41 sold",    delivery:"Shipping from Penang",       url:"#" },
        { id:"s4", title:"[Bundle] Dell Latitude 5540 + Bag + Mouse – Offer",              seller:"ClearanceTechHub",     price:`RM ${(vary(96)).toLocaleString()}`,  priceNum:vary(96),  rating:"4.5", sold:"17 sold",    delivery:"Shipping from KL",           url:"#" },
      ]
      if (isMonitor) return [
        { id:"s1", title:`LG 27\" 4K UltraFine USB-C Monitor – MY Warranty`,               seller:"LG_Official_MY",       price:`RM ${(vary(90)).toLocaleString()}`,  priceNum:vary(90),  rating:"4.9", sold:"520 sold",   delivery:"Free · Ships from KL",       badge:"Mall",      url:"#" },
        { id:"s2", title:`LG 27UK850-W 4K HDR Monitor USB-C – Sealed`,                     seller:"MonitorWorldMY",       price:`RM ${(vary(84)).toLocaleString()}`,  priceNum:vary(84),  rating:"4.7", sold:"203 sold",   delivery:"Free shipping",              badge:"Preferred", url:"#" },
        { id:"s3", title:`LG UltraFine 27\" 4K IPS – Open Box Excellent Condition`,         seller:"refurb_electronics_my", price:`RM ${(vary(72)).toLocaleString()}`,  priceNum:vary(72),  rating:"4.5", sold:"34 sold",    delivery:"Shipping from Selangor",     url:"#" },
      ]
      if (isPaper) return [
        { id:"s1", title:"Double A A4 80gsm Copy Paper 5 Ream/Box – Original",              seller:"PaperMart_Official",   price:`RM ${(vary(95)).toLocaleString()}`,  priceNum:vary(95),  rating:"4.9", sold:"2.1k sold",  delivery:"Free · Ships Today",         badge:"Mall",      url:"#" },
        { id:"s2", title:"IK Plus A4 Paper 80gsm 5 Reams/Box – Bulk Order",                 seller:"OfficeSupplyMY",       price:`RM ${(vary(88)).toLocaleString()}`,  priceNum:vary(88),  rating:"4.8", sold:"1.4k sold",  delivery:"Free shipping",              badge:"Preferred", url:"#" },
        { id:"s3", title:"A4 80gsm Paper Box (5 Reams) – Same Day Dispatch",                seller:"stationery_hub_kl",    price:`RM ${(vary(82)).toLocaleString()}`,  priceNum:vary(82),  rating:"4.6", sold:"890 sold",   delivery:"Ships from KL · Free",       url:"#" },
        { id:"s4", title:"Mondi Rotatrim A4 Paper 80gsm – Office Bulk Pack",                seller:"BulkBuy_MY",           price:`RM ${(vary(79)).toLocaleString()}`,  priceNum:vary(79),  rating:"4.4", sold:"512 sold",   delivery:"Shipping from Shah Alam",    url:"#" },
      ]
      // default
      return [
        { id:"s1", title:`${item.name} – Authorised Seller MY`,                             seller:"TechMall_MY",          price:`RM ${(vary(88)).toLocaleString()}`,  priceNum:vary(88),  rating:"4.8", sold:"156 sold",   delivery:"Free · Ships from KL",       badge:"Mall",      url:"#" },
        { id:"s2", title:`${item.name} – Original Sealed`,                                  seller:"OfficialbrandsMY",     price:`RM ${(vary(91)).toLocaleString()}`,  priceNum:vary(91),  rating:"4.7", sold:"72 sold",    delivery:"Free shipping",              badge:"Preferred", url:"#" },
        { id:"s3", title:`${item.name} – Ready Stock`,                                      seller:"local_tech_dealer",    price:`RM ${(vary(84)).toLocaleString()}`,  priceNum:vary(84),  rating:"4.5", sold:"38 sold",    delivery:"Shipping from Selangor",     url:"#" },
      ]
    }

    if (platform === "lazada") {
      if (isLaptop) return [
        { id:"l1", title:"Dell Latitude 5540 i7 16GB 512GB SSD – LazMall Official",         seller:"Dell LazMall",         price:`RM ${(vary(93)).toLocaleString()}`,  priceNum:vary(93),  rating:"4.9", sold:"421 sold",   delivery:"Free · LazMall Guarantee",   badge:"LazMall",   url:"#" },
        { id:"l2", title:"Dell Latitude 5540 Business Laptop – Authorised Reseller",        seller:"CompuZone MY",         price:`RM ${(vary(87)).toLocaleString()}`,  priceNum:vary(87),  rating:"4.7", sold:"134 sold",   delivery:"Free shipping",              url:"#" },
        { id:"l3", title:"Dell L5540 i7-13th Gen Laptop – Sealed + 1Y Warranty",            seller:"itech_solutions",      price:`RM ${(vary(85)).toLocaleString()}`,  priceNum:vary(85),  rating:"4.6", sold:"67 sold",    delivery:"Shipping from KL",           url:"#" },
      ]
      if (isPaper) return [
        { id:"l1", title:"Double A A4 80gsm 5 Reams/Box – LazMall",                         seller:"Double A LazMall",     price:`RM ${(vary(96)).toLocaleString()}`,  priceNum:vary(96),  rating:"4.9", sold:"3.2k sold",  delivery:"Free · Same Day",            badge:"LazMall",   url:"#" },
        { id:"l2", title:"IK Plus A4 80gsm Paper Box 5 Reams – Bulk",                       seller:"OfficeWorld LazMall",  price:`RM ${(vary(89)).toLocaleString()}`,  priceNum:vary(89),  rating:"4.8", sold:"1.8k sold",  delivery:"Free shipping",              badge:"LazMall",   url:"#" },
        { id:"l3", title:"Mondi Rotatrim A4 80gsm Copy Paper – Office Pack",                 seller:"paper_supply_my",      price:`RM ${(vary(81)).toLocaleString()}`,  priceNum:vary(81),  rating:"4.5", sold:"740 sold",   delivery:"Shipping from Selangor",     url:"#" },
      ]
      return [
        { id:"l1", title:`${item.name} – LazMall Official`,                                  seller:"Brand LazMall",       price:`RM ${(vary(92)).toLocaleString()}`,  priceNum:vary(92),  rating:"4.9", sold:"288 sold",   delivery:"Free · LazMall Guarantee",   badge:"LazMall",   url:"#" },
        { id:"l2", title:`${item.name} – Authorised Reseller`,                               seller:"TechZone MY",         price:`RM ${(vary(87)).toLocaleString()}`,  priceNum:vary(87),  rating:"4.7", sold:"93 sold",    delivery:"Free shipping",              url:"#" },
        { id:"l3", title:`${item.name} – Ready Stock MY`,                                    seller:"eStore_KL",           price:`RM ${(vary(83)).toLocaleString()}`,  priceNum:vary(83),  rating:"4.6", sold:"45 sold",    delivery:"Ships from KL",              url:"#" },
      ]
    }

    if (platform === "1688") {
      if (isLaptop) return [
        { id:"c1", title:"戴尔 Latitude 5540 i7-13th 商用笔记本 批发",                       seller:"深圳华南电脑批发",     price:`RM ${(vary(48)).toLocaleString()}`,  priceNum:vary(48),  rating:"4.8", sold:"900+ sold",  delivery:"Sea freight ~25 days",       badge:"Gold Supplier", url:"#" },
        { id:"c2", title:"Dell L5540 企业采购 整机 定制配置",                                  seller:"广州商用IT采购",       price:`RM ${(vary(52)).toLocaleString()}`,  priceNum:vary(52),  rating:"4.7", sold:"310 sold",   delivery:"Air freight ~7 days",        url:"#" },
        { id:"c3", title:"笔记本电脑 i7 16G 512G 商务 批量议价",                              seller:"联想华硕戴尔批发中心", price:`RM ${(vary(44)).toLocaleString()}`,  priceNum:vary(44),  rating:"4.5", sold:"1.2k sold",  delivery:"Sea freight ~30 days",       url:"#" },
      ]
      if (isPaper) return [
        { id:"c1", title:"A4 复印纸 80克 整箱批发 500张/包×5",                               seller:"广州纸业批发",         price:`RM ${(vary(38)).toLocaleString()}`,  priceNum:vary(38),  rating:"4.9", sold:"50k+ sold",  delivery:"Sea freight ~20 days",       badge:"Gold Supplier", url:"#" },
        { id:"c2", title:"办公用纸 A4 80g 白度95 整件起批",                                    seller:"山东纸业",             price:`RM ${(vary(32)).toLocaleString()}`,  priceNum:vary(32),  rating:"4.7", sold:"30k sold",   delivery:"Sea freight ~25 days",       url:"#" },
        { id:"c3", title:"A4纸 双面打印 5令/箱 大量采购优惠",                                  seller:"东莞文具批发",         price:`RM ${(vary(35)).toLocaleString()}`,  priceNum:vary(35),  rating:"4.6", sold:"18k sold",   delivery:"Air freight ~8 days",        url:"#" },
      ]
      return [
        { id:"c1", title:`${item.name.slice(0,12)} 批发 企业采购`,                            seller:"深圳品质批发",         price:`RM ${(vary(45)).toLocaleString()}`,  priceNum:vary(45),  rating:"4.8", sold:"1.5k sold",  delivery:"Sea freight ~25 days",       badge:"Gold Supplier", url:"#" },
        { id:"c2", title:`${item.name.slice(0,12)} 整件起批 工厂直销`,                         seller:"广东直供",             price:`RM ${(vary(40)).toLocaleString()}`,  priceNum:vary(40),  rating:"4.6", sold:"620 sold",   delivery:"Air freight ~7 days",        url:"#" },
        { id:"c3", title:`${item.name.slice(0,12)} 企业定制 量大议价`,                         seller:"义乌品质货源",         price:`RM ${(vary(36)).toLocaleString()}`,  priceNum:vary(36),  rating:"4.5", sold:"980 sold",   delivery:"Sea freight ~30 days",       url:"#" },
      ]
    }

    // Google Shopping
    if (isLaptop) return [
      { id:"g1", title:"Dell Latitude 5540 – Tech Solutions MY (Authorised)",                seller:"techsolutionsmy.com",  price:`RM ${(vary(100)).toLocaleString()}`, priceNum:vary(100), rating:"",    sold:"In stock",   delivery:"Delivery 3–5 days",          badge:"Authorised", url:"#" },
      { id:"g2", title:"Dell Latitude 5540 – CompuZone Malaysia",                            seller:"compuzone.com.my",     price:`RM ${(vary(94)).toLocaleString()}`,  priceNum:vary(94),  rating:"",    sold:"In stock",   delivery:"Free delivery KL/Selangor",  url:"#" },
      { id:"g3", title:"Dell L5540 i7 16GB – Harvey Norman Malaysia",                        seller:"harveynorman.com.my",  price:`RM ${(vary(98)).toLocaleString()}`,  priceNum:vary(98),  rating:"",    sold:"In stock",   delivery:"Click & collect or delivery", url:"#" },
      { id:"g4", title:"Dell Latitude 5540 Business – LYN Marketplace",                      seller:"forum.lowyat.net",     price:`RM ${(vary(86)).toLocaleString()}`,  priceNum:vary(86),  rating:"",    sold:"1 unit",     delivery:"Self-collect Petaling Jaya",  url:"#" },
    ]
    return [
      { id:"g1", title:`${item.name} – Official MY Distributor`,                             seller:"official-store.com.my", price:`RM ${(vary(100)).toLocaleString()}`,priceNum:vary(100), rating:"",   sold:"In stock",   delivery:"Delivery 3–5 working days",  badge:"Official",  url:"#" },
      { id:"g2", title:`${item.name} – Authorised Reseller`,                                 seller:"techstore.com.my",     price:`RM ${(vary(93)).toLocaleString()}`,  priceNum:vary(93),  rating:"",    sold:"In stock",   delivery:"Free delivery above RM 200", url:"#" },
      { id:"g3", title:`${item.name} – Low Price MY`,                                        seller:"priceman.com.my",      price:`RM ${(vary(87)).toLocaleString()}`,  priceNum:vary(87),  rating:"",    sold:"In stock",   delivery:"Ships from KL",              url:"#" },
    ]
  }

  const handleOpenBrowse = (item: ConfirmedItem) => {
    setBrowseItem(item)
    setBrowsePlatform("shopee")
    setBrowseLoading(true)
    setRightWidth(null)   // open right panel
    setTimeout(() => setBrowseLoading(false), 600)
  }

  const handleBrowsePlatformChange = (p: "google" | "shopee" | "lazada" | "1688") => {
    setBrowsePlatform(p)
    setBrowseLoading(true)
    setTimeout(() => setBrowseLoading(false), 400)
  }

  const handleSelectBrowseResult = (result: BrowseResult) => {
    if (!browseItem) return
    handleItemVendorOverride(browseItem.code, result.seller, result.seller, false)
    setBrowseItem(null)
  }

  const rightPanelStyle: React.CSSProperties = {
    background:"#F7F7FE", borderRadius:10, overflow:"hidden",
    display: rightWidth === 0 ? "none" : "flex",
    flexDirection:"column",
    flex: rightWidth ? `0 0 ${rightWidth}px` : "1 1 0",
    minWidth: 0,
  }

  return (
    <div ref={wrapperRef} className="flex min-h-0" style={{ height:"calc(100vh - 20px)" }}>

      {/* ── Chat — flex:1, content centered at max 600px ── */}
      <div className="flex flex-col min-h-0 flex-1 min-w-[500px] relative">
        <div className="flex flex-col min-h-0 h-full w-full max-w-[700px] mx-auto"
          style={{ padding: chatState === "idle" ? "0 16px 16px" : "24px 16px 16px", gap:0 }}>

        {/* ══ IDLE: Starter screen ══ */}
        {chatState === "idle" ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center min-h-0"
            style={{ paddingTop:100, paddingBottom:24, gap:24 }}>

            {/* Back button */}
            <div className="absolute top-5 left-5">
              <button onClick={() => router.push("/p2p/purchase-requests")}
                className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70">
                <div className="size-6 rounded-lg flex items-center justify-center">
                  <ChevronLeft size={16} color="#FFFFFF" strokeWidth={1.67}/>
                </div>
                <span className="text-[12px] font-light text-white">Purchase Requests</span>
              </button>
            </div>

            {/* Jomie logomark */}
            <div className="shrink-0" style={{ width:52, height:52 }}>
              <svg width="52" height="52" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
                <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
                <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
                <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
                <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-[20px] font-semibold text-white text-center leading-[30px]"
              style={{ fontFamily:"var(--font-lora), Lora, serif" }}>
              What do you want to purchase today?
            </h1>

            {/* Glass card */}
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-col gap-2 p-4"
                style={{ background:"rgba(255,255,255,0.05)", borderRadius:20 }}>

                {/* Card header */}
                <div className="pb-1">
                  <span className="text-[14px] font-semibold text-white leading-5"
                    style={{ fontFamily:"Inter, sans-serif" }}>New Request</span>
                </div>

                {/* Project Name input with auto-gen badge */}
                <div className="relative">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={projectName}
                      onChange={e => handleNameChange(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      placeholder="Project Name"
                      autoFocus
                      className="w-full text-[14px] leading-5 placeholder-gray-400 text-gray-700 focus:outline-none bg-white px-4"
                      style={{
                        height:52, border:`2px solid ${T.purple}`, borderRadius:15,
                        boxShadow:"0px 0px 0px 3px rgba(93,94,244,0.12)",
                        fontFamily:"Inter, sans-serif",
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => { setIsEditingName(true); setIsNameAutoGen(false) }}
                      className="w-full flex items-center cursor-text"
                      style={{
                        height:52, border:`2px solid ${T.border}`, borderRadius:15,
                        background:"white", padding:"0 16px",
                        boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                      }}>
                      {projectName ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[14px] text-gray-700 truncate flex-1"
                            style={{ fontFamily:"Inter, sans-serif" }}>
                            {projectName}
                          </span>
                          {isNameAutoGen && (
                            <span className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ background:"rgba(93,94,244,0.08)", color: T.purple }}>
                              <Sparkles size={9} strokeWidth={2}/> AI suggested
                            </span>
                          )}
                          <Pencil size={12} style={{ color: T.dimText, flexShrink:0 }} strokeWidth={1.8}/>
                        </div>
                      ) : (
                        <span className="text-[14px]" style={{ color:"#9CA3AF", fontFamily:"Inter, sans-serif" }}>
                          Project Name
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Textarea + action row */}
                <div className="w-full flex flex-col"
                  style={{
                    background:"#FFFFFF", border:`2px solid ${T.border}`,
                    borderRadius:15, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                  }}>
                  <textarea
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Describe what you need — items, quantities, purpose…"
                    className="w-full resize-none px-4 pt-4 pb-2 text-[14px] leading-5 placeholder-gray-400 border-0 focus:outline-none bg-transparent text-gray-700"
                    style={{ height:111, fontFamily:"Inter, sans-serif" }}
                  />
                  {/* Action row */}
                  <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
                    <button className="size-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
                      style={{ background:"#FFFFFF", border:"1px solid #D0D5DD", boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                      <Plus size={16} style={{ color:"#344054" }}/>
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: T.purpleDark }}>
                        Claude Opus 4.8
                        <ChevronDown size={16} style={{ color: T.purpleDark }}/>
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!inputValue.trim()}
                        className="flex items-center justify-center gap-2 px-4 h-10 rounded-[10px] text-[14px] text-white transition-all"
                        style={{
                          background: inputValue.trim() ? T.purple : "rgba(93,94,244,0.4)",
                          border:`1px solid ${inputValue.trim() ? T.purple : "transparent"}`,
                          boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                          cursor: inputValue.trim() ? "pointer" : "not-allowed",
                        }}>
                        Create
                        <Send size={16} color="#FFFFFF"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab pill bar */}
              <div className="flex justify-center">
                <div className="inline-flex items-center p-1 gap-2"
                  style={{ background:"rgba(255,255,255,0.05)", border:`2px solid ${T.border}`, borderRadius:24 }}>
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "h-9 px-3 text-[12px] transition-all cursor-pointer whitespace-nowrap",
                        activeTab===tab.key ? "text-white" : "text-gray-400 hover:text-gray-300",
                      )}
                      style={{
                        borderRadius: activeTab===tab.key ? 20 : 6,
                        background: activeTab===tab.key ? T.activeBg : "transparent",
                        boxShadow: activeTab===tab.key ? "0px 1px 3px rgba(16,24,40,0.1), 0px 1px 2px rgba(16,24,40,0.06)" : "none",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
        <React.Fragment>

        {/* ── Header ── */}
        <div className="shrink-0 pb-6" style={{ borderBottom:`1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <button onClick={() => router.push("/p2p/purchase-requests")}
              className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70">
              <div className="size-6 rounded-lg flex items-center justify-center">
                <ChevronLeft size={16} color="#FFFFFF" strokeWidth={1.67}/>
              </div>
              <span className="text-[12px] font-light text-white">Purchase Request / New Request</span>
            </button>
            <span className="px-2 py-0.5 rounded-md text-[12px]"
              style={{ background: T.indigoBadgeBg, color: T.indigoBadgeFg }}>
              {savedPRId ? `${savedPRId} · Pending` : draftPRId ? `${draftPRId} · Draft` : "Draft"}
            </span>
          </div>
          {/* Editable PR title — InlineEditableTitle component */}
          <InlineEditableTitle
            value={submittedProject || "New Purchase Request"}
            onSave={setSubmittedProject}
            className="text-[18px] font-semibold text-white leading-7 max-w-full"
            inputClassName="text-[18px] font-semibold text-white leading-7"
            style={{ fontFamily: "var(--font-lora), Lora, serif" }}
          />
        </div>

        {/* ── Chat scroll area (with bottom fade mask) ── */}
        <div className="flex-1 min-h-0 relative">
          {/* Bottom fade — softens messages being cut off by the input box */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"
            style={{ background:"linear-gradient(to top, #141137 0%, transparent 100%)" }}/>
        <div className="h-full overflow-y-auto py-4 jomie-scrollbar" style={{ display:"flex", flexDirection:"column", gap:20,
          scrollbarWidth:"thin", scrollbarColor:"rgba(93,94,244,0.2) transparent" }}>

          {/* Jomie greeting */}
          <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out" }}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
              <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
            </div>
            <div className="text-[14px] text-white leading-5">
              Hi Lim Wei Xiang! What do you need to purchase today?
              <br/>
              Describe it naturally — I'll handle item matching, GL codes, approval routing, and sourcing options automatically.
            </div>
          </div>

          {/* User message */}
          <div className="flex flex-col items-end gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out 0.15s both" }}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              <span className="text-[12px] font-bold text-white">Lim Wei Xiang</span>
            </div>
            <div className="w-fit max-w-[85%] px-3.5 py-2.5 text-[14px] text-white leading-5"
              style={{ background:"rgba(255,255,255,0.05)", borderRadius:12 }}>
              {submittedMessage}
            </div>
          </div>

          {/* ── QUESTIONING: Jomie asks follow-up questions ── */}
          {(chatState === "questioning" || chatState === "processing" ||
            chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.5s ease-out 0.3s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>

              {chatState === "questioning" ? (
                /* ── Round A + B UI ── */
                <div className="flex flex-col gap-4">

                  {/* Progress strip */}
                  <ProgressStrip roundADone={roundAComplete} roundBDone={roundBComplete}/>

                  {/* ── Round A: Item Identification ── */}
                  {!roundAComplete ? (
                    <div className="flex flex-col gap-3 p-4 rounded-xl"
                      style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.4)" }}>
                      <div className="text-[13px] text-white leading-5">
                        {confirmedItems.length > 0 ? (
                          <>I found <strong>{confirmedItems.length} item{confirmedItems.length !== 1 ? "s" : ""}</strong> from your description. Confirm quantities and check stock before we proceed.</>
                        ) : (
                          <>I couldn{"'"}t detect specific items from your description. Use <strong>/item</strong> below to search the item master, or describe what you need more specifically.</>
                        )}
                      </div>

                      {/* Item cards */}
                      {confirmedItems.map(item => (
                        <ItemCard
                          key={item.code}
                          item={item}
                          inventorySkipped={inventorySkipped}
                          onQtyChange={handleItemQtyChange}
                          onRemove={handleItemRemove}
                          onSkipInventory={() => setInventorySkipped(true)}
                        />
                      ))}

                      {/* Add item button */}
                      <button
                        onClick={() => { setShowItemPicker(true); setItemPickerQuery("") }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] cursor-pointer transition-colors w-fit"
                        style={{ background:"rgba(93,94,244,0.1)", color:"#A5A6F6", border:"0.5px solid rgba(93,94,244,0.35)" }}>
                        <Plus size={12}/>
                        Add item <span className="font-mono opacity-60 text-[11px]">· type /item to search</span>
                      </button>

                      {/* Subscription duplicate warning */}
                      {confirmedItems.some(i => i.itemType === "subscription") && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background:"rgba(93,94,244,0.08)", border:"0.5px solid rgba(93,94,244,0.3)" }}>
                          <RefreshCw size={10} style={{ color:"#A5A6F6", flexShrink:0, marginTop:1 }}/>
                          <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.55)" }}>
                            <span className="font-semibold" style={{ color:"#A5A6F6" }}>Subscription detected</span>
                            {" "}— Jomie will check for active duplicates before submission. Renewal date shown on each item.
                          </div>
                        </div>
                      )}

                      {/* Service no-delivery note */}
                      {confirmedItems.some(i => i.noPhysicalDelivery) && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background:"rgba(29,158,117,0.06)", border:"0.5px solid rgba(29,158,117,0.25)" }}>
                          <Link2 size={10} style={{ color:"#1D9E75", flexShrink:0, marginTop:1 }}/>
                          <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.5)" }}>
                            <span className="font-semibold" style={{ color:"#1D9E75" }}>Service / subscription items</span>
                            {" "}have no physical delivery — delivery address will be skipped for these lines in vendor matching.
                          </div>
                        </div>
                      )}

                      {/* Confirm button */}
                      {confirmedItems.length > 0 && (
                        <button
                          onClick={handleConfirmAllItems}
                          disabled={confirmedItems.some(i => i.qty < i.moq || i.qty === 0)}
                          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer"
                          style={{
                            background: confirmedItems.every(i => i.qty >= i.moq && i.qty > 0) ? T.purple : "rgba(93,94,244,0.3)",
                            opacity: confirmedItems.some(i => i.qty < i.moq || i.qty === 0) ? 0.5 : 1,
                          }}>
                          <Check size={14} strokeWidth={2.5}/>
                          Confirm {confirmedItems.length} item{confirmedItems.length !== 1 ? "s" : ""} — proceed to vendor matching
                          <ArrowRight size={14}/>
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Round A complete — collapsed summary with edit link */
                    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                      style={{ background:"rgba(29,158,117,0.08)", border:"0.5px solid rgba(29,158,117,0.3)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="size-4 rounded-full flex items-center justify-center shrink-0" style={{ background: T.teal }}>
                          <Check size={8} color="#fff" strokeWidth={3}/>
                        </div>
                        <span className="text-[12px]" style={{ color: T.dimText }}>
                          <span className="text-white font-medium">{confirmedItems.length} items confirmed</span>
                          <span className="mx-1.5" style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                          Total <span className="font-mono text-white">RM {confirmedItems.reduce((s,i) => s+i.qty*i.unitPrice, 0).toLocaleString()}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => { setRoundAComplete(false); setRoundBComplete(false) }}
                        className="text-[10px] font-medium cursor-pointer transition-opacity hover:opacity-70 shrink-0"
                        style={{ color:"#A5A6F6" }}>
                        Edit items
                      </button>
                    </div>
                  )}

                  {/* ── Round B: Vendor Matching ── */}
                  {roundAComplete && !roundBComplete && (() => {
                    const groups = buildSubPRGroups(confirmedItems)
                    const hasMyInvoisIssue = groups.some(g => !g.myInvois && !!g.vendorCode && g.vendorCode !== "" && !(vendorOverrides[g.id]?.approved === true))
                    return (
                      <div className="flex flex-col gap-3 p-4 rounded-xl"
                        style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.4)" }}>
                        <div className="text-[13px] text-white leading-5">
                          I{"'"}ve grouped your {confirmedItems.length} item{confirmedItems.length !== 1 ? "s" : ""} into{" "}
                          <strong>{groups.length} sub-PR{groups.length !== 1 ? "s" : ""}</strong> by vendor and approval tier.
                          Review and suggest a different vendor if needed — final decision is confirmed during Phase C.
                        </div>

                        {/* Sub-PR cards (flat, one per group) */}
                        {groups.map(group => {
                          // vendor display comes from group (already resolved via effectiveVendorCode on items)
                          const displayName     = group.vendorName
                          const displayApproved = group.isApproved
                          const isPickerOpen    = vendorPickerOpen === group.id
                          // Has any item in this group a manual vendor preference set?
                          const hasItemOverride = group.items.some(i => !!i.preferredVendorCode)

                          // Relevant vendors: those that supply any item in this group (by original item master code)
                          const relevantCodes = new Set(group.items.map(i => i.vendorCode).filter(Boolean))
                          const sLower = vendorSearchQuery.toLowerCase()
                          const relevantVendors = VENDOR_MASTER.filter(v =>
                            relevantCodes.has(v.code) && v.name.toLowerCase().includes(sLower)
                          )
                          const otherVendors = VENDOR_MASTER.filter(v =>
                            !relevantCodes.has(v.code) && v.name.toLowerCase().includes(sLower)
                          )
                          const tierColor = group.tier === "FM + CFO" ? { bg:"#EFF6FF", fg:"#1D4ED8" }
                                          : group.tier === "Finance Manager" ? { bg:"#EEF4FF", fg:"#3538CD" }
                                          : { bg:"#F0FDF4", fg:"#16A34A" }

                          return (
                            <div key={group.id} className="rounded-xl overflow-hidden"
                              style={{ border:"0.5px solid rgba(103,100,136,0.3)", background:"rgba(255,255,255,0.03)" }}>

                              {/* Sub-PR header */}
                              <div className="flex items-center justify-between px-3 py-2.5 border-b"
                                style={{ borderColor:"rgba(103,100,136,0.15)" }}>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-semibold" style={{ color:"rgba(255,255,255,0.4)" }}>{group.id}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: tierColor.bg, color: tierColor.fg }}>
                                    {group.tier}
                                  </span>
                                </div>
                                <span className="text-[12px] font-mono font-semibold text-white">
                                  RM {group.total.toLocaleString()}
                                </span>
                              </div>

                              {/* Item lines — each item has its own per-item vendor button */}
                              <div className="flex flex-col px-3 py-2">
                                {group.items.map(item => {
                                  const itemPickerOpen = itemVendorPickerOpen === item.code
                                  const hasOverride = !!item.preferredVendorCode
                                  const iLower = itemVendorSearchQuery.toLowerCase()
                                  // For per-item picker: all vendors are shown (any can supply any item as a preference)
                                  const pickerVendors = VENDOR_MASTER.filter(v =>
                                    !iLower || v.name.toLowerCase().includes(iLower)
                                  )
                                  return (
                                    <div key={item.code} className="flex flex-col py-1.5 border-b last:border-0"
                                      style={{ borderColor:"rgba(103,100,136,0.1)" }}>
                                      <div className="flex items-center gap-1.5 text-[10px]">
                                        {item.isNew
                                          ? <AlertCircle size={8} style={{ color:"#BA7517", flexShrink:0 }}/>
                                          : <div className="size-1 rounded-full shrink-0" style={{ background:"rgba(255,255,255,0.3)" }}/>
                                        }
                                        <span className="flex-1 truncate" style={{ color: item.isNew ? "#BA7517" : "rgba(255,255,255,0.65)" }}>
                                          {item.name}
                                          {item.isNew && <span className="ml-1 text-[8px]">(new item request)</span>}
                                        </span>
                                        <span className="font-mono shrink-0" style={{ color:"rgba(255,255,255,0.35)" }}>×{item.qty}</span>
                                        <span className="font-mono shrink-0" style={{ color:"rgba(255,255,255,0.5)" }}>
                                          {item.unitPrice > 0 ? `RM ${(item.qty * item.unitPrice).toLocaleString()}` : "Price TBD"}
                                        </span>
                                      </div>
                                      {/* Per-item vendor hint + change buttons */}
                                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 ml-3">
                                        {hasOverride && (
                                          <span className="text-[8px] font-semibold px-1 py-0.5 rounded"
                                            style={{ background:"rgba(93,94,244,0.2)", color:"#A5A6F6" }}>
                                            → {item.preferredVendorName}
                                          </span>
                                        )}
                                        {/* Approved-vendor picker toggle */}
                                        <button
                                          onClick={() => {
                                            setItemVendorPickerOpen(itemPickerOpen ? null : item.code)
                                            setItemVendorSearchQuery("")
                                          }}
                                          className="text-[8px] cursor-pointer transition-opacity hover:opacity-70"
                                          style={{ color: hasOverride ? "rgba(255,255,255,0.3)" : "#A5A6F6" }}>
                                          {hasOverride ? "change vendor" : "from approved list"}
                                        </button>
                                        {/* Browse online */}
                                        <button
                                          onClick={() => handleOpenBrowse(item)}
                                          className="flex items-center gap-0.5 text-[8px] cursor-pointer transition-opacity hover:opacity-70"
                                          style={{ color:"rgba(255,255,255,0.45)" }}>
                                          <Search size={7}/>
                                          browse Shopee / Lazada / 1688
                                        </button>
                                        {hasOverride && (
                                          <button
                                            onClick={() => {
                                              setConfirmedItems(prev => prev.map(i =>
                                                i.code === item.code
                                                  ? { ...i, preferredVendorCode: undefined, preferredVendorName: undefined }
                                                  : i
                                              ))
                                              setVendorOverrides({})
                                            }}
                                            className="text-[8px] cursor-pointer transition-opacity hover:opacity-70"
                                            style={{ color:"rgba(255,255,255,0.2)" }}>
                                            ✕ reset
                                          </button>
                                        )}
                                      </div>
                                      {/* Per-item vendor picker dropdown */}
                                      {itemPickerOpen && (
                                        <div className="mt-1.5 ml-3 rounded-lg overflow-hidden"
                                          style={{ border:"0.5px solid rgba(103,100,136,0.5)", background:"#1A1740" }}>
                                          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b"
                                            style={{ borderColor:"rgba(103,100,136,0.3)" }}>
                                            <Search size={10} style={{ color:"rgba(255,255,255,0.3)" }}/>
                                            <input
                                              autoFocus
                                              type="text"
                                              value={itemVendorSearchQuery}
                                              onChange={e => setItemVendorSearchQuery(e.target.value)}
                                              placeholder="Search vendor to source from…"
                                              className="flex-1 bg-transparent text-[11px] text-white placeholder-gray-500 border-0 focus:outline-none"
                                            />
                                          </div>
                                          <div className="px-2 pt-1.5 pb-0.5">
                                            <span className="text-[8px] font-semibold uppercase tracking-wider"
                                              style={{ color:"rgba(255,255,255,0.25)" }}>
                                              Select preferred vendor for this item
                                            </span>
                                          </div>
                                          <div className="overflow-y-auto" style={{ maxHeight:130 }}>
                                            {pickerVendors.map(v => (
                                              <button key={v.code}
                                                onClick={() => handleItemVendorOverride(item.code, v.code, v.name, v.approved)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
                                                style={{ background:"transparent" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <div className="size-1.5 rounded-full shrink-0"
                                                  style={{ background: v.approved ? "#1D9E75" : "#BA7517" }}/>
                                                <span className="text-[11px] text-white flex-1 truncate">{v.name}</span>
                                                {v.approved
                                                  ? <span className="text-[8px] shrink-0" style={{ color:T.teal }}>Approved</span>
                                                  : <span className="text-[8px] shrink-0" style={{ color:"#BA7517" }}>Unapproved</span>
                                                }
                                              </button>
                                            ))}
                                            {/* Custom vendor */}
                                            {itemVendorSearchQuery.length > 2 && !VENDOR_MASTER.some(v => v.name.toLowerCase() === itemVendorSearchQuery.toLowerCase()) && (
                                              <button
                                                onClick={() => handleItemVendorOverride(item.code, itemVendorSearchQuery, itemVendorSearchQuery, false)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 border-t transition-colors"
                                                style={{ borderColor:"rgba(103,100,136,0.2)", background:"transparent" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                <Plus size={9} style={{ color:"#BA7517" }}/>
                                                <span className="text-[11px]" style={{ color:"#BA7517" }}>
                                                  Suggest "{itemVendorSearchQuery}"
                                                </span>
                                                <span className="text-[9px] ml-auto" style={{ color:"rgba(255,255,255,0.3)" }}>Unapproved</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Vendor row */}
                              <div className="px-3 py-2 border-t" style={{ borderColor:"rgba(103,100,136,0.15)", background:"rgba(0,0,0,0.12)" }}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="size-1.5 rounded-full shrink-0"
                                      style={{ background: displayApproved ? "#1D9E75" : group.vendorCode ? "#BA7517" : "rgba(255,255,255,0.3)" }}/>
                                    <span className="text-[10px] font-medium truncate"
                                      style={{ color: hasItemOverride ? "#A5A6F6" : group.vendorCode ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}>
                                      {displayName}
                                    </span>
                                    {hasItemOverride && (
                                      <span className="text-[8px] font-semibold shrink-0 px-1 py-0.5 rounded"
                                        style={{ background:"rgba(93,94,244,0.2)", color:"#A5A6F6" }}>
                                        Your preference
                                      </span>
                                    )}
                                    {!hasItemOverride && displayApproved && (
                                      <span className="text-[8px] shrink-0" style={{ color:T.teal }}>✓ Approved</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setVendorPickerOpen(isPickerOpen ? null : group.id)
                                      setVendorSearchQuery("")
                                    }}
                                    className="text-[9px] font-medium cursor-pointer transition-opacity hover:opacity-70 shrink-0"
                                    style={{ color:"#A5A6F6" }}>
                                    {hasItemOverride ? "Change" : "Suggest vendor"}
                                  </button>
                                </div>

                                {hasItemOverride && !displayApproved && (
                                  <div className="flex items-center gap-1 text-[9px]" style={{ color:"#BA7517" }}>
                                    <AlertCircle size={8}/> Not on approved list — sourcing approval required
                                  </div>
                                )}
                                {hasItemOverride && (
                                  <div className="text-[9px] mt-0.5" style={{ color:"rgba(255,255,255,0.25)" }}>
                                    Final vendor confirmed by approver in Phase C
                                  </div>
                                )}

                                {/* Vendor picker */}
                                {isPickerOpen && (
                                  <div className="mt-2 rounded-lg overflow-hidden" style={{ border:"0.5px solid rgba(103,100,136,0.5)", background:"#1A1740" }}>
                                    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b" style={{ borderColor:"rgba(103,100,136,0.3)" }}>
                                      <Search size={10} style={{ color:"rgba(255,255,255,0.3)" }}/>
                                      <input
                                        autoFocus
                                        type="text"
                                        value={vendorSearchQuery}
                                        onChange={e => setVendorSearchQuery(e.target.value)}
                                        placeholder="Search vendors…"
                                        className="flex-1 bg-transparent text-[11px] text-white placeholder-gray-500 border-0 focus:outline-none"
                                      />
                                    </div>
                                    <div className="overflow-y-auto" style={{ maxHeight:160 }}>
                                      {/* Suggested: vendors that supply items in this group */}
                                      {relevantVendors.length > 0 && (
                                        <>
                                          <div className="px-2 pt-2 pb-1">
                                            <span className="text-[8px] font-semibold uppercase tracking-wider"
                                              style={{ color:"rgba(255,255,255,0.3)" }}>
                                              Suggested — supply these items
                                            </span>
                                          </div>
                                          {relevantVendors.map(v => (
                                            <button key={v.code}
                                              onClick={() => handleVendorOverride(group.id, v.code, v.name)}
                                              className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
                                              style={{ background:"transparent" }}
                                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                              <div className="size-1.5 rounded-full shrink-0"
                                                style={{ background: v.approved ? "#1D9E75" : "#BA7517" }}/>
                                              <span className="text-[11px] text-white flex-1 truncate">{v.name}</span>
                                              {v.approved
                                                ? <span className="text-[8px] shrink-0" style={{ color:T.teal }}>Approved</span>
                                                : <span className="text-[8px] shrink-0" style={{ color:"#BA7517" }}>Unapproved</span>
                                              }
                                            </button>
                                          ))}
                                        </>
                                      )}
                                      {/* Other vendors */}
                                      {otherVendors.length > 0 && (
                                        <>
                                          <div className="px-2 pt-2 pb-1 border-t" style={{ borderColor:"rgba(103,100,136,0.15)" }}>
                                            <span className="text-[8px] font-semibold uppercase tracking-wider"
                                              style={{ color:"rgba(255,255,255,0.2)" }}>
                                              Other vendors
                                            </span>
                                          </div>
                                          {otherVendors.map(v => (
                                            <button key={v.code}
                                              onClick={() => handleVendorOverride(group.id, v.code, v.name)}
                                              className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors"
                                              style={{ background:"transparent", opacity:0.7 }}
                                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.opacity = "1" }}
                                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = "0.7" }}>
                                              <div className="size-1.5 rounded-full shrink-0"
                                                style={{ background: v.approved ? "#1D9E75" : "#BA7517" }}/>
                                              <span className="text-[11px] text-white flex-1 truncate">{v.name}</span>
                                              {!v.approved && <span className="text-[8px] shrink-0" style={{ color:"#BA7517" }}>Unapproved</span>}
                                            </button>
                                          ))}
                                        </>
                                      )}
                                      {/* Custom vendor */}
                                      {vendorSearchQuery.length > 2 && !VENDOR_MASTER.some(v => v.name.toLowerCase() === vendorSearchQuery.toLowerCase()) && (
                                        <button
                                          onClick={() => handleVendorOverride(group.id, vendorSearchQuery, vendorSearchQuery)}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 text-left border-t transition-colors"
                                          style={{ borderColor:"rgba(103,100,136,0.2)", background:"transparent" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                          <Plus size={9} style={{ color:"#BA7517" }}/>
                                          <span className="text-[11px]" style={{ color:"#BA7517" }}>
                                            Suggest "{vendorSearchQuery}"
                                          </span>
                                          <span className="text-[9px] ml-auto shrink-0" style={{ color:"rgba(255,255,255,0.3)" }}>Unapproved</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* MyInvois warning */}
                        {hasMyInvoisIssue && (
                          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                            style={{ background:T.amberLight, border:`0.5px solid ${T.amber}55` }}>
                            <TriangleAlert size={11} style={{ color:T.amber, marginTop:1, flexShrink:0 }}/>
                            <span className="text-[11px]" style={{ color:T.amberText }}>
                              One or more vendors are not registered on MyInvois. Request e-invoice confirmation before PO issuance to protect your SST input credit claim.
                            </span>
                          </div>
                        )}

                        {/* Service / subscription — no delivery note */}
                        {confirmedItems.some(i => i.noPhysicalDelivery) && (
                          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                            style={{ background:"rgba(29,158,117,0.06)", border:"0.5px solid rgba(29,158,117,0.25)" }}>
                            <Link2 size={11} style={{ color:"#1D9E75", marginTop:1, flexShrink:0 }}/>
                            <span className="text-[11px]" style={{ color:"rgba(255,255,255,0.5)" }}>
                              <span style={{ color:"#1D9E75", fontWeight:600 }}>Service / subscription lines</span>
                              {" "}have no physical delivery — delivery address will be skipped for these items during Phase C.
                            </span>
                          </div>
                        )}

                        <button
                          onClick={handleConfirmVendors}
                          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer"
                          style={{ background: T.teal }}>
                          <Check size={14} strokeWidth={2.5}/>
                          Confirm vendor & sub-PR grouping
                          <ArrowRight size={14}/>
                        </button>
                      </div>
                    )
                  })()}

                  {/* Round B complete — show Analyse button */}
                  {roundBComplete && (
                    <>
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                        style={{ background:"rgba(29,158,117,0.08)", border:"0.5px solid rgba(29,158,117,0.3)" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="size-4 rounded-full flex items-center justify-center shrink-0" style={{ background: T.teal }}>
                            <Check size={8} color="#fff" strokeWidth={3}/>
                          </div>
                          <span className="text-[12px]" style={{ color: T.dimText }}>
                            Vendor confirmed — <span className="text-white font-medium">{[...new Set(confirmedItems.map(i=>i.vendorCode))].map(vc=>VENDOR_MASTER.find(v=>v.code===vc)?.name).join(", ")}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => setRoundBComplete(false)}
                          className="text-[10px] font-medium cursor-pointer transition-opacity hover:opacity-70 shrink-0"
                          style={{ color:"#A5A6F6" }}>
                          Edit vendor
                        </button>
                      </div>
                      <button
                        onClick={startProcessing}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer"
                        style={{ background: T.teal }}>
                        <Sparkles size={14} strokeWidth={2}/>
                        Analyse request
                        <ArrowRight size={14} strokeWidth={2}/>
                      </button>
                    </>
                  )}

                </div>
              ) : (
                /* ── Collapsed summary (shown after questioning → processing) ── */
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.3)" }}>
                  <Check size={13} style={{ color: T.teal, flexShrink:0 }} strokeWidth={2.5}/>
                  <span className="text-[12px]" style={{ color: T.dimText }}>
                    <span className="text-white">{confirmedItems.length} items confirmed</span>
                    <span className="mx-2" style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                    <span className="text-white font-mono">RM {confirmedItems.reduce((s,i)=>s+i.qty*i.unitPrice,0).toLocaleString()}</span>
                    <span className="mx-2" style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                    2 sub-PRs
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── PROCESSING: Jomie analysing ── */}
          {(chatState === "processing" || chatState === "confirmed" ||
            chatState === "submitting" || chatState === "a2-pass") && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out 0.2s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>
              <div className="flex flex-col gap-3 px-3.5 py-3 rounded-xl"
                style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.3)" }}>
                <div className="flex items-center gap-2">
                  {chatState === "processing"
                    ? <Loader2 size={13} className="animate-spin shrink-0" style={{ color: T.purple }}/>
                    : <div className="size-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: T.teal }}>
                        <Check size={8} color="#fff" strokeWidth={3}/>
                      </div>
                  }
                  <span className="text-[13px] font-semibold text-white">
                    {chatState === "processing" ? "Analysing your request…" : "Analysis complete"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pl-1">
                  {PROCESSING_STEPS.map((step, i) => (
                    <div key={i}
                      className={cn("flex items-start gap-2 transition-all duration-300",
                        (chatState !== "processing" || processStep >= i) ? "opacity-100" : "opacity-0"
                      )}>
                      <div className="shrink-0 mt-0.5">
                        {chatState === "processing" && processStep === i && i < PROCESSING_STEPS.length - 1
                          ? <Loader2 size={12} className="animate-spin" style={{ color: T.purple }}/>
                          : <div className="size-3 rounded-full flex items-center justify-center"
                              style={{ background: T.teal }}>
                              <Check size={7} color="#fff" strokeWidth={3}/>
                            </div>
                        }
                      </div>
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0">
                        <span className="text-[12px] font-semibold text-white">{step.label}</span>
                        <span className="text-[12px]" style={{ color: T.dimText }}>{step.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIRMED: Jomie analysis response ── */}
          {(chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.5s ease-out 0.15s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>
              <div className="text-[14px] text-white leading-5 space-y-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: T.dimText }}>
                    Analysing your request
                  </div>
                  <div className="space-y-1.5">
                    {PROCESSING_STEPS.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-[14px]">
                        <div className="size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                          style={{ borderColor: T.teal+"66", background: T.tealLight }}>
                          <Check size={9} style={{ color: T.teal }} strokeWidth={2.5}/>
                        </div>
                        <span className="font-semibold text-white">{step.label}</span>
                        <span style={{ color: T.dimText }}>{step.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[14px] text-white leading-5">
                  I've prepared <strong>2 sub-PRs</strong> from your request. All 3 items matched to the item master. Preferred vendor:{" "}
                  <strong>Tech Solutions MY</strong> (last price: Dell L5540 RM 7,200/unit, Feb 2026).
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border"
                    style={{ background: T.tealLight, borderColor: T.teal+"55", color: T.tealText }}>
                    <Check size={10} strokeWidth={2.5}/> Vendor ✓
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border"
                    style={{ background: T.tealLight, borderColor: T.teal+"55", color: T.tealText }}>
                    <Check size={10} strokeWidth={2.5}/> Budget ✓
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border"
                    style={{ background: T.amberLight, borderColor: T.amber+"55", color: T.amberText }}>
                    <TriangleAlert size={10}/> 1 warning
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── SUBMITTING: typing dots ── */}
          {chatState === "submitting" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
              </div>
              <div className="inline-flex items-center px-2.5 py-1.5 gap-1.5">
                {[0,1,2].map(i => (
                  <span key={i} className="size-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay:`${i*150}ms` }}/>
                ))}
              </div>
            </div>
          )}

          {/* ── A2 PASS ── */}
          {chatState === "a2-pass" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>
              <div className="rounded-xl px-4 py-3 space-y-2"
                style={{ background: T.tealLight, border:`1px solid ${T.teal}55` }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} style={{ color: T.teal }}/>
                  <span className="text-[13px] font-bold" style={{ color: T.tealText }}>
                    A2 checks passed — routing to Phase B
                  </span>
                </div>
                <div className="space-y-1 pl-5">
                  {A2_STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <Check size={9} style={{ color: T.teal }} strokeWidth={2.5}/>
                      <span className="font-medium text-gray-700">{s.label}</span>
                      <span className="text-gray-500">· {s.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: T.teal+"33" }}>
                  <ArrowRight size={11} style={{ color: T.teal }}/>
                  <span className="text-[11px] font-medium" style={{ color: T.tealText }}>
                    2 sub-PRs sent · {savedPRId}-A → Razif Abdullah (FM) · {savedPRId}-B → Siti Aisyah
                  </span>
                </div>
              </div>
              <button onClick={() => router.push(savedPRId ? `/p2p/purchase-requests/${savedPRId}` : "/p2p/purchase-requests")}
                className="flex items-center gap-1 text-[12px] font-medium mt-1 cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: T.purple }}>
                <ArrowRight size={13}/> View {savedPRId || "in Purchase Requests"}
              </button>
            </div>
          )}

          {/* ── Follow-up chat messages ── */}
          {chatMessages.map((msg, i) => (
            <div key={i}
              className={cn("flex flex-col gap-1.5", msg.role === "user" && "items-end")}
              style={{ animation:"fadeInUp 0.3s ease-out" }}>
              {msg.role === "user" ? (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[12px] font-light" style={{ color: T.dimText }}>Just now</span>
                    <span className="text-[12px] font-bold text-white">Lim Wei Xiang</span>
                  </div>
                  <div className="w-fit max-w-[85%] px-3.5 py-2.5 text-[14px] text-white leading-5"
                    style={{ background:"rgba(255,255,255,0.05)", borderRadius:12 }}>
                    {msg.text}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                    <span className="text-[12px] font-light" style={{ color: T.dimText }}>Just now</span>
                  </div>
                  <div className="text-[14px] text-white leading-5">{msg.text}</div>
                </>
              )}
            </div>
          ))}

          {/* Jomie thinking indicator */}
          {isChatThinking && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.25s ease-out" }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-fit"
                style={{ background:"rgba(255,255,255,0.05)" }}>
                {[0,1,2].map(i => (
                  <span key={i} className="size-1.5 rounded-full animate-bounce"
                    style={{ background:"rgba(255,255,255,0.4)", animationDelay:`${i*160}ms` }}/>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef}/>
        </div>
        </div>{/* end fade wrapper */}

        {/* ── Bottom sticky: questioning + confirmed/submitted ── */}
        {(chatState === "questioning" || chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
        <div className="shrink-0 pt-4 flex flex-col gap-2">
          {/* Item picker popup — floats above input during questioning */}
          {chatState === "questioning" && showItemPicker && (
            <ItemPickerPopup
              query={itemPickerQuery}
              onQueryChange={setItemPickerQuery}
              onSelect={handleItemAdd}
              onRequestNew={handleRequestNew}
              onClose={() => { setShowItemPicker(false); setItemPickerQuery("") }}
              confirmedCodes={new Set(confirmedItems.map(i => i.code))}
            />
          )}

          <div className="flex flex-col" style={{
            background:"#FFFFFF", border:`2px solid ${T.border}`,
            borderRadius:20, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
          }}>
            <textarea
              value={chatState === "questioning" ? questioningInput : inputValue}
              onChange={e => chatState === "questioning" ? handleQuestioningInput(e.target.value) : setInputValue(e.target.value)}
              onKeyDown={chatState === "questioning" ? undefined : handleChatKeyDown}
              placeholder={chatState === "questioning" ? "Type a message or /item to add items from the master list…" : "Ask Jomie anything about this PR… (↵ to send, ⇧↵ for new line)"}
              rows={3}
              className="w-full resize-none px-4 pt-4 pb-2 text-[14px] leading-5 placeholder-gray-400 border-0 focus:outline-none bg-transparent text-gray-700"
              style={{ fontFamily:"Inter, sans-serif" }}
            />
            <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
              <button className="size-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
                style={{ background:"#FFFFFF", border:"1px solid #D0D5DD", boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                <Plus size={16} style={{ color:"#344054" }}/>
              </button>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] cursor-pointer transition-opacity hover:opacity-80"
                  style={{ color: T.purpleDark }}>
                  Claude Opus 4.8
                  <ChevronDown size={16} style={{ color: T.purpleDark }}/>
                </button>
                <button
                  onClick={handleSend}
                  className="flex items-center justify-center px-3.5 h-8 rounded-lg text-[14px] font-medium text-white transition-all cursor-pointer"
                  style={{
                    background: inputValue.trim() && !isChatThinking ? T.purple : "rgba(93,94,244,0.35)",
                    border:`1px solid ${inputValue.trim() && !isChatThinking ? T.purple : "transparent"}`,
                    boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                    opacity: isChatThinking ? 0.5 : 1,
                  }}>
                  {isChatThinking ? "…" : "Send"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
          <div className="inline-flex items-center p-1 gap-2"
            style={{ background:"rgba(255,255,255,0.05)", border:`2px solid ${T.border}`, borderRadius:24 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "h-9 px-3 text-[12px] transition-all cursor-pointer whitespace-nowrap",
                  activeTab===tab.key ? "text-white" : "text-gray-400 hover:text-gray-300",
                )}
                style={{
                  borderRadius: activeTab===tab.key ? 20 : 6,
                  background: activeTab===tab.key ? T.activeBg : "transparent",
                  boxShadow: activeTab===tab.key ? "0px 1px 3px rgba(16,24,40,0.1), 0px 1px 2px rgba(16,24,40,0.06)" : "none",
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          </div>
        </div>
        )}

        </React.Fragment>
        )}{/* end idle / chat conditional */}
        </div>{/* inner centered */}
      </div>{/* outer flex:1 chat wrapper */}

      {/* ── Drag handle + toggle ── */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width:16, alignSelf:"stretch", position:"relative", cursor:"col-resize" }}
        onMouseDown={onDragMouseDown}>
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px"
          style={{ background:"rgba(103,100,136,0.25)" }}/>
        <button
          onClick={() => setRightWidth(w => w === 0 ? null : 0)}
          onMouseDown={e => e.stopPropagation()}
          className="relative z-10 flex items-center justify-center size-7 rounded-lg transition-all cursor-pointer"
          style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(103,100,136,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.07)")}
          title={rightOpen ? "Hide preview" : "Show preview"}>
          {rightOpen
            ? <ChevronRight size={13} color="rgba(255,255,255,0.6)"/>
            : <ChevronLeft  size={13} color="rgba(255,255,255,0.6)"/>
          }
        </button>
      </div>

      {/* ── Right — Live PR Preview / Browse ── */}
      <div style={rightPanelStyle}>

        {/* ══ Browse mode ══ */}
        {browseItem ? (
          <div className="flex flex-col h-full">
            {/* Browse header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Search size={13} style={{ color: T.purple, flexShrink:0 }}/>
                  <span className="text-[12px] font-semibold text-gray-700 truncate">
                    Sourcing: {browseItem.name}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 ml-5">
                  Compare prices · pick a seller · Jomie will tag it as your preference
                </span>
              </div>
              <button
                onClick={() => { setBrowseItem(null) }}
                className="size-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:bg-gray-100">
                <X size={12} style={{ color:"#9CA3AF" }}/>
              </button>
            </div>

            {/* Platform tabs */}
            <div className="flex items-center gap-0 px-4 pt-3 pb-0 shrink-0">
              {(["shopee","lazada","1688","google"] as const).map(p => {
                const labels: Record<string, string> = { shopee:"Shopee", lazada:"Lazada", "1688":"1688.com", google:"Google" }
                const colors: Record<string, string> = { shopee:"#EE4D2D", lazada:"#0F146D", "1688":"#E31837", google:"#4285F4" }
                const isActive = browsePlatform === p
                return (
                  <button key={p}
                    onClick={() => handleBrowsePlatformChange(p)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold cursor-pointer transition-all border-b-2"
                    style={{
                      color: isActive ? colors[p] : "#9CA3AF",
                      borderColor: isActive ? colors[p] : "transparent",
                      borderRadius:"4px 4px 0 0",
                    }}>
                    <div className="size-2 rounded-full shrink-0" style={{ background: colors[p] }}/>
                    {labels[p]}
                  </button>
                )
              })}
            </div>
            <div className="h-px w-full shrink-0" style={{ background:"#E5E7EB" }}/>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {browseLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 animate-pulse">
                    <Skeleton className="h-3 w-3/4 bg-gray-200 mb-2"/>
                    <Skeleton className="h-4 w-1/3 bg-gray-300 mb-2"/>
                    <Skeleton className="h-2 w-1/2 bg-gray-200"/>
                  </div>
                ))
              ) : getBrowseResults(browseItem, browsePlatform).map(result => {
                const platformColors: Record<string, string> = { shopee:"#EE4D2D", lazada:"#0F146D", "1688":"#E31837", google:"#4285F4" }
                const pc = platformColors[browsePlatform]
                const isCheaper = result.priceNum < browseItem.unitPrice
                const saving = browseItem.unitPrice - result.priceNum
                return (
                  <div key={result.id}
                    className="flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm hover:border-gray-300"
                    style={{ borderColor:"#E5E7EB", background:"#FFFFFF" }}>
                    {/* Result title + badge */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {result.badge && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: pc + "15", color: pc }}>
                              {result.badge}
                            </span>
                          )}
                          {isCheaper && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background:"#DCFCE7", color:"#16A34A" }}>
                              Save RM {saving.toLocaleString()} vs master price
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-gray-700 leading-snug line-clamp-2">{result.title}</p>
                      </div>
                    </div>
                    {/* Price + meta */}
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-bold" style={{ color: isCheaper ? "#16A34A" : "#111827" }}>
                          {result.price}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] text-gray-400">{result.seller}</span>
                          {result.rating && (
                            <span className="text-[9px] text-amber-500">★ {result.rating}</span>
                          )}
                          <span className="text-[9px] text-gray-400">{result.sold}</span>
                        </div>
                        <span className="text-[9px] text-gray-400">{result.delivery}</span>
                      </div>
                      <button
                        onClick={() => handleSelectBrowseResult(result)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer transition-all hover:opacity-80"
                        style={{ background: T.purple, color:"#fff" }}>
                        <Check size={9} strokeWidth={2.5}/>
                        Use this seller
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Disclaimer */}
              <div className="flex items-start gap-1.5 px-2 py-2 rounded-lg mt-1"
                style={{ background:"#FEF9C3" }}>
                <TriangleAlert size={10} style={{ color:"#CA8A04", marginTop:1, flexShrink:0 }}/>
                <p className="text-[9px] leading-relaxed" style={{ color:"#92400E" }}>
                  Prices are indicative only. Unapproved sellers require sourcing approval before PO issuance.
                  Final vendor confirmed by approver in Phase C.
                </p>
              </div>
            </div>
          </div>

        ) : (
          <>{/* ══ PR Preview mode ══ */}

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
                <CircleDot size={11} style={{ color: T.purple }}/>
              </div>
              <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily:"var(--font-pjs)" }}>
                PR preview
              </span>
              {chatState !== "idle" && chatState !== "questioning" && (
                <div className="flex items-center gap-1">
                  <div className="size-1.5 rounded-full animate-pulse" style={{ background: T.purple }}/>
                  <span className="text-[9px] font-mono font-semibold tracking-wider" style={{ color: T.purple }}>LIVE</span>
                </div>
              )}
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background:"#F3F4F6", color:"#6B7280" }}>
              draft
            </span>
          </div>

          {/* Empty / waiting state */}
          {(chatState === "idle" || chatState === "questioning") ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
              <div className="size-12 rounded-xl flex items-center justify-center" style={{ background: T.purpleLight }}>
                <Sparkles size={22} style={{ color: T.purple, opacity:0.4 }}/>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-gray-400 mb-1">
                  {chatState === "questioning" ? "Confirming details…" : "Start typing in the chat"}
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed max-w-[200px]">
                  {chatState === "questioning"
                    ? "Your PR preview will appear once Jomie has everything it needs"
                    : "Your PR will take shape here in real time as Jomie processes your request"
                  }
                </div>
              </div>
            </div>
          ) : isPanelLoading ? (
            /* ── PR preview skeleton while Jomie populates the panel ── */
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background:"#F3F4F6" }}>
                    <Skeleton className="h-3 w-16 bg-gray-200 mb-2" />
                    <Skeleton className="h-5 w-20 bg-gray-300" />
                    <Skeleton className="h-2.5 w-24 bg-gray-200 mt-1" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background:"#F3F4F6" }}>
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-3.5 w-40 bg-gray-200" />
                    <Skeleton className="h-3.5 w-16 bg-gray-300" />
                  </div>
                  <Skeleton className="h-3 w-28 bg-gray-200" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div><Skeleton className="h-2.5 w-12 bg-gray-200 mb-1"/><Skeleton className="h-3 w-20 bg-gray-200"/></div>
                    <div><Skeleton className="h-2.5 w-12 bg-gray-200 mb-1"/><Skeleton className="h-3 w-20 bg-gray-200"/></div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-1.5 pt-1">
                <Skeleton className="h-3 w-24 bg-gray-200" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-3 w-28 bg-gray-100" />
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-11 w-full rounded-xl bg-gray-200 mt-auto" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

              {/* 4 metric cards */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:"Items",            value:"3",          sub:"matched to master" },
                  { label:"Est. total",        value:"RM 142,806", sub:"2 sub-PRs" },
                  { label:"POs to generate",   value:"2",          sub:"after approval" },
                  { label:"Approvals needed",  value:"FM + CFO",   sub:"highest tier" },
                ].map((card, i) => (
                  <div key={i} className="rounded-lg bg-white border px-3 py-2.5"
                    style={{ borderColor:"#E0DED8", borderWidth:"0.5px" }}>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{card.label}</div>
                    <div className="text-[14px] font-bold text-gray-900 leading-tight">{card.value}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Sub-PR cards */}
              {SUB_PRS.map(sub => <SubPRCard key={sub.id} sub={sub}/>)}

              {/* Controls status */}
              <div className="rounded-lg bg-white border px-3 py-3" style={{ borderColor:"#E0DED8", borderWidth:"0.5px" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Controls status</div>
                {[
                  { label:"Budget",           ok:true, note:"IT-CAPEX-2024 active" },
                  { label:"Item codes",        ok:true, note:"All 3 matched" },
                  { label:"Vendor status",     ok:true, note:"All approved" },
                  { label:"Approval routing",  ok:true, note:"FM + CFO required" },
                  { label:"Duplicate check",   ok:true, note:"Clear" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="size-4 rounded-full flex items-center justify-center shrink-0" style={{ background: T.tealLight }}>
                      <Check size={9} style={{ color: T.teal }} strokeWidth={2.5}/>
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 flex-1">{row.label}</span>
                    <span className="text-[10px] text-gray-400">{row.note}</span>
                  </div>
                ))}
              </div>

              {/* Tax intelligence */}
              <div className="rounded-lg bg-white border px-3 py-3" style={{ borderColor:"#E0DED8", borderWidth:"0.5px" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2.5">Tax intelligence</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">GL codes assigned</span>
                    <span className="font-semibold text-gray-800">3 / 3</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: T.purple }}/>
                    <span className="text-[10px] text-gray-600">Capital allowance eligible — IA 20% + AA 14% (Sch 3)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: T.amber }}/>
                    <span className="text-[10px] text-gray-600">SST input tax — validate e-invoice (S38 SST Act 2018)</span>
                  </div>
                </div>
              </div>

              <div className="px-1">
                <code className="text-[9px] font-mono text-gray-300 leading-relaxed block">
                  itemMaster.md:v2.1 · procurementPolicy.md:v1.3 · approvalMatrix.md:v1.2
                </code>
              </div>

            </div>
          )}

          {/* Confirm & Submit */}
          {chatState !== "idle" && chatState !== "questioning" && (
            <div className="px-4 pb-5 pt-3 border-t border-gray-100 shrink-0 space-y-2.5">
              {totalBlocks === 0 && (
                <div className="flex items-center gap-2 text-[11px]" style={{ color: T.teal }}>
                  <CheckCircle2 size={12} className="shrink-0"/>
                  <span>No blockers — ready to submit</span>
                  {totalWarnings > 0 && (
                    <span className="ml-auto flex items-center gap-1" style={{ color: T.amber }}>
                      <TriangleAlert size={10}/> {totalWarnings} warning
                    </span>
                  )}
                </div>
              )}
              <button
                disabled={chatState==="submitting" || chatState==="processing"}
                onClick={handleSubmit}
                className={cn(
                  "w-full h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all",
                  (chatState==="submitting" || chatState==="processing") && "opacity-70 cursor-not-allowed",
                )}
                style={{
                  background: chatState==="a2-pass" ? T.teal : T.teal,
                  color:"#fff",
                }}>
                {chatState==="processing"  && <><Loader2 size={13} className="animate-spin"/> Analysing…</>}
                {chatState==="confirmed"   && <><CheckCircle2 size={13}/> Confirm and submit →</>}
                {chatState==="submitting"  && <><Loader2 size={13} className="animate-spin"/> Running checks…</>}
                {chatState==="a2-pass"     && <><CheckCircle2 size={13}/> Submitted — View PRs</>}
              </button>
              <p className="text-center text-[10px] text-gray-300 leading-relaxed">
                A2 duplicate and split-PR checks run automatically on submit.
              </p>
            </div>
          )}

        </>)}

      </div>{/* end rightPanelStyle */}

    </div>
  )
}
