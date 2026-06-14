"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { getSavedPRs, SEED_IDS } from "@/lib/pr-store"
import { cn } from "@/lib/utils"
import { PageBackButton } from "@/components/ui/page-back-button"
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip"
import { InlineEditableTitle } from "@/components/ui/inline-editable-title"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft, ChevronRight, ChevronDown, Sparkles, ShieldCheck, CheckCircle2,
  TriangleAlert, Clock, Check, ArrowRight,
  Globe, CircleCheck, Building2, Plus, Loader2,
} from "lucide-react"

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  purple:      "#5D5EF4",
  purpleLight: "#EEEDFE",
  purpleText:  "#3C3489",
  purpleDark:  "#4243AD",
  teal:        "#1D9E75",
  tealLight:   "#E1F5EE",
  tealText:    "#085041",
  amber:       "#BA7517",
  amberLight:  "#FAEEDA",
  amberText:   "#633806",
  red:         "#E24B4A",
  redLight:    "#FCEBEB",
  redText:     "#791F1F",
  border:      "#E0DED8",
  dimText:     "#98A2B3",
  darkBorder:  "#676488",
  activeBg:    "#0F0D2B",
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PR_TEMPLATE = {
  id:"PR-0089", title:"IT Equipment — Q3 Upgrade", sub:"14 laptops · 6 monitors · 14 docks",
  requester:"Lim Wei Xiang", requesterInitials:"LW", dept:"Information Technology",
  submittedDate:"28 May 2026, 09:14 AM", deliveryDate:"31 July 2026",
  phase:"B" as const, status:"pending" as const,
  justification:"Q3 hardware refresh for IT team. 14 new Dell Latitude 5540 replacing 4-year-old units for developers. 6 LG 27\" UltraFine 4K monitors for design team. 14 WD22TB4 docks to support hot-desk setup across Level 4 expansion.",
  lineItems:[
    { code:"NXG-IT-001", name:"Dell Latitude 5540 Laptop",     spec:"Intel i7-13th, 16GB RAM, 512GB SSD", qty:14, unit:"unit", unitPrice:"7,200",  total:"100,800", glCode:"GL-7200-CAPEX", vendor:"Tech Solutions MY" },
    { code:"NXG-IT-002", name:"LG 27\" UltraFine 4K Monitor",  spec:"3840×2160, USB-C, 60Hz",             qty:6,  unit:"unit", unitPrice:"2,500",  total:"15,000",  glCode:"GL-7200-CAPEX", vendor:"Tech Solutions MY" },
    { code:"NXG-IT-003", name:"Dell WD22TB4 Thunderbolt Dock", spec:"TB4, 130W PD, 5× USB-A",             qty:14, unit:"unit", unitPrice:"1,929",  total:"27,006",  glCode:"GL-7200-CAPEX", vendor:"Tech Solutions MY" },
  ],
  costAllocation:{ centre:"IT Department", glCode:"GL-7200-CAPEX", budgetCode:"IT-CAPEX-2024", total:150000, committed:142806 },
  subPRs:[
    { id:"PR-0089-A", type:"Capex", items:"Dell L5540 × 14, WD22TB4 × 14", amount:"127,806", path:"FM + CFO", status:"pending" as const, leftColor:"#2563EB" },
    { id:"PR-0089-B", type:"Capex", items:"LG 27\" 4K × 6",                 amount:"15,000",  path:"Dept Head", status:"review" as const, leftColor:"#2563EB" },
  ],
  a2Results:[
    { check:"Exact duplicate",      result:"pass" as const, detail:"No duplicates in last 7 days" },
    { check:"Split PR pattern",     result:"pass" as const, detail:"Single submission — no split detected" },
    { check:"Vendor concentration", result:"pass" as const, detail:"Tech Solutions MY — 1 PR this month" },
    { check:"Budget availability",  result:"warn" as const, detail:"Headroom 4.8% — below 10% threshold" },
    { check:"New item gate",        result:"pass" as const, detail:"All 3 items in master" },
  ],
  approvers:[
    { initials:"SA", state:"done"    as const, name:"Siti Aisyah",    role:"Dept Head",   level:1, note:"✓ Approved · 28 May, 11:28 AM · 2h 14m", slaPct:100 },
    { initials:"RA", state:"pending" as const, name:"Razif Abdullah", role:"Finance Mgr", level:2, note:"Awaiting · 18h elapsed / 48h SLA",          slaPct:37.5 },
    { initials:"CM", state:"waiting" as const, name:"Chong Mei Ling", role:"CFO",         level:3, note:"Waiting",                                     slaPct:0 },
  ],
  sodNote:"Lim Wei Xiang (requestor) is excluded from all approval steps by system.",
}

type PRData = typeof PR_TEMPLATE
const PRContext = React.createContext<PRData>(PR_TEMPLATE)

