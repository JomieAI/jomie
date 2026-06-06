"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sparkles, ChevronRight, Download, Plus, Search,
  CheckCircle2, ShieldCheck, Clock, Package, Building2,
  Briefcase, RefreshCw, ShoppingBag, Star, Globe,
  TriangleAlert, Check, ArrowRight, X,
} from "lucide-react"

// ─── Design tokens (brief v1 + Jomie brand reconciled) ───────────────────────

const T = {
  // AI bar
  aiBarBg:      "#EEEDFE",
  aiBarBorder:  "#AFA9EC",
  aiBarIcon:    "#534AB7",
  aiBarText:    "#3C3489",
  aiBarHint:    "#AFA9EC",
  // Severity border accents
  borderCritical: "#E24B4A",
  borderWarning:  "#BA7517",
  borderApproved: "#1D9E75",
  // Teal
  teal:         "#1D9E75",
  tealLight:    "#E1F5EE",
  tealText:     "#085041",
  // Amber
  amber:        "#BA7517",
  amberLight:   "#FAEEDA",
  amberText:    "#633806",
  // Red
  red:          "#E24B4A",
  redLight:     "#FCEBEB",
  redText:      "#791F1F",
  // Purple (Jomie brand)
  purple:       "#5D5EF4",
  purpleLight:  "#EEEDFE",
  purpleText:   "#3C3489",
  // Selected row
  selectedBg:   "#F0FAF6",
  selectedBorder: "#1D9E75",
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PRStatus = "pending" | "review" | "approved" | "draft"
type Phase    = "A1" | "A2" | "B" | "C" | "D" | "F" | "G"
type PurchaseType = "trade" | "capex" | "service" | "recurring" | "nontrade"

interface Approver {
  initials: string; state: "done" | "pending" | "waiting"
  name: string; role: string; level: number
}
interface LineItem { name: string; detail: string; amount: string }
interface AIInsight { type: "info" | "warn" | "ok"; title: string; body: string; cite: string }
interface VendorOption {
  rank: number; name: string; price: string; unit: string
  type: "approved" | "marketplace"; isImport?: boolean; isRecommended?: boolean
}
interface SubPR {
  id: string; type: PurchaseType; vendor: string; amount: string
  approvalTier: string; phase: Phase; status: PRStatus
}
interface PR {
  id: string; title: string; sub: string
  requester: string; requesterInitials: string; date: string; dept: string
  amount: string; budget: string; overBudget?: boolean
  status: PRStatus; phase: Phase; purchaseType: PurchaseType
  subPRs?: SubPR[]
  approvers: Approver[]; aiFlags: number
  lineItems: LineItem[]; aiInsights: AIInsight[]
  vendors?: VendorOption[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRS: PR[] = [
  {
    id: "PR-0089", title: "IT Equipment — Q3 Upgrade",
    sub: "14 laptops · 6 monitors · 14 docks",
    requester: "Lim Wei Xiang", requesterInitials: "LW",
    date: "28 May", dept: "IT",
    amount: "142,800", budget: "150,000",
    status: "pending", phase: "B", purchaseType: "capex",
    subPRs: [
      { id:"PR-0089-A", type:"capex",   vendor:"Tech Solutions MY", amount:"127,800", approvalTier:"FM + CFO",   phase:"B", status:"pending" },
      { id:"PR-0089-B", type:"capex",   vendor:"Tech Solutions MY", amount:"15,000",  approvalTier:"Dept Head", phase:"B", status:"review"  },
    ],
    approvers: [
      { initials:"SA", state:"done",    name:"Siti Aisyah",    role:"Dept Head",   level:1 },
      { initials:"RA", state:"pending", name:"Razif Abdullah", role:"Finance Mgr", level:2 },
      { initials:"CM", state:"waiting", name:"Chong Mei Ling", role:"CFO",         level:3 },
    ],
    aiFlags: 1,
    lineItems: [
      { name:"Dell Latitude 5540",   detail:"14 × RM 7,200 · Tech Solutions MY", amount:"100,800" },
      { name:"LG 27\" UltraFine 4K", detail:"6 × RM 2,500 · Tech Solutions MY",  amount:"15,000"  },
      { name:"Dell WD22TB4 Dock",    detail:"14 × RM 1,929 · Tech Solutions MY", amount:"27,000"  },
    ],
    aiInsights: [
      { type:"info", title:"Capital allowance eligible",
        body:"Laptops and monitors qualify for IA 20% + AA 14% under Schedule 3. Tag as IT Equipment in asset register before period close.",
        cite:"capitalAllowance.md:v1.4 → ITA67:Sch3" },
      { type:"warn", title:"Vendor not on MyInvois",
        body:"Tech Solutions MY has no MyInvois registration. SST input credit may be disallowed. Request validated e-invoice before PO issuance.",
        cite:"jomie-sst-baseline.md:v1.5 → SST18:S38" },
      { type:"ok",  title:"Within capex budget",
        body:"RM 142,800 is 95.2% of the approved RM 150,000 IT capex budget. No override approval required.",
        cite:"budgetControl.md:v1.2 → approvalMatrix.md:v1.0" },
    ],
    vendors: [
      { rank:1, name:"Tech Solutions MY",  price:"7,200",  unit:"/unit", type:"approved",     isRecommended:true },
      { rank:2, name:"Digital Hub Malaysia",price:"7,450", unit:"/unit", type:"approved" },
      { rank:1, name:"TechGear (Shopee)",  price:"6,890",  unit:"/unit", type:"marketplace" },
      { rank:2, name:"Lenovo (1688.com)",  price:"~5,900", unit:"/unit", type:"marketplace",  isImport:true },
    ],
  },
  {
    id:"PR-0088", title:"Office Renovation — Level 3",
    sub:"Partitioning · furniture · electrical",
    requester:"Nur Aisyah", requesterInitials:"NA",
    date:"27 May", dept:"Admin",
    amount:"38,500", budget:"40,000",
    status:"review", phase:"B", purchaseType:"service",
    approvers:[
      { initials:"SA", state:"done",    name:"Siti Aisyah",    role:"Dept Head",   level:1 },
      { initials:"RA", state:"done",    name:"Razif Abdullah", role:"Finance Mgr", level:2 },
      { initials:"CM", state:"pending", name:"Chong Mei Ling", role:"CFO",         level:3 },
    ],
    aiFlags:0, lineItems:[], aiInsights:[],
    vendors:[
      { rank:1, name:"SKY Renovation Sdn Bhd", price:"38,500", unit:" lump sum", type:"approved", isRecommended:true },
      { rank:2, name:"Urban Build Works",       price:"41,200", unit:" lump sum", type:"approved" },
    ],
  },
  {
    id:"PR-0087", title:"Raw Materials — Batch #44",
    sub:"Packaging film · adhesives · labels",
    requester:"Ahmad Firdaus", requesterInitials:"AF",
    date:"26 May", dept:"Production",
    amount:"285,000", budget:"280,000", overBudget:true,
    status:"pending", phase:"A2", purchaseType:"trade",
    approvers:[
      { initials:"SA", state:"done",    name:"Siti Aisyah",    role:"Dept Head",   level:1 },
      { initials:"RA", state:"done",    name:"Razif Abdullah", role:"Finance Mgr", level:2 },
      { initials:"CM", state:"pending", name:"Chong Mei Ling", role:"CFO",         level:3 },
    ],
    aiFlags:2, lineItems:[], aiInsights:[],
  },
  {
    id:"PR-0086", title:"Marketing — Trade Fair Booth",
    sub:"KLCC Convention 2024",
    requester:"Priya Nair", requesterInitials:"PN",
    date:"24 May", dept:"Marketing",
    amount:"22,000", budget:"25,000",
    status:"approved", phase:"C", purchaseType:"service",
    approvers:[
      { initials:"SA", state:"done", name:"Siti Aisyah",    role:"Dept Head",   level:1 },
      { initials:"RA", state:"done", name:"Razif Abdullah", role:"Finance Mgr", level:2 },
    ],
    aiFlags:0, lineItems:[], aiInsights:[],
  },
  {
    id:"PR-0085", title:"Cleaning Services Contract",
    sub:"Annual renewal · 3 locations",
    requester:"Tan Beng Huat", requesterInitials:"TB",
    date:"22 May", dept:"Facilities",
    amount:"18,600", budget:"20,000",
    status:"approved", phase:"G", purchaseType:"recurring",
    approvers:[
      { initials:"SA", state:"done", name:"Siti Aisyah",    role:"Dept Head",   level:1 },
      { initials:"RA", state:"done", name:"Razif Abdullah", role:"Finance Mgr", level:2 },
    ],
    aiFlags:0, lineItems:[], aiInsights:[],
  },
  {
    id:"PR-0084", title:"Software Licences — Adobe CC",
    sub:"12 seats · annual subscription",
    requester:"Lim Wei Xiang", requesterInitials:"LW",
    date:"Today", dept:"Creative",
    amount:"8,400", budget:"10,000",
    status:"draft", phase:"A1", purchaseType:"recurring",
    approvers:[], aiFlags:0, lineItems:[], aiInsights:[],
  },
]

// ─── Purchase type config ─────────────────────────────────────────────────────

const PTYPE_CONFIG: Record<PurchaseType, { icon: React.ElementType; color: string; label: string }> = {
  trade:     { icon: Package,     color: "#0D9488", label: "Trade"     },
  capex:     { icon: Building2,   color: "#2563EB", label: "Capex"     },
  service:   { icon: Briefcase,   color: "#D97706", label: "Service"   },
  recurring: { icon: RefreshCw,   color: "#6B7280", label: "Recurring" },
  nontrade:  { icon: ShoppingBag, color: "#7C3AED", label: "Non-trade" },
}

// ─── Severity → left border ───────────────────────────────────────────────────

function rowBorderColor(pr: PR): string {
  if (pr.overBudget) return T.borderCritical
  if (pr.status === "pending" || pr.status === "review") return T.borderWarning
  if (pr.status === "approved") return T.borderApproved
  return "transparent"
}

// ─── Jomie AI Bar ─────────────────────────────────────────────────────────────

function JomieAIBar({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-3"
      style={{
        background: T.aiBarBg,
        border: `0.5px solid ${T.aiBarBorder}`,
        borderRadius: 8,
      }}>
      <Sparkles size={15} style={{ color: T.aiBarIcon, flexShrink: 0 }} />
      <span className="flex-1 text-[12px] leading-snug" style={{ color: T.aiBarText }}>
        {message}
      </span>
      <kbd className="shrink-0 text-[11px] font-mono select-none" style={{ color: T.aiBarHint }}>⌘K</kbd>
    </div>
  )
}

// ─── 4-dot journey strip (table STATUS column) ────────────────────────────────

function JourneyDotsMini({ pr }: { pr: PR }) {
  // Map phase/status to 4-dot state: PR created → Approved → Quotation → PO
  const phaseToStep: Record<Phase, number> = { A1:0, A2:1, B:1, C:2, D:3, F:3, G:4 }
  const currentStep = pr.status === "draft" ? 0 : phaseToStep[pr.phase] ?? 1
  const allDone = pr.status === "approved" && (pr.phase === "G" || pr.phase === "F")

  const dots = ["PR", "Appvl", "Quote", "PO"]
  return (
    <div className="flex items-center gap-1">
      {dots.map((_, i) => {
        const done    = allDone || (i < currentStep)
        const active  = !allDone && i === currentStep
        const waiting = !done && !active
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="h-px w-2 shrink-0"
                style={{ background: done ? T.teal : "#E5E7EB" }} />
            )}
            <div className={cn("rounded-full shrink-0 transition-all", active && "animate-pulse")}
              style={{
                width:  active ? 8 : 6,
                height: active ? 8 : 6,
                background: done ? T.teal : active ? T.purple : "#E5E7EB",
                border: waiting ? "1.5px solid #D1D5DB" : "none",
              }} />
          </React.Fragment>
        )
      })}
      {pr.status === "draft" && (
        <span className="text-[9px] text-gray-400 italic ml-1">draft</span>
      )}
    </div>
  )
}

