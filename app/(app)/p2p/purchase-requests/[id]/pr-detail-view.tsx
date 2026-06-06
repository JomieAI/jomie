"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ChevronLeft, Sparkles, ShieldCheck, ShieldAlert, CheckCircle2,
  TriangleAlert, Clock, Truck, Check, Download, MessageSquare,
  ArrowRight, Star, Globe, ChevronDown, CircleCheck, Building2,
  BadgeCheck, X,
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
  aiBarBg:     "#EEEDFE",
  aiBarBorder: "#AFA9EC",
  aiBarIcon:   "#534AB7",
  aiBarText:   "#3C3489",
  border:      "#E0DED8",
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PR = {
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
    { check:"Exact duplicate",     result:"pass" as const, detail:"No duplicates in last 7 days" },
    { check:"Split PR pattern",    result:"pass" as const, detail:"Single submission — no split detected" },
    { check:"Vendor concentration",result:"pass" as const, detail:"Tech Solutions MY — 1 PR this month" },
    { check:"Budget availability", result:"warn" as const, detail:"Headroom 4.8% — below 10% threshold" },
    { check:"New item gate",       result:"pass" as const, detail:"All 3 items in master" },
  ],
  approvers:[
    { initials:"SA", state:"done"    as const, name:"Siti Aisyah",    role:"Dept Head",   level:1, note:"✓ Approved · 28 May, 11:28 AM · 2h 14m",   slaPct:100 },
    { initials:"RA", state:"pending" as const, name:"Razif Abdullah", role:"Finance Mgr", level:2, note:"Awaiting · 18h elapsed / 48h SLA",           slaPct:37.5 },
    { initials:"CM", state:"waiting" as const, name:"Chong Mei Ling", role:"CFO",         level:3, note:"Waiting",                                      slaPct:0 },
  ],
  sodNote:"Lim Wei Xiang (requestor) is excluded from all approval steps by system.",
}

// Per-item sourcing data
const ITEM_SOURCING: Record<string, { code:string; name:string; approved:{rank:number;name:string;price:string;unit:string;recommended?:boolean}[]; marketplace:{rank:number;name:string;price:string;unit:string;isImport?:boolean}[] }> = {
  "NXG-IT-001":{ code:"NXG-IT-001", name:"Dell Latitude 5540",
    approved:[
      { rank:1, name:"Tech Solutions MY",   price:"7,200",  unit:"/unit", recommended:true },
      { rank:2, name:"Digital Hub Malaysia", price:"7,450", unit:"/unit" },
    ],
    marketplace:[
      { rank:1, name:"TechGear (Shopee Biz)", price:"6,890", unit:"/unit" },
      { rank:2, name:"Lenovo Authorised (1688)", price:"~5,900", unit:"/unit", isImport:true },
    ],
  },
  "NXG-IT-002":{ code:"NXG-IT-002", name:"LG 27\" UltraFine 4K",
    approved:[
      { rank:1, name:"Tech Solutions MY",  price:"2,500", unit:"/unit", recommended:true },
      { rank:2, name:"PC Image Malaysia",  price:"2,650", unit:"/unit" },
    ],
    marketplace:[
      { rank:1, name:"LG Official (Shopee)", price:"2,280", unit:"/unit" },
      { rank:2, name:"Display World (Lazada)", price:"2,350", unit:"/unit" },
    ],
  },
  "NXG-IT-003":{ code:"NXG-IT-003", name:"Dell WD22TB4 Dock",
    approved:[
      { rank:1, name:"Tech Solutions MY",  price:"1,929", unit:"/unit", recommended:true },
    ],
    marketplace:[
      { rank:1, name:"Dell Official (Shopee)", price:"1,780", unit:"/unit" },
    ],
  },
}

// ─── Shared components ────────────────────────────────────────────────────────

function JomieAIBar({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
      style={{ background:T.aiBarBg, border:`0.5px solid ${T.aiBarBorder}`, borderRadius:8 }}>
      <Sparkles size={15} style={{ color:T.aiBarIcon, flexShrink:0 }}/>
      <span className="flex-1 text-[12px] leading-snug" style={{ color:T.aiBarText }}>{message}</span>
      <kbd className="shrink-0 text-[11px] font-mono select-none" style={{ color:T.aiBarBorder }}>⌘K</kbd>
    </div>
  )
}

