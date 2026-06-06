"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronLeft, ChevronRight, Send, Plus, Check, CheckCircle2,
  Building2, TriangleAlert, ArrowRight, Loader2, ShieldCheck,
  CircleDot, Package, Briefcase, RefreshCw, ChevronDown,
  PanelRight,
} from "lucide-react"

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

type ChatState = "idle" | "processing" | "initial" | "confirmed" | "submitting" | "a2-pass"

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
  const [processStep, setProcessStep] = React.useState(-1)   // -1 = not started; 0-4 = step index
  const [submittedMessage, setSubmittedMessage] = React.useState("")
  const [submittedProject, setSubmittedProject] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("ai")
  // null = fill remaining space | 0 = closed | >0 = fixed px width
  const [rightWidth, setRightWidth] = React.useState<number | null>(null)
  const endRef     = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dragging   = React.useRef(false)

  const rightOpen = rightWidth !== 0

  // ── Drag: width = distance from cursor to wrapper's right edge ──
  // Drag LEFT  → cursor moves left  → distance grows  → panel wider  ✓
  // Drag RIGHT → cursor moves right → distance shrinks → panel narrower → closes ✓
  const onDragMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    e.preventDefault()
  }

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      // right panel width = distance from cursor to container's right edge
      const newW = Math.max(0, Math.min(rect.width - 16 - 500, rect.right - e.clientX))
      setRightWidth(newW)
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setRightWidth(w => {
        if (w === null) return w
        if (w < 160) return 0    // snap closed
        if (w < 280) return 280  // snap to comfortable minimum
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

  const handleSubmit = () => {
    if (chatState !== "confirmed") return
    setChatState("submitting")
    setTimeout(() => setChatState("a2-pass"), 2200)
  }

  const handleCreate = () => {
    if (!inputValue.trim()) return
    // Capture values before clearing
    setSubmittedMessage(inputValue)
    setSubmittedProject(projectName || "New Purchase Request")
    // Enter processing state
    setChatState("processing")
    setProcessStep(-1)
    // Reveal steps sequentially, one every 380ms
    PROCESSING_STEPS.forEach((_, i) => {
      setTimeout(() => setProcessStep(i), 400 + i * 400)
    })
    // After all steps done, transition to confirmed
    setTimeout(() => {
      setChatState("confirmed")
      setProcessStep(-1)
    }, 400 + PROCESSING_STEPS.length * 400 + 500)
  }

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [chatState])

  const tabs = [
    { key:"ai",      label:"AI Chat" },
    { key:"form",    label:"Form" },
    { key:"upload",  label:"Upload/Import" },
    { key:"reorder", label:"Auto Reorder" },
  ]

  // Right panel: flex: 0 0 Xpx — sits at the right edge naturally as last flex child.
  // As Xpx shrinks, its LEFT edge moves right → closes left-to-right ✓
  // Chat (flex:1) fills all remaining space; content inside is max-w-600 centered.
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
      <div className="flex flex-col min-h-0 flex-1 min-w-[500px]">
        {/* Inner content centered */}
        <div className="flex flex-col min-h-0 h-full w-full max-w-[600px] mx-auto"
          style={{ padding: chatState === "idle" ? "0 16px 16px" : "24px 16px 16px", gap:0 }}>

        {/* ══ IDLE: Starter screen ══ */}
        {chatState === "idle" || chatState === "processing" ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center min-h-0"
            style={{ paddingTop:100, paddingBottom:24, gap:24 }}>

            {/* Jomie logomark — jomie-favicon.svg (production paths) */}
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

            {/* Glass card — idle input OR processing steps */}
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-col gap-2 p-4"
                style={{ background:"rgba(255,255,255,0.05)", borderRadius:20 }}>

                {chatState === "idle" ? (<>
                  {/* Card header */}
                  <div className="pb-1">
                    <span className="text-[14px] font-semibold text-white leading-5"
                      style={{ fontFamily:"Inter, sans-serif" }}>New Request</span>
                  </div>

                  {/* Project Name input */}
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="Project Name"
                    className="w-full text-[14px] leading-5 placeholder-gray-400 text-gray-700 focus:outline-none bg-white px-4"
                    style={{
                      height:56, border:`2px solid ${T.border}`, borderRadius:15,
                      boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                      fontFamily:"Inter, sans-serif",
                    }}
                  />

                  {/* Textarea + action row */}
                  <div className="w-full flex flex-col"
                    style={{
                      background:"#FFFFFF", border:`2px solid ${T.border}`,
                      borderRadius:15, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
                    }}>
                    <textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder="Write a message..."
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
                </>) : (
                  /* ── Processing view ── */
                  <div className="flex flex-col gap-3 py-2" style={{ animation:"fadeInUp 0.3s ease-out" }}>
                    {/* Header with spinner */}
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0" style={{ width:32, height:32 }}>
                        {/* Pulsing glow ring */}
                        <div className="absolute inset-0 rounded-full"
                          style={{
                            background:`radial-gradient(circle, rgba(93,94,244,0.3) 0%, transparent 70%)`,
                            animation:"pulseGlow 1.4s ease-in-out infinite",
                            transform:"scale(1.8)",
                          }}/>
                        <svg width="32" height="32" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position:"relative", zIndex:1 }}>
                          <rect x="4.625" y="4.625" width="64.75" height="64.75" rx="20.0417" fill="#5D5EF4"/>
                          <path d="M38.8849 21.522C37.9561 22.451 37.2416 23.5231 36.67 24.6665C35.5268 22.3081 33.5977 20.3785 31.2399 19.235C32.3831 18.6632 33.4548 17.9486 34.3837 17.0195C35.3125 16.0904 36.0984 15.0184 36.67 13.8749C37.2416 15.0184 37.9561 16.0189 38.8849 17.0195C39.8138 17.9486 40.8855 18.7347 42.0287 19.3064C40.8855 19.8067 39.8138 20.5929 38.8849 21.522Z" fill="#1C184E"/>
                          <path d="M38.0991 57.0417V35.2439C38.0991 29.3121 42.8861 24.4523 48.8878 24.4523V46.25C48.8878 52.1818 44.0293 57.0417 38.0991 57.0417Z" fill="white"/>
                          <path d="M30.0968 56.8269C27.0959 56.8269 24.6667 54.397 24.6667 51.3953C24.6667 48.3937 27.0959 45.9637 30.0968 45.9637C33.0976 45.9637 35.5269 48.3937 35.5269 51.3953C35.5269 54.4684 33.0976 56.8269 30.0968 56.8269Z" fill="white"/>
                          <path d="M50.4596 24.4523H48.8877V24.9525H50.4596V24.4523Z" fill="white"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-white" style={{ fontFamily:"Inter, sans-serif" }}>
                          Analysing your request…
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.dimText }}>
                          {submittedProject}
                        </div>
                      </div>
                    </div>

                    {/* Sequential steps */}
                    <div className="flex flex-col gap-2 pl-1">
                      {PROCESSING_STEPS.map((step, i) => (
                        <div key={i}
                          className={cn("flex items-start gap-2.5 transition-all duration-300",
                            processStep >= i ? "opacity-100" : "opacity-0"
                          )}
                          style={{
                            transform: processStep >= i ? "translateY(0)" : "translateY(8px)",
                            animation: processStep >= i ? "fadeInUp 0.3s ease-out" : "none",
                          }}>
                          {/* Icon: spinner while "current", check when done */}
                          <div className="shrink-0 mt-0.5">
                            {processStep === i && processStep < PROCESSING_STEPS.length - 1 ? (
                              <Loader2 size={14} className="animate-spin" style={{ color: T.purple }}/>
                            ) : processStep > i || processStep === PROCESSING_STEPS.length - 1 ? (
                              <div className="size-3.5 rounded-full flex items-center justify-center"
                                style={{ background: T.teal }}>
                                <Check size={8} color="#fff" strokeWidth={3}/>
                              </div>
                            ) : (
                              <div className="size-3.5 rounded-full" style={{ background:"rgba(255,255,255,0.1)" }}/>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-semibold text-white leading-4">{step.label}</span>
                            <span className="text-[12px] leading-4" style={{ color: T.dimText }}>{step.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Tab pill bar */}
              <div className="flex justify-center">
                <div className="inline-flex items-center p-1 gap-2"
                  style={{ background:"rgba(255,255,255,0.05)", border:`2px solid ${T.border}`, borderRadius:24 }}>
                  {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "h-9 px-3 text-[14px] transition-all cursor-pointer whitespace-nowrap",
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
          {/* Back + badge row */}
          <div className="flex items-center justify-between mb-1.5">
            <button onClick={() => router.push("/p2p/purchase-requests")}
              className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70">
              <div className="size-6 rounded-lg flex items-center justify-center"
                style={{ filter:"drop-shadow(0px 1px 2px rgba(16,24,40,0.05))" }}>
                <ChevronLeft size={16} color="#FFFFFF" strokeWidth={1.67}/>
              </div>
              <span className="text-[12px] font-light text-white">Purchase Request / New Request</span>
            </button>
            <span className="px-2 py-0.5 rounded-md text-[12px]"
              style={{ background: T.indigoBadgeBg, color: T.indigoBadgeFg }}>
              PR-2026-NEW · Draft
            </span>
          </div>
          {/* Title */}
          <h1 className="text-[18px] font-semibold text-white leading-7"
            style={{ fontFamily:"var(--font-lora), Lora, serif" }}>
            {submittedProject || "New Purchase Request"}
          </h1>
        </div>

        {/* ── Chat scroll area ── */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4" style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Jomie greeting */}
          <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out" }}>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
              <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
            </div>
            <div className="text-[14px] text-white leading-5">
              Hi Lim Wei Xiang! What do you need to purchase today?
              <br/>
              Describe it naturally — I'll handle item matching, GL codes, approval routing, and sourcing options automatically.
            </div>
          </div>

          {/* User message */}
          {chatState !== "initial" && (
            <div className="flex flex-col items-end gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out 0.15s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
                <span className="text-[14px] font-bold text-white">Lim Wei Xiang</span>
              </div>
              <div className="w-full px-3.5 py-2.5 text-[14px] text-white leading-5"
                style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, animation:"fadeInUp 0.4s ease-out" }}>
                {submittedMessage || "I need 14 Dell Latitude 5540 laptops, 6 LG 27\" UltraFine 4K monitors, and 14 Dell WD22TB4 docks for the IT team Q3 upgrade. Budget code IT-CAPEX-2024. Delivery by end of July."}
              </div>
            </div>
          )}

          {/* Jomie analysis response */}
          {chatState !== "initial" && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.5s ease-out 0.35s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>
              <div className="text-[14px] text-white leading-5 space-y-3">
                {/* Step trace */}
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

                {/* Jomie summary text */}
                <p className="text-[14px] text-white leading-5">
                  I've prepared <strong>2 sub-PRs</strong> from your request. All 3 items matched to the item master. Preferred vendor:{" "}
                  <strong>Tech Solutions MY</strong> (last price: Dell L5540 RM 7,200/unit, Feb 2026).
                </p>

                {/* Confirm chips */}
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

          {/* A2 typing indicator / result */}
          {chatState === "submitting" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
              </div>
              <div className="inline-flex items-center px-2.5 py-1.5 gap-1.5"
                style={{ borderRadius:"0 8px 8px 8px" }}>
                {[0,1,2].map(i => (
                  <span key={i} className="size-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay:`${i*150}ms` }}/>
                ))}
              </div>
            </div>
          )}

          {chatState === "a2-pass" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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
                    2 sub-PRs sent · PR-DRAFT-A → Razif Abdullah (FM) · PR-DRAFT-B → Siti Aisyah
                  </span>
                </div>
              </div>
              <button onClick={() => router.push("/p2p/purchase-requests")}
                className="flex items-center gap-1 text-[12px] font-medium mt-1 cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: T.purple }}>
                <ArrowRight size={13}/> View in Purchase Requests
              </button>
            </div>
          )}

          <div ref={endRef}/>
        </div>

        {/* ── Bottom sticky: input + tabs ── */}
        <div className="shrink-0 pt-4 flex flex-col gap-2">

          {/* Textarea input card */}
          <div className="flex flex-col" style={{
            background:"#FFFFFF", border:`2px solid ${T.border}`,
            borderRadius:20, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
          }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Write a message..."
              rows={3}
              className="w-full resize-none px-4 pt-4 pb-2 text-[14px] leading-5 placeholder-gray-400 border-0 focus:outline-none bg-transparent text-gray-700"
              style={{ fontFamily:"var(--font-pjs)" }}
            />
            {/* Action row */}
            <div className="flex items-center justify-between px-4 pb-3.5 pt-1">
              {/* + attach */}
              <button className="size-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50"
                style={{ background:"#FFFFFF", border:"1px solid #D0D5DD", boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                <Plus size={16} style={{ color:"#344054" }}/>
              </button>
              {/* Right: model + send */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] cursor-pointer transition-opacity hover:opacity-80"
                  style={{ color: T.purpleDark }}>
                  Claude Opus 4.8
                  <ChevronDown size={16} style={{ color: T.purpleDark }}/>
                </button>
                <button
                  onClick={() => inputValue.trim() && null}
                  className="flex items-center justify-center px-3.5 h-8 rounded-lg text-[14px] font-medium text-white cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: T.purple, border:`1px solid ${T.purple}`, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)" }}>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Tab pill bar — hug content, centered */}
          <div className="flex justify-center">
          <div className="inline-flex items-center p-1 gap-2"
            style={{
              background:"rgba(255,255,255,0.05)",
              border:`2px solid ${T.border}`,
              borderRadius:24,
            }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "h-9 px-3 text-[14px] transition-all cursor-pointer whitespace-nowrap",
                  activeTab===tab.key ? "text-white" : "text-gray-400 hover:text-gray-300",
                )}
                style={{
                  borderRadius: activeTab===tab.key ? 20 : 6,
                  background: activeTab===tab.key ? T.activeBg : "transparent",
                  boxShadow: activeTab===tab.key
                    ? "0px 1px 3px rgba(16,24,40,0.1), 0px 1px 2px rgba(16,24,40,0.06)"
                    : "none",
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          </div>

        </div>
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

      {/* ── Right — Live PR Preview ── */}
      <div style={rightPanelStyle}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-md flex items-center justify-center" style={{ background: T.purpleLight }}>
                <CircleDot size={11} style={{ color: T.purple }}/>
              </div>
              <span className="text-[12px] font-semibold text-gray-700" style={{ fontFamily:"var(--font-pjs)" }}>
                PR preview
              </span>
              {chatState !== "initial" && chatState !== "idle" && (
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

          {/* Empty state */}
          {(chatState === "idle" || chatState === "initial") ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
              <div className="size-12 rounded-xl flex items-center justify-center" style={{ background: T.purpleLight }}>
                <Sparkles size={22} style={{ color: T.purple, opacity:0.4 }}/>
              </div>
              <div className="text-center">
                <div className="text-[13px] font-semibold text-gray-400 mb-1">Start typing in the chat</div>
                <div className="text-[11px] text-gray-300 leading-relaxed max-w-[200px]">
                  Your PR will take shape here in real time as Jomie processes your request
                </div>
              </div>
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

              {/* Citation */}
              <div className="px-1">
                <code className="text-[9px] font-mono text-gray-300 leading-relaxed block">
                  itemMaster.md:v2.1 · procurementPolicy.md:v1.3 · approvalMatrix.md:v1.2
                </code>
              </div>

            </div>
          )}

          {/* Confirm & Submit — only in active chat states */}
          {chatState !== "idle" && chatState !== "initial" && (
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
                disabled={chatState==="submitting"}
                onClick={handleSubmit}
                className={cn(
                  "w-full h-10 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all",
                  chatState==="submitting" && "opacity-70 cursor-not-allowed",
                )}
                style={{
                  background: chatState==="a2-pass" ? T.teal
                    : chatState==="submitting" ? T.purple
                    : T.teal,
                  color:"#fff",
                }}>
                {chatState==="confirmed"  && <><CheckCircle2 size={13}/> Confirm and submit →</>}
                {chatState==="submitting" && <><Loader2 size={13} className="animate-spin"/> Running checks…</>}
                {chatState==="a2-pass"    && <><CheckCircle2 size={13}/> Submitted — View PRs</>}
              </button>
              <p className="text-center text-[10px] text-gray-300 leading-relaxed">
                A2 duplicate and split-PR checks run automatically on submit.
              </p>
            </div>
          )}

        </div>

    </div>
  )
}