const ITEM_SOURCING: Record<string, {
  code:string; name:string
  approved:{ rank:number; name:string; price:string; unit:string; recommended?:boolean }[]
  marketplace:{ rank:number; name:string; price:string; unit:string; isImport?:boolean }[]
}> = {
  "NXG-IT-001":{ code:"NXG-IT-001", name:"Dell Latitude 5540",
    approved:[
      { rank:1, name:"Tech Solutions MY",    price:"7,200", unit:"/unit", recommended:true },
      { rank:2, name:"Digital Hub Malaysia", price:"7,450", unit:"/unit" },
    ],
    marketplace:[
      { rank:1, name:"TechGear (Shopee Biz)",       price:"6,890",  unit:"/unit" },
      { rank:2, name:"Lenovo Authorised (1688.com)", price:"~5,900", unit:"/unit", isImport:true },
    ],
  },
  "NXG-IT-002":{ code:"NXG-IT-002", name:"LG 27\" UltraFine 4K",
    approved:[
      { rank:1, name:"Tech Solutions MY", price:"2,500", unit:"/unit", recommended:true },
      { rank:2, name:"PC Image Malaysia", price:"2,650", unit:"/unit" },
    ],
    marketplace:[
      { rank:1, name:"LG Official (Shopee)",   price:"2,280", unit:"/unit" },
      { rank:2, name:"Display World (Lazada)", price:"2,350", unit:"/unit" },
    ],
  },
  "NXG-IT-003":{ code:"NXG-IT-003", name:"Dell WD22TB4 Dock",
    approved:[
      { rank:1, name:"Tech Solutions MY", price:"1,929", unit:"/unit", recommended:true },
    ],
    marketplace:[
      { rank:1, name:"Dell Official (Shopee)", price:"1,780", unit:"/unit" },
    ],
  },
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

interface ChatMsg { role:"ai"|"user"; text:string; isHistory?:boolean }

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    role:"ai", isHistory:true,
    text:"PR-0089 is pending your approval as Finance Manager. I've pre-loaded line items, A2 integrity checks, and sourcing options across 5 channels.\n\nApproval chain: Dept Head ✓ → You (current) → CFO pending.",
  },
  {
    role:"ai", isHistory:true,
    text:"⚠️ 1 flag: Tech Solutions MY is not registered on MyInvois. SST input credit may be disallowed if a validated e-invoice is not obtained before PO issuance.\n\nSource: jomie-sst-baseline.md:v1.5 → SST18:S38",
  },
  {
    role:"ai", isHistory:true,
    text:"Budget headroom is 4.8% (RM 7,194 remaining of RM 150,000 IT-CAPEX-2024). Below the 10% alert threshold — flagged for awareness, no override required.\n\nSource: budgetControl.md:v1.2",
  },
]

function generateReply(msg: string): string {
  const m = msg.toLowerCase()
  if (/approve|approv/i.test(m))
    return "Based on A2 check results and available budget headroom (4.8%), I recommend proceeding with approval — selecting approved vendor Tech Solutions MY for all line items.\n\nNote: Request e-invoice from vendor before PO issuance to preserve SST input credit."
  if (/budget|headroom|cost/i.test(m))
    return "IT-CAPEX-2024 has RM 7,194 remaining after committing this PR (RM 142,806 of RM 150,000). This is 4.8% headroom — below the 10% alert threshold flagged in budgetControl.md:v1.2."
  if (/vendor|sourcing|supply/i.test(m))
    return "Tech Solutions MY (recommended) is the sole approved vendor across all 3 line items. Marketplace alternatives available but require vendor onboarding before PO issuance per procurementPolicy.md:v1.3 → S7.2."
  if (/sla|timeline|urgent/i.test(m))
    return "You have 30h remaining on your FM approval SLA (48h total). CFO approval (Chong Mei Ling) follows with a 72h SLA. Target delivery: 31 July 2026."
  if (/reject|decline/i.test(m))
    return "If you reject this PR, the requestor (Lim Wei Xiang) will be notified and can revise and resubmit. All A2 checks will re-run on resubmission. Confirm rejection?"
  return "I'll look into that for PR-0089. Cross-referencing line items, budget codes, and vendor records now...\n\nSource: procurementPolicy.md:v1.3 · budgetControl.md:v1.2"
}

// ─── Journey strip ────────────────────────────────────────────────────────────

const PHASES = [
  { key:"pr",    label:"PR Created", short:"PR"    },
  { key:"a2",    label:"A2 Check",   short:"A2"    },
  { key:"appvl", label:"Approval",   short:"Appvl" },
  { key:"quote", label:"Quotation",  short:"Quote" },
  { key:"po",    label:"PO",         short:"PO"    },
  { key:"grn",   label:"GRN",        short:"GRN"   },
  { key:"ap",    label:"AP Payment", short:"AP"    },
]