// 7-phase journey strip
const PHASES = [
  { key:"pr",    label:"PR Created" },
  { key:"a2",    label:"A2 Check"  },
  { key:"appvl", label:"Approval"  },
  { key:"quote", label:"Quotation" },
  { key:"po",    label:"PO"        },
  { key:"grn",   label:"GRN"       },
  { key:"ap",    label:"AP Payment"},
]

function JourneyStrip({ activeIdx }: { activeIdx: number }) {
  return (
    <div className="flex items-center w-full">
      {PHASES.map((phase, i) => {
        const done   = i < activeIdx
        const active = i === activeIdx
        const pending= i > activeIdx
        return (
          <React.Fragment key={phase.key}>
            {i > 0 && <div className="flex-1 h-0.5 min-w-[12px]"
              style={{ background: done ? T.teal : "#E5E7EB" }}/>}
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col items-center gap-1 cursor-default">
                  <div className={cn("size-6 rounded-full flex items-center justify-center border-2 transition-all",
                    active && "animate-pulse")}
                    style={{
                      background: done ? T.teal : active ? T.purple : "white",
                      borderColor: done ? T.teal : active ? T.purple : "#D1D5DB",
                    }}>
                    {done   && <Check size={11} color="white" strokeWidth={3}/>}
                    {active && <div className="size-2 rounded-full bg-white"/>}
                  </div>
                  <span className="text-[9px] font-semibold whitespace-nowrap"
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

// ─── Left column sections ─────────────────────────────────────────────────────

function RequestDetails() {
  return (
    <div className="pb-5 border-b" style={{ borderColor:T.border }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
        Request Details
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Requestor</div>
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-full flex items-center justify-center text-[9px] font-bold"
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
      <div className="rounded-lg px-3 py-2.5" style={{ background:"#F8F7F4", border:`0.5px solid ${T.border}` }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color:"#888780" }}>
          Business Justification
        </div>
        <p className="text-[12px] text-gray-600 leading-relaxed">{PR.justification}</p>
      </div>
    </div>
  )
}

function LineItemsSection() {
  const total = PR.lineItems.reduce((n, i) => n + parseFloat(i.total.replace(/,/g,"")), 0)
  return (
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
        Line Items
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border:`0.5px solid ${T.border}` }}>
        <div className="grid text-[9px] font-semibold uppercase tracking-wider px-3 py-2"
          style={{ gridTemplateColumns:"80px 1fr 44px 72px 72px 90px", background:"#F8F7F4", color:"#888780", borderBottom:`0.5px solid ${T.border}` }}>
          <span>Code</span><span>Item</span><span className="text-right">Qty</span>
          <span className="text-right">Unit</span><span className="text-right">Total</span>
          <span className="text-right">GL Code</span>
        </div>
        {PR.lineItems.map((item, i) => (
          <div key={i} className="grid items-center px-3 py-2.5 bg-white text-[12px]"
            style={{ gridTemplateColumns:"80px 1fr 44px 72px 72px 90px", borderTop: i>0 ? `0.5px solid ${T.border}` : undefined }}>
            <span className="font-mono text-[9px] text-gray-400">{item.code}</span>
            <div>
              <div className="font-medium text-gray-800">{item.name}</div>
              <div className="text-[9px] text-gray-400">{item.spec}</div>
            </div>
            <span className="text-right font-mono text-gray-600">{item.qty}</span>
            <span className="text-right font-mono text-gray-600">RM {item.unitPrice}</span>
            <span className="text-right font-mono font-semibold text-gray-800">RM {item.total}</span>
            <span className="text-right font-mono text-[9px] text-gray-400">{item.glCode}</span>
          </div>
        ))}
        <div className="grid px-3 py-2 bg-gray-50"
          style={{ gridTemplateColumns:"80px 1fr 44px 72px 72px 90px", borderTop:`0.5px solid ${T.border}` }}>
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
  const { costAllocation: ca } = PR
  const pct = (ca.committed / ca.total) * 100
  const isLow = ((ca.total - ca.committed) / ca.total) < 0.1
  return (
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
        Cost Allocation
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color:"#888780" }}>Cost Centre</div>
          <div className="text-[12px] font-medium text-gray-800">{ca.centre}</div>
        </div>
        <div className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color:"#888780" }}>GL Code</div>
          <div className="text-[12px] font-mono text-gray-800">{ca.glCode}</div>
        </div>
        <div className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color:"#888780" }}>Budget Code</div>
          <div className="text-[12px] font-mono text-gray-800">{ca.budgetCode}</div>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2.5 bg-white" style={{ border:`0.5px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>Budget Headroom</span>
          <span className="text-[11px] font-semibold" style={{ color: isLow ? T.amber : T.teal }}>
            {((ca.total-ca.committed)/ca.total*100).toFixed(1)}% remaining
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
          <div className="h-full rounded-full" style={{ width:`${pct}%`, background: isLow ? T.amber : T.teal }}/>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-400">
          <span>RM {ca.committed.toLocaleString()} committed</span>
          <span>/ RM {ca.total.toLocaleString()}</span>
        </div>
        {isLow && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color:T.amber }}>
            <TriangleAlert size={10} className="shrink-0"/>
            <span>Below 10% headroom — budgetControl.md:v1.2</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SubPRBreakdown() {
  return (
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color:"#888780" }}>
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
                <div className="text-[11px] text-gray-600">{sub.items}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-bold font-mono text-gray-900">RM {sub.amount}</div>
                <div className="text-[9px] text-gray-400">{sub.path}</div>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: sub.status==="review" ? T.purpleLight : "#FEF3C7",
                  color: sub.status==="review" ? T.purpleText : "#92400E",
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

