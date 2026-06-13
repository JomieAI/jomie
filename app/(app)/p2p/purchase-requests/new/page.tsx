"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronLeft, ChevronRight, Send, Plus, Check, CheckCircle2,
  Building2, TriangleAlert, ArrowRight, Loader2, ShieldCheck,
  CircleDot, Package, Briefcase, RefreshCw, ChevronDown, Pencil,
  Search, X, Minus, AlertCircle, Link2, Warehouse, ChevronUp,
  Store, Globe, Lock, PanelRightClose,
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

type ChatState = "idle" | "item-picking" | "questioning" | "processing" | "initial" | "confirmed" | "submitting" | "a2-pass"

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

type ChatActionType = "open-picker" | "proceed-to-vendor" | "edit-items" | "confirm-vendors" | "change-vendor"

interface ChatMsgAction {
  label: string
  primary?: boolean
  action: ChatActionType
}

interface ChatMsg {
  role: "user" | "ai"
  text: string
  thinking?: string
  actions?: ChatMsgAction[]
}

// ─── Intent detection ────────────────────────────────────────────────────────

function detectIntent(msg: string): "affirm" | "edit" | "question" | "item-request" | "other" {
  const m = msg.toLowerCase().trim()
  if (/^(yes|ok|okay|sure|proceed|confirm|looks good|that'?s? (right|correct|good|fine)|go ahead|continue|next|right|correct|sounds good|agreed|perfect|done|ready|yep|yup|let'?s go|please do|do it)/.test(m))
    return "affirm"
  if (/\b(no|wait|change|edit|wrong|different|update|modify|add more|remove|adjust|undo|back|again|re-?open|not right|incorrect)\b/.test(m))
    return "edit"
  if (/^(why|what|how|when|who|which|explain|tell me|help|what is|what are|can you|could you|is there|are there)\b/.test(m))
    return "question"
  if (/\b(need|want|buy|purchase|order|add|get|item|product|laptop|monitor|printer|chair|paper|keyboard|mouse|dock|software|subscription|service)\b/.test(m))
    return "item-request"
  return "other"
}

// ─── Smart Jomie reply engine ─────────────────────────────────────────────────

interface JomieContext {
  roundAComplete: boolean
  roundBComplete: boolean
  confirmedItems: ConfirmedItem[]
  submittedMessage: string
}

interface JomieReply {
  text: string
  actions?: ChatMsgAction[]
  sideEffect?: "open-picker" | "proceed-to-vendor" | "confirm-vendors"
}

function buildItemSummaryText(items: ConfirmedItem[]): string {
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const lines = items.map(i =>
    `· ${i.name} ×${i.qty}${i.unitPrice > 0 ? ` — RM ${(i.qty * i.unitPrice).toLocaleString()}` : " — Price TBD"}`
  ).join("\n")
  return `${lines}\n\nTotal estimate: RM ${total.toLocaleString()}`
}

function buildVendorSummaryText(groups: SubPRGroup[], _items: ConfirmedItem[]): string {
  const lines = groups.map(g => {
    const tier = g.tier
    const total = `RM ${g.total.toLocaleString()}`
    const vendorStatus = g.isApproved ? "✓ Approved vendor" : g.vendorCode ? "⚠ Unapproved vendor" : "⚠ Vendor TBD"
    const myInvoisWarn = !g.myInvois && g.vendorCode ? " · Not on MyInvois" : ""
    return `📦 ${g.id} · ${g.vendorName} · ${total} · ${tier}\n   ${vendorStatus}${myInvoisWarn}`
  })
  const warnings: string[] = []
  if (groups.some(g => !g.myInvois && !!g.vendorCode))
    warnings.push("⚠ One or more vendors are not registered on MyInvois — request e-invoice before PO is issued.")
  if (groups.some(g => !g.isApproved && !!g.vendorCode))
    warnings.push("⚠ Some vendors are not on the approved list — sourcing approval will be required.")
  return lines.join("\n") + (warnings.length ? "\n\n" + warnings.join("\n") : "")
}

// ─── Groq LLM integration ────────────────────────────────────────────────────

interface GroqReply {
  thinking?: string
  text: string
  action?: "open-picker" | "proceed-to-vendor" | "confirm-vendors" | "apply-vendor" | "reset-vendor" | null
  payload?: { itemCode?: string; vendorCode?: string; vendorName?: string }
  buttons?: ChatMsgAction[]
}

function buildJomieSystemPrompt(ctx: {
  roundAComplete: boolean
  roundBComplete: boolean
  confirmedItems: ConfirmedItem[]
  submittedMessage: string
}): string {
  const { roundAComplete, roundBComplete, confirmedItems, submittedMessage } = ctx
  const hasItems = confirmedItems.length > 0

  let stateDesc = ""
  if (!roundAComplete) {
    stateDesc = hasItems
      ? `CURRENT STATE: Round A — user is building their item list. They have ${confirmedItems.length} item(s) in cart:\n${confirmedItems.map(i => `  - ${i.name} x${i.qty} @ RM${i.unitPrice} (${i.code})`).join("\n")}\nHelp them confirm or adjust the cart, then guide them to vendor matching.`
      : "CURRENT STATE: Round A — user has no items yet. Help them add items via the item picker."
  } else if (roundAComplete && !roundBComplete) {
    const groups = buildSubPRGroups(confirmedItems)
    const groupDesc = groups.map(g =>
      `  - ${g.id}: vendor="${g.vendorName || "TBD"}" (${g.isApproved ? "approved" : "UNAPPROVED"}) — RM${g.total.toLocaleString()} — ${g.tier}${!g.myInvois ? " [NOT on MyInvois]" : ""}\n    Items: ${g.items.map(i => `${i.name} [code:${i.code}]${i.preferredVendorName ? ` (user chose: ${i.preferredVendorName})` : ""}`).join(", ")}`
    ).join("\n")
    const vendorList = `V001=Tech Solutions MY Sdn Bhd (approved, no MyInvois), V002=Digital Hub Malaysia Sdn Bhd (approved, MyInvois), V003=Office World Trading Sdn Bhd (approved, MyInvois), V004=Paper Plus Trading (NOT approved, no MyInvois), V005=Microsoft Malaysia Sdn Bhd (approved, MyInvois), V006=Logitech Authorised Reseller (approved, MyInvois)`
    stateDesc = `CURRENT STATE: Round B — vendor grouping review. Items grouped into ${groups.length} sub-PR(s):\n${groupDesc}\n\nAVAILABLE VENDORS:\n${vendorList}\n\nYOUR ROLE AS AGENT IN ROUND B:\nYou can directly apply vendor changes — you don't just redirect to the UI. When user asks you to change or suggest a vendor:\n1. If you know which item they mean (from context), proceed directly. If not, ask which item with buttons for each item name.\n2. Recommend the best vendor from the available list based on: approval status, MyInvois status, and what makes sense for the item category. Explain your reasoning briefly.\n3. Ask user to confirm with a button, then set action: "apply-vendor" with payload: { itemCode, vendorCode, vendorName }.\n4. To reset an item back to Jomie's original suggestion, use action: "reset-vendor" with payload: { itemCode }.\n5. You can also just apply immediately if the user's intent is clear and they've already confirmed.\nOnly other valid action in Round B: confirm-vendors (when user confirms the whole grouping).`
  } else {
    stateDesc = "CURRENT STATE: Round B complete. Vendor grouping is confirmed. Guide user toward Round C (budget code, delivery date, urgency)."
  }

  return `You are Jomie, an intelligent AI procurement assistant inside a Malaysian audit firm's ERP system. You are warm, sharp, and conversational — like a knowledgeable colleague who happens to know procurement inside out.

${stateDesc}

ORIGINAL PR REQUEST: "${submittedMessage || "(none yet)"}"

YOUR PERSONALITY:
- You understand what people *mean*, not just what they *say*. Read context and intent.
- When unsure, ask a short clarifying question with 2–3 button options — never just give a generic "I don't understand" response.
- Be proactive: if you know the next logical step, suggest it naturally. Don't wait for the user to ask.
- Keep replies short and conversational (2–4 lines max). No walls of text.
- Light Malaysian professional tone is fine — direct, helpful, no jargon overload.
- You never approve/reject PRs — you guide and inform.

WHAT YOU KNOW (Malaysian procurement context):
- Approval tiers: <RM5k = Dept Head only · RM5k–RM50k = Dept Head + Finance Manager · >RM50k = Dept Head + FM + CFO
- MyInvois: vendors must be on Malaysia's e-invoice platform. If not, flag it and recommend requesting e-invoice before PO.
- Approved vendor list: unapproved vendors trigger a sourcing approval step — warn the user proactively.
- CAPEX (single unit >RM1k or tagged capex): GL-7200-CAPEX, may need asset registration.
- Services/subscriptions: non-physical, GL-6300-OPEX.
- MOQ: minimum order quantity — items below MOQ are flagged; user can override with vendor waiver.

AVAILABLE ACTIONS — fire these when you're confident of the user's intent:
- "open-picker" — open item search/add picker. Fire when user wants to add, search, or browse items.
- "proceed-to-vendor" — advance to vendor grouping (Round B). Fire when user is ready to move past the item list.
- "confirm-vendors" — lock vendor grouping. ONLY fire when user clearly and explicitly confirms (e.g. "confirm", "looks good", "lock it in", "done"). NOT for "proceed" or "yes" in Round B — those should show the grouping first.

HOW TO HANDLE AMBIGUITY — this is important:
- If a message is short or vague (e.g. "open", "change", "yes", "next"), use the conversation history to infer intent. Don't ask for clarification if context makes it obvious.
- If genuinely unclear, respond with a friendly question and 2–3 button options. Example: user says "change" in Round B → you could ask "What would you like to change?" with buttons like ["Change a vendor", "Edit items", "Something else"].
- Never repeat the same response twice. If the user seems stuck, offer a different angle or a direct suggestion.
- If the user asks something off-topic (weather, jokes, etc.), gently redirect: acknowledge briefly, then guide back to the PR.

CRITICAL ACTION RULES:
- If roundAComplete is FALSE and you are describing vendor grouping or sub-PRs to the user → you MUST set action: "proceed-to-vendor". Do not just describe grouping without triggering it.
- If roundAComplete is FALSE and user expresses intent to proceed (e.g. "proceed", "go ahead", "next", "yes", "match vendors") AND they have items → set action: "proceed-to-vendor".
- If roundBComplete is FALSE and user clearly confirms vendors (e.g. "confirm", "confirmed", "looks good", "lock it in") → set action: "confirm-vendors".
- If user wants to change/suggest a vendor for an item → clarify which item if needed, suggest the best vendor with reasoning, confirm with user, then set action: "apply-vendor" + payload. Act as an agent — do the change, don't just redirect.
- If user wants to reset a vendor back to Jomie's original suggestion → set action: "reset-vendor" + payload with itemCode.
- If user wants to add/search items → set action: "open-picker".

RESPONSE FORMAT — always return valid JSON, nothing else:
{
  "thinking": "1-2 sentences: what you understood from the user's message and why you're responding this way",
  "text": "Your conversational reply (max 4 lines, use \\n for line breaks)",
  "action": "open-picker | proceed-to-vendor | confirm-vendors | apply-vendor | reset-vendor | null",
  "buttons": [
    { "label": "Short button label", "primary": true, "action": "action-string" }
  ]
}

- "thinking" is always required — briefly explain your reasoning (shown to user as collapsible context).
- "action" triggers automatically in the UI — must match one of the valid actions or null.
- For apply-vendor: also include "payload": { "itemCode": "<item code string>", "vendorCode": "<V00X>", "vendorName": "<full vendor name>" }
- For reset-vendor: also include "payload": { "itemCode": "<item code string>" }
- "buttons" are shown as clickable chips — always include relevant next-step buttons.
- action in buttons must be one of: open-picker, proceed-to-vendor, confirm-vendors, edit-items.
- Respond ONLY with the JSON object. No markdown fences, no explanation outside it.`
}