function JourneyStrip({ activeIdx }: { activeIdx:number }) {
  return (
    <div className="flex items-center w-full">
      {PHASES.map((phase, i) => {
        const done   = i < activeIdx
        const active = i === activeIdx
        return (
          <React.Fragment key={phase.key}>
            {i > 0 && (
              <div className="flex-1 h-0.5 min-w-[4px]"
                style={{ background: done ? T.teal : "#D1D5DB" }}/>
            )}
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col items-center gap-0.5 cursor-default shrink-0">
                  <div className={cn("size-5 rounded-full flex items-center justify-center border-2 transition-all", active && "animate-pulse")}
                    style={{
                      background:  done ? T.teal : active ? T.purple : "white",
                      borderColor: done ? T.teal : active ? T.purple : "#D1D5DB",
                    }}>
                    {done   && <Check size={9} color="white" strokeWidth={3}/>}
                    {active && <div className="size-1.5 rounded-full bg-white"/>}
                  </div>
                  <span className="text-[8px] font-semibold whitespace-nowrap leading-none"
                    style={{ color: done ? T.teal : active ? T.purple : "#9CA3AF" }}>
                    {phase.short}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{phase.label}</TooltipContent>
            </Tooltip>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── PR stat grid (2×2 summary cards) ───────────────────────────────────────

function PRStatGrid() {
  const PR = React.useContext(PRContext)
  const approvalPath = PR.approvers.filter(a => a.state !== "waiting").map(a => a.role.split(" ")[0]).join(" + ")
  const stats = [
    { label:"Items",           value:String(PR.lineItems.length), sub:"matched to master"   },
    { label:"Est. Total",      value:`RM ${PR.costAllocation.committed.toLocaleString()}`, sub:`${PR.subPRs.length} sub-PRs` },
    { label:"POs to Generate", value:String(PR.subPRs.length),   sub:"after approval"       },
    { label:"Approvals Needed",value:approvalPath,                sub:"highest tier"         },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 pt-4 pb-2">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl px-4 py-3.5 bg-white"
          style={{ border:`0.5px solid ${T.border}` }}>
          <div className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color:"#888780" }}>
            {s.label}
          </div>
          <div className="text-[15px] font-bold text-gray-900 leading-tight truncate">{s.value}</div>
          <div className="text-[10px] mt-0.5" style={{ color:T.dimText }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Right-panel section components ──────────────────────────────────────────

function RequestDetails() {
  const PR = React.useContext(PRContext)
  return (
    <div className="space-y-4 py-4">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color:"#888780" }}>
          Business Justification
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{PR.justification}</p>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color:"#888780" }}>
          Journey
        </div>
        <div className="rounded-xl bg-white px-6 py-6">
          <JourneyStrip activeIdx={2}/>
        </div>
      </div>
    </div>
  )
}

function LineItemsSection() {
  const PR = React.useContext(PRContext)
  const total = PR.lineItems.reduce((n, i) => n + parseFloat(i.total.replace(/,/g,"")), 0)
  return (
    <div className="pb-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color:"#888780" }}>
        Line Items
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border:`0.5px solid ${T.border}` }}>
        <div className="grid text-[9px] font-semibold uppercase tracking-wider px-3 py-2"
          style={{ gridTemplateColumns:"72px 1fr 36px 64px 88px 96px", background:"#F0EFEB", color:"#888780", borderBottom:`0.5px solid ${T.border}` }}>
          <span>Code</span><span>Item</span><span className="text-right">Qty</span>
          <span className="text-right">Unit</span><span className="text-right">Total</span>
          <span className="text-right">GL</span>
        </div>
        {PR.lineItems.map((item, i) => (
          <div key={i} className="grid items-center px-3 py-2.5 bg-white text-[12px]"
            style={{ gridTemplateColumns:"72px 1fr 36px 64px 88px 96px", borderTop:i>0 ? `0.5px solid ${T.border}` : undefined }}>
            <span className="font-mono text-[9px] text-gray-400">{item.code}</span>
            <div>
              <div className="font-medium text-gray-800 truncate">{item.name}</div>
              <div className="text-[9px] text-gray-400 truncate">{item.spec}</div>
            </div>
            <span className="text-right font-mono text-gray-600">{item.qty}</span>
            <span className="text-right font-mono text-gray-600">RM {item.unitPrice}</span>
            <span className="text-right font-mono font-semibold text-gray-800">RM {item.total}</span>
            <span className="text-right font-mono text-[9px] text-gray-400 whitespace-nowrap">{item.glCode}</span>
          </div>
        ))}
        <div className="grid px-3 py-2 bg-gray-50"
          style={{ gridTemplateColumns:"72px 1fr 36px 64px 88px 96px", borderTop:`0.5px solid ${T.border}` }}>
          <div/><div className="text-[11px] font-semibold text-gray-600">Total</div>
          <div/><div/>
          <div className="text-right font-mono font-bold text-gray-900 text-[13px] whitespace-nowrap">RM {total.toLocaleString()}</div>
          <div/>
        </div>
      </div>
    </div>
  )
}

function CostAllocationSection() {
  const PR = React.useContext(PRContext)
  const { costAllocation:ca } = PR
  const pct   = (ca.committed / ca.total) * 100
  const isLow = ((ca.total - ca.committed) / ca.total) < 0.1
  return (
    <div className="pb-4 space-y-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>
        Cost Allocation
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label:"Cost Centre",  value:ca.centre    },
          { label:"GL Code",      value:ca.glCode    },
          { label:"Budget Code",  value:ca.budgetCode},
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color:"#888780" }}>{label}</div>
            <div className="text-[11px] font-mono text-gray-800 truncate">{value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>Budget Headroom</span>
          <span className="text-[11px] font-semibold" style={{ color:isLow ? T.amber : T.teal }}>
            {((ca.total-ca.committed)/ca.total*100).toFixed(1)}% remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
          <div className="h-full rounded-full" style={{ width:`${pct}%`, background:isLow ? T.amber : T.teal }}/>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-400">
          <span>RM {ca.committed.toLocaleString()} committed</span>
          <span>/ RM {ca.total.toLocaleString()}</span>
        </div>
        {isLow && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color:T.amber }}>
            <TriangleAlert size={10} className="shrink-0"/>
            Below 10% headroom — budgetControl.md:v1.2
          </div>
        )}
      </div>
    </div>
  )
}