function A2SectionLeft() {
  const warns = PR.a2Results.filter(r => r.result==="warn")
  return (
    <div className="py-5 border-b" style={{ borderColor:T.border }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color:"#888780" }}>A2 Checks</div>
        {warns.length===0
          ? <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color:T.teal }}><Check size={10}/>All passed</span>
          : <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color:T.amber }}><TriangleAlert size={10}/>{warns.length} warning</span>
        }
      </div>
      <div className="space-y-1.5">
        {PR.a2Results.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
              style={{ borderColor:r.result==="pass" ? T.teal+"66" : T.amber+"66",
                background:r.result==="pass" ? T.tealLight : T.amberLight }}>
              {r.result==="pass"
                ? <Check size={9} style={{ color:T.teal }} strokeWidth={2.5}/>
                : <TriangleAlert size={9} style={{ color:T.amber }}/>}
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-700">{r.check}</span>
              <span className="text-[10px] text-gray-400 ml-2">{r.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalChainSection() {
  return (
    <div className="py-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color:"#888780" }}>
        Approval Chain
      </div>
      <div className="flex flex-col">
        {PR.approvers.map((a, i) => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0 relative">
            {i < PR.approvers.length-1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background:"#F0EEE8" }}/>
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
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-gray-800">{a.name}</span>
                <span className="text-[10px] text-gray-400">{a.role}</span>
                <span className="text-[9px] font-mono border rounded px-1 py-0.5"
                  style={{ borderColor: a.state==="done" ? T.teal+"66" : a.state==="pending" ? T.amber+"66" : "#E5E7EB",
                    color: a.state==="done" ? T.tealText : a.state==="pending" ? T.amberText : "#9CA3AF" }}>
                  L{a.level}
                </span>
              </div>
              <div className="text-[11px] mt-0.5 flex items-center gap-1.5"
                style={{ color: a.state==="done" ? T.teal : a.state==="pending" ? T.amber : "#9CA3AF" }}>
                {a.state==="done"    && <><CircleCheck size={11}/> {a.note}</>}
                {a.state==="pending" && <><Clock size={11}/> {a.note}</>}
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
        style={{ background:"#F8F7F4", border:`0.5px solid ${T.border}` }}>
        <ShieldCheck size={12} className="shrink-0 mt-0.5" style={{ color:T.purple }}/>
        <p className="text-[10px] text-gray-500 leading-snug">{PR.sodNote}</p>
      </div>
    </div>
  )
}

// ─── Right column — Sourcing ──────────────────────────────────────────────────

function ItemSourcingBlock({ itemCode }: { itemCode: string }) {
  const data = ITEM_SOURCING[itemCode]
  if (!data) return null
  const [expanded, setExpanded] = React.useState(itemCode==="NXG-IT-001")

  return (
    <div className="rounded-lg overflow-hidden bg-white" style={{ border:`0.5px solid ${T.border}` }}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
        <span className="text-[9px] font-mono text-gray-400 shrink-0">{data.code}</span>
        <span className="flex-1 text-left text-[11px] font-semibold text-gray-800">{data.name}</span>
        <ChevronDown size={12} className={cn("text-gray-400 transition-transform duration-200 shrink-0", expanded && "rotate-180")}/>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor:T.border }}>
          {/* Approved vendors */}
          <div>
            <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{ background:T.tealLight, color:T.tealText, borderBottom:`0.5px solid ${T.teal}33` }}>
              Approved vendors
            </div>
            {data.approved.map((v, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-[#E1F5EE] transition-colors"
                style={{ borderTop:i>0 ? `0.5px solid ${T.teal}22` : undefined }}>
                <span className="text-[10px] font-bold w-4 shrink-0"
                  style={{ color: v.recommended ? T.purple : "#888780" }}>
                  {v.recommended ? "★" : v.rank}
                </span>
                <span className="flex-1 text-[11px] font-medium text-gray-800 truncate">{v.name}</span>
                <span className="text-[11px] font-mono text-gray-700 shrink-0">RM {v.price}{v.unit}</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{ background:T.tealLight, color:T.tealText }}>Approved</span>
              </div>
            ))}
          </div>

          {/* Marketplace */}
          <div>
            <div className="px-3 py-1 text-[9px] flex items-center gap-1.5"
              style={{ background:T.amberLight+"88", color:T.amberText, borderTop:`0.5px solid ${T.amber}33` }}>
              <TriangleAlert size={9}/> Requires vendor onboarding before PO
            </div>
            {data.marketplace.map((v, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAEEDA] transition-colors"
                style={{ borderTop:i>0 ? `0.5px solid ${T.amber}22` : undefined }}>
                <span className="text-[10px] font-bold w-4 shrink-0 text-gray-400">
                  {["①","②","③"][i]}
                </span>
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
        </div>
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PRDetailView() {
  const router = useRouter()
  const [sourcingChoice, setSourcingChoice] = React.useState<"approved"|"marketplace"|"defer"|null>(null)
  const [approved, setApproved] = React.useState(false)

  const panelStyle: React.CSSProperties = { background:"#F7F7FE", borderRadius:10, overflow:"hidden" }

  // Phase B = index 2
  const journeyIdx = 2

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full gap-0">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-6 py-3 shrink-0 bg-white border-b"
          style={{ borderColor:T.border }}>
          <button onClick={() => router.push("/p2p/purchase-requests")}
            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer shrink-0">
            <ChevronLeft size={14}/> Purchase Requests
          </button>
          <span className="text-[13px] font-semibold text-gray-900">{PR.id}</span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background:"#FEF3C7", color:"#92400E" }}>● Pending approval</span>
          <div className="flex-1"/>
          <Button variant="outline" size="sm" className="gap-1.5 text-gray-600">
            <Download size={12}/> Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-gray-600">
            <MessageSquare size={12}/> Query
          </Button>
          <button
            disabled={!sourcingChoice || approved}
            onClick={() => sourcingChoice && setApproved(true)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-4 rounded-lg text-[13px] font-semibold text-white transition-all",
              (!sourcingChoice || approved) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
            )}
            style={{ background: approved ? T.teal : T.teal }}>
            <CheckCircle2 size={13}/> {approved ? "Approved" : "Approve →"}
          </button>
        </div>

        {/* ── Journey strip ── */}
        <div className="px-6 py-3 shrink-0 bg-white border-b" style={{ borderColor:T.border }}>
          <JourneyStrip activeIdx={journeyIdx}/>
        </div>

        {/* ── AI bar ── */}
        <div className="px-6 py-2.5 shrink-0" style={{ background:"#F7F7FE" }}>
          <JomieAIBar message={`PR-0089 is pending your approval. Jomie has pre-fetched sourcing options from 5 channels. Capital allowance eligible — tag as IT asset before period close.`}/>
        </div>

        {/* ── Body: two columns ── */}
        <div className="flex gap-[10px] flex-1 overflow-hidden px-6 pb-6 pt-2">

          {/* Left — 60% */}
          <div className="flex flex-col overflow-hidden" style={{ ...panelStyle, flex:"0 0 60%" }}>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-0">
              <RequestDetails/>
              <LineItemsSection/>
              <CostAllocationSection/>
              <SubPRBreakdown/>
              <A2SectionLeft/>
              <ApprovalChainSection/>
            </div>
          </div>

          {/* Right — 40% */}
          <div className="flex flex-col overflow-hidden" style={{ ...panelStyle, flex:"0 0 40%" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b shrink-0" style={{ borderColor:T.border }}>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md flex items-center justify-center" style={{ background:T.purpleLight }}>
                  <Sparkles size={11} style={{ color:T.purple }}/>
                </div>
                <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily:"var(--font-pjs)" }}>
                  Sourcing Options
                </span>
                <span className="text-[9px] font-mono text-gray-400">· fetched 4 min ago</span>
              </div>
              <span className="text-[9px] font-mono text-gray-300">{PR.id}</span>
            </div>

            {/* Per-item sourcing */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {PR.lineItems.map(item => (
                <ItemSourcingBlock key={item.code} itemCode={item.code}/>
              ))}

              {/* Citation */}
              <code className="text-[9px] font-mono text-gray-300 block px-1">
                procurementPolicy.md:v1.3 → S7.2 · vendorOnboarding.md:v2.1
              </code>
            </div>

            {/* Selection buttons + footer */}
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

              {/* SOD check — current user is Razif (not requestor — no block) */}
              {approved && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                  style={{ background:T.tealLight, border:`0.5px solid ${T.teal}66` }}>
                  <CheckCircle2 size={13} style={{ color:T.teal }}/>
                  <div className="text-[11px] font-medium" style={{ color:T.tealText }}>
                    Approved · Sourcing direction recorded · Routing to CFO
                  </div>
                </div>
              )}

              {!sourcingChoice && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-gray-500"
                  style={{ background:"#F8F7F4", border:`0.5px solid ${T.border}` }}>
                  Select a sourcing direction below before approving
                </div>
              )}

              {/* 3 sourcing direction buttons */}
              <div className="space-y-2">
                <button onClick={() => setSourcingChoice("approved")}
                  className={cn("w-full flex items-center gap-2 h-9 px-3 rounded-lg text-[12px] font-semibold transition-all cursor-pointer")}
                  style={{
                    background: sourcingChoice==="approved" ? T.teal : T.tealLight,
                    color: sourcingChoice==="approved" ? "white" : T.tealText,
                    border: `0.5px solid ${T.teal}55`,
                  }}>
                  <CheckCircle2 size={13}/>
                  Proceed with best approved vendor
                  <ArrowRight size={12} className="ml-auto"/>
                </button>
                <button onClick={() => setSourcingChoice("marketplace")}
                  className={cn("w-full flex items-center gap-2 h-9 px-3 rounded-lg text-[12px] font-semibold transition-all cursor-pointer")}
                  style={{
                    background: sourcingChoice==="marketplace" ? T.amber : T.amberLight,
                    color: sourcingChoice==="marketplace" ? "white" : T.amberText,
                    border: `0.5px solid ${T.amber}55`,
                  }}>
                  <Globe size={13}/>
                  Select marketplace option
                  <ArrowRight size={12} className="ml-auto"/>
                </button>
                <button onClick={() => setSourcingChoice("defer")}
                  className={cn("w-full flex items-center gap-2 h-9 px-3 rounded-lg text-[12px] font-medium transition-all cursor-pointer")}
                  style={{
                    background: sourcingChoice==="defer" ? "#6B7280" : "#F3F4F6",
                    color: sourcingChoice==="defer" ? "white" : "#6B7280",
                    border: "0.5px solid #E5E7EB",
                  }}>
                  Defer to quotation stage
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-300 leading-relaxed">
                Sourcing direction is a preference. Formal selection at Phase C.
                Deviation requires documented justification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