// ── LLM provider config ──────────────────────────────────────────────────────
// Set NEXT_PUBLIC_LLM_PROVIDER to "openrouter" to use OpenRouter instead of Groq.
// Set NEXT_PUBLIC_OPENROUTER_API_KEY with your OpenRouter key.
// OpenRouter free models: meta-llama/llama-3.3-70b-instruct:free, google/gemini-flash-1.5-8b
const LLM_CONFIG = {
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    getKey: () => process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "",
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    getKey: () => process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ?? "",
  },
}

class LLMError extends Error {
  constructor(public code: "rate_limit" | "auth" | "network" | "parse", message: string) {
    super(message)
  }
}

async function callGroqJomie(
  userMessage: string,
  ctx: {
    roundAComplete: boolean
    roundBComplete: boolean
    confirmedItems: ConfirmedItem[]
    submittedMessage: string
  },
  history: ChatMsg[],
  hintAction?: string | null
): Promise<GroqReply> {
  const provider = (process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "groq") as "groq" | "openrouter"
  const cfg = LLM_CONFIG[provider] ?? LLM_CONFIG.groq
  const apiKey = cfg.getKey()

  if (!apiKey || apiKey === "your_groq_api_key_here") {
    const legacyCtx: JomieContext = { roundAComplete: ctx.roundAComplete, roundBComplete: ctx.roundBComplete, confirmedItems: ctx.confirmedItems, submittedMessage: ctx.submittedMessage }
    const r = smartReply(userMessage, legacyCtx)
    return { text: r.text, action: r.sideEffect ?? null, buttons: r.actions }
  }

  const historyMessages = history.slice(-8).map(m => ({
    role: m.role === "ai" ? "assistant" : "user" as "user" | "assistant",
    content: m.text,
  }))

  const systemPrompt = buildJomieSystemPrompt(ctx) +
    (hintAction ? `\n\nIMPORTANT: User clicked a button with intended action "${hintAction}". Set "action": "${hintAction}" in your response.` : "")

  let response: Response
  try {
    response = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(provider === "openrouter" ? { "HTTP-Referer": "https://jomie.app", "X-Title": "Jomie" } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    })
  } catch {
    throw new LLMError("network", "Network error — check your connection.")
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    const isRateLimit = response.status === 429 || errText.includes("rate_limit")
    // Try to extract reset time from Groq's error message
    const timeMatch = errText.match(/try again in (\d+m[\d.]+s)/i)
    const resetIn = timeMatch ? ` Try again in ${timeMatch[1]}.` : ""
    if (isRateLimit) throw new LLMError("rate_limit", `Daily token limit reached.${resetIn}`)
    if (response.status === 401) throw new LLMError("auth", "Invalid API key.")
    throw new LLMError("network", `API error ${response.status}.`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content ?? "{}"

  let parsed: GroqReply
  try {
    parsed = JSON.parse(raw) as GroqReply
  } catch {
    throw new LLMError("parse", "Jomie returned an unexpected response.")
  }

  const validActions = ["open-picker", "proceed-to-vendor", "confirm-vendors", "apply-vendor", "reset-vendor"]
  if (parsed.action && !validActions.includes(parsed.action)) parsed.action = null

  return parsed
}

function jomieErrorMessage(err: unknown): string {
  if (err instanceof LLMError) {
    if (err.code === "rate_limit") return `⏳ Jomie's daily AI quota is used up. ${err.message} You can still use the right panel to manage vendors manually.`
    if (err.code === "auth") return "🔑 Jomie can't connect — API key issue. Check your .env.local."
    if (err.code === "network") return "📡 Can't reach Jomie's AI right now. Check your connection and try again."
    if (err.code === "parse") return "Jomie got confused by the response format. Please try again."
  }
  return "Sorry, I had trouble processing that. Please try again."
}

// ─── Smart Jomie reply engine (legacy fallback) ───────────────────────────────

function smartReply(msg: string, ctx: JomieContext): JomieReply {
  const m = msg.toLowerCase()
  const intent = detectIntent(msg)
  const { roundAComplete, roundBComplete, confirmedItems } = ctx
  const hasItems = confirmedItems.length > 0

  // ── Post-Round B: free-form Q&A ──
  if (roundBComplete) {
    if (/vendor|supplier/.test(m)) return { text: "The vendors shown are from your approved vendor master. You can override per item using the 'from approved list' option in the vendor grouping view. Final vendor selection is confirmed during Phase C (Quotation)." }
    if (/budget|cost|gl|code/.test(m)) return { text: "GL codes and budget codes are assigned in Round C. I'll suggest the most appropriate budget code based on the item types and your department's active codes." }
    if (/approv|who|sign/.test(m)) return { text: "Approval routing is determined by sub-PR value and your company's approval matrix. High-value lines (>RM 50k) route to Finance Manager + CFO. Standard lines route to Dept Head only." }
    return { text: "Ready to proceed to Round C — budget code, delivery date, and urgency. Just say 'continue' whenever you're ready.", actions:[{ label:"Continue to Round C →", primary:true, action:"confirm-vendors" }] }
  }

  // ── Round A in progress ──
  if (!roundAComplete) {
    if (intent === "affirm" && hasItems) {
      return {
        text: `Great! Here's your cart:\n\n${buildItemSummaryText(confirmedItems)}\n\nShall I group these by vendor and work out the approval routing?`,
        actions: [
          { label:"Yes, proceed to vendor matching →", primary:true, action:"proceed-to-vendor" },
          { label:"Edit items", action:"edit-items" },
        ],
        sideEffect: undefined,
      }
    }
    if (intent === "affirm" && !hasItems) {
      return {
        text: "Let's add items to your PR first. Search the item master or describe what you need.",
        actions:[{ label:"Open item picker", primary:true, action:"open-picker" }],
      }
    }
    if (intent === "edit" || m.includes("add") || m.includes("more") || m.includes("picker")) {
      return {
        text: "Opening the item picker — search for items and tap + to add them to your cart.",
        actions:[],
        sideEffect: "open-picker",
      }
    }
    if (intent === "item-request") {
      const keyword = msg.trim()
      return {
        text: `I'll open the item picker pre-filtered for "${keyword}". Tap + on any item to add it to your cart.`,
        actions:[{ label:`Search "${keyword.slice(0, 30)}" in picker →`, primary:true, action:"open-picker" }],
      }
    }
    if (intent === "question") {
      if (/split|sub.pr|why.*2|why.*two/.test(m))
        return { text: "Sub-PRs are split by vendor and approval tier. Items from the same vendor that exceed RM 50k per line get a higher approval tier (Finance Manager or FM + CFO) than lower-value items. This enforces your approval matrix automatically." }
      if (/vendor|supplier/.test(m))
        return { text: "Vendors are matched from your approved vendor master based on each item's default supplier. You can override vendor per item using the item picker. Unapproved vendors trigger a sourcing approval step." }
      if (/budget|gl|code/.test(m))
        return { text: "GL codes are pre-mapped per item type in your item master. Budget codes are assigned in Round C — I'll suggest the most active code for your department." }
      if (/moq|minimum|qty|quantity/.test(m))
        return { text: "MOQ (Minimum Order Quantity) is the minimum quantity your vendor requires per order line. Items below MOQ are flagged — you can override if you have a waiver from the vendor." }
      return { text: "Good question! Could you give me a bit more context about what you'd like to know? I can help with vendors, budget, approval routing, GL codes, or item specifications." }
    }
    // Default: nudge toward adding items
    if (!hasItems) {
      return {
        text: "I couldn't quite catch that. To get started, describe what you need to purchase — or open the item picker to search your item master.",
        actions:[{ label:"Open item picker", primary:true, action:"open-picker" }],
      }
    }
    return {
      text: `You have ${confirmedItems.length} item${confirmedItems.length !== 1 ? "s" : ""} in your cart. Ready to proceed to vendor matching, or do you want to adjust anything?`,
      actions:[
        { label:"Yes, proceed →", primary:true, action:"proceed-to-vendor" },
        { label:"Edit items", action:"edit-items" },
      ],
    }
  }

  // ── Round A done, Round B in progress ──
  if (roundAComplete && !roundBComplete) {
    const groups = buildSubPRGroups(confirmedItems)
    const vendorSummary = buildVendorSummaryText(groups, confirmedItems)
    const confirmActions: ChatMsgAction[] = [
      { label:"Confirm vendors →", primary:true, action:"confirm-vendors" },
      { label:"I want to change a vendor", action:"change-vendor" },
    ]

    // Confirm when user is explicit — standalone "confirm/confirmed/done" counts in Round B context
    const isExplicitConfirm =
      /^(confirm|confirmed|done|lock it in|looks good|approve|finalize|finalise)$/.test(m) ||
      /\b(confirm vendor|vendor confirm|confirmed vendor|approve vendor|lock vendor|finalise vendor|finalize vendor)\b/.test(m)
    if (isExplicitConfirm) {
      return {
        text: "✓ Vendors confirmed.",
        actions:[{ label:"Continue to Round C →", primary:true, action:"confirm-vendors" }],
        sideEffect: "confirm-vendors",
      }
    }

    // "Show / where is / what is" the grouping
    if (/\b(show|where|see|view|display|grouping|sub.?pr|breakdown|which vendor|what vendor)\b/.test(m)) {
      return {
        text: `Here's the current vendor grouping:\n\n${vendorSummary}\n\nHappy with this? Confirm to proceed, or override a vendor if needed.`,
        actions: confirmActions,
      }
    }

    // General affirm ("yes", "ok", "proceed") — show grouping, guide to button
    if (intent === "affirm") {
      return {
        text: `Here's how your items are grouped:\n\n${vendorSummary}\n\nIf that looks right, tap 'Confirm vendors →' to lock it in.`,
        actions: confirmActions,
      }
    }

    if (intent === "edit" || /vendor|change|override|different/.test(m)) {
      return {
        text: "Open the vendor override panel to change the vendor for any sub-PR.",
        actions:[{ label:"Override vendors →", primary:true, action:"change-vendor" }],
      }
    }
    if (/why|split|2 pr|two pr/.test(m)) {
      return { text: "Sub-PRs are split when items from the same vendor have different approval tiers — lines above RM 50k need Finance Manager approval, while lower-value lines only need Dept Head sign-off. This enforces your approval matrix automatically." }
    }
    if (/myinvois|e.invoice|tax|sst/.test(m)) {
      return { text: "MyInvois is Malaysia's e-invoicing system under LHDN. Vendors not registered on MyInvois can't issue validated e-invoices, which affects your SST input credit claim (S38, SST Act 2018). Request the vendor's registration before the PO is issued." }
    }
    // Default — show grouping
    return {
      text: `Current vendor grouping:\n\n${vendorSummary}\n\nConfirm to proceed to Round C, or override a vendor if needed.`,
      actions: confirmActions,
    }
  }

  return { text: "Let me know if there's anything you'd like to change or if you have any questions before submitting." }
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

// ─── Slash command popover ────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { cmd: "/add-item", desc: "Search & add items to your PR cart", icon: "+" },
]

interface SlashPopoverProps {
  query: string          // everything after "/"
  selectedIndex: number
  onSelect: (cmd: string) => void
  onClose: () => void
}

function SlashPopover({ query, selectedIndex, onSelect, onClose: _onClose }: SlashPopoverProps) {
  const filtered = SLASH_COMMANDS.filter(c =>
    c.cmd.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase())
  )
  if (filtered.length === 0) return null
  return (
    <div
      className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden shadow-2xl z-50"
      style={{ background:"#1A1740", border:"1px solid rgba(103,100,136,0.6)" }}>
      <div className="px-3 py-1.5 border-b" style={{ borderColor:"rgba(103,100,136,0.25)" }}>
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.3)" }}>
          Commands
        </span>
      </div>
      {filtered.map((c, i) => (
        <button
          key={c.cmd}
          onClick={() => onSelect(c.cmd)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer"
          style={{ background: i === selectedIndex ? "rgba(93,94,244,0.2)" : "transparent" }}
          onMouseEnter={e => { if (i !== selectedIndex) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseLeave={e => { if (i !== selectedIndex) e.currentTarget.style.background = "transparent" }}>
          <div className="size-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background:"rgba(93,94,244,0.2)", fontSize:14, color:"#A5A6F6", fontWeight:700 }}>
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white">{c.cmd}</div>
            <div className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>{c.desc}</div>
          </div>
          {i === selectedIndex && (
            <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0" style={{ background:"rgba(93,94,244,0.25)", color:"#A5A6F6" }}>
              ↵ Enter
            </span>
          )}
        </button>
      ))}
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
  fullHeight?: boolean
}

function ItemPickerPopup({ query, onQueryChange, onSelect, onRequestNew, onClose, confirmedCodes, fullHeight }: ItemPickerProps) {
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
    <div className={fullHeight ? "flex flex-col min-h-0 h-full" : "rounded-xl overflow-hidden shadow-2xl"}
      style={fullHeight ? {} : { background:"#1A1740", border:"1px solid rgba(103,100,136,0.6)" }}>
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0" style={{ borderColor:"rgba(103,100,136,0.3)", background: fullHeight ? "rgba(255,255,255,0.03)" : undefined }}>
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
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor:"rgba(103,100,136,0.15)", background:"rgba(93,94,244,0.06)" }}>
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
        <div className={fullHeight ? "flex-1 overflow-y-auto min-h-0 jomie-scrollbar" : "overflow-y-auto"} style={fullHeight ? {} : { maxHeight:256 }}>
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

// ─── Vendor override panel (right panel — change-vendor mode) ───────────────

const T_LIGHT = {
  bg: "#F7F7FE",
  border: "#E4E4FB",
  text: "#1C1B4B",
  dimText: "#6B6CA8",
  purple: "#5D5EF4",
  purpleLight: "rgba(93,94,244,0.08)",
}

interface VendorOverridePanelProps {
  confirmedItems: ConfirmedItem[]
  onVendorSelect: (itemCode: string, vendorCode: string, vendorName: string) => void
  onBrowse: (item: ConfirmedItem) => void
  onConfirm: () => void
  hideHeader?: boolean
}

function VendorOverridePanel({
  confirmedItems, onVendorSelect, onBrowse, onConfirm, hideHeader,
}: VendorOverridePanelProps) {
  const groups = buildSubPRGroups(confirmedItems)
  const totalItems = confirmedItems.reduce((s, i) => s + i.qty, 0)
  const [itemPickerOpen, setItemPickerOpen] = React.useState<string | null>(null)
  const [itemSearch, setItemSearch] = React.useState("")

  const tierColor = (tier: string) => {
    if (tier === "FM + CFO") return { bg:"#FFF0F0", fg:"#DC2626" }
    if (tier === "FM") return { bg:"#FFF7ED", fg:"#EA580C" }
    return { bg:"#F0FDF4", fg:"#16A34A" }
  }

  const filteredVendors = VENDOR_MASTER.filter(v =>
    v.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    v.code.toLowerCase().includes(itemSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full" style={{ background: T_LIGHT.bg }}>
      {/* Header — hidden when universal nav header is present */}
      {!hideHeader && (
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T_LIGHT.border }}>
          <div>
            <div className="text-[14px] font-bold" style={{ color: T_LIGHT.text }}>Vendor Grouping</div>
            <div className="text-[11px] mt-0.5" style={{ color: T_LIGHT.dimText }}>{groups.length} sub-PR{groups.length !== 1 ? "s" : ""} · {totalItems} item{totalItems !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[12px] font-semibold cursor-pointer"
            style={{ background: T_LIGHT.purple, color:"#fff" }}>
            <Check size={12} strokeWidth={2.5}/> Confirm grouping
          </button>
        </div>
      )}

      {/* Sub-PR groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {groups.map(group => {
          const tc = tierColor(group.tier)
          return (
            <div key={group.id} className="rounded-xl border overflow-hidden" style={{ background:"#fff", borderColor: T_LIGHT.border }}>

              {/* Group header */}
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: T_LIGHT.border, background: T_LIGHT.purpleLight }}>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold font-mono" style={{ color: T_LIGHT.purple }}>{group.id}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: tc.bg, color: tc.fg }}>{group.tier}</span>
                </div>
                <span className="text-[12px] font-mono font-semibold" style={{ color: T_LIGHT.text }}>RM {group.total.toLocaleString()}</span>
              </div>

              {/* Jomie's vendor suggestion row */}
              <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor:"#F0F0FA", background:"#FAFAFF" }}>
                <div className="size-5 rounded flex items-center justify-center shrink-0" style={{ background:"rgba(93,94,244,0.08)" }}>
                  <Store size={10} style={{ color: T_LIGHT.purple }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold truncate" style={{ color: T_LIGHT.text }}>
                    {group.vendorName || "Vendor TBD"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[9px] font-medium" style={{ color: T_LIGHT.dimText }}>Jomie's suggestion</span>
                    {group.isApproved && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background:"#F0FDF4", color:"#16A34A" }}>✓ Approved</span>}
                    {!group.isApproved && group.vendorCode && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background:"#FFF7ED", color:"#EA580C" }}>⚠ Unapproved</span>}
                    {!group.myInvois && group.vendorCode && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background:"#FEF9C3", color:"#A16207" }}>No MyInvois</span>}
                  </div>
                </div>
              </div>

              {/* Item rows — each with Change vendor + Browse */}
              {group.items.map(item => {
                // Active vendor for this item: user override takes priority, else group's Jomie suggestion
                const activeVendorCode = item.preferredVendorCode || group.vendorCode
                const isOverridden = !!item.preferredVendorName
                // Exclude active vendor from picker so user can't re-select the same one
                const availableVendors = filteredVendors.filter(v => v.code !== activeVendorCode)
                return (
                <div key={item.code} style={{ borderBottom:"1px solid #F0F0FA" }}>
                  {/* Item row */}
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium truncate" style={{ color: T_LIGHT.text }}>{item.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: T_LIGHT.dimText }}>
                        {item.qty} × RM {item.unitPrice.toLocaleString()} = RM {(item.qty * item.unitPrice).toLocaleString()}
                        {isOverridden && (
                          <span className="ml-1.5 font-medium" style={{ color: T_LIGHT.purple }}>· {item.preferredVendorName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Reset to Jomie's suggestion — only shown when item has been overridden */}
                      {isOverridden && (
                        <button
                          onClick={() => onVendorSelect(item.code, "", "")}
                          className="flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-medium cursor-pointer transition-all"
                          style={{ background:"transparent", color:"#94A3B8", border:"1px solid #E2E8F0" }}
                          title="Reset to Jomie's suggestion">
                          <X size={8}/>
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => { setItemPickerOpen(itemPickerOpen === item.code ? null : item.code); setItemSearch("") }}
                        className="flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-medium cursor-pointer transition-all"
                        style={{
                          background: itemPickerOpen === item.code ? T_LIGHT.purple : "transparent",
                          color: itemPickerOpen === item.code ? "#fff" : T_LIGHT.purple,
                          border:`1px solid ${T_LIGHT.purple}`,
                        }}>
                        <RefreshCw size={8}/>
                        {isOverridden ? "Change" : "Change vendor"}
                      </button>
                      <button
                        onClick={() => onBrowse(item)}
                        className="flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-medium cursor-pointer transition-all shrink-0"
                        style={{ background:"rgba(93,94,244,0.08)", color: T_LIGHT.purple, border:"1px solid rgba(93,94,244,0.15)" }}>
                        <Globe size={8}/>
                        Browse
                      </button>
                    </div>
                  </div>

                  {/* Inline vendor search — shown when this item's picker is open */}
                  {itemPickerOpen === item.code && (
                    <div className="mx-3 mb-2.5 rounded-lg overflow-hidden border" style={{ borderColor: T_LIGHT.border }}>
                      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: T_LIGHT.border, background:"#F7F7FE" }}>
                        <Search size={11} style={{ color: T_LIGHT.dimText, flexShrink:0 }}/>
                        <input
                          autoFocus
                          type="text"
                          value={itemSearch}
                          onChange={e => setItemSearch(e.target.value)}
                          placeholder="Search vendors…"
                          className="flex-1 text-[12px] bg-transparent focus:outline-none"
                          style={{ color: T_LIGHT.text }}/>
                        <button onClick={() => setItemPickerOpen(null)}>
                          <X size={11} style={{ color: T_LIGHT.dimText }}/>
                        </button>
                      </div>
                      <div className="max-h-44 overflow-y-auto bg-white">
                        {availableVendors.map(v => (
                          <button
                            key={v.code}
                            onClick={() => { onVendorSelect(item.code, v.code, v.name); setItemPickerOpen(null); setItemSearch("") }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-medium truncate" style={{ color: T_LIGHT.text }}>{v.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {v.approved && <span className="text-[9px] px-1 rounded" style={{ background:"#F0FDF4", color:"#16A34A" }}>Approved</span>}
                                {v.myInvois && <span className="text-[9px] px-1 rounded" style={{ background:"#EFF6FF", color:"#1D4ED8" }}>MyInvois</span>}
                              </div>
                            </div>
                            <ChevronRight size={11} style={{ color:"#CBD5E1", flexShrink:0 }}/>
                          </button>
                        ))}
                        {availableVendors.length === 0 && (
                          <div className="px-3 py-3 text-center text-[11px]" style={{ color: T_LIGHT.dimText }}>No other vendors found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: T_LIGHT.border }}>
        <button onClick={onConfirm}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold cursor-pointer transition-all"
          style={{ background: T_LIGHT.purple, color:"#fff" }}>
          <Check size={14} strokeWidth={2.5}/>
          Confirm vendor grouping →
        </button>
      </div>
    </div>
  )
}

// ─── Cart panel (right panel — item-picking mode) ─────────────────────────────

interface CartPanelProps {
  items: ConfirmedItem[]
  onQtyChange: (code: string, qty: number) => void
  onRemove: (code: string) => void
  onConfirm: () => void
}

function CartPanel({ items, onQtyChange, onRemove, onConfirm }: CartPanelProps) {
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const typeConfig: Record<ItemType,{ bg:string; fg:string }> = {
    standard:     { bg:"rgba(100,100,120,0.1)",  fg:"#9CA3AF" },
    capex:        { bg:"#EFF6FF",                fg:"#1D4ED8" },
    service:      { bg:"#ECFDF5",               fg:"#059669"  },
    subscription: { bg:"#EEF2FF",               fg:"#4F46E5"  },
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:"#E5E3F0" }}>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg flex items-center justify-center" style={{ background:"#EEEDFE" }}>
            <Package size={13} style={{ color:"#5D5EF4" }}/>
          </div>
          <span className="text-[13px] font-semibold" style={{ color:"#1C1B4B" }}>Item Cart</span>
        </div>
        {items.length > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"#EEEDFE", color:"#5D5EF4" }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6" style={{ color:"#9CA3AF" }}>
          <div className="size-12 rounded-2xl flex items-center justify-center" style={{ background:"#F0EFF8" }}>
            <Package size={22} style={{ color:"#C4C2E0" }}/>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-medium mb-1" style={{ color:"#6B7280" }}>Cart is empty</div>
            <div className="text-[11px] leading-relaxed" style={{ color:"#9CA3AF" }}>
              Search for items on the left and tap{" "}
              <span className="font-bold" style={{ color:"#5D5EF4" }}>+</span>{" "}
              to add them here
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Items list */}
          <div className="flex-1 overflow-y-auto min-h-0 jomie-scrollbar" style={{ padding:"8px 12px", display:"flex", flexDirection:"column", gap:8 }}>
            {items.map(item => {
              const tc = typeConfig[item.itemType ?? "standard"]
              return (
                <div key={item.code} className="rounded-xl overflow-hidden"
                  style={{ background:"#FFFFFF", border:"0.5px solid #E8E6F4", boxShadow:"0 1px 3px rgba(93,94,244,0.06)" }}>
                  {/* Item info row */}
                  <div className="flex items-start gap-2.5 px-3 pt-2.5 pb-2">
                    <div className="size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: tc.bg }}>
                      <Package size={11} style={{ color: tc.fg }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] font-semibold leading-tight" style={{ color:"#1C1B4B" }}>{item.name}</span>
                        <button
                          onClick={() => onRemove(item.code)}
                          className="size-4 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:bg-red-50 mt-0.5">
                          <X size={9} style={{ color:"#D1C9E8" }}/>
                        </button>
                      </div>
                      <div className="text-[9px] font-mono mt-0.5" style={{ color:"#9B97C0" }}>{item.code}</div>
                      {item.isNew && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded mt-0.5 inline-block"
                          style={{ background:"#FAEEDA", color:"#633806" }}>NEW REQUEST</span>
                      )}
                    </div>
                  </div>
                  {/* Qty + price row */}
                  <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                    <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border:"0.5px solid #DDD9F0" }}>
                      <button
                        onClick={() => onQtyChange(item.code, Math.max(0, item.qty - 1))}
                        className="size-6 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50">
                        <Minus size={9} style={{ color:"#6B7280" }}/>
                      </button>
                      <span className="text-[11px] font-mono font-semibold px-1 min-w-[20px] text-center" style={{ color:"#1C1B4B" }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onQtyChange(item.code, item.qty + 1)}
                        className="size-6 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50">
                        <Plus size={9} style={{ color:"#6B7280" }}/>
                      </button>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px]" style={{ color:"#9B97C0" }}>RM</span>
                      <span className="text-[13px] font-bold font-mono" style={{ color:"#1C1B4B" }}>
                        {(item.qty * item.unitPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {/* MOQ warning */}
                  {item.qty < item.moq && (
                    <div className="px-3 pb-2 flex items-center gap-1 text-[9px]" style={{ color:"#BA7517" }}>
                      <AlertCircle size={9}/> Min. order qty: {item.moq} {item.uom}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer: total + confirm */}
          <div className="shrink-0 border-t px-4 py-3 flex flex-col gap-2.5" style={{ borderColor:"#E5E3F0" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ color:"#6B7280" }}>
                {items.length} item{items.length !== 1 ? "s" : ""} · est. total
              </span>
              <span className="text-[16px] font-bold font-mono" style={{ color:"#1C1B4B" }}>
                RM {total.toLocaleString()}
              </span>
            </div>
            {items.some(i => i.itemType === "subscription") && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background:"#EEF2FF", border:"0.5px solid #C7D2FE" }}>
                <RefreshCw size={9} style={{ color:"#4F46E5" }}/>
                <span className="text-[9px]" style={{ color:"#4338CA" }}>Subscriptions detected — duplicate check on submit</span>
              </div>
            )}
            <button
              onClick={onConfirm}
              disabled={items.some(i => i.qty < i.moq || i.qty === 0)}
              className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-[12px] font-semibold text-white transition-all cursor-pointer"
              style={{
                background: items.every(i => i.qty >= i.moq && i.qty > 0) ? "#5D5EF4" : "rgba(93,94,244,0.35)",
                opacity: items.some(i => i.qty < i.moq || i.qty === 0) ? 0.6 : 1,
              }}>
              <Check size={13} strokeWidth={2.5}/>
              Confirm {items.length} item{items.length !== 1 ? "s" : ""} — proceed to vendor matching
              <ArrowRight size={13}/>
            </button>
          </div>
        </>
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
  const [showVendorOverride, setShowVendorOverride] = React.useState(false)
  const [vendorPickerOpen, setVendorPickerOpen]         = React.useState<string | null>(null)
  const [vendorSearchQuery, setVendorSearchQuery]         = React.useState("")
  const [itemVendorPickerOpen, setItemVendorPickerOpen]   = React.useState<string | null>(null)  // item code
  const [itemVendorSearchQuery, setItemVendorSearchQuery] = React.useState("")
  const [browseItem, setBrowseItem]                       = React.useState<ConfirmedItem | null>(null)
  const [browsePlatform, setBrowsePlatform]               = React.useState<"google" | "shopee" | "lazada" | "1688">("shopee")
  const [browseLoading, setBrowseLoading]                 = React.useState(false)

  // ── Slash command state ──
  const [slashOpen, setSlashOpen]           = React.useState(false)
  const [slashQuery, setSlashQuery]         = React.useState("")
  const [slashSelectedIdx, setSlashSelectedIdx] = React.useState(0)

  // ── Item picker panel state ──
  const prevChatStateRef    = React.useRef<ChatState>("questioning")
  const wasAtVendorStepRef  = React.useRef(false)   // true if picker was opened from Round B vendor step
  const [itemPickerSnapshot, setItemPickerSnapshot] = React.useState<ConfirmedItem[]>([])
  const [widgetHeight, setWidgetHeight]             = React.useState(340)
  const widgetDragging = React.useRef(false)

  // null = fill remaining space | 0 = closed | >0 = fixed px width
  const [rightWidth, setRightWidth] = React.useState<number | null>(0)
  const [isPanelLoading, setIsPanelLoading] = React.useState(false)
  type RightPanelView = "items" | "vendors" | "budget" | "context" | "review"
  const [rightPanelView, setRightPanelView] = React.useState<RightPanelView>("review")
  const [rightNavOpen, setRightNavOpen] = React.useState(false)
  const rightNavRef = React.useRef<HTMLDivElement>(null)
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

  // ── Widget vertical drag (item picker height) ──
  const onWidgetDragMouseDown = (e: React.MouseEvent) => {
    widgetDragging.current = true
    e.preventDefault()
  }
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!widgetDragging.current || !wrapperRef.current) return
      const wrapperRect = wrapperRef.current.getBoundingClientRect()
      const newH = Math.max(200, Math.min(wrapperRect.height * 0.75, wrapperRect.bottom - e.clientY))
      setWidgetHeight(newH)
    }
    const onUp = () => { widgetDragging.current = false }
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
    // Build initial Jomie response
    const initialMsg: ChatMsg = detected.length > 0
      ? {
          role: "ai",
          text: `I found ${detected.length} item${detected.length !== 1 ? "s" : ""} from your description:\n\n${buildItemSummaryText(detected)}\n\nDoes this look right? You can adjust quantities, add more items, or proceed.`,
          actions: [
            { label:"Open item picker to review / add more", action:"open-picker" },
            { label:"Looks right — proceed to vendor matching →", primary:true, action:"proceed-to-vendor" },
          ],
        }
      : {
          role: "ai",
          text: "I couldn't detect specific items from your description. Use the item picker to search your item master and add what you need.",
          actions: [{ label:"Open item picker", primary:true, action:"open-picker" }],
        }
    setChatMessages([initialMsg])
    setFollowUp({ delivery: "", budgetCode: "", budgetCustom: "" })
    setChatState("questioning")
  }

  const handleSend = () => {
    const msg = inputValue.trim()
    if (!msg || isChatThinking) return
    setInputValue("")
    setChatMessages(prev => [...prev, { role: "user", text: msg }])
    setIsChatThinking(true)
    const ctx = { roundAComplete, roundBComplete, confirmedItems, submittedMessage }
    const currentHistory = [...chatMessages]
    callGroqJomie(msg, ctx, currentHistory).then(reply => {
      setIsChatThinking(false)
      setChatMessages(prev => [...prev, { role: "ai", text: reply.text, thinking: reply.thinking, actions: reply.buttons }])
      if (reply.action === "open-picker") setTimeout(handleOpenItemPicker, 100)
      if (reply.action === "proceed-to-vendor") handleProceedToVendor()
      if (reply.action === "confirm-vendors") handleConfirmVendorMatching()
      if (reply.action === "apply-vendor" && reply.payload?.itemCode && reply.payload?.vendorCode)
        handleItemVendorOverride(reply.payload.itemCode, reply.payload.vendorCode, reply.payload.vendorName ?? "", true)
      if (reply.action === "reset-vendor" && reply.payload?.itemCode)
        handleItemVendorOverride(reply.payload.itemCode, "", "", false)
    }).catch((err) => {
      setIsChatThinking(false)
      setChatMessages(prev => [...prev, { role: "ai", text: jomieErrorMessage(err) }])
    })
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
  const handleItemVendorOverride = (itemCode: string, vendorCode: string, vendorName: string, _approved: boolean) => {
    setConfirmedItems(prev => prev.map(i => i.code === itemCode
      ? { ...i, preferredVendorCode: vendorCode || undefined, preferredVendorName: vendorName || undefined }
      : i
    ))
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
    // Only lock item list — roundAComplete is set exclusively by handleProceedToVendor
    const valid = confirmedItems.filter(i => i.qty >= i.moq)
    setConfirmedItems(valid)
  }
  const handleConfirmVendors = () => {
    setRoundBComplete(true)
  }

  // ── Item picker widget handlers ──
  const handleOpenItemPicker = () => {
    prevChatStateRef.current = chatState as Exclude<ChatState, "item-picking">
    wasAtVendorStepRef.current = roundAComplete   // remember if we came from vendor step
    setItemPickerSnapshot([...confirmedItems])
    // Do NOT reset roundAComplete — preserves vendor-step context across the picker session
    setItemPickerQuery("")
    setRightWidth(null)    // open right panel → cart view
    setBrowseItem(null)    // exit browse mode if active
    setChatState("item-picking")
  }
  const handleDoneItemPicker = () => {
    setChatState(prevChatStateRef.current)
    const valid = confirmedItems.filter(i => i.qty >= i.moq && i.qty > 0)
    if (valid.length === 0) return

    const isReEdit = wasAtVendorStepRef.current

    if (isReEdit) {
      // Re-edit after vendor step — rebuild grouping and re-confirm
      setConfirmedItems(valid)
      setRoundAComplete(true)
      setRoundBComplete(false)
      setShowVendorOverride(true)
      setRightWidth(null)
      setRightPanelView("vendors")
    } else {
      // Initial item-add — show items in right panel
      setRightPanelView("items")
    }

    // 1. Post user message describing what they did
    const userText = isReEdit
      ? `I've updated my item list — ${valid.length} item${valid.length !== 1 ? "s" : ""} now.`
      : `Done! I've added ${valid.length} item${valid.length !== 1 ? "s" : ""} to the cart.`
    const userMsg: ChatMsg = { role: "user", text: userText }

    // 2. Call Groq so Jomie acknowledges and responds intelligently
    const ctx = {
      roundAComplete: isReEdit ? true : roundAComplete,
      roundBComplete: false,
      confirmedItems: valid,
      submittedMessage,
    }
    const currentHistory = [...chatMessages]
    setChatMessages(prev => [...prev, userMsg])
    setIsChatThinking(true)

    callGroqJomie(userText, ctx, [...currentHistory, userMsg]).then(reply => {
      setIsChatThinking(false)
      const aiMsg: ChatMsg = { role:"ai", text: reply.text, thinking: reply.thinking, actions: reply.buttons }
      setChatMessages(prev => [...prev, aiMsg])
      // Do NOT auto-fire proceed-to-vendor or confirm-vendors here —
      // Jomie should ask the user first; actions fire only when user clicks the button
      if (reply.action === "apply-vendor" && reply.payload?.itemCode && reply.payload?.vendorCode)
        handleItemVendorOverride(reply.payload.itemCode, reply.payload.vendorCode, reply.payload.vendorName ?? "", true)
    }).catch((err) => {
      setIsChatThinking(false)
      // For rate-limit / auth errors, show the error message directly
      if (err instanceof LLMError && (err.code === "rate_limit" || err.code === "auth")) {
        setChatMessages(prev => [...prev, { role:"ai", text: jomieErrorMessage(err) }])
        return
      }
      // For other errors, fall back to static messages so the flow continues
      const fallback: ChatMsg = isReEdit ? {
        role: "ai",
        text: `Got it — I've re-grouped your updated ${valid.length} item${valid.length !== 1 ? "s" : ""}. Check the right panel for the new vendor grouping. Happy with it?`,
        actions: [
          { label:"Confirm vendors →", primary:true, action:"confirm-vendors" },
          { label:"I want to change a vendor", action:"proceed-to-vendor" },
        ],
      } : {
        role: "ai",
        text: `Updated! Here's your cart:\n\n${buildItemSummaryText(valid)}\n\nReady to proceed to vendor matching, or want to add more items?`,
        actions: [
          { label:"Yes, proceed to vendor matching →", primary:true, action:"proceed-to-vendor" },
          { label:"Add more items", action:"open-picker" },
        ],
      }
      setChatMessages(prev => [...prev, fallback])
    })
  }
  const handleProceedToVendor = () => {
    const valid = confirmedItems.filter(i => i.qty >= i.moq && i.qty > 0)
    setConfirmedItems(valid)
    setRoundAComplete(true)       // single place this is set
    setShowVendorOverride(true)
    setRightPanelView("vendors")  // single place the right panel switches to vendors
    setRightWidth(null)           // ensure right panel is open/visible
    const groups = buildSubPRGroups(valid)
    const vendorMsg: ChatMsg = {
      role: "ai",
      text: `I've grouped your ${valid.length} item${valid.length !== 1 ? "s" : ""} into ${groups.length} sub-PR${groups.length !== 1 ? "s" : ""} by vendor and approval tier:\n\n${buildVendorSummaryText(groups, valid)}\n\nHappy with this grouping? You can override vendor per item if needed.`,
      actions: [
        { label:"Confirm vendors →", primary:true, action:"confirm-vendors" },
        { label:"I want to change a vendor", action:"change-vendor" },
      ],
    }
    setChatMessages(prev => [...prev, vendorMsg])
  }

  const handleConfirmVendorMatching = () => {
    setRoundBComplete(true)
    setShowVendorOverride(false)   // close vendor override panel if open
    setVendorPickerOpen(null)
    handleConfirmVendors()
    const doneMsg: ChatMsg = {
      role: "ai",
      text: "✓ Vendor grouping confirmed. All sub-PRs are ready.\n\nNext up: Round C — budget code, delivery date, and urgency flag. This tells Finance and the approvers when and where items are needed.\n\nReady to continue?",
      actions: [{ label:"Continue to Round C →", primary:true, action:"confirm-vendors" }],
    }
    setChatMessages(prev => [...prev, doneMsg])
  }

  const handleConfirmVendorOverride = () => {
    setShowVendorOverride(false)
    setVendorPickerOpen(null)
    setVendorSearchQuery("")
    // Re-run grouping with updated preferred vendors
    const valid = confirmedItems.filter(i => i.qty >= i.moq && i.qty > 0)
    setConfirmedItems(valid)
    setRoundAComplete(true)
    setRoundBComplete(false)
    const groups = buildSubPRGroups(valid)
    const vendorMsg: ChatMsg = {
      role: "ai",
      text: `Updated vendor grouping — ${valid.length} item${valid.length !== 1 ? "s" : ""} in ${groups.length} sub-PR${groups.length !== 1 ? "s" : ""}:\n\n${buildVendorSummaryText(groups, valid)}\n\nHappy with this grouping?`,
      actions: [
        { label:"Confirm vendors →", primary:true, action:"confirm-vendors" },
        { label:"I want to change a vendor", action:"change-vendor" },
      ],
    }
    setChatMessages(prev => [...prev, vendorMsg])
  }

  const handleCancelItemPicker = () => {
    // Restore snapshot (undo picker changes) — only if no items were previously confirmed
    if (itemPickerSnapshot.length === 0 && confirmedItems.length > 0) {
      setConfirmedItems([])
    } else {
      setConfirmedItems(itemPickerSnapshot)
    }
    setChatState(prevChatStateRef.current)
  }

  // ── Questioning input handler ──
  const handleQuestioningInput = (val: string) => {
    setQuestioningInput(val)
    // Detect slash command: val starts with "/" or has " /" pattern
    const trimmed = val.trim()
    if (trimmed.startsWith("/")) {
      setSlashOpen(true)
      setSlashQuery(trimmed.slice(1))  // everything after "/"
      setSlashSelectedIdx(0)
    } else {
      setSlashOpen(false)
    }
  }
  const handleQuestioningSend = () => {
    const val = questioningInput.trim()
    if (!val) return
    setSlashOpen(false)
    const isPickerTrigger = val === "/add-item" || val === "/item"
    if (isPickerTrigger) {
      setChatMessages(prev => [
        ...prev,
        { role:"user", text:"/add-item" },
        { role:"ai", text:`Opening the item picker — search below and tap + to add items to your cart on the right. Hit Done when you're finished.${confirmedItems.length > 0 ? ` You already have ${confirmedItems.length} item${confirmedItems.length !== 1 ? "s" : ""} in your cart.` : ""}` },
      ])
      setQuestioningInput("")
      setTimeout(handleOpenItemPicker, 80)
    } else {
      const ctx = { roundAComplete, roundBComplete, confirmedItems, submittedMessage }
      const currentHistory = [...chatMessages]
      setChatMessages(prev => [...prev, { role:"user", text:val }])
      setQuestioningInput("")
      setIsChatThinking(true)
      callGroqJomie(val, ctx, currentHistory).then(reply => {
        setIsChatThinking(false)
        const msg: ChatMsg = { role:"ai", text: reply.text, thinking: reply.thinking, actions: reply.buttons }
        setChatMessages(prev => [...prev, msg])
        // Handle side effects
        if (reply.action === "open-picker") setTimeout(handleOpenItemPicker, 100)
        if (reply.action === "proceed-to-vendor") handleProceedToVendor()
        if (reply.action === "confirm-vendors") handleConfirmVendorMatching()
        if (reply.action === "apply-vendor" && reply.payload?.itemCode && reply.payload?.vendorCode)
          handleItemVendorOverride(reply.payload.itemCode, reply.payload.vendorCode, reply.payload.vendorName ?? "", true)
        if (reply.action === "reset-vendor" && reply.payload?.itemCode)
          handleItemVendorOverride(reply.payload.itemCode, "", "", false)
      }).catch(() => {
        setIsChatThinking(false)
        setChatMessages(prev => [...prev, { role:"ai", text: jomieErrorMessage(err) }])
      })
    }
  }
  // Execute a slash command directly (bypasses state timing issues)
  const executeSlashCommand = (cmd: string) => {
    setSlashOpen(false)
    setQuestioningInput("")
    if (cmd === "/add-item" || cmd === "/item") {
      setChatMessages(prev => [
        ...prev,
        { role:"user", text:"/add-item" },
        { role:"ai", text:`Opening the item picker — search below and tap + to add items to your cart on the right. Hit Done when you're finished.${confirmedItems.length > 0 ? ` You already have ${confirmedItems.length} item${confirmedItems.length !== 1 ? "s" : ""} in your cart.` : ""}` },
      ])
      setTimeout(handleOpenItemPicker, 80)
    }
  }

  const handleQuestioningKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelectedIdx(i => Math.min(i + 1, SLASH_COMMANDS.length - 1)); return }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashSelectedIdx(i => Math.max(0, i - 1)); return }
      if (e.key === "Escape")    { e.preventDefault(); setSlashOpen(false); return }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const cmds = SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().includes(slashQuery.toLowerCase()))
        const selected = cmds[slashSelectedIdx] ?? cmds[0]
        if (selected) executeSlashCommand(selected.cmd)
        return
      }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuestioningSend() }
  }

  const handleMessageAction = (action: ChatActionType, label?: string) => {
    if (isChatThinking) return
    // Special case: open-picker and edit-items don't go through LLM — open directly
    if (action === "open-picker" || action === "edit-items") {
      const userText = label || (action === "edit-items" ? "Edit items" : "Open item picker")
      setChatMessages(prev => [...prev, { role:"user", text: userText }])
      setTimeout(handleOpenItemPicker, 80)
      return
    }
    // All other actions: post button label as user message, route through Groq
    const userText = label || action
    const ctx = { roundAComplete, roundBComplete, confirmedItems, submittedMessage }
    const currentHistory = [...chatMessages]
    setChatMessages(prev => [...prev, { role:"user", text: userText }])
    setIsChatThinking(true)
    callGroqJomie(userText, ctx, [...currentHistory, { role:"user", text: userText }], action).then(reply => {
      setIsChatThinking(false)
      const msg: ChatMsg = { role:"ai", text: reply.text, actions: reply.buttons }
      setChatMessages(prev => [...prev, msg])
      if (reply.action === "open-picker") setTimeout(handleOpenItemPicker, 100)
      if (reply.action === "proceed-to-vendor") handleProceedToVendor()
      if (reply.action === "confirm-vendors") handleConfirmVendorMatching()
      if (reply.action === "apply-vendor" && reply.payload?.itemCode && reply.payload?.vendorCode)
        handleItemVendorOverride(reply.payload.itemCode, reply.payload.vendorCode, reply.payload.vendorName ?? "", true)
      if (reply.action === "reset-vendor" && reply.payload?.itemCode)
        handleItemVendorOverride(reply.payload.itemCode, "", "", false)
    }).catch((err) => {
      setIsChatThinking(false)
      setChatMessages(prev => [...prev, { role:"ai", text: jomieErrorMessage(err) }])
    })
  }

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [chatState, processStep, chatMessages, isChatThinking])

  // rightPanelView is switched explicitly inside handleProceedToVendor — no auto-effect needed

  // Close right nav dropdown on outside click
  React.useEffect(() => {
    if (!rightNavOpen) return
    const handler = (e: MouseEvent) => {
      if (rightNavRef.current && !rightNavRef.current.contains(e.target as Node))
        setRightNavOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [rightNavOpen])

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
          style={{ padding: chatState === "idle" ? "0 16px 16px" : "24px 16px 0", gap:0 }}>

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
                <ProgressStrip roundADone={roundAComplete} roundBDone={roundBComplete}/>
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
                  {/* Thinking thread — collapsible */}
                  {msg.thinking && (
                    <details className="group w-fit max-w-full">
                      <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none mb-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}>
                        <svg className="size-3 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="none">
                          <path d="M4 2.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[11px] font-medium">Jomie's thinking</span>
                      </summary>
                      <div className="px-3 py-2 rounded-lg text-[12px] leading-5 italic"
                        style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.45)", borderLeft:"2px solid rgba(93,94,244,0.3)" }}>
                        {msg.thinking}
                      </div>
                    </details>
                  )}
                  <div className="text-[14px] text-white leading-5 whitespace-pre-line">{msg.text}</div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.actions.map((act, ai) => (
                        <button
                          key={ai}
                          onClick={() => handleMessageAction(act.action, act.label)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
                          style={{
                            background: act.primary ? T.purple : "rgba(255,255,255,0.07)",
                            color: act.primary ? "#fff" : "rgba(255,255,255,0.65)",
                            border: `1px solid ${act.primary ? T.purple : "rgba(103,100,136,0.4)"}`,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}>
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
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

        {/* ── Item picker widget (inline at bottom, replaces input) ── */}
        {chatState === "item-picking" && (
          <>
            {/* Drag handle */}
            <div
              onMouseDown={onWidgetDragMouseDown}
              className="shrink-0 flex items-center justify-center"
              style={{ height:12, cursor:"row-resize", touchAction:"none" }}>
              <div className="w-10 h-1 rounded-full" style={{ background:"rgba(103,100,136,0.5)" }}/>
            </div>

            {/* Widget panel */}
            <div className="shrink-0 flex flex-col rounded-t-2xl overflow-hidden"
              style={{ height:widgetHeight, background:"#1A1740", border:`1px solid rgba(103,100,136,0.5)`, borderBottom:"none" }}>

              {/* Widget header */}
              <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor:"rgba(103,100,136,0.3)" }}>
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-md flex items-center justify-center" style={{ background:"rgba(93,94,244,0.2)" }}>
                    <Search size={11} style={{ color:"#A5A6F6" }}/>
                  </div>
                  <span className="text-[13px] font-semibold text-white">Add Items</span>
                  <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>
                    · type /add-item anytime to reopen
                  </span>
                </div>
                <button
                  onClick={handleDoneItemPicker}
                  className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: confirmedItems.length > 0 ? "rgba(29,158,117,0.15)" : "rgba(255,255,255,0.06)",
                    color: confirmedItems.length > 0 ? "#1D9E75" : "rgba(255,255,255,0.4)",
                    border:`1px solid ${confirmedItems.length > 0 ? "rgba(29,158,117,0.4)" : "rgba(103,100,136,0.3)"}`,
                  }}>
                  <Check size={10} strokeWidth={2.5}/>
                  Done{confirmedItems.length > 0 ? ` — ${confirmedItems.length} in cart` : ""}
                </button>
              </div>

              {/* Search input */}
              <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor:"rgba(103,100,136,0.25)" }}>
                <Search size={13} style={{ color:"rgba(255,255,255,0.35)", flexShrink:0 }}/>
                <input
                  autoFocus
                  type="text"
                  value={itemPickerQuery}
                  onChange={e => { setItemPickerQuery(e.target.value) }}
                  placeholder="Search by item name, code, or type…"
                  className="flex-1 bg-transparent text-[13px] text-white placeholder-gray-500 border-0 focus:outline-none"
                />
                {itemPickerQuery && (
                  <button onClick={() => setItemPickerQuery("")} className="cursor-pointer hover:opacity-70">
                    <X size={12} style={{ color:"rgba(255,255,255,0.35)" }}/>
                  </button>
                )}
              </div>

              {/* BOM banner */}
              <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-b"
                style={{ borderColor:"rgba(103,100,136,0.15)", background:"rgba(93,94,244,0.05)" }}>
                <Package size={9} style={{ color:"#A5A6F6" }}/>
                <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>
                  Manufacturing / F&B / Construction?
                </span>
                <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background:"rgba(93,94,244,0.15)", color:"#A5A6F6" }}>
                  BOM / BOQ — Phase B
                </span>
              </div>

              {/* Results list */}
              <div className="flex-1 overflow-y-auto min-h-0 jomie-scrollbar">
                {(() => {
                  const lower = itemPickerQuery.toLowerCase()
                  const filtered = ITEM_MASTER.filter(item =>
                    !lower || item.name.toLowerCase().includes(lower) ||
                    item.code.toLowerCase().includes(lower) ||
                    item.spec.toLowerCase().includes(lower)
                  )
                  const confirmedCodes = new Set(confirmedItems.map(i => i.code))
                  const ITEM_TYPE_META: Record<ItemType,{ label:string; bg:string; fg:string }> = {
                    standard:     { label:"STANDARD",     bg:"rgba(255,255,255,0.08)", fg:"rgba(255,255,255,0.45)" },
                    capex:        { label:"CAPEX",        bg:"#EFF6FF",                fg:"#1D4ED8"                },
                    service:      { label:"SERVICE",      bg:"rgba(29,158,117,0.15)",  fg:"#1D9E75"                },
                    subscription: { label:"SUBSCRIPTION", bg:"rgba(93,94,244,0.15)",   fg:"#A5A6F6"                },
                  }
                  if (filtered.length === 0) return (
                    <div className="flex flex-col items-center gap-3 px-4 pt-8 pb-4">
                      <Search size={20} style={{ color:"rgba(255,255,255,0.15)" }}/>
                      <div className="text-center">
                        <div className="text-[12px] font-medium text-white mb-0.5">
                          {itemPickerQuery ? `No match for "${itemPickerQuery}"` : "Start typing to search the item master"}
                        </div>
                        {itemPickerQuery.length > 0 && (
                          <button
                            onClick={() => handleRequestNew({ name:itemPickerQuery, spec:"", unitPrice:"", uom:"unit", itemType:"standard" })}
                            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer mx-auto"
                            style={{ background:"rgba(186,117,23,0.15)", color:"#BA7517", border:"0.5px solid rgba(186,117,23,0.4)" }}>
                            <Plus size={10}/> Request new item: "{itemPickerQuery}"
                          </button>
                        )}
                      </div>
                    </div>
                  )
                  return (
                    <>
                      {filtered.map(item => {
                        const inCart = confirmedCodes.has(item.code)
                        const cartItem = confirmedItems.find(i => i.code === item.code)
                        const typeMeta = ITEM_TYPE_META[item.itemType]
                        return (
                          <div key={item.code}
                            className="flex items-center gap-3 px-4 py-2.5 border-b"
                            style={{ borderColor:"rgba(103,100,136,0.12)" }}>
                            {/* Type icon */}
                            <div className="size-7 rounded-lg shrink-0 flex items-center justify-center"
                              style={{ background: typeMeta.bg }}>
                              <Package size={12} style={{ color: typeMeta.fg }}/>
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[12px] font-medium text-white truncate">{item.name}</span>
                                <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                                  style={{ background: typeMeta.bg, color: typeMeta.fg }}>
                                  {typeMeta.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-mono" style={{ color:"rgba(255,255,255,0.3)" }}>{item.code}</span>
                                <span style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                                <span className="text-[10px] font-mono font-semibold" style={{ color:"rgba(255,255,255,0.55)" }}>
                                  RM {item.unitPrice.toLocaleString()}/{item.uom}
                                </span>
                              </div>
                            </div>
                            {/* Add / in-cart control */}
                            {inCart && cartItem ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleItemQtyChange(item.code, Math.max(0, cartItem.qty - 1))}
                                  className="size-6 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                                  style={{ background:"rgba(255,255,255,0.08)" }}
                                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
                                  onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}>
                                  <Minus size={9} color="rgba(255,255,255,0.7)"/>
                                </button>
                                <span className="text-[11px] font-mono font-semibold text-white w-5 text-center">{cartItem.qty}</span>
                                <button
                                  onClick={() => handleItemQtyChange(item.code, cartItem.qty + 1)}
                                  className="size-6 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                                  style={{ background:"rgba(93,94,244,0.2)" }}
                                  onMouseEnter={e => e.currentTarget.style.background="rgba(93,94,244,0.35)"}
                                  onMouseLeave={e => e.currentTarget.style.background="rgba(93,94,244,0.2)"}>
                                  <Plus size={9} color="#A5A6F6"/>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleItemAdd(item)}
                                className="size-7 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0"
                                style={{ background:"rgba(93,94,244,0.15)", border:"1px solid rgba(93,94,244,0.4)" }}
                                onMouseEnter={e => { e.currentTarget.style.background="rgba(93,94,244,0.3)"; e.currentTarget.style.borderColor="rgba(93,94,244,0.7)" }}
                                onMouseLeave={e => { e.currentTarget.style.background="rgba(93,94,244,0.15)"; e.currentTarget.style.borderColor="rgba(93,94,244,0.4)" }}>
                                <Plus size={13} color="#A5A6F6"/>
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {/* Request new item footer */}
                      <div className="px-4 py-3 border-t" style={{ borderColor:"rgba(103,100,136,0.15)" }}>
                        <button
                          onClick={() => handleRequestNew({ name: itemPickerQuery || "New item", spec:"", unitPrice:"", uom:"unit", itemType:"standard" })}
                          className="flex items-center gap-1.5 text-[11px] cursor-pointer transition-opacity hover:opacity-70"
                          style={{ color:"rgba(255,255,255,0.3)" }}>
                          <Plus size={10}/> Can&apos;t find what you need? Request a new item
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </>
        )}

        {/* ── Bottom sticky: questioning + confirmed/submitted ── */}
        {(chatState === "questioning" || chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
        <div className="shrink-0 pt-4 flex flex-col gap-2">
          <div className="relative">
            {slashOpen && chatState === "questioning" && (
              <SlashPopover
                query={slashQuery}
                selectedIndex={slashSelectedIdx}
                onSelect={(cmd) => executeSlashCommand(cmd)}
                onClose={() => setSlashOpen(false)}
              />
            )}
          <div className="flex flex-col" style={{
            background:"#FFFFFF", border:`2px solid ${T.border}`,
            borderRadius:20, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
          }}>
            <textarea
              value={chatState === "questioning" ? questioningInput : inputValue}
              onChange={e => chatState === "questioning" ? handleQuestioningInput(e.target.value) : setInputValue(e.target.value)}
              onKeyDown={chatState === "questioning" ? handleQuestioningKeyDown : handleChatKeyDown}
              placeholder={chatState === "questioning" ? "Ask Jomie anything, or type /add-item + Send to open item picker…" : "Ask Jomie anything about this PR… (↵ to send, ⇧↵ for new line)"}
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
                  onClick={chatState === "questioning" ? handleQuestioningSend : handleSend}
                  className="flex items-center justify-center px-3.5 h-8 rounded-lg text-[14px] font-medium text-white transition-all cursor-pointer"
                  style={{
                    background: (chatState === "questioning" ? questioningInput.trim() : inputValue.trim()) && !isChatThinking ? T.purple : "rgba(93,94,244,0.35)",
                    border:`1px solid ${(chatState === "questioning" ? questioningInput.trim() : inputValue.trim()) && !isChatThinking ? T.purple : "transparent"}`,
                    boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                    opacity: isChatThinking ? 0.5 : 1,
                  }}>
                  {isChatThinking ? "…" : "Send"}
                </button>
              </div>
            </div>
          </div>{/* end textarea container */}
          </div>{/* end relative wrapper */}

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

      {/* ── Right — Cart / Browse / PR Preview ── */}
      <div style={rightPanelStyle}>

        {/* ══ Universal nav header — shown on all views except item-picking and browse ══ */}
        {chatState !== "item-picking" && !browseItem && (() => {
          const NAV_TABS: { key: RightPanelView; label: string; enabled: boolean }[] = [
            { key: "items",   label: "Items",   enabled: confirmedItems.length > 0 },
            { key: "vendors", label: "Vendors", enabled: roundAComplete },
            { key: "budget",  label: "Budget",  enabled: false },
            { key: "context", label: "Context", enabled: false },
            { key: "review",  label: "Review",  enabled: true },
          ]
          const activeLabel = NAV_TABS.find(t => t.key === rightPanelView)?.label ?? "Review"
          return (
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0 bg-white relative z-10">
              {/* Left: icon + current view label */}
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
                  <CircleDot size={11} style={{ color: T.purple }}/>
                </div>
                <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily:"var(--font-pjs)" }}>
                  {activeLabel}
                </span>
                {chatState !== "idle" && chatState !== "questioning" && rightPanelView === "review" && (
                  <div className="flex items-center gap-1">
                    <div className="size-1.5 rounded-full animate-pulse" style={{ background: T.purple }}/>
                    <span className="text-[9px] font-mono font-semibold tracking-wider" style={{ color: T.purple }}>LIVE</span>
                  </div>
                )}
              </div>

              {/* Right: collapse + nav dropdown button group */}
              <div className="relative flex flex-row items-center h-8" ref={rightNavRef}>
                {/* Collapse button */}
                <button
                  onClick={() => setRightWidth(w => w === 0 ? null : 0)}
                  className="flex items-center justify-center rounded-lg cursor-pointer transition-all"
                  style={{ width:32, height:32, background:"transparent", borderRadius:8 }}
                  title="Collapse panel"
                  onMouseEnter={e => (e.currentTarget.style.background="rgba(0,0,0,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background="transparent")}
                  onMouseDown={e => (e.currentTarget.style.background="rgba(0,0,0,0.1)")}
                  onMouseUp={e => (e.currentTarget.style.background="rgba(0,0,0,0.06)")}>
                  <PanelRightClose size={16} style={{ color:"#6B7280" }}/>
                </button>

                {/* Dropdown chevron button */}
                <button
                  onClick={() => setRightNavOpen(o => !o)}
                  className="flex items-center justify-center cursor-pointer transition-all"
                  style={{
                    width:28, height:32,
                    background: rightNavOpen ? "rgba(0,0,0,0.08)" : "transparent",
                    borderRadius:8,
                  }}
                  onMouseEnter={e => { if (!rightNavOpen) e.currentTarget.style.background="rgba(0,0,0,0.06)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = rightNavOpen ? "rgba(0,0,0,0.08)" : "transparent" }}
                  onMouseDown={e => (e.currentTarget.style.background="rgba(0,0,0,0.1)")}
                  onMouseUp={e => (e.currentTarget.style.background="rgba(0,0,0,0.08)")}>
                  <ChevronDown size={13} style={{ color:"#6B7280" }} strokeWidth={2}/>
                </button>

                {/* Dropdown menu */}
                {rightNavOpen && (
                  <div className="absolute z-50"
                    style={{
                      right:0, top:36,
                      width:121,
                      background:"#101828",
                      border:"1px solid #101828",
                      boxShadow:"0px 12px 16px -4px rgba(99,86,228,0.08), 0px 4px 6px -2px rgba(99,86,228,0.03)",
                      borderRadius:8,
                      overflow:"hidden",
                    }}>
                    <div className="flex flex-col p-1">
                      {NAV_TABS.map(tab => (
                        <button
                          key={tab.key}
                          disabled={!tab.enabled}
                          onClick={() => { setRightPanelView(tab.key); setRightNavOpen(false) }}
                          className="flex items-center justify-between px-4 h-8 rounded-lg text-left w-full transition-colors"
                          style={{
                            background: tab.key === rightPanelView ? "rgba(255,255,255,0.08)" : "transparent",
                            cursor: tab.enabled ? "pointer" : "not-allowed",
                          }}
                          onMouseEnter={e => { if (tab.enabled) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                          onMouseLeave={e => { e.currentTarget.style.background = tab.key === rightPanelView ? "rgba(255,255,255,0.08)" : "transparent" }}>
                          <span className="text-[14px] font-light leading-5"
                            style={{ color: tab.enabled ? "#ffffff" : "rgba(255,255,255,0.3)" }}>
                            {tab.label}
                          </span>
                          {!tab.enabled && <Lock size={10} style={{ color:"rgba(255,255,255,0.2)", flexShrink:0 }}/>}
                          {tab.key === rightPanelView && tab.enabled && <Check size={10} style={{ color:"rgba(255,255,255,0.5)", flexShrink:0 }}/>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ══ Cart mode (item-picking) ══ */}
        {chatState === "item-picking" ? (
          <CartPanel
            items={confirmedItems}
            onQtyChange={handleItemQtyChange}
            onRemove={handleItemRemove}
            onConfirm={() => { handleConfirmAllItems(); handleDoneItemPicker() }}
          />
        ) : rightPanelView === "vendors" && roundAComplete ? (
          <VendorOverridePanel
            confirmedItems={confirmedItems}
            onVendorSelect={(itemCode, vendorCode, vendorName) => handleItemVendorOverride(itemCode, vendorCode, vendorName, true)}
            onBrowse={(item) => { setBrowseItem(item); setRightPanelView("review") }}
            onConfirm={handleConfirmVendorOverride}
            hideHeader
          />
        ) : browseItem ? (
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
          <>{/* ══ PR Preview / navigated view ══ */}

          {/* ── Items view: read-only cart summary ── */}
          {rightPanelView === "items" && confirmedItems.length > 0 ? (
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cart — {confirmedItems.length} items</span>
                <span className="text-[12px] font-semibold text-gray-700">
                  RM {confirmedItems.reduce((s,i)=>s+i.qty*i.unitPrice,0).toLocaleString()}
                </span>
              </div>
              {confirmedItems.map(item => (
                <div key={item.code} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.purpleLight }}>
                    <Package size={14} style={{ color: T.purple }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{item.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{item.code}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-500">×{item.qty}</span>
                      {item.unitPrice > 0
                        ? <span className="text-[11px] font-medium text-gray-700">RM {(item.qty * item.unitPrice).toLocaleString()}</span>
                        : <span className="text-[11px] text-amber-500">Price TBD</span>
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => { setRightPanelView("review"); setTimeout(handleOpenItemPicker, 80) }}
                    className="text-[11px] text-purple-400 hover:text-purple-600 shrink-0 mt-0.5 cursor-pointer transition-colors">
                    Edit
                  </button>
                </div>
              ))}
            </div>

          ) : rightPanelView === "budget" || rightPanelView === "context" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
              <div className="size-12 rounded-xl flex items-center justify-center" style={{ background:"#F3F4F6" }}>
                <Lock size={20} style={{ color:"#9CA3AF" }}/>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-gray-400 mb-1">Coming in Round {rightPanelView === "budget" ? "C" : "D"}</div>
                <div className="text-[11px] text-gray-300 leading-relaxed max-w-[180px]">
                  {rightPanelView === "budget" ? "Budget code, GL code, and cost centre will be assigned here." : "Delivery date, urgency flag, and business justification."}
                </div>
              </div>
            </div>

          ) : /* Empty / waiting state */
          (chatState === "idle" || chatState === "questioning") ? (
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

        </>)}{/* end browseItem ternary */}

      </div>{/* end rightPanelStyle */}

    </div>
  )
}