function SubPRBreakdown() {
  const PR = React.useContext(PRContext)
  return (
    <div className="py-4 space-y-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>
        Sub-PR Breakdown
      </div>
      <div className="space-y-2">
        {PR.subPRs.map(sub => (
          <div key={sub.id} className="rounded-lg bg-white overflow-hidden"
            style={{ border:`0.5px solid ${T.border}`, borderLeftWidth:3, borderLeftColor:sub.leftColor }}>
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="size-5 rounded flex items-center justify-center shrink-0"
                style={{ background:"#EFF6FF" }}>
                <Building2 size={11} style={{ color:"#2563EB" }} strokeWidth={1.6}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-mono text-gray-300">{sub.id}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background:"#EFF6FF", color:"#1D4ED8" }}>{sub.type}</span>
                </div>
                <div className="text-[11px] text-gray-600 truncate">{sub.items}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-bold font-mono text-gray-900">RM {sub.amount}</div>
                <div className="text-[9px] text-gray-400">{sub.path}</div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: sub.status==="review" ? T.purpleLight : "#FEF3C7",
                  color:      sub.status==="review" ? T.purpleText  : "#92400E",
                }}>
                {sub.status.charAt(0).toUpperCase()+sub.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function A2Section() {
  const PR = React.useContext(PRContext)
  const warns = PR.a2Results.filter(r => r.result==="warn")
  return (
    <div className="py-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>
          A2 Integrity Checks
        </div>
        {warns.length===0
          ? <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color:T.teal }}><Check size={10}/>All passed</span>
          : <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color:T.amber }}><TriangleAlert size={10}/>{warns.length} warning</span>
        }
      </div>
      <div className="space-y-1.5">
        {PR.a2Results.map((r, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-white"
            style={{ border:`0.5px solid ${T.border}` }}>
            <div className="size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
              style={{
                borderColor: r.result==="pass" ? T.teal+"66" : T.amber+"66",
                background:  r.result==="pass" ? T.tealLight : T.amberLight,
              }}>
              {r.result==="pass"
                ? <Check size={9} style={{ color:T.teal }} strokeWidth={2.5}/>
                : <TriangleAlert size={9} style={{ color:T.amber }}/>}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-semibold text-gray-700">{r.check}</span>
              <div className="text-[10px] text-gray-400 mt-0.5">{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalChainSection() {
  const PR = React.useContext(PRContext)
  return (
    <div className="py-4 space-y-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>
        Approval Chain
      </div>
      <div className="flex flex-col">
        {PR.approvers.map((a, i) => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0 relative">
            {i < PR.approvers.length-1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background:"#E5E7EB" }}/>
            )}
            <div className="size-[22px] rounded-full border-2 flex items-center justify-center text-[9px] font-bold shrink-0 z-10"
              style={{
                borderColor: a.state==="done" ? T.teal : a.state==="pending" ? T.amber : "#E5E7EB",
                background:  a.state==="done" ? T.tealLight : a.state==="pending" ? T.amberLight : "#F9FAFB",
                color:       a.state==="done" ? T.tealText  : a.state==="pending" ? T.amberText  : "#9CA3AF",
              }}>
              {a.state==="done" ? "✓" : a.level}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-semibold text-gray-800">{a.name}</span>
                <span className="text-[10px] text-gray-400">{a.role}</span>
                <span className="text-[9px] font-mono border rounded px-1 py-0.5"
                  style={{
                    borderColor: a.state==="done" ? T.teal+"66" : a.state==="pending" ? T.amber+"66" : "#E5E7EB",
                    color:       a.state==="done" ? T.tealText  : a.state==="pending" ? T.amberText  : "#9CA3AF",
                  }}>
                  L{a.level}
                </span>
              </div>
              <div className="text-[11px] mt-0.5 flex items-center gap-1.5"
                style={{ color: a.state==="done" ? T.teal : a.state==="pending" ? T.amber : "#9CA3AF" }}>
                {a.state==="done"    && <><CircleCheck size={11}/>{a.note}</>}
                {a.state==="pending" && <><Clock size={11}/>{a.note}</>}
                {a.state==="waiting" && a.note}
              </div>
              {a.state==="pending" && (
                <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden w-28">
                  <div className="h-full rounded-full" style={{ width:`${a.slaPct}%`, background:T.amber }}/>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
        style={{ background:"#F0EFEB", border:`0.5px solid ${T.border}` }}>
        <ShieldCheck size={12} className="shrink-0 mt-0.5" style={{ color:T.purple }}/>
        <p className="text-[10px] text-gray-500 leading-snug">{PR.sodNote}</p>
      </div>
    </div>
  )
}

function ItemSourcingBlock({ itemCode }: { itemCode:string }) {
  const data = ITEM_SOURCING[itemCode]
  if (!data) return null
  const [expanded, setExpanded] = React.useState(itemCode==="NXG-IT-001")
  return (
    <div className="rounded-lg overflow-hidden bg-white" style={{ border:`0.5px solid ${T.border}` }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
        <span className="text-[9px] font-mono text-gray-400 shrink-0">{data.code}</span>
        <span className="flex-1 text-left text-[11px] font-semibold text-gray-800 truncate">{data.name}</span>
        <ChevronDown size={12} className={cn("text-gray-400 transition-transform duration-200 shrink-0", expanded && "rotate-180")}/>
      </button>
      {expanded && (
        <div className="border-t" style={{ borderColor:T.border }}>
          <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{ background:T.tealLight, color:T.tealText, borderBottom:`0.5px solid ${T.teal}33` }}>
            Approved vendors
          </div>
          {data.approved.map((v, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-[#E1F5EE] transition-colors"
              style={{ borderTop:i>0 ? `0.5px solid ${T.teal}22` : undefined }}>
              <span className="text-[10px] font-bold w-4 shrink-0" style={{ color:v.recommended ? T.purple : "#888780" }}>
                {v.recommended ? "★" : v.rank}
              </span>
              <span className="flex-1 text-[11px] font-medium text-gray-800 truncate">{v.name}</span>
              <span className="text-[11px] font-mono text-gray-700 shrink-0">RM {v.price}{v.unit}</span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{ background:T.tealLight, color:T.tealText }}>Approved</span>
            </div>
          ))}
          <div className="px-3 py-1 text-[9px] flex items-center gap-1.5"
            style={{ background:T.amberLight+"88", color:T.amberText, borderTop:`0.5px solid ${T.amber}33` }}>
            <TriangleAlert size={9}/> Requires vendor onboarding before PO
          </div>
          {data.marketplace.map((v, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAEEDA] transition-colors"
              style={{ borderTop:i>0 ? `0.5px solid ${T.amber}22` : undefined }}>
              <span className="text-[10px] font-bold w-4 shrink-0 text-gray-400">{["①","②","③"][i]}</span>
              <span className="flex-1 text-[11px] font-medium text-gray-700 truncate">{v.name}</span>
              <span className="text-[11px] font-mono text-gray-600 shrink-0">RM {v.price}{v.unit}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background:T.amberLight, color:T.amberText }}>Marketplace</span>
                {v.isImport && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                    style={{ background:T.redLight, color:T.redText }}>Import ⚠</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const ACTIVITY_ITEMS = [
  {
    type:"pending",
    actor:"Razif Abdullah",
    initials:"RA",
    ts:"In progress",
    label:"Awaiting Finance Manager approval",
    detail:"L2 · 18h elapsed / 48h SLA",
    color:"#BA7517",
    bg:"#FAEEDA",
  },
  {
    type:"flag",
    actor:"Jomie AI",
    initials:"AI",
    ts:"28 May 2026, 11:28 AM",
    label:"A2 integrity check completed",
    detail:"4 passed · 1 warning (budget headroom 4.8%)",
    color:"#BA7517",
    bg:"#FAEEDA",
  },
  {
    type:"approval",
    actor:"Siti Aisyah",
    initials:"SA",
    ts:"28 May 2026, 11:28 AM",
    label:"Approved by Dept Head",
    detail:"L1 — 2h 14m after submission",
    color:"#1D9E75",
    bg:"#E1F5EE",
  },
  {
    type:"submit",
    actor:"Lim Wei Xiang",
    initials:"LW",
    ts:"28 May 2026, 09:14 AM",
    label:"PR submitted",
    detail:"IT Equipment — Q3 Upgrade · RM 142,806",
    color:"#5D5EF4",
    bg:"#EEEDFE",
  },
]

function ActivitySection() {
  return (
    <div className="py-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
        Activity Trail
      </div>
      <div className="flex flex-col">
        {ACTIVITY_ITEMS.map((item, i) => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0 relative">
            {i < ACTIVITY_ITEMS.length - 1 && (
              <div className="absolute left-[13px] top-7 bottom-0 w-px" style={{ background:"#E5E7EB" }}/>
            )}
            {/* Avatar */}
            <div className="size-[26px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 z-10"
              style={{ background:item.bg, color:item.color }}>
              {item.initials}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                <span className="text-[12px] font-semibold text-gray-800">{item.label}</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-0.5">{item.detail}</div>
              <div className="text-[10px] font-mono" style={{ color:T.dimText }}>{item.ts}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="grid grid-cols-2 gap-2">
        {[0,1,2,3].map(i => (
          <div key={i} className="p-3 rounded-xl" style={{ background:"#F0EFEB" }}>
            <Skeleton className="h-2.5 w-14 bg-gray-200 mb-2"/>
            <Skeleton className="h-4 w-20 bg-gray-300"/>
            <Skeleton className="h-2 w-24 bg-gray-200 mt-1.5"/>
          </div>
        ))}
      </div>
      {[0,1].map(i => (
        <div key={i} className="rounded-xl p-3.5 flex flex-col gap-2.5" style={{ background:"#F0EFEB" }}>
          <div className="flex justify-between items-start">
            <Skeleton className="h-3.5 w-36 bg-gray-200"/>
            <Skeleton className="h-3.5 w-14 bg-gray-300"/>
          </div>
          <Skeleton className="h-2.5 w-28 bg-gray-200"/>
        </div>
      ))}
    </div>
  )
}

// ─── Status badges ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg:string; color:string; label:string }> = {
  pending:  { bg:"#FFFAEB", color:"#B54708", label:"Pending Approval" },
  review:   { bg:"#EFF6FF", color:"#1D4ED8", label:"Under Review"     },
  approved: { bg:"#ECFDF5", color:"#065F46", label:"Approved"         },
  draft:    { bg:"#F3F4F6", color:"#6B7280", label:"Draft"            },
  rejected: { bg:"#FEF2F2", color:"#991B1B", label:"Rejected"         },
}

const CHAT_TABS = [
  { key:"ai",      label:"AI Chat"       },
  { key:"form",    label:"Form"          },
  { key:"import",  label:"Upload/Import" },
  { key:"reorder", label:"Auto Reorder"  },
]

const DETAIL_TABS = [
  { key:"details",  label:"Details"   },
  { key:"a2",       label:"A2 Checks" },
  { key:"approval", label:"Approvals" },
  { key:"activity", label:"Activity"  },
]

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PRDetailView() {
  const router   = useRouter()
  const params   = useParams()

  const [sourcingChoice, setSourcingChoice] = React.useState<"approved"|"marketplace"|"defer"|null>(null)
  const [approved,       setApproved]       = React.useState(false)
  const [prData,         setPrData]         = React.useState<PRData>(PR_TEMPLATE)
  const [messages,       setMessages]       = React.useState<ChatMsg[]>(INITIAL_MESSAGES)
  const [inputVal,       setInputVal]       = React.useState("")
  const [chatTab,        setChatTab]        = React.useState("ai")
  const [detailTab,      setDetailTab]      = React.useState("details")
  const [isChatThinking, setIsChatThinking] = React.useState(false)
  const [isPanelLoading, setIsPanelLoading] = React.useState(true)

  // Single-open accordion for right panels: "details" | "sourcing"
  const [activePanel, setActivePanel] = React.useState<"details"|"sourcing">("details")

  const endRef      = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // null = fill remaining | 0 = hidden | >0 = fixed px
  const [rightWidth, setRightWidth] = React.useState<number | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dragging   = React.useRef(false)
  const rightOpen  = rightWidth !== 0

  // Load PR from localStorage
  React.useEffect(() => {
    const id = params?.id as string | undefined
    if (!id || SEED_IDS.includes(id)) return
    const saved = getSavedPRs()
    const found = saved.find(p => p.id === id)
    if (found) setPrData({ ...PR_TEMPLATE, id:found.id, title:found.title, sub:found.sub, justification:found.message })
  }, [params?.id])

  // Simulate panel loading
  React.useEffect(() => {
    const t = setTimeout(() => setIsPanelLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  // Auto-scroll on new messages / thinking
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [messages, isChatThinking])

  // Drag resize — exact pattern from /new/
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

  // Send message with Jomie thinking animation
  const sendMessage = () => {
    const text = inputVal.trim()
    if (!text || isChatThinking) return
    setMessages(prev => [...prev, { role:"user", text }])
    setInputVal("")
    setIsChatThinking(true)
    const delay = Math.min(1200 + text.length * 8, 2400)
    setTimeout(() => {
      setIsChatThinking(false)
      setMessages(prev => [...prev, { role:"ai", text:generateReply(text) }])
    }, delay)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const badge = STATUS_BADGE[prData.status] ?? STATUS_BADGE.pending

  const rightPanelStyle: React.CSSProperties = {
    display:       rightWidth === 0 ? "none" : "flex",
    flexDirection: "column",
    flex:          rightWidth ? `0 0 ${rightWidth}px` : "1 1 0",
    minWidth:      0,
    gap:           8,
    overflow:      "hidden",
  }

  return (
    <PRContext.Provider value={prData}>
    <TooltipProvider>
      {/*
        Use calc(100vh - 20px) on wrapperRef — same as /new/ page — so the
        flex container has a definite height and the chat input sticks to bottom.
        The dark gradient is applied directly here.
      */}
      <div
        ref={wrapperRef}
        className="flex min-h-0"
        style={{
          height:"calc(100vh - 20px)",
          background:"linear-gradient(45deg, #141137 0%, #191647 100%)",
          padding:10,
          gap:0,
        }}>

        {/* ══════════════════════════════════════════════════════════
            MIDDLE COLUMN — identical structure to /new/
        ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col min-h-0 flex-1 min-w-[500px]">
          <div className="flex flex-col min-h-0 h-full w-full max-w-[700px] mx-auto"
            style={{ padding:"4px 16px 16px", gap:0 }}>

            {/* ── Header ── */}
            <div className="pb-4 shrink-0" style={{ borderBottom:`1px solid ${T.darkBorder}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <PageBackButton href="/p2p/purchase-requests" label={`Purchase Request / ${prData.id}`} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <InlineEditableTitle
                  value={prData.title}
                  onSave={title => setPrData(p => ({ ...p, title }))}
                  className="text-[18px] font-semibold text-white leading-7"
                  inputClassName="text-[18px] font-semibold text-white leading-7"
                  style={{ fontFamily:"var(--font-lora), Lora, serif" }}
                />
                <span className="shrink-0 text-[12px] px-2 py-0.5 rounded-md whitespace-nowrap"
                  style={{ background:badge.bg, color:badge.color }}>
                  {badge.label}
                </span>
              </div>
            </div>

            {/* ── PR Summary card — dark glass ── */}
            <div className="mt-4 rounded-[10px] p-4 shrink-0"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(103,100,136,0.3)" }}>
              {/* Single row: Requester left, Budget summary right */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] mb-0.5" style={{ color:T.dimText }}>Requester</div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background:"rgba(93,94,244,0.25)", color:"#A5A6F6" }}>{prData.requesterInitials}</div>
                    <span className="text-[12px] font-medium text-white">{prData.requester}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color:T.dimText }}>{prData.dept}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 mb-0.5">
                    <span className="text-[10px]" style={{ color:T.dimText }}>Amount</span>
                    <Tooltip>
                      <TooltipTrigger render={<button className="cursor-default"/>}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                          <path d="M8 7v4M8 5.5v.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[180px] text-[11px]">
                        Committed / total budget allocated to this PR (IT-CAPEX-2024)
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-[17px] font-bold font-mono text-white leading-tight">
                    RM {prData.costAllocation.committed.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color:T.dimText }}>
                    of RM {prData.costAllocation.total.toLocaleString()} budgeted
                  </div>
                </div>
              </div>
            </div>

            {/* ── Chat scroll area ── */}
            <div className="flex-1 min-h-0 relative mt-4">
              {/* Bottom fade — same as /new/ */}
              <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"
                style={{ background:"linear-gradient(to top, #141137 0%, transparent 100%)" }}/>
              <div className="h-full overflow-y-auto py-4 jomie-scrollbar"
                style={{ display:"flex", flexDirection:"column", gap:20,
                  scrollbarWidth:"thin", scrollbarColor:"rgba(93,94,244,0.2) transparent" }}>

                {messages.map((msg, i) => (
                  <div key={i}
                    className={cn("flex flex-col gap-1.5", msg.role==="user" && "items-end")}
                    style={{ animation:"fadeInUp 0.35s ease-out" }}>
                    {msg.role==="user" ? (
                      /* ── User bubble — same as /new/ ── */
                      <>
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[12px] font-light" style={{ color:T.dimText }}>
                            {msg.isHistory ? "28 May, 9:14am" : "Just now"}
                          </span>
                          <span className="text-[12px] font-bold text-white">You</span>
                        </div>
                        <div className="w-fit max-w-[80%] px-3.5 py-2.5 text-[14px] text-white leading-5"
                          style={{ background:"rgba(255,255,255,0.05)", borderRadius:12 }}>
                          {msg.text}
                        </div>
                      </>
                    ) : msg.isHistory ? (
                      /* ── Jomie history message — glass card style (like /new/ analysis block) ── */
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold" style={{ color:T.purple }}>Jomie AI</span>
                          <span className="text-[12px] font-light" style={{ color:T.dimText }}>28 May, 9:14am</span>
                        </div>
                        <div className="px-3.5 py-3 rounded-xl text-[14px] text-white leading-5 whitespace-pre-wrap"
                          style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.4)" }}>
                          {msg.text}
                        </div>
                      </>
                    ) : (
                      /* ── Jomie new reply — plain text, same as /new/ follow-up chat ── */
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold" style={{ color:T.purple }}>Jomie AI</span>
                          <span className="text-[12px] font-light" style={{ color:T.dimText }}>Just now</span>
                        </div>
                        <div className="text-[14px] text-white leading-5 whitespace-pre-wrap">{msg.text}</div>
                      </>
                    )}
                  </div>
                ))}

                {/* Jomie thinking — same as /new/ */}
                {isChatThinking && (
                  <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.25s ease-out" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold" style={{ color:T.purple }}>Jomie AI</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-fit"
                      style={{ background:"rgba(255,255,255,0.05)" }}>
                      {[0,1,2].map(j => (
                        <span key={j} className="size-1.5 rounded-full animate-bounce"
                          style={{ background:"rgba(255,255,255,0.4)", animationDelay:`${j*160}ms` }}/>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={endRef}/>
              </div>
            </div>

            {/* ── Sticky bottom: textarea + tab bar — same as /new/ ── */}
            <div className="shrink-0 pt-4">
              <div className="flex flex-col"
                style={{ background:"#FFFFFF", border:`2px solid ${T.darkBorder}`, borderRadius:20,
                  boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                <textarea
                  ref={textareaRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Ask Jomie anything about this PR… (↵ to send, ⇧↵ new line)"
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
                      style={{ color:T.purpleDark }}>
                      Claude Opus 4.8
                      <ChevronDown size={16} style={{ color:T.purpleDark }}/>
                    </button>
                    <button
                      onClick={sendMessage}
                      className="flex items-center justify-center px-3.5 h-8 rounded-lg text-[14px] font-medium text-white transition-all cursor-pointer"
                      style={{
                        background: inputVal.trim() && !isChatThinking ? T.purple : "rgba(93,94,244,0.35)",
                        border:`1px solid ${inputVal.trim() && !isChatThinking ? T.purple : "transparent"}`,
                        boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                        opacity: isChatThinking ? 0.5 : 1,
                      }}>
                      {isChatThinking ? <Loader2 size={14} className="animate-spin"/> : "Send"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab bar — same as /new/ */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="inline-flex items-center p-1 gap-2"
                  style={{ background:"rgba(255,255,255,0.05)", border:`2px solid ${T.darkBorder}`, borderRadius:24 }}>
                  {CHAT_TABS.map(tab => (
                    <button key={tab.key}
                      onClick={() => setChatTab(tab.key)}
                      className={cn(
                        "h-9 px-3 text-[12px] transition-all cursor-pointer whitespace-nowrap",
                        chatTab===tab.key ? "text-white" : "text-gray-400 hover:text-gray-300",
                      )}
                      style={{
                        borderRadius: chatTab===tab.key ? 20 : 6,
                        background:   chatTab===tab.key ? T.activeBg : "transparent",
                        boxShadow:    chatTab===tab.key ? "0px 1px 3px rgba(16,24,40,0.1), 0px 1px 2px rgba(16,24,40,0.06)" : "none",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            DRAG HANDLE + TOGGLE — exact from /new/
        ══════════════════════════════════════════════════════════ */}
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
            title={rightOpen ? "Hide panels" : "Show panels"}>
            {rightOpen
              ? <ChevronRight size={13} color="rgba(255,255,255,0.6)"/>
              : <ChevronLeft  size={13} color="rgba(255,255,255,0.6)"/>
            }
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT — Two mutually-exclusive accordion panels
        ══════════════════════════════════════════════════════════ */}
        <div style={rightPanelStyle}>

          {/* ── Panel 1: PR Details ── */}
          <div
            className="flex flex-col rounded-[10px] overflow-hidden"
            style={{
              background:"#F7F7FE",
              flex: activePanel==="details" ? "1 1 0" : "0 0 auto",
              minHeight: 0,
            }}>

            {/* Panel 1 header — click to open (closes Panel 2 content) */}
            <button
              onClick={() => setActivePanel("details")}
              className="w-full flex items-center justify-between px-5 py-3 border-b shrink-0 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderColor:T.border }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-gray-700">PR Details</span>
                <span className="text-[10px] font-mono text-gray-300">{prData.id}</span>
              </div>
              <ChevronDown size={14}
                className="text-gray-400 transition-transform duration-200 shrink-0"
                style={{ transform: activePanel==="details" ? "rotate(180deg)" : "rotate(0deg)" }}/>
            </button>

            {/* Panel 1 content — visible only when active */}
            {activePanel==="details" && (
              <>
                {/* Inner tabs */}
                <div className="flex items-center px-5 border-b shrink-0"
                  style={{ borderColor:T.border, background:"white" }}>
                  {DETAIL_TABS.map(tab => (
                    <button key={tab.key}
                      onClick={() => setDetailTab(tab.key)}
                      className="px-3 py-2.5 text-[12px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
                      style={{
                        borderColor: detailTab===tab.key ? T.purple : "transparent",
                        color:       detailTab===tab.key ? T.purple : "#6B7280",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content — scrollable, height fits content */}
                <div className="flex-1 overflow-y-auto px-5 jomie-scrollbar min-h-0">
                  {isPanelLoading ? (
                    <PanelSkeleton/>
                  ) : (
                    <>
                      {detailTab==="details"  && <><PRStatGrid/><RequestDetails/><LineItemsSection/><SubPRBreakdown/><CostAllocationSection/></>}
                      {detailTab==="a2"       && <A2Section/>}
                      {detailTab==="approval" && <ApprovalChainSection/>}
                      {detailTab==="activity" && <ActivitySection/>}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Panel 2: Sourcing Options + always-visible Approval footer ── */}
          <div
            className="flex flex-col rounded-[10px] overflow-hidden"
            style={{
              background:"#F7F7FE",
              flex: activePanel==="sourcing" ? "1 1 0" : "0 0 auto",
              minHeight: 0,
            }}>

            {/* Panel 2 header — click to open (closes Panel 1 content) */}
            <button
              onClick={() => setActivePanel("sourcing")}
              className="w-full flex items-center justify-between px-5 py-3 border-b shrink-0 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderColor:T.border }}>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded flex items-center justify-center shrink-0"
                  style={{ background:T.purpleLight }}>
                  <Sparkles size={9} style={{ color:T.purple }}/>
                </div>
                <span className="text-[12px] font-semibold text-gray-700">Sourcing Options</span>
                <span className="text-[10px] font-mono text-gray-400">· 4 min ago</span>
              </div>
              <ChevronDown size={14}
                className="text-gray-400 transition-transform duration-200 shrink-0"
                style={{ transform: activePanel==="sourcing" ? "rotate(180deg)" : "rotate(0deg)" }}/>
            </button>

            {/* Sourcing list — only when active */}
            {activePanel==="sourcing" && (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 jomie-scrollbar min-h-0">
                {isPanelLoading ? (
                  <div className="flex flex-col gap-2 py-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="rounded-lg p-3 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-2.5 w-20 bg-gray-200"/>
                          <Skeleton className="h-3 w-32 bg-gray-300 flex-1"/>
                        </div>
                        <Skeleton className="h-2 w-full bg-gray-100"/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {prData.lineItems.map(item => (
                      <ItemSourcingBlock key={item.code} itemCode={item.code}/>
                    ))}
                    <code className="text-[9px] font-mono text-gray-300 block px-1 pb-1">
                      procurementPolicy.md:v1.3 → S7.2 · vendorOnboarding.md:v2.1
                    </code>
                  </>
                )}
              </div>
            )}

            {/* ── Approval action footer — ALWAYS VISIBLE regardless of panel state ── */}
            <div className="px-4 pb-4 pt-3 border-t shrink-0"
              style={{ borderColor:T.border, background:"#F7F7FE" }}>

              {/* SLA bar */}
              <div className="flex items-center justify-between mb-3 text-[11px]">
                <div className="flex items-center gap-1.5" style={{ color:T.amber }}>
                  <Clock size={11} className="shrink-0"/>
                  <span className="font-medium">18h elapsed · 30h remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:"37.5%", background:T.amber }}/>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">FM SLA</span>
                </div>
              </div>

              {/* State banners */}
              {approved ? (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
                  style={{ background:T.tealLight, border:`0.5px solid ${T.teal}66` }}>
                  <CheckCircle2 size={12} style={{ color:T.teal }}/>
                  <div className="text-[11px] font-medium" style={{ color:T.tealText }}>
                    Approved · Sourcing recorded · Routing to CFO
                  </div>
                </div>
              ) : !sourcingChoice && (
                <div className="text-[11px] text-gray-500 px-3 py-2 rounded-lg mb-3"
                  style={{ background:"#F0EFEB", border:`0.5px solid ${T.border}` }}>
                  Select a sourcing direction before approving
                </div>
              )}

              {/* ── Compact 3-column sourcing direction selector ── */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {([
                  {
                    key:"approved" as const,
                    icon:<CheckCircle2 size={15}/>,
                    label:"Best Vendor",
                    activeBg:T.teal,     activeColor:"white",
                    inactiveBg:T.tealLight, inactiveColor:T.tealText,
                  },
                  {
                    key:"marketplace" as const,
                    icon:<Globe size={15}/>,
                    label:"Marketplace",
                    activeBg:T.amber,    activeColor:"white",
                    inactiveBg:T.amberLight, inactiveColor:T.amberText,
                  },
                  {
                    key:"defer" as const,
                    icon:<ArrowRight size={15}/>,
                    label:"Defer",
                    activeBg:"#6B7280", activeColor:"white",
                    inactiveBg:"#F3F4F6", inactiveColor:"#6B7280",
                  },
                ] as const).map(opt => (
                  <button key={opt.key}
                    onClick={() => setSourcingChoice(opt.key)}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                    style={{
                      background: sourcingChoice===opt.key ? opt.activeBg   : opt.inactiveBg,
                      color:      sourcingChoice===opt.key ? opt.activeColor : opt.inactiveColor,
                      border: sourcingChoice===opt.key
                        ? `1.5px solid ${opt.activeBg}`
                        : `1px solid ${opt.inactiveBg === "#F3F4F6" ? "#E5E7EB" : opt.inactiveBg}`,
                      boxShadow: sourcingChoice===opt.key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                    }}>
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Approve CTA */}
              <button
                disabled={!sourcingChoice || approved}
                onClick={() => sourcingChoice && setApproved(true)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[13px] font-semibold text-white transition-all",
                  (!sourcingChoice || approved) ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
                )}
                style={{ background: approved ? T.teal : T.purple }}>
                <CheckCircle2 size={13}/>
                {approved ? "Approved ✓" : `Approve ${prData.id} →`}
              </button>

              <p className="text-center text-[10px] mt-2 leading-relaxed" style={{ color:T.dimText }}>
                Sourcing preference only · formal selection at Phase C
              </p>
            </div>
          </div>

        </div>{/* end right panels */}

      </div>
    </TooltipProvider>
    </PRContext.Provider>
  )
}
