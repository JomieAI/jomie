"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { getSavedPRs, SEED_IDS } from "@/lib/pr-store"
import { cn } from "@/lib/utils"
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip"
import { InlineEditableTitle } from "@/components/ui/inline-editable-title"
import {
  ChevronLeft, Sparkles, ShieldCheck, CheckCircle2,
  TriangleAlert, Clock, Truck, Check, ArrowRight,
  Globe, ChevronDown, CircleCheck, Building2, Send, Plus,
} from "lucide-react"

// ─── Design tokens ────────────────────────────────────────────────────────────

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
  border:      "#E0DED8",
  dimText:     "#98A2B3",
  darkBorder:  "#676488",
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
    { id:"PR-0089-B", type:"Capex", items:"LG 27\" 4K × 6",                 amount:"15,000",  path:"Dept Head",    status:"review"  as const, leftColor:"#2563EB" },
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
      { rank:1, name:"TechGear (Shopee Biz)",     price:"6,890",  unit:"/unit" },
      { rank:2, name:"Lenovo Authorised (1688.com)", price:"~5,900", unit:"/unit", isImport:true },
    ],
  },
  "NXG-IT-002":{ code:"NXG-IT-002", name:"LG 27\" UltraFine 4K",
    approved:[
      { rank:1, name:"Tech Solutions MY", price:"2,500", unit:"/unit", recommended:true },
      { rank:2, name:"PC Image Malaysia", price:"2,650", unit:"/unit" },
    ],
    marketplace:[
      { rank:1, name:"LG Official (Shopee)",      price:"2,280", unit:"/unit" },
      { rank:2, name:"Display World (Lazada)",    price:"2,350", unit:"/unit" },
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

interface ChatMsg { role:"ai"|"user"; text:string }

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    role:"ai",
    text:"PR-0089 is pending your approval as Finance Manager. I've pre-loaded line items, A2 integrity checks, and sourcing options across 5 channels.\n\nApproval chain: Dept Head ✓ → You (current) → CFO pending.",
  },
  {
    role:"ai",
    text:"⚠️ 1 flag: Tech Solutions MY is not registered on MyInvois. SST input credit may be disallowed if a validated e-invoice is not obtained before PO issuance.\n\nSource: jomie-sst-baseline.md:v1.5 → SST18:S38",
  },
  {
    role:"ai",
    text:"Budget headroom is 4.8% (RM 7,194 remaining of RM 150,000 IT-CAPEX-2024). Below the 10% alert threshold — flagged for awareness, no override required.\n\nSource: budgetControl.md:v1.2",
  },
]

// ─── Journey strip ────────────────────────────────────────────────────────────

const PHASES = [
  { key:"pr",    label:"PR Created" },
  { key:"a2",    label:"A2 Check"   },
  { key:"appvl", label:"Approval"   },
  { key:"quote", label:"Quotation"  },
  { key:"po",    label:"PO"         },
  { key:"grn",   label:"GRN"        },
  { key:"ap",    label:"AP Payment" },
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
                    {done   && <Check size={9}  color="white" strokeWidth={3}/>}
                    {active && <div className="size-1.5 rounded-full bg-white"/>}
                  </div>
                  <span className="text-[8px] font-semibold whitespace-nowrap leading-none"
                    style={{ color: done ? T.teal : active ? T.purple : "#9CA3AF" }}>
                    {phase.label}
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

// ─── Right-panel section components ──────────────────────────────────────────

function SectionLabel({ children }: { children:React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
      {children}
    </div>
  )
}

function RequestDetails() {
  const PR = React.useContext(PRContext)
  return (
    <div className="pb-5 border-b" style={{ borderColor:T.border }}>
      <SectionLabel>Request Details</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Requestor</div>
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background:T.purpleLight, color:T.purple }}>{PR.requesterInitials}</div>
            <span className="text-[12px] font-medium text-gray-800">{PR.requester}</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{PR.dept}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Submitted</div>
          <div className="text-[12px] text-gray-700">{PR.submittedDate}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Required delivery</div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-700">
            <Truck size={12} className="text-gray-400"/>{PR.deliveryDate}
          </div>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2.5" style={{ background:"#F0EFEB", border:`0.5px solid ${T.border}` }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color:"#888780" }}>
          Business Justification
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{PR.justification}</p>
      </div>
    </div>
  )
}

