"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles, ChevronLeft, ChevronRight, Send, Plus, Check, CheckCircle2,
  Building2, TriangleAlert, ArrowRight, Loader2, ShieldCheck,
  CircleDot, Package, Briefcase, RefreshCw, ChevronDown,
  Pencil,
} from "lucide-react"
import { savePR, buildNextPRId, getSavedPRs } from "@/lib/pr-store"

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

type ChatState = "idle" | "questioning" | "processing" | "initial" | "confirmed" | "submitting" | "a2-pass"

interface FollowUpAnswers {
  delivery:   string
  budgetCode: string
  budgetCustom: string
}

// ─── Auto-generate project name from description ──────────────────────────────

function autoGenerateName(desc: string): string {
  const d = desc.toLowerCase()
  if (/laptop|desktop|computer|server|workstation|monitor|dock|hardware|printer|scanner/.test(d))
    return "IT Equipment"
  if (/software|licence|license|subscription|saas|cloud|app/.test(d))
    return "Software License"
  if (/renovation|partition|furniture|flooring|office fit|fitting/.test(d))
    return "Office Renovation"
  if (/vehicle|car|van|truck|lorry/.test(d))
    return "Fleet Purchase"
  if (/training|course|workshop|seminar|conference/.test(d))
    return "Training & Development"
  if (/marketing|booth|banner|trade fair|brochure|print/.test(d))
    return "Marketing Materials"
  if (/cleaning|maintenance|repair|servic/.test(d))
    return "Maintenance Services"
  if (/stationery|supplies|paper|toner|consumable/.test(d))
    return "Office Supplies"
  // Fallback: first 3 words title-cased
  const words = desc.trim().split(/\s+/).slice(0, 3)
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")
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

  // null = fill remaining space | 0 = closed | >0 = fixed px width
  const [rightWidth, setRightWidth] = React.useState<number | null>(null)
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
    }, 400 + PROCESSING_STEPS.length * 400 + 500)
  }

  const handleSubmit = () => {
    if (chatState !== "confirmed") return
    const saved = getSavedPRs()
    const newId = buildNextPRId(saved.length)
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
    setChatState("submitting")
    setTimeout(() => setChatState("a2-pass"), 2200)
  }

  const handleCreate = () => {
    if (!inputValue.trim()) return
    setSubmittedMessage(inputValue)
    const finalProject = projectName.trim() || autoGenerateName(inputValue) || "New Purchase Request"
    setSubmittedProject(finalProject)
    setInputValue("")                                       // clear for follow-up chat
    setChatMessages([])                                    // fresh chat history
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
    // Enter alone → send. Shift+Enter → new line (default textarea behaviour).
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" })
  }, [chatState, processStep])

  const tabs = [
    { key:"ai",      label:"AI Chat" },
    { key:"form",    label:"Form" },
    { key:"upload",  label:"Upload/Import" },
    { key:"reorder", label:"Auto Reorder" },
  ]

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
        <div className="flex flex-col min-h-0 h-full w-full max-w-[600px] mx-auto"
          style={{ padding: chatState === "idle" ? "0 16px 16px" : "24px 16px 16px", gap:0 }}>

        {/* ══ IDLE: Starter screen ══ */}
        {chatState === "idle" ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center min-h-0"
            style={{ paddingTop:100, paddingBottom:24, gap:24 }}>

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
                        height:56, border:`2px solid ${T.purple}`, borderRadius:15,
                        boxShadow:"0px 0px 0px 3px rgba(93,94,244,0.12)",
                        fontFamily:"Inter, sans-serif",
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => { setIsEditingName(true); setIsNameAutoGen(false) }}
                      className="w-full flex items-center cursor-text"
                      style={{
                        height:56, border:`2px solid ${T.border}`, borderRadius:15,
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
              {savedPRId ? `${savedPRId} · Pending` : "PR-2026-NEW · Draft"}
            </span>
          </div>
          <h1 className="text-[18px] font-semibold text-white leading-7"
            style={{ fontFamily:"var(--font-lora), Lora, serif" }}>
            {submittedProject || "New Purchase Request"}
          </h1>
        </div>

        {/* ── Chat scroll area ── */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4" style={{ display:"flex", flexDirection:"column", gap:20 }}>

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
          <div className="flex flex-col items-end gap-1.5" style={{ animation:"fadeInUp 0.4s ease-out 0.15s both" }}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              <span className="text-[14px] font-bold text-white">Lim Wei Xiang</span>
            </div>
            <div className="w-full px-3.5 py-2.5 text-[14px] text-white leading-5"
              style={{ background:"rgba(255,255,255,0.05)", borderRadius:12 }}>
              {submittedMessage}
            </div>
          </div>

          {/* ── QUESTIONING: Jomie asks follow-up questions ── */}
          {(chatState === "questioning" || chatState === "processing" ||
            chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
            <div className="flex flex-col gap-1.5" style={{ animation:"fadeInUp 0.5s ease-out 0.3s both" }}>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
                <span className="text-[12px] font-light" style={{ color: T.dimText }}>Friday 2:20pm</span>
              </div>

              {chatState === "questioning" ? (
                /* ── Live questions UI ── */
                <div className="flex flex-col gap-4 p-4 rounded-xl"
                  style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.4)" }}>

                  <p className="text-[14px] text-white leading-5">
                    Got it — <strong>{submittedProject}</strong>. Before I prepare the sub-PRs,
                    I need to confirm two quick details.
                  </p>

                  {/* Q1: Delivery timeline */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: T.dimText }}>
                      1 · When is delivery needed?
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DELIVERY_OPTIONS.map(opt => (
                        <button key={opt}
                          onClick={() => setFollowUp(f => ({ ...f, delivery: opt }))}
                          className="px-3 py-1.5 rounded-lg text-[12px] transition-all cursor-pointer"
                          style={{
                            background: followUp.delivery === opt ? T.purple : "rgba(255,255,255,0.06)",
                            color:      followUp.delivery === opt ? "#fff"    : T.dimText,
                            border:    `1px solid ${followUp.delivery === opt ? T.purple : "rgba(103,100,136,0.3)"}`,
                            fontFamily: "Inter, sans-serif",
                          }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {followUp.delivery && (
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.teal }}>
                        <Check size={11} strokeWidth={2.5}/> {followUp.delivery}
                      </div>
                    )}
                  </div>

                  {/* Q2: Budget code */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: T.dimText }}>
                      2 · Which budget code applies?
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {BUDGET_OPTIONS.map(opt => (
                        <button key={opt}
                          onClick={() => setFollowUp(f => ({ ...f, budgetCode: opt }))}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all cursor-pointer"
                          style={{
                            background: followUp.budgetCode === opt ? T.purple : "rgba(255,255,255,0.06)",
                            color:      followUp.budgetCode === opt ? "#fff"    : T.dimText,
                            border:    `1px solid ${followUp.budgetCode === opt ? T.purple : "rgba(103,100,136,0.3)"}`,
                          }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {/* Custom budget code input */}
                    {followUp.budgetCode === "Other" && (
                      <input
                        type="text"
                        value={followUp.budgetCustom}
                        onChange={e => setFollowUp(f => ({ ...f, budgetCustom: e.target.value }))}
                        placeholder="e.g. MKTG-OPEX-2024"
                        autoFocus
                        className="w-full h-9 px-3 rounded-lg text-[12px] font-mono focus:outline-none"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: `1px solid ${T.border}`,
                          color: "white",
                        }}
                      />
                    )}
                    {followUp.budgetCode && followUp.budgetCode !== "Other" && (
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.teal }}>
                        <Check size={11} strokeWidth={2.5}/> {followUp.budgetCode}
                      </div>
                    )}
                    {followUp.budgetCode === "Other" && followUp.budgetCustom && (
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.teal }}>
                        <Check size={11} strokeWidth={2.5}/> {followUp.budgetCustom}
                      </div>
                    )}
                  </div>

                  {/* Continue button — appears when both answered */}
                  <div className={cn("transition-all duration-300", allQuestionsAnswered ? "opacity-100" : "opacity-40 pointer-events-none")}>
                    <button
                      onClick={allQuestionsAnswered ? startProcessing : undefined}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold text-white transition-all"
                      style={{
                        background: allQuestionsAnswered ? T.teal : "rgba(29,158,117,0.3)",
                        cursor: allQuestionsAnswered ? "pointer" : "default",
                      }}>
                      <Sparkles size={14} strokeWidth={2}/>
                      Analyse request
                      <ArrowRight size={14} strokeWidth={2}/>
                    </button>
                  </div>

                </div>
              ) : (
                /* ── Collapsed summary of answers (shown after questioning) ── */
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(103,100,136,0.3)" }}>
                  <Check size={13} style={{ color: T.teal, flexShrink:0 }} strokeWidth={2.5}/>
                  <span className="text-[12px]" style={{ color: T.dimText }}>
                    Delivery: <span className="text-white">{followUp.delivery}</span>
                    <span className="mx-2" style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                    Budget: <span className="text-white font-mono">{resolvedBudgetCode}</span>
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
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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
              className={cn("flex flex-col gap-1.5")}
              style={{ animation:"fadeInUp 0.3s ease-out" }}>
              {msg.role === "user" ? (
                <>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[12px] font-light" style={{ color: T.dimText }}>Just now</span>
                    <span className="text-[14px] font-bold text-white">Lim Wei Xiang</span>
                  </div>
                  <div className="w-full px-3.5 py-2.5 text-[14px] text-white leading-5"
                    style={{ background:"rgba(255,255,255,0.05)", borderRadius:12 }}>
                    {msg.text}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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
                <span className="text-[14px] font-bold" style={{ color: T.purple }}>Jomie AI</span>
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

        {/* ── Bottom sticky: visible once PR is confirmed/submitted ── */}
        {(chatState === "confirmed" || chatState === "submitting" || chatState === "a2-pass") && (
        <div className="shrink-0 pt-4 flex flex-col gap-2">
          <div className="flex flex-col" style={{
            background:"#FFFFFF", border:`2px solid ${T.border}`,
            borderRadius:20, boxShadow:"0px 1px 2px rgba(16,24,40,0.05)",
          }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask Jomie anything about this PR… (↵ to send, ⇧↵ for new line)"
              rows={3}
              className="w-full resize-none px-4 pt-4 pb-2 text-[14px] leading-5 placeholder-gray-400 border-0 focus:outline-none bg-transparent text-gray-700"
              style={{ fontFamily:"var(--font-pjs)" }}
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

        </div>

    </div>
  )
}