// ─── 7-phase journey strip (drawer) ──────────────────────────────────────────

const JOURNEY_PHASES = [
  { key:"pr",      label:"PR",     fullLabel:"PR Created"   },
  { key:"a2",      label:"A2",     fullLabel:"A2 Check"     },
  { key:"appvl",   label:"Appvl",  fullLabel:"Approval"     },
  { key:"quote",   label:"Quote",  fullLabel:"Quotation"    },
  { key:"po",      label:"PO",     fullLabel:"PO"           },
  { key:"grn",     label:"GRN",    fullLabel:"GRN"          },
  { key:"ap",      label:"AP",     fullLabel:"AP Payment"   },
]

function phaseToJourneyIndex(phase: Phase, status: PRStatus): number {
  if (status === "draft") return 0
  const map: Record<Phase, number> = { A1:0, A2:1, B:2, C:3, D:4, F:5, G:6 }
  return map[phase] ?? 0
}

function JourneyStrip({ pr, compact = false }: { pr: PR; compact?: boolean }) {
  const activeIdx = phaseToJourneyIndex(pr.phase, pr.status)

  return (
    <div className={cn("flex items-center", compact ? "gap-0" : "gap-0")}>
      {JOURNEY_PHASES.map((phase, i) => {
        const done   = i < activeIdx
        const active = i === activeIdx
        const pending = i > activeIdx

        return (
          <React.Fragment key={phase.key}>
            {i > 0 && (
              <div className="flex-1 h-px min-w-[6px]"
                style={{ background: done ? T.teal : "#E5E7EB" }} />
            )}
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col items-center gap-0.5 cursor-default">
                  <div
                    className={cn("flex items-center justify-center rounded-full shrink-0",
                      active && "animate-pulse",
                      compact ? "size-4" : "size-5")}
                    style={{
                      background: done ? T.teal : active ? T.purple : "white",
                      border: pending ? "1.5px solid #D1D5DB" : "none",
                    }}>
                    {done && <Check size={compact ? 8 : 10} color="white" strokeWidth={3} />}
                    {active && <div className={cn("rounded-full bg-white", compact ? "size-1.5" : "size-2")} />}
                  </div>
                  <span className={cn("font-semibold whitespace-nowrap",
                    compact ? "text-[8px]" : "text-[9px]",
                    done ? "text-teal-600" : active ? "text-[#3C3489]" : "text-gray-400"
                  )} style={{ color: done ? T.teal : active ? T.purple : undefined }}>
                    {compact ? phase.label : phase.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span>{phase.fullLabel}</span>
              </TooltipContent>
            </Tooltip>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── AI insight card ──────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const cfg = {
    info: { bg: "rgba(93,94,244,0.05)", border: "rgba(93,94,244,0.12)", dot: T.purple,       title: "#4338CA" },
    warn: { bg: T.amberLight + "88",    border: T.amber + "55",          dot: T.amber,        title: T.amber   },
    ok:   { bg: T.tealLight + "88",     border: T.teal  + "55",          dot: T.teal,         title: T.teal    },
  }[insight.type]

  return (
    <div className="rounded-lg p-3 mb-2 last:mb-0"
      style={{ background: cfg.bg, border: `0.5px solid ${cfg.border}` }}>
      <div className="flex items-start gap-2">
        <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: cfg.dot }} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold mb-1" style={{ color: cfg.title }}>{insight.title}</div>
          <p className="text-[11px] text-gray-600 leading-relaxed">{insight.body}</p>
          <div className="mt-1.5 pt-1.5 border-t border-black/5">
            <code className="text-[9px] font-mono text-gray-400">{insight.cite}</code>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sourcing section (drawer) ────────────────────────────────────────────────

function SourcingSection({ vendors }: { vendors: VendorOption[] }) {
  const approved     = vendors.filter(v => v.type === "approved")
  const marketplace  = vendors.filter(v => v.type === "marketplace")

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Sourcing Options</span>
        <span className="text-[9px] text-gray-400 font-mono">· fetched 2 min ago</span>
      </div>

      {/* Approved vendors */}
      <div className="rounded-lg overflow-hidden mb-2"
        style={{ border: `0.5px solid ${T.teal}55` }}>
        <div className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{ background: T.tealLight, color: T.tealText, borderBottom:`0.5px solid ${T.teal}33` }}>
          Approved vendors
        </div>
        {approved.map((v, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2 hover:bg-[#E1F5EE] transition-colors"
            style={{ borderTop: i > 0 ? `0.5px solid ${T.teal}22` : undefined }}>
            <span className="text-[10px] font-bold w-4 shrink-0"
              style={{ color: v.isRecommended ? T.purple : "#888780" }}>
              {v.isRecommended ? "★" : v.rank}
            </span>
            <span className="flex-1 text-[11px] font-medium text-gray-800 truncate">{v.name}</span>
            <span className="text-[11px] font-mono text-gray-700 shrink-0">RM {v.price}{v.unit}</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
              style={{ background: T.tealLight, color: T.tealText }}>Approved</span>
          </div>
        ))}
      </div>

      {/* Marketplace */}
      {marketplace.length > 0 && (
        <div className="rounded-lg overflow-hidden"
          style={{ border: `0.5px solid ${T.amber}55` }}>
          <div className="px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{ background: T.amberLight, color: T.amberText, borderBottom:`0.5px solid ${T.amber}33` }}>
            Marketplace suggestions
          </div>
          <div className="px-2.5 py-1.5 flex items-start gap-1.5"
            style={{ background: T.amberLight + "88", borderBottom:`0.5px solid ${T.amber}22` }}>
            <TriangleAlert size={10} style={{ color: T.amber, marginTop:1, flexShrink:0 }} />
            <span className="text-[9px]" style={{ color: T.amberText }}>
              Requires vendor onboarding before PO
            </span>
          </div>
          {marketplace.map((v, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-2 hover:bg-[#FAEEDA] transition-colors"
              style={{ borderTop: i > 0 ? `0.5px solid ${T.amber}22` : undefined }}>
              <span className="text-[10px] font-bold w-4 shrink-0 text-gray-400">
                {["①","②","③"][i]}
              </span>
              <span className="flex-1 text-[11px] font-medium text-gray-700 truncate">{v.name}</span>
              <span className="text-[11px] font-mono text-gray-600 shrink-0">RM {v.price}{v.unit}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: T.amberLight, color: T.amberText }}>Marketplace</span>
                {v.isImport && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background: T.redLight, color: T.redText }}>Import ⚠</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Copilot drawer ───────────────────────────────────────────────────────────

function CopilotPanel({ pr }: { pr: PR | null }) {
  const router = useRouter()
  const showSourcing = pr && (pr.status === "pending" || pr.status === "review")

  // Footer state
  const footerType: "requestor" | "approver" | "done" | null = pr
    ? pr.status === "approved" ? "done"
    : pr.status === "pending" || pr.status === "review" ? "approver"
    : pr.status === "draft" ? null
    : "requestor"
    : null

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md flex items-center justify-center"
            style={{ background: T.purpleLight }}>
            <Sparkles size={11} style={{ color: T.purple }} />
          </div>
          <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily:"var(--font-pjs)" }}>
            Jomie AI
          </span>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full animate-pulse" style={{ background: T.teal }} />
            <span className="text-[9px] font-mono font-semibold tracking-wider" style={{ color: T.teal }}>LIVE</span>
          </div>
        </div>
        {pr && (
          <button onClick={() => router.push(`/p2p/purchase-requests/${pr.id}`)}
            className="flex items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer"
            style={{ color: T.purple }}>
            {pr.id}<ChevronRight size={10} />
          </button>
        )}
      </div>

      {/* Empty state */}
      {!pr ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <div className="size-10 rounded-xl flex items-center justify-center"
            style={{ background: T.purpleLight }}>
            <Sparkles size={18} style={{ color: T.purple }} />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-gray-500 mb-1">Select a PR to analyse</div>
            <div className="text-[11px] text-gray-400 leading-relaxed max-w-[180px]">
              Jomie surfaces tax flags, compliance issues, and approval context
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4">

          {/* PR summary */}
          <div>
            <div className="text-[14px] font-bold text-gray-900 leading-snug mb-0.5"
              style={{ fontFamily:"var(--font-pjs)" }}>{pr.title}</div>
            <div className="text-[11px] text-gray-400 mb-3">{pr.sub}</div>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-gray-400">Total</div>
                <div className="text-[22px] font-bold text-gray-900 tabular-nums font-mono">RM {pr.amount}</div>
                <div className={cn("text-[10px] font-mono mt-0.5",
                  pr.overBudget ? "text-red-500" : "text-gray-400")}>
                  {pr.overBudget
                    ? `▲ over by RM ${(+pr.amount.replace(/,/g,"") - +pr.budget.replace(/,/g,"")).toLocaleString()}`
                    : `/ ${pr.budget}`}
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: pr.status==="approved" ? T.tealLight
                    : pr.status==="pending" ? "#FEF3C7"
                    : pr.status==="review" ? T.purpleLight : "#F3F4F6",
                  color: pr.status==="approved" ? T.tealText
                    : pr.status==="pending" ? "#92400E"
                    : pr.status==="review" ? T.purpleText : "#6B7280",
                }}>
                ● {pr.status.charAt(0).toUpperCase()+pr.status.slice(1)}
              </span>
            </div>

            {/* Journey strip in drawer (compact) */}
            <div className="rounded-lg px-3 py-2.5 bg-white border border-gray-100">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Journey</div>
              <JourneyStrip pr={pr} compact={true} />
            </div>
          </div>

          {/* Line items */}
          {pr.lineItems.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Line Items</div>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {pr.lineItems.map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-2 px-3 py-2", i>0 && "border-t border-gray-100")}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-800 truncate">{item.name}</div>
                      <div className="text-[9px] text-gray-400 truncate">{item.detail}</div>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-gray-800 tabular-nums shrink-0">{item.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI insights */}
          {pr.aiInsights.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">AI Analysis</div>
              {pr.aiInsights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          )}

          {/* Sourcing (only for pending/review) */}
          {showSourcing && pr.vendors && pr.vendors.length > 0 && (
            <SourcingSection vendors={pr.vendors} />
          )}

          {/* Approval chain */}
          {pr.approvers.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Approval Chain</div>
              <div className="flex flex-col">
                {pr.approvers.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 pb-3 last:pb-0 relative">
                    {i < pr.approvers.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-100" />
                    )}
                    <div className={cn(
                      "size-[18px] rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 z-10 bg-white",
                      a.state==="done"    && "border-emerald-300 text-emerald-600",
                      a.state==="pending" && "border-amber-300 text-amber-600",
                      a.state==="waiting" && "border-gray-200 text-gray-300",
                    )}>
                      {a.state==="done" ? "✓" : a.level}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-gray-700">{a.role}</span>
                        <span className="text-[9px] text-gray-300 font-mono">L{a.level}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{a.name}</div>
                      <div className={cn("text-[9px] mt-0.5 flex items-center gap-1",
                        a.state==="done"    && "text-emerald-600",
                        a.state==="pending" && "text-amber-600",
                        a.state==="waiting" && "text-gray-300")}>
                        {a.state==="done"    && "✓ Approved"}
                        {a.state==="pending" && <><Clock size={8} className="shrink-0"/>Awaiting · 18 hrs</>}
                        {a.state==="waiting" && "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-start gap-1.5 rounded-lg p-2.5 border border-gray-100 bg-gray-50/50">
                <ShieldCheck size={11} className="shrink-0 mt-0.5" style={{ color:T.purple }} />
                <p className="text-[10px] text-gray-500 leading-snug">
                  SOD enforced — {pr.requester} excluded from all approval steps by system.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Context-aware footer */}
      {pr && footerType && (
        <div className="pt-3 mt-3 border-t border-gray-100 shrink-0">
          {footerType === "approver" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Total amount</div>
              </div>
              <div className="text-[18px] font-bold text-gray-900 tabular-nums font-mono mb-3">RM {pr.amount}</div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold shrink-0"
                  style={{ background: T.purpleLight, color: T.purpleText }}>
                  Select sourcing <ArrowRight size={11}/>
                </button>
                <button className="flex-1 flex items-center justify-center h-8 rounded-lg text-[12px] font-semibold text-white"
                  style={{ background: T.teal }}>
                  <CheckCircle2 size={13} className="mr-1.5"/> Approve
                </button>
                <button className="flex-1 flex items-center justify-center h-8 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
                  Query
                </button>
                <button className="size-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200">
                  <X size={13}/>
                </button>
              </div>
            </>
          )}
          {footerType === "done" && (
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold border"
                style={{ borderColor: T.teal+"66", color: T.teal }}
                onClick={() => router.push(`/p2p/purchase-requests/${pr.id}`)}>
                View PO <ArrowRight size={12}/>
              </button>
              <button className="size-9 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                <X size={13}/>
              </button>
            </div>
          )}
          {footerType === "requestor" && (
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-600">
                Track progress
              </button>
              <button className="size-9 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                <X size={13}/>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key:"all",      label:"All",      count:12 },
  { key:"pending",  label:"Pending",  count:3  },
  { key:"review",   label:"Review",   count:2  },
  { key:"approved", label:"Approved", count:6  },
  { key:"draft",    label:"Draft",    count:1  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseRequestsPage() {
  const router  = useRouter()
  const [selected, setSelected] = React.useState<PR>(PRS[0])
  const [filter,   setFilter]   = React.useState("all")
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const panelStyle: React.CSSProperties = { background:"#F7F7FE", borderRadius:10, overflow:"hidden" }

  return (
    <TooltipProvider>
      <div className="flex gap-[10px] h-full">

        {/* ── Main panel ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={panelStyle}>

          {/* Breadcrumb + AI bar + title row */}
          <div className="px-8 pt-6 pb-3 shrink-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
              <span>P2P</span>
              <ChevronRight size={10} className="text-gray-300"/>
              <span className="text-gray-600 font-medium">Purchase Requests</span>
            </div>

            {/* AI assistant bar — between breadcrumb and title */}
            <JomieAIBar message="3 PRs pending your approval — PR-0087 (Raw Materials) is over budget. Quotation required for PR-0089 (IT Equipment). 1 new vendor onboarding pending." />

            {/* Title + actions */}
            <div className="flex items-center justify-between">
              <h1 className="text-[20px] font-semibold text-gray-900" style={{ fontFamily:"var(--font-pjs)" }}>
                Purchase Requests
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-gray-600">
                  <Download size={12}/> Export
                </Button>
                <Button size="sm" className="gap-1.5 text-white border-0"
                  style={{ background: T.purple }}
                  onClick={() => router.push("/p2p/purchase-requests/new")}>
                  <Plus size={12}/> New PR
                </Button>
              </div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-2 px-8 pb-3 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"/>
              <Input placeholder="Search PRs…"
                className="h-8 pl-7 w-48 text-[12px] bg-white border-gray-200"/>
            </div>
            <div className="flex items-center gap-0.5">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex items-center gap-1 h-8 px-3 rounded-md text-[12px] transition-colors cursor-pointer",
                    filter===f.key
                      ? "bg-white border border-gray-200 font-semibold text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/60",
                  )}>
                  {f.label}
                  <span className="text-[10px] text-gray-400 tabular-nums">{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {/* Header */}
            <div className="grid border-b border-gray-200 pb-2 mb-1 pl-1"
              style={{ gridTemplateColumns:"1fr 140px 130px 120px 28px" }}>
              {["REQUEST","REQUESTED BY","AMOUNT (RM)","STATUS",""].map((h, i) => (
                <div key={i} className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider text-gray-400",
                  i===2 && "text-right", i===3 && "text-center",
                )}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {PRS.map(pr => {
              const isSel    = selected?.id === pr.id
              const isExp    = expanded.has(pr.id)
              const hasSubPRs = pr.subPRs && pr.subPRs.length > 0
              const PTypeIcon = PTYPE_CONFIG[pr.purchaseType].icon
              const ptColor   = PTYPE_CONFIG[pr.purchaseType].color
              const borderColor = rowBorderColor(pr)

              return (
                <React.Fragment key={pr.id}>
                  <div
                    onClick={() => setSelected(pr)}
                    className={cn(
                      "grid items-center py-2.5 border-b border-gray-100 cursor-pointer group transition-all duration-150 rounded-r-lg",
                    )}
                    style={{
                      gridTemplateColumns:"1fr 140px 130px 120px 28px",
                      borderLeft: `3px solid ${isSel ? T.selectedBorder : borderColor}`,
                      background: isSel ? T.selectedBg : "transparent",
                      paddingLeft: 8,
                    }}>

                    {/* Request */}
                    <div className="flex items-start gap-2 min-w-0 pr-2">
                      {/* Purchase type icon */}
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: ptColor+"18" }}>
                            <PTypeIcon size={13} style={{ color: ptColor }} strokeWidth={1.6}/>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {PTYPE_CONFIG[pr.purchaseType].label}
                        </TooltipContent>
                      </Tooltip>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-mono text-gray-300">{pr.id}</span>
                          {hasSubPRs && (
                            <button onClick={e => toggleExpand(pr.id, e)}
                              className="text-[9px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-500 hover:border-gray-300 cursor-pointer transition-colors">
                              {pr.subPRs!.length} sub-PRs
                            </button>
                          )}
                          {pr.aiFlags > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] font-medium"
                              style={{ color: T.amber }}>
                              <TriangleAlert size={10}/>{pr.aiFlags}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] font-semibold text-gray-800 truncate">{pr.title}</div>
                        <div className="text-[10px] text-gray-400 truncate">{pr.sub}</div>
                      </div>
                    </div>

                    {/* Requester */}
                    <div>
                      <div className="text-[12px] font-medium text-gray-700">{pr.requester}</div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                        <span>{pr.date}</span><span className="text-gray-200">·</span><span>{pr.dept}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-[12px] font-mono font-semibold text-gray-800 tabular-nums">{pr.amount}</div>
                      <div className={cn("text-[9px] font-mono mt-0.5",
                        pr.overBudget ? "font-semibold" : "text-gray-400")}
                        style={{ color: pr.overBudget ? T.borderCritical : undefined }}>
                        {pr.overBudget ? "▲ over budget" : `/ ${pr.budget}`}
                      </div>
                    </div>

                    {/* Status — 4-dot journey */}
                    <div className="flex justify-center">
                      <JourneyDotsMini pr={pr}/>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <button onClick={e => { e.stopPropagation(); router.push(`/p2p/purchase-requests/${pr.id}`) }}
                        className="cursor-pointer rounded p-0.5 hover:bg-gray-100 transition-colors"
                        title={`Open ${pr.id}`}>
                        <ChevronRight size={12} className={cn("transition-colors",
                          isSel ? "text-[#5D5EF4]" : "text-gray-200 group-hover:text-gray-400")}/>
                      </button>
                    </div>
                  </div>

                  {/* Sub-PR rows */}
                  {isExp && hasSubPRs && (
                    <div className="border-b border-gray-100 pl-10 pr-2 py-1.5 bg-gray-50/50">
                      <div className="space-y-1">
                        {pr.subPRs!.map(sub => {
                          const SubIcon = PTYPE_CONFIG[sub.type]?.icon ?? Package
                          const subColor = PTYPE_CONFIG[sub.type]?.color ?? T.purple
                          return (
                            <div key={sub.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer text-[11px]">
                              <ArrowRight size={10} className="text-gray-300 shrink-0"/>
                              <span className="font-mono text-[9px] text-gray-300 shrink-0">{sub.id}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: subColor+"18", color: subColor }}>
                                {PTYPE_CONFIG[sub.type]?.label}
                              </span>
                              <span className="flex-1 text-gray-600 truncate">{sub.vendor}</span>
                              <span className="font-mono font-semibold text-gray-700 shrink-0">RM {sub.amount}</span>
                              <span className="text-[9px] text-gray-400 shrink-0">{sub.approvalTier}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Right panel — 320px ── */}
        <div className="shrink-0 flex flex-col" style={{ ...panelStyle, width:320, padding:"20px 18px" }}>
          <CopilotPanel pr={selected}/>
        </div>
      </div>
    </TooltipProvider>
  )
}