function LineItemsSection() {
  const PR = React.useContext(PRContext)
  const total = PR.lineItems.reduce((n, i) => n + parseFloat(i.total.replace(/,/g,"")), 0)
  return (
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <SectionLabel>Line Items</SectionLabel>
      <div className="rounded-xl overflow-hidden" style={{ border:`0.5px solid ${T.border}` }}>
        <div className="grid text-[9px] font-semibold uppercase tracking-wider px-3 py-2"
          style={{ gridTemplateColumns:"76px 1fr 40px 68px 72px 84px", background:"#F0EFEB", color:"#888780", borderBottom:`0.5px solid ${T.border}` }}>
          <span>Code</span><span>Item</span><span className="text-right">Qty</span>
          <span className="text-right">Unit</span><span className="text-right">Total</span>
          <span className="text-right">GL Code</span>
        </div>
        {PR.lineItems.map((item, i) => (
          <div key={i} className="grid items-center px-3 py-2.5 bg-white text-[12px]"
            style={{ gridTemplateColumns:"76px 1fr 40px 68px 72px 84px", borderTop:i>0 ? `0.5px solid ${T.border}` : undefined }}>
            <span className="font-mono text-[9px] text-gray-400">{item.code}</span>
            <div>
              <div className="font-medium text-gray-800 truncate">{item.name}</div>
              <div className="text-[9px] text-gray-400 truncate">{item.spec}</div>
            </div>
            <span className="text-right font-mono text-gray-600">{item.qty}</span>
            <span className="text-right font-mono text-gray-600">RM {item.unitPrice}</span>
            <span className="text-right font-mono font-semibold text-gray-800">RM {item.total}</span>
            <span className="text-right font-mono text-[9px] text-gray-400">{item.glCode}</span>
          </div>
        ))}
        <div className="grid px-3 py-2 bg-gray-50"
          style={{ gridTemplateColumns:"76px 1fr 40px 68px 72px 84px", borderTop:`0.5px solid ${T.border}` }}>
          <div/><div className="text-[11px] font-semibold text-gray-600">Total</div>
          <div/><div/>
          <div className="text-right font-mono font-bold text-gray-900 text-[13px]">RM {total.toLocaleString()}</div>
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
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <SectionLabel>Cost Allocation</SectionLabel>
      <div className="grid grid-cols-3 gap-2 mb-3">
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
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <SectionLabel>Sub-PR Breakdown</SectionLabel>
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
    <div className="py-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>A2 Integrity Checks</SectionLabel>
        {warns.length===0
          ? <span className="text-[10px] font-semibold flex items-center gap-1 mb-3" style={{ color:T.teal }}><Check size={10}/>All passed</span>
          : <span className="text-[10px] font-semibold flex items-center gap-1 mb-3" style={{ color:T.amber }}><TriangleAlert size={10}/>{warns.length} warning</span>
        }
      </div>
      <div className="space-y-2">
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
    <div className="py-5">
      <SectionLabel>Approval Chain</SectionLabel>
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
      <div className="mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5"
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
          {/* Approved */}
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
          {/* Marketplace */}
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

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg:string; color:string; label:string }> = {
  pending:  { bg:"#FFFAEB", color:"#B54708", label:"Pending Approval" },
  review:   { bg:"#EFF6FF", color:"#1D4ED8", label:"Under Review"     },
  approved: { bg:"#ECFDF5", color:"#065F46", label:"Approved"         },
  draft:    { bg:"#F3F4F6", color:"#6B7280", label:"Draft"            },
  rejected: { bg:"#FEF2F2", color:"#991B1B", label:"Rejected"         },
}

// ─── Tab bar config ───────────────────────────────────────────────────────────

const CHAT_TABS = [
  { key:"ai",      label:"AI Chat"       },
  { key:"form",    label:"Form"          },
  { key:"import",  label:"Upload/Import" },
  { key:"reorder", label:"Auto Reorder"  },
]

const PANEL1_TABS = [
  { key:"details",  label:"Details"   },
  { key:"a2",       label:"A2 Checks" },
  { key:"approval", label:"Approvals" },
]

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PRDetailView() {
  const router = useRouter()
  const params = useParams()
  const [sourcingChoice, setSourcingChoice] = React.useState<"approved"|"marketplace"|"defer"|null>(null)
  const [approved,   setApproved]   = React.useState(false)
  const [prData,     setPrData]     = React.useState<PRData>(PR_TEMPLATE)
  const [messages,   setMessages]   = React.useState<ChatMsg[]>(INITIAL_MESSAGES)
  const [inputVal,   setInputVal]   = React.useState("")
  const [activeTab,  setActiveTab]  = React.useState("ai")
  const [panel1Tab,  setPanel1Tab]  = React.useState("details")
  const endRef      = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Load localStorage PR
  React.useEffect(() => {
    const id = params?.id as string | undefined
    if (!id || SEED_IDS.includes(id)) return
    const saved = getSavedPRs()
    const found = saved.find(p => p.id === id)
    if (found) {
      setPrData({ ...PR_TEMPLATE, id:found.id, title:found.title, sub:found.sub, justification:found.message })
    }
  }, [params?.id])

  // Auto-scroll chat
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [messages])

  const sendMessage = () => {
    const text = inputVal.trim()
    if (!text) return
    setMessages(prev => [
      ...prev,
      { role:"user", text },
      { role:"ai", text:"I'm reviewing your question. Let me check the relevant policies and data for this purchase request..." },
    ])
    setInputVal("")
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const badge = STATUS_BADGE[prData.status] ?? STATUS_BADGE.pending

  return (
    <PRContext.Provider value={prData}>
    <TooltipProvider>
      {/* ── Page wrapper — dark gradient ── */}
      <div className="flex h-full gap-2 p-4"
        style={{ background:"linear-gradient(45deg, #141137 0%, #191647 100%)" }}>

        {/* ══════════════════════════════════════════════════════════
            MIDDLE COLUMN — chat + PR summary
        ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col min-h-0 h-full shrink-0" style={{ width:440 }}>

          {/* ── Header ── */}
          <div className="pb-5 shrink-0" style={{ borderBottom:`1px solid ${T.darkBorder}` }}>
            {/* Breadcrumb row */}
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={() => router.push("/p2p/purchase-requests")}
                className="size-6 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
                <ChevronLeft size={16} color="white"/>
              </button>
              <span className="text-[12px] font-light" style={{ color:"rgba(255,255,255,0.7)" }}>
                Purchase Request / {prData.id}
              </span>
            </div>
            {/* Title + badge row */}
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

          {/* ── PR Summary card ── */}
          <div className="mt-5 rounded-[10px] p-4 shrink-0" style={{ background:"#F7F7FE" }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-3">
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Requester</div>
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background:T.purpleLight, color:T.purple }}>{prData.requesterInitials}</div>
                  <span className="text-[12px] font-medium text-gray-800">{prData.requester}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{prData.dept}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Submitted</div>
                <div className="text-[12px] text-gray-700">{prData.submittedDate}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Total Amount</div>
                <div className="text-[13px] font-bold font-mono text-gray-900">
                  RM {prData.costAllocation.committed.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 mb-0.5">Budget Approved</div>
                <div className="text-[12px] font-mono text-gray-600">
                  RM {prData.costAllocation.total.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="pt-2.5 border-t text-[11px] text-gray-500 mb-3" style={{ borderColor:T.border }}>
              {prData.sub}
            </div>
            {/* Journey strip */}
            <JourneyStrip activeIdx={2}/>
          </div>

          {/* ── Chat messages ── */}
          <div className="flex-1 min-h-0 relative mt-4">
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-10"
              style={{ background:"linear-gradient(to top, #141137 0%, transparent 100%)" }}/>
            <div className="h-full overflow-y-auto py-2 jomie-scrollbar"
              style={{ display:"flex", flexDirection:"column", gap:16,
                scrollbarWidth:"thin", scrollbarColor:"rgba(93,94,244,0.2) transparent" }}>
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col gap-1", msg.role==="user" && "items-end")}>
                  {msg.role==="ai" && (
                    <span className="text-[13px] font-bold" style={{ color:T.purple, fontFamily:"var(--font-inter), Inter, sans-serif" }}>
                      Jomie AI
                    </span>
                  )}
                  <div className={cn(
                    "w-fit max-w-[85%] px-3.5 py-2.5 text-[13px] leading-[1.5] whitespace-pre-wrap",
                    msg.role==="ai"
                      ? "rounded-[0px_8px_8px_8px]"
                      : "rounded-[8px_0px_8px_8px]",
                  )}
                    style={{
                      background: msg.role==="ai" ? "rgba(255,255,255,0.09)" : T.purple,
                      color:      msg.role==="ai" ? "rgba(255,255,255,0.88)" : "white",
                    }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={endRef}/>
            </div>
          </div>

          {/* ── Input area ── */}
          <div className="mt-3 flex flex-col gap-3 shrink-0">
            {/* Textarea card */}
            <div className="rounded-[15px] overflow-hidden bg-white"
              style={{ border:`2px solid ${T.darkBorder}`, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Write a message..."
                rows={3}
                className="w-full px-4 pt-4 pb-2 text-[13px] text-gray-700 placeholder-gray-400 resize-none bg-transparent focus:outline-none"
                style={{ fontFamily:"var(--font-inter), Inter, sans-serif" }}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <button className="size-8 rounded-lg flex items-center justify-center border"
                  style={{ borderColor:"#D0D5DD", boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                  <Plus size={15} style={{ color:"#344054" }}/>
                </button>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-[13px] px-2 py-1 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ color:T.purpleText }}>
                    Claude Opus 4.8
                    <ChevronDown size={14} style={{ color:T.purpleText }}/>
                  </button>
                  <button onClick={sendMessage}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background:T.purple, border:`1px solid ${T.purple}` }}>
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center justify-center pb-1">
              <div className="flex items-center gap-1 p-1 rounded-[24px]"
                style={{ background:"rgba(255,255,255,0.05)", border:`2px solid ${T.darkBorder}` }}>
                {CHAT_TABS.map(tab => (
                  <button key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="px-3 py-2 text-[12px] rounded-[20px] transition-all whitespace-nowrap"
                    style={{
                      background:  activeTab===tab.key ? "#0F0D2B" : "transparent",
                      color:       activeTab===tab.key ? "white"    : T.dimText,
                      boxShadow:   activeTab===tab.key ? "0px 1px 3px rgba(16,24,40,0.1), 0px 1px 2px rgba(16,24,40,0.06)" : "none",
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT COLUMN — two stacked #F7F7FE panels
        ══════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 h-full">

          {/* ── Panel 1: PR Details ── */}
          <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden min-h-0"
            style={{ background:"#F7F7FE" }}>

            {/* Panel 1 header */}
            <div className="px-6 pt-5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-gray-700">PR Details</span>
                <span className="text-[10px] font-mono text-gray-300">{prData.id}</span>
              </div>
              {/* Section tabs */}
              <div className="flex items-center gap-0 border-b" style={{ borderColor:T.border }}>
                {PANEL1_TABS.map(tab => (
                  <button key={tab.key}
                    onClick={() => setPanel1Tab(tab.key)}
                    className="px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px"
                    style={{
                      borderColor: panel1Tab===tab.key ? T.purple : "transparent",
                      color:       panel1Tab===tab.key ? T.purple : "#6B7280",
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel 1 content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 jomie-scrollbar"
              style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(93,94,244,0.15) transparent" }}>
              {panel1Tab==="details" && (
                <>
                  <RequestDetails/>
                  <LineItemsSection/>
                  <CostAllocationSection/>
                  <SubPRBreakdown/>
                </>
              )}
              {panel1Tab==="a2"       && <A2Section/>}
              {panel1Tab==="approval" && <ApprovalChainSection/>}
            </div>
          </div>

          {/* ── Panel 2: Sourcing + Approval Action ── */}
          <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden min-h-0"
            style={{ background:"#F7F7FE" }}>

            {/* Panel 2 header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b shrink-0"
              style={{ borderColor:T.border }}>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background:T.purpleLight }}>
                  <Sparkles size={11} style={{ color:T.purple }}/>
                </div>
                <span className="text-[13px] font-semibold text-gray-700">Sourcing Options</span>
                <span className="text-[10px] font-mono text-gray-400">· fetched 4 min ago</span>
              </div>
              <span className="text-[10px] font-mono text-gray-300">{prData.id}</span>
            </div>

            {/* Sourcing list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 jomie-scrollbar"
              style={{ scrollbarWidth:"thin", scrollbarColor:"rgba(93,94,244,0.15) transparent" }}>
              {prData.lineItems.map(item => (
                <ItemSourcingBlock key={item.code} itemCode={item.code}/>
              ))}
              <code className="text-[9px] font-mono text-gray-300 block px-1">
                procurementPolicy.md:v1.3 → S7.2 · vendorOnboarding.md:v2.1
              </code>
            </div>

            {/* Approval action footer */}
            <div className="px-4 pb-5 pt-3 border-t shrink-0 space-y-2.5" style={{ borderColor:T.border }}>

              {/* SLA */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5" style={{ color:T.amber }}>
                  <Clock size={11} className="shrink-0"/>
                  <span className="font-medium">18h elapsed · 30h remaining (FM SLA)</span>
                </div>
                <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:"37.5%", background:T.amber }}/>
                </div>
              </div>

              {/* State banners */}
              {!sourcingChoice && !approved && (
                <div className="text-[11px] text-gray-500 px-3 py-2 rounded-lg"
                  style={{ background:"#F0EFEB", border:`0.5px solid ${T.border}` }}>
                  Select a sourcing direction below before approving
                </div>
              )}
              {approved && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ background:T.tealLight, border:`0.5px solid ${T.teal}66` }}>
                  <CheckCircle2 size={13} style={{ color:T.teal }}/>
                  <div className="text-[11px] font-medium" style={{ color:T.tealText }}>
                    Approved · Sourcing direction recorded · Routing to CFO
                  </div>
                </div>
              )}

              {/* Sourcing direction buttons */}
              <div className="space-y-1.5">
                {[
                  {
                    key:"approved" as const,
                    icon:<CheckCircle2 size={13}/>,
                    label:"Proceed with best approved vendor",
                    activeBg:T.teal, activeColor:"white",
                    inactiveBg:T.tealLight, inactiveColor:T.tealText,
                    border:`0.5px solid ${T.teal}55`,
                  },
                  {
                    key:"marketplace" as const,
                    icon:<Globe size={13}/>,
                    label:"Select marketplace option",
                    activeBg:T.amber, activeColor:"white",
                    inactiveBg:T.amberLight, inactiveColor:T.amberText,
                    border:`0.5px solid ${T.amber}55`,
                  },
                  {
                    key:"defer" as const,
                    icon:null,
                    label:"Defer to quotation stage",
                    activeBg:"#6B7280", activeColor:"white",
                    inactiveBg:"#F3F4F6", inactiveColor:"#6B7280",
                    border:"0.5px solid #E5E7EB",
                  },
                ].map(opt => (
                  <button key={opt.key}
                    onClick={() => setSourcingChoice(opt.key)}
                    className="w-full flex items-center gap-2 h-9 px-3 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
                    style={{
                      background: sourcingChoice===opt.key ? opt.activeBg   : opt.inactiveBg,
                      color:      sourcingChoice===opt.key ? opt.activeColor : opt.inactiveColor,
                      border:     opt.border,
                      fontWeight: opt.key !== "defer" ? 600 : 400,
                    }}>
                    {opt.icon}
                    {opt.label}
                    {opt.key !== "defer" && <ArrowRight size={12} className="ml-auto"/>}
                  </button>
                ))}
              </div>

              {/* Approve CTA */}
              <button
                disabled={!sourcingChoice || approved}
                onClick={() => sourcingChoice && setApproved(true)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 h-10 rounded-lg text-[13px] font-semibold text-white transition-all",
                  (!sourcingChoice || approved) ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
                )}
                style={{ background: approved ? T.teal : T.purple }}>
                <CheckCircle2 size={14}/>
                {approved ? "Approved ✓" : `Approve ${prData.id} →`}
              </button>

              <p className="text-center text-[10px] leading-relaxed" style={{ color:T.dimText }}>
                Sourcing direction is a preference. Formal selection at Phase C.
                Deviation requires documented justification.
              </p>
            </div>
          </div>
        </div>

      </div>
    </TooltipProvider>
    </PRContext.Provider>
  )
}
