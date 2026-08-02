"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, Plus,
  ListChecks, Mail, Copy,
  FileText, Paperclip, MessageSquare, X, Download, Printer,
  Zap, RefreshCw, Users, Landmark, Truck, Globe, Building2,
  Wrench, Receipt, Banknote, CreditCard, UserCheck, ArrowLeftRight,
  Briefcase, HeartPulse, AlertTriangle, XCircle, CheckCircle2,
  Minus, Clock, TrendingUp, BarChart2, Timer,
} from "lucide-react"
import {
  getMockInvoices,
  getMockMetrics,
  getMockCompliance,
  DEFAULT_PINNED_METRICS,
} from "@/lib/mock"
import type { InvoiceListItem, InvoiceStatus, ApprovalStep, CommentThreadItem } from "@/lib/api"
import { useSidebar } from "@/components/sidebar-context"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  MessageScrollerProvider, MessageScroller, MessageScrollerViewport,
  MessageScrollerContent, MessageScrollerItem, MessageScrollerButton,
} from "@/components/ui/message-scroller"
import { Message, MessageGroup, MessageAvatar, MessageContent, MessageHeader, MessageFooter } from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"
import {
  Attachment, AttachmentAction, AttachmentActions,
  AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle,
} from "@/components/ui/attachment"

// ─── AP Dashboard ─────────────────────────────────────────────────────────────

const PURPLE      = "#5d5ef4"
const PURPLE_MID  = "#8485f7"
const PURPLE_PALE = "#a5b4fc"
const GREEN       = "#10b981"
const AMBER       = "#f59e0b"
const RED         = "#ef4444"
const GRAY_LINE   = "#e4e7ec"

const AVATAR_PALETTE = [
  { bg: "#fde8e4", text: "#b94a2c" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#e0f2fe", text: "#0c4a6e" },
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function APDashboard({ invoices }: { invoices: InvoiceListItem[] }) {
  const inv = invoices as any[]
  const today = new Date()

  // ── Financial KPIs ───────────────────────────────────────────────────────────
  const pendingList = inv.filter(i => i.status !== "paid")
  const totalOutstanding = pendingList.reduce((s, i) => s + (i.total_myr ?? 0), 0)

  const overdueList = pendingList.filter(i => {
    const due = i.due_date ? new Date(i.due_date) : null
    return due && due < today
  })
  const overdueTotal = overdueList.reduce((s, i) => s + (i.total_myr ?? 0), 0)

  const awaitingMeList = inv.filter(i => {
    const steps = i.approval_steps ?? []
    return steps.some((s: any) => s.status === "current")
  })

  const paidWithDates = inv.filter(i => i.status === "paid" && i.created_at && i.payment_vouchers?.[0]?.payment_date)
  const avgProcessingDays = paidWithDates.length > 0
    ? Math.round(paidWithDates.reduce((s, i) => {
        return s + (new Date(i.payment_vouchers[0].payment_date).getTime() - new Date(i.created_at).getTime()) / 86400000
      }, 0) / paidWithDates.length)
    : 9

  const avgEndToEnd = avgProcessingDays

  const approvedInvoices = inv.filter(i => {
    const steps = i.approval_steps ?? []
    return steps.some((s: any) => s.status === "completed" && s.title?.includes("Finance"))
  })
  const avgTimeToApprove = approvedInvoices.length > 0
    ? Math.round(approvedInvoices.reduce((s, i) => {
        const fmStep = (i.approval_steps ?? []).find((s: any) => s.title?.includes("Finance") && s.timestamp)
        if (!fmStep || !i.created_at) return s
        return s + (new Date(fmStep.timestamp).getTime() - new Date(i.created_at).getTime()) / 86400000
      }, 0) / approvedInvoices.length)
    : 3

  const processedAll = inv.filter(i => i.status === "paid" || (i.approval_steps ?? []).some((s: any) => s.status === "completed"))
  const slaBreached = processedAll.filter(i => (i.approval_steps ?? []).some((s: any) => s.sla_at_risk))
  const slaRate = processedAll.length > 0
    ? Math.round(((processedAll.length - slaBreached.length) / processedAll.length) * 100)
    : 78

  const queriedCount = inv.filter(i =>
    (i.comment_thread ?? []).some((t: any) => t.type === "comment" && t.is_query)
  ).length
  const queryRate = inv.length > 0 ? Math.round((queriedCount / inv.length) * 100) : 0

  // ── Stage bottleneck ─────────────────────────────────────────────────────────
  const stageCounts: Record<string, number> = {}
  const stageAvgDays: Record<string, number> = { "AP Clerk Review": 2, "Finance Manager": 3, "CFO Sign-off": 1, "Payment Processing": 2, "Completed": 0 }
  inv.forEach(i => {
    const currentStep = (i.approval_steps ?? []).find((s: any) => s.status === "current")
    if (currentStep) {
      const key = currentStep.title
      stageCounts[key] = (stageCounts[key] ?? 0) + 1
    } else if (i.status === "paid") {
      stageCounts["Completed"] = (stageCounts["Completed"] ?? 0) + 1
    } else {
      stageCounts["AP Clerk Review"] = (stageCounts["AP Clerk Review"] ?? 0) + 1
    }
  })
  const totalAtStage = inv.length || 1
  const stageData = [
    { stage: "AP Clerk Review",    short: "AP Review",     count: stageCounts["AP Clerk Review"] ?? 0,          avgDays: stageAvgDays["AP Clerk Review"] },
    { stage: "Finance Manager",    short: "Finance Mgr",   count: stageCounts["Finance Manager Approval"] ?? 0, avgDays: stageAvgDays["Finance Manager"] },
    { stage: "CFO Sign-off",       short: "CFO",           count: stageCounts["CFO Sign-off"] ?? 0,             avgDays: stageAvgDays["CFO Sign-off"] },
    { stage: "Payment Processing", short: "Payment",       count: stageCounts["Payment Processing"] ?? 0,       avgDays: stageAvgDays["Payment Processing"] },
    { stage: "Completed",          short: "Done",          count: stageCounts["Completed"] ?? 0,                avgDays: 0 },
  ].filter(s => s.count > 0 || s.stage === "AP Clerk Review" || s.stage === "Finance Manager")

  const bottleneckStage = stageData.reduce((max, s) => s.count > max.count ? s : max, stageData[0] ?? { stage: "—", count: 0 })

  // ── Stage owners (who is holding each stage) ────────────────────────────────
  const stageOwners: Record<string, { name: string; sla: boolean; invoiceCount: number }> = {}
  inv.forEach(i => {
    const currentStep = (i.approval_steps ?? []).find((s: any) => s.status === "current")
    if (currentStep?.title && currentStep?.assignee) {
      const key = currentStep.title
      if (!stageOwners[key]) stageOwners[key] = { name: currentStep.assignee, sla: false, invoiceCount: 0 }
      stageOwners[key].invoiceCount++
      if (currentStep.sla_at_risk) stageOwners[key].sla = true
    }
  })

  // ── Assignee workload ────────────────────────────────────────────────────────
  const workloadMap: Record<string, { total: number; sla: number }> = {}
  inv.forEach(i => {
    const currentStep = (i.approval_steps ?? []).find((s: any) => s.status === "current")
    if (currentStep?.assignee) {
      const a = currentStep.assignee
      if (!workloadMap[a]) workloadMap[a] = { total: 0, sla: 0 }
      workloadMap[a].total++
      if (currentStep.sla_at_risk) workloadMap[a].sla++
    }
  })
  const workloadData = Object.entries(workloadMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxWorkload = Math.max(...workloadData.map(w => w.total), 1)

  // ── Cycle time trend ─────────────────────────────────────────────────────────
  const cycleData = [
    { month: "Feb", days: 12 },
    { month: "Mar", days: 10 },
    { month: "Apr", days: 11 },
    { month: "May", days: 9  },
    { month: "Jun", days: 8  },
    { month: "Jul", days: avgEndToEnd > 1 && avgEndToEnd < 30 ? avgEndToEnd : 7 },
  ]
  const cycleDelta = cycleData[0].days - cycleData[cycleData.length - 1].days

  // ── First-pass rate ──────────────────────────────────────────────────────────
  const firstPassCount = inv.length - queriedCount
  const firstPassData = [
    { name: "Approved clean",     value: firstPassCount, fill: PURPLE },
    { name: "Had query / rework", value: queriedCount,   fill: "#e4e7ec" },
  ]
  const firstPassRate = inv.length > 0 ? Math.round((firstPassCount / inv.length) * 100) : 0

  // ── Needs Attention ──────────────────────────────────────────────────────────
  const actionItems = inv.filter(i => {
    const steps = i.approval_steps ?? []
    const thread = i.comment_thread ?? []
    return steps.some((s: any) => s.sla_at_risk)
      || thread.some((t: any) => t.type === "comment" && t.is_query && !t.resolved)
      || i.risk_level === "warning" || i.risk_level === "fail"
  }).slice(0, 6)

  const fmtMYR = (n: number) =>
    `MYR ${n.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtMYRShort = (n: number) => {
    if (n >= 1_000_000) return `MYR ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `MYR ${(n / 1_000).toFixed(1)}K`
    return fmtMYR(n)
  }

  // ── Mini sparkline data (5-bar outstanding trend) ──────────────────────────
  const outstandingTrend = [28900, 31200, 29800, 33400, 30100, totalOutstanding]
  const trendMax = Math.max(...outstandingTrend)

  // ── Process health target progress (capped 0–100%) ──────────────────────────
  const hasE2EData      = avgEndToEnd > 0
  const hasApproveData  = avgTimeToApprove > 0
  const e2eDisplay      = hasE2EData ? avgEndToEnd : null
  const approveDisplay  = hasApproveData ? avgTimeToApprove : null
  const e2ePct          = hasE2EData ? Math.min(100, (avgEndToEnd / 14) * 100) : 0
  const approvePct      = hasApproveData ? Math.min(100, (avgTimeToApprove / 5) * 100) : 0
  const e2eDelta        = hasE2EData ? 14 - avgEndToEnd : null
  const approveDelta    = hasApproveData ? 5 - avgTimeToApprove : null

  // ── Oldest wait + value per assignee ────────────────────────────────────────
  const oldestWaitMap: Record<string, number> = {}
  const assigneeValueMap: Record<string, number> = {}
  inv.forEach(i => {
    const currentStep = (i.approval_steps ?? []).find((s: any) => s.status === "current")
    if (currentStep?.assignee) {
      const a = currentStep.assignee
      assigneeValueMap[a] = (assigneeValueMap[a] ?? 0) + (i.total_myr ?? 0)
      if (currentStep.assigned_at) {
        const days = Math.max(0, Math.floor((today.getTime() - new Date(currentStep.assigned_at).getTime()) / 86400000))
        if (oldestWaitMap[a] === undefined || days > oldestWaitMap[a]) oldestWaitMap[a] = days
      }
    }
  })

  // ── Delay reason data ────────────────────────────────────────────────────────
  const delayReasonData = [
    { reason: "Missing or late approval",    count: (stageData.find(s => s.stage.includes("Finance"))?.count ?? 0) + (stageData.find(s => s.stage.includes("CFO"))?.count ?? 0) + 3 },
    { reason: "Service evidence incomplete", count: Math.max(1, Math.floor(queriedCount * 0.6) + 1) },
    { reason: "PO or invoice ambiguity",     count: Math.max(1, Math.floor(queriedCount * 0.4) + 1) },
    { reason: "Vendor or bank mismatch",     count: Math.max(1, overdueList.length) },
  ]
  const delayTotal = Math.max(1, delayReasonData.reduce((s, d) => s + d.count, 0))
  const delayMax   = Math.max(...delayReasonData.map(d => d.count), 1)

  // ── Compliance & Control Health ───────────────────────────────────────────────
  const highValueInv = inv.filter(i => (i.total_myr ?? 0) >= 5000)
  const dualApprovalRate = highValueInv.length > 0
    ? Math.round((highValueInv.filter(i => (i.approval_steps ?? []).filter((s: any) => s.status === "completed").length >= 2).length / highValueInv.length) * 100)
    : 100

  const docCompleteRate = inv.length > 0
    ? Math.round((inv.filter(i => ((i as any).attachments ?? []).length > 0).length / inv.length) * 100)
    : 0

  const threeWayMatchRate = inv.length > 0
    ? Math.round((inv.filter(i => (i as any).purchase_order_number || (i as any).po_number).length / inv.length) * 100)
    : 0

  const vendorRegRate = inv.length > 0
    ? Math.round((inv.filter(i => (i as any).vendor_bank_account || (i as any).vendor_registration_number).length / inv.length) * 100)
    : 0

  const complianceDimensions = [
    { label: "Dual approval on invoices >MYR 5K", rate: dualApprovalRate,  target: 100, weight: 25 },
    { label: "Supporting documents attached",      rate: docCompleteRate,   target: 95,  weight: 25 },
    { label: "SLA adherence",                      rate: slaRate,           target: 90,  weight: 20 },
    { label: "Three-way match (PO → GRN → Inv)",   rate: threeWayMatchRate, target: 80,  weight: 15 },
    { label: "Vendor registration before payment", rate: vendorRegRate,     target: 100, weight: 15 },
  ]

  const complianceScore = Math.round(
    complianceDimensions.reduce((s, d) => s + (d.rate / 100) * d.weight, 0)
  )
  const complianceStatus  = complianceScore >= 80 ? "Compliant" : complianceScore >= 60 ? "Needs Review" : "At Risk"
  const complianceColor   = complianceScore >= 80 ? GREEN : complianceScore >= 60 ? AMBER : RED
  const complianceBg      = complianceScore >= 80 ? "#f0fdf4" : complianceScore >= 60 ? "#fffbeb" : "#fff1f2"
  const complianceBorder  = complianceScore >= 80 ? "#bbf7d0" : complianceScore >= 60 ? "#fde68a" : "#fecdd3"
  const passedCount   = complianceDimensions.filter(d => d.rate >= d.target * 0.9).length
  const warningCount  = complianceDimensions.filter(d => d.rate >= d.target * 0.6 && d.rate < d.target * 0.9).length
  const failedCount   = complianceDimensions.filter(d => d.rate < d.target * 0.6).length

  const dimStatus = (d: typeof complianceDimensions[0]) =>
    d.rate >= d.target * 0.9 ? "pass" : d.rate >= d.target * 0.6 ? "warn" : "fail"
  const dimColor = (d: typeof complianceDimensions[0]) =>
    dimStatus(d) === "pass" ? GREEN : dimStatus(d) === "warn" ? AMBER : RED

  // ── Invoice volume by month ───────────────────────────────────────────────────
  const volumeData = [
    { month: "Feb", submitted: 6, processed: 5 },
    { month: "Mar", submitted: 5, processed: 4 },
    { month: "Apr", submitted: 8, processed: 7 },
    { month: "May", submitted: 7, processed: 6 },
    { month: "Jun", submitted: 6, processed: 5 },
    { month: "Jul", submitted: Math.max(inv.length, 4), processed: Math.max(inv.length - pendingList.length, 0) },
  ]

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d0d5dd] [&::-webkit-scrollbar-thumb]:rounded-full" style={{ fontFamily: "Inter" }}>

      {/* ── Row 1: [2fr 1.5fr 1.5fr] — Needs Attention | Financial Snapshot | Awaiting Me ── */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr" }}>

        {/* Needs Attention */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-[6px] bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={11} className="text-red-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Needs Attention</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">SLA · open queries · compliance flags</p>
              </div>
            </div>
            {actionItems.length > 0 && (
              <span className="text-[11px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shrink-0">{actionItems.length}</span>
            )}
          </div>
          {actionItems.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-5">
              <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
              <p className="text-[13px] font-medium text-[#344054]">All clear — no action items</p>
            </div>
          ) : (
            <>
              {actionItems.map((item, i) => {
                const steps: any[] = item.approval_steps ?? []
                const thread: any[] = item.comment_thread ?? []
                const currentStep = steps.find((s: any) => s.status === "current")
                const openQuery = thread.find((t: any) => t.type === "comment" && t.is_query && !t.resolved)
                const isOverdue = overdueList.some(o => o.id === item.id)
                const hasSLA = currentStep?.sla_at_risk
                const leadBadge = isOverdue ? { label: "Overdue",    cls: "bg-[#f9fafb] text-red-600 border-[#f2f4f7]" }
                  : hasSLA    ? { label: "SLA risk",   cls: "bg-[#f9fafb] text-amber-600 border-[#f2f4f7]" }
                  : openQuery ? { label: "Query",      cls: "bg-[#f9fafb] text-blue-600 border-[#f2f4f7]" }
                  :             { label: "Compliance", cls: "bg-[#f9fafb] text-[#5d5ef4] border-[#f2f4f7]" }
                const ac = avatarColor(item.vendor_name_raw ?? "")
                return (
                  <div key={item.id} className={cn("flex items-center gap-3 px-4 py-3.5", i < actionItems.length - 1 && "border-b border-[#f2f4f7]")}>
                    <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ac.bg }}>
                      <span className="text-[11px] font-bold" style={{ color: ac.text }}>
                        {toTitleCase(item.vendor_name_raw ?? "").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#344054] truncate leading-none">{toTitleCase(item.vendor_name_raw ?? "")}</p>
                      <p className="text-[11px] text-[#98a2b3] truncate mt-0.5">{item.invoice_number} · {fmtMYRShort(item.total_myr ?? 0)}</p>
                    </div>
                    <span className={cn("text-[10px] font-medium border px-2 py-0.5 rounded-full shrink-0", leadBadge.cls)}>{leadBadge.label}</span>
                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-[11px] font-medium text-[#5d5ef4] hover:bg-[#eef0ff] shrink-0">
                      View →
                    </Button>
                  </div>
                )
              })}
              <div className="mx-4 mb-4 mt-3 flex gap-2">
                <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                  <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">Overdue value</p>
                  <p className="text-[13px] font-bold text-red-600">{fmtMYRShort(overdueTotal)}</p>
                </div>
                <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                  <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">Open queries</p>
                  <p className={cn("text-[13px] font-bold", actionItems.filter(i => (i.comment_thread ?? []).some((t: any) => t.is_query && !t.resolved)).length > 0 ? "text-blue-600" : "text-[#344054]")}>
                    {actionItems.filter(i => (i.comment_thread ?? []).some((t: any) => t.is_query && !t.resolved)).length}
                  </p>
                </div>
                <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                  <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">SLA at risk</p>
                  <p className={cn("text-[13px] font-bold", actionItems.filter(i => (i.approval_steps ?? []).some((s: any) => s.sla_at_risk)).length > 0 ? "text-amber-600" : "text-[#344054]")}>
                    {actionItems.filter(i => (i.approval_steps ?? []).some((s: any) => s.sla_at_risk)).length}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4 mt-auto border-t border-[#f2f4f7] pt-3">
                <Button variant="outline" size="sm" className="w-full h-8 text-[12px] font-medium text-[#667085] border-[#e4e7ec] hover:bg-[#f9fafb]">
                  View All Requests
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#eef0ff] border border-[#c7c9fb] flex items-center justify-center shrink-0">
                <Banknote size={11} className="text-[#5d5ef4]" />
              </span>
              <p className="text-[13px] font-semibold text-[#344054] leading-none">Financial Snapshot</p>
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#5d5ef4] bg-[#eef0ff] border border-[#c7c9fb] px-2 py-0.5 rounded-full">AP</span>
          </div>
          <div className="px-4 pt-4 pb-4 flex-1 flex flex-col">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3] mb-1.5">Total Outstanding</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[30px] font-bold text-[#101828] leading-none tracking-tight">{fmtMYRShort(totalOutstanding)}</span>
                <span className="text-[12px] text-[#98a2b3]">pending</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={cn("text-[11px] font-semibold", overdueList.length > 0 ? "text-red-500" : "text-[#10b981]")}>
                  {overdueList.length > 0 ? `${overdueList.length} overdue` : "All on track"}
                </span>
                <span className="text-[11px] text-[#d0d5dd]">·</span>
                <span className="text-[11px] text-[#98a2b3]">{slaRate}% SLA compliance</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center justify-between rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                <p className="text-[11px] text-[#667085]">Pending invoices</p>
                <p className="text-[14px] font-bold text-[#344054]">{pendingList.length}</p>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                <p className="text-[11px] text-[#667085]">Overdue</p>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-red-600">{overdueList.length}</p>
                  <p className="text-[11px] text-[#98a2b3]">{fmtMYRShort(overdueTotal)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
                <p className="text-[11px] text-[#667085]">SLA compliance</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-14 h-1.5 rounded-full bg-[#e4e7ec] overflow-hidden">
                    <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${slaRate}%` }} />
                  </div>
                  <p className="text-[14px] font-bold text-[#10b981]">{slaRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Awaiting Me */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#eef0ff] border border-[#c7c9fb] flex items-center justify-center shrink-0">
                <Clock size={11} className="text-[#5d5ef4]" />
              </span>
              <p className="text-[13px] font-semibold text-[#344054] leading-none">Awaiting Me</p>
            </div>
            {awaitingMeList.length > 0 && (
              <span className="text-[11px] font-bold bg-[#5d5ef4] text-white px-2 py-0.5 rounded-full shrink-0">{awaitingMeList.length}</span>
            )}
          </div>
          <div className="px-4 pt-3.5 pb-3 border-b border-[#f2f4f7]">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-[36px] font-bold leading-none", awaitingMeList.length > 0 ? "text-[#5d5ef4]" : "text-[#98a2b3]")}>{awaitingMeList.length}</span>
              <span className="text-[12px] text-[#98a2b3]">{awaitingMeList.length === 1 ? "request needs action" : "requests need action"}</span>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            {awaitingMeList.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-4">
                <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
                <p className="text-[12px] text-[#667085]">Nothing pending from you</p>
              </div>
            ) : (
              awaitingMeList.slice(0, 3).map((item: any, i: number) => {
                const currentStep = (item.approval_steps ?? []).find((s: any) => s.status === "current")
                const isSLA = currentStep?.sla_at_risk
                const ac = avatarColor(item.vendor_name_raw ?? "")
                return (
                  <div key={item.id} className={cn("flex items-center gap-3 px-4 py-3.5", i < Math.min(awaitingMeList.length, 3) - 1 && "border-b border-[#f2f4f7]")}>
                    <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ac.bg }}>
                      <span className="text-[11px] font-bold" style={{ color: ac.text }}>
                        {toTitleCase(item.vendor_name_raw ?? "").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#344054] truncate leading-none">{toTitleCase(item.vendor_name_raw ?? "")}</p>
                      <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">{currentStep?.title ?? "Review"} · {fmtMYRShort(item.total_myr ?? 0)}</p>
                    </div>
                    {isSLA && <span className="text-[10px] font-medium bg-[#f9fafb] text-amber-600 border border-[#f2f4f7] px-2 py-0.5 rounded-full shrink-0">SLA</span>}
                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-[11px] font-medium text-[#5d5ef4] hover:bg-[#eef0ff] shrink-0">
                      Review →
                    </Button>
                  </div>
                )
              })
            )}
          </div>
          <div className="mx-4 mb-4 mt-auto flex gap-2">
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">Value pending</p>
              <p className="text-[13px] font-bold text-[#344054]">{fmtMYRShort(awaitingMeList.reduce((s: number, i: any) => s + (i.total_myr ?? 0), 0))}</p>
            </div>
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">SLA at risk</p>
              <p className={cn("text-[13px] font-bold", awaitingMeList.filter((i: any) => (i.approval_steps ?? []).some((s: any) => s.status === "current" && s.sla_at_risk)).length > 0 ? "text-amber-600" : "text-[#344054]")}>
                {awaitingMeList.filter((i: any) => (i.approval_steps ?? []).some((s: any) => s.status === "current" && s.sla_at_risk)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: [1fr 1fr] — Approval Bottlenecks | Why Delayed ── */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Approval Bottlenecks */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#f5f3ff] border border-[#ddd6fe] flex items-center justify-center shrink-0">
                <Users size={11} className="text-[#7c3aed]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Approval bottlenecks</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Current workflow · oldest first</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            {workloadData.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-5">
                <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
                <p className="text-[12px] text-[#667085]">No pending approvals — queue clear</p>
              </div>
            ) : (
              workloadData.map((w, i) => {
                const ac = avatarColor(w.name)
                const waitDays = oldestWaitMap[w.name]
                const value = assigneeValueMap[w.name] ?? 0
                return (
                  <div key={w.name} className={cn("flex items-center gap-3 px-4 py-3.5", i < workloadData.length - 1 && "border-b border-[#f2f4f7]")}>
                    <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ac.bg }}>
                      <span className="text-[11px] font-bold" style={{ color: ac.text }}>
                        {w.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[13px] font-semibold text-[#344054] leading-none truncate">{w.name}</p>
                        {w.sla > 0 && <span className="text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full shrink-0 ml-2">SLA</span>}
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f2f4f7] overflow-hidden mb-1">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(w.total / maxWorkload) * 100}%`, background: PURPLE }} />
                      </div>
                      <p className="text-[10px] text-[#98a2b3]">{w.total} {w.total === 1 ? "request" : "requests"} · {fmtMYRShort(value)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {waitDays !== undefined ? (
                        <>
                          <p className="text-[15px] font-bold text-[#344054] leading-none">{waitDays}d</p>
                          <p className="text-[10px] text-[#98a2b3] mt-0.5">oldest wait</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[15px] font-bold text-[#5d5ef4] leading-none">{w.total}</p>
                          <p className="text-[10px] text-[#98a2b3] mt-0.5">pending</p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Why Requests Are Delayed */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center shrink-0">
                <Timer size={11} className="text-[#ea580c]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Why requests are delayed</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Last 90 days · top causes</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            {delayReasonData.map((d, i) => {
              const pct = Math.round((d.count / delayTotal) * 100)
              const barW = Math.max(8, Math.round((d.count / delayMax) * 100))
              return (
                <div key={d.reason} className={cn("flex items-center gap-3 px-4 py-3", i < delayReasonData.length - 1 && "border-b border-[#f2f4f7]")}>
                  <div className="w-[52px] shrink-0">
                    <div className="h-1.5 rounded-full bg-[#f2f4f7] overflow-hidden">
                      <div className="h-full rounded-full bg-[#2d6a5a] transition-all" style={{ width: `${barW}%` }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#344054] leading-none">{d.reason}</p>
                    <p className="text-[10px] text-[#98a2b3] mt-0.5">{d.count} {d.count === 1 ? "request" : "requests"}</p>
                  </div>
                  <span className="text-[14px] font-bold text-[#344054] shrink-0">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Row 3: [1fr 1fr 2fr] — Workload | First-Pass | Cycle Time ─────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 2fr" }}>

        {/* Invoice Volume by Month */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#eef0ff] border border-[#c7c9fb] flex items-center justify-center shrink-0">
                <BarChart2 size={11} className="text-[#5d5ef4]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Invoice Volume</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Submitted vs processed · 6 months</p>
              </div>
            </div>
          </div>
          <div className="px-4 pt-3 pb-1 flex-1">
            <ChartContainer config={{ submitted: { color: "#eef0ff" }, processed: { color: PURPLE } }} className="h-[120px] w-full">
              <BarChart data={volumeData} barSize={13} barGap={3} barCategoryGap="28%">
                <defs>
                  <linearGradient id="volProcessedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a5b4fc" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98a2b3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#98a2b3" }} axisLine={false} tickLine={false} width={18} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="submitted" fill="#e8eaff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="processed" fill="url(#volProcessedGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="mx-4 mb-4 mt-2 flex gap-2">
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full shrink-0" style={{ background: PURPLE }} />
                <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">Submitted</p>
              </div>
              <p className="text-[13px] font-bold text-[#344054]">{volumeData.reduce((s, d) => s + d.submitted, 0)}</p>
            </div>
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full shrink-0" style={{ background: GREEN }} />
                <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">Processed</p>
              </div>
              <p className="text-[13px] font-bold text-[#344054]">{volumeData.reduce((s, d) => s + d.processed, 0)}</p>
            </div>
          </div>
        </div>

        {/* First-Pass Rate */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#f0fdf4] border border-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={11} className="text-[#10b981]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">First-Pass Rate</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Approved without rework</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold border px-2 py-0.5 rounded-full text-[#10b981] bg-[#f0fdf4] border-green-100">↑ 8% vs last mo</span>
          </div>
          <div className="flex items-center justify-center py-5">
            <div className="relative size-[100px] shrink-0">
              <ChartContainer config={{ value: { color: PURPLE } }} className="size-[100px]">
                <PieChart>
                  <Pie data={firstPassData} cx="50%" cy="50%" innerRadius={34} outerRadius={48}
                    startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    {firstPassData.map((_, idx) => (
                      <Cell key={idx} fill={idx === 0 ? PURPLE : "#e4e7ec"} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-bold text-[#344054] leading-none">{firstPassRate}%</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col border-t border-[#f2f4f7] mt-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f7]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: PURPLE }} />
                <span className="text-[12px] text-[#667085]">Approved clean</span>
              </div>
              <span className="text-[13px] font-bold text-[#344054]">{firstPassCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f7]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#e4e7ec] shrink-0" />
                <span className="text-[12px] text-[#667085]">Had query / rework</span>
              </div>
              <span className="text-[13px] font-bold text-amber-600">{queriedCount}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-[#98a2b3]">Total processed</span>
              <span className="text-[13px] font-bold text-[#344054]">{inv.length}</span>
            </div>
          </div>
        </div>

        {/* Cycle Time Trend */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#eef0ff] border border-[#c7c9fb] flex items-center justify-center shrink-0">
                <TrendingUp size={11} className="text-[#5d5ef4]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Cycle Time Trend</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Avg days end-to-end · last 6 months</p>
              </div>
            </div>
            <span className={cn("text-[10px] font-semibold border px-2 py-0.5 rounded-full", cycleDelta > 0 ? "text-[#10b981] bg-[#f0fdf4] border-green-100" : "text-red-500 bg-red-50 border-red-100")}>
              {cycleDelta > 0 ? `↓ ${cycleDelta}d faster` : `↑ ${Math.abs(cycleDelta)}d slower`}
            </span>
          </div>
          <div className="px-4 pt-4 pb-2">
            <ChartContainer config={{ days: { color: PURPLE } }} className="h-[120px] w-full">
              <LineChart data={cycleData}>
                <CartesianGrid vertical={false} stroke={GRAY_LINE} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#98a2b3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#98a2b3" }} axisLine={false} tickLine={false} width={24} domain={[0, Math.max(16, ...cycleData.map(d => d.days))]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="days" stroke={PURPLE} strokeWidth={2}
                  dot={{ fill: PURPLE, r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: PURPLE }}
                />
              </LineChart>
            </ChartContainer>
          </div>
          <div className="mx-4 mb-4 mt-1 flex gap-2">
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">6-mo high</p>
              <p className="text-[13px] font-bold text-red-500">{Math.max(...cycleData.map(d => d.days))}d</p>
            </div>
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">6-mo low</p>
              <p className="text-[13px] font-bold text-[#10b981]">{Math.min(...cycleData.map(d => d.days))}d</p>
            </div>
            <div className="flex-1 rounded-[8px] bg-[#f9fafb] border border-[#f2f4f7] px-3 py-2.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide mb-1">Trend</p>
              <p className={cn("text-[13px] font-bold", cycleDelta > 0 ? "text-[#10b981]" : "text-red-500")}>
                {cycleDelta > 0 ? `↓${cycleDelta}d` : `↑${Math.abs(cycleDelta)}d`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: [1fr 1.2fr] — Process Health | Compliance & Control ──────── */}
      <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 1.2fr" }}>

        {/* Process Health */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] bg-[#eef0ff] border border-[#c7c9fb] flex items-center justify-center shrink-0">
                <HeartPulse size={11} className="text-[#5d5ef4]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Process Health</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Efficiency metrics · current period</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-[#f2f4f7] flex-1">
            {/* End-to-End */}
            <div className="px-4 py-4 flex flex-col gap-1.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">End-to-End</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-bold text-[#344054] leading-none">{e2eDisplay ?? "—"}</span>
                <span className="text-[11px] text-[#98a2b3]">days</span>
              </div>
              {e2eDelta !== null && (
                <span className={cn("text-[10px] font-medium", e2eDelta < 0 ? "text-[#10b981]" : "text-red-500")}>
                  {e2eDelta < 0 ? `↓ ${Math.abs(e2eDelta)}d faster` : `↑ ${e2eDelta}d slower`}
                </span>
              )}
              <div className="mt-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-[#98a2b3]">Target 14d</span>
                  <span className="text-[9px] text-[#98a2b3]">{e2ePct}%</span>
                </div>
                <div className="h-1 rounded-full bg-[#f2f4f7] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(e2ePct ?? 0, 100)}%`, background: (e2ePct ?? 0) >= 80 ? GREEN : AMBER }} />
                </div>
              </div>
            </div>
            {/* To Approve */}
            <div className="px-4 py-4 flex flex-col gap-1.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">Approval Time</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-bold text-[#344054] leading-none">{approveDisplay ?? "—"}</span>
                <span className="text-[11px] text-[#98a2b3]">days</span>
              </div>
              {approveDelta !== null && (
                <span className={cn("text-[10px] font-medium", approveDelta < 0 ? "text-[#10b981]" : "text-red-500")}>
                  {approveDelta < 0 ? `↓ ${Math.abs(approveDelta)}d faster` : `↑ ${approveDelta}d slower`}
                </span>
              )}
              <div className="mt-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-[#98a2b3]">Target 5d</span>
                  <span className="text-[9px] text-[#98a2b3]">{approvePct}%</span>
                </div>
                <div className="h-1 rounded-full bg-[#f2f4f7] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(approvePct ?? 0, 100)}%`, background: (approvePct ?? 0) >= 80 ? GREEN : AMBER }} />
                </div>
              </div>
            </div>
            {/* Query Rate */}
            <div className="px-4 py-4 flex flex-col gap-1.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">Query Rate</p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-[20px] font-bold leading-none", queryRate > 20 ? "text-red-500" : queryRate > 10 ? "text-amber-500" : "text-[#344054]")}>{queryRate}</span>
                <span className="text-[11px] text-[#98a2b3]">%</span>
              </div>
              <span className="text-[10px] text-[#98a2b3]">{queriedCount} of {inv.length} queried</span>
              <div className="mt-1 h-1 rounded-full bg-[#f2f4f7] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(queryRate, 100)}%`, background: queryRate > 20 ? RED : queryRate > 10 ? AMBER : GREEN }} />
              </div>
            </div>
            {/* First-Pass */}
            <div className="px-4 py-4 flex flex-col gap-1.5">
              <p className="text-[9px] text-[#98a2b3] uppercase tracking-wide">First-Pass Rate</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-bold text-[#344054] leading-none">{firstPassRate}</span>
                <span className="text-[11px] text-[#98a2b3]">%</span>
              </div>
              <span className="text-[10px] text-[#98a2b3]">{firstPassCount} clean passes</span>
              <div className="mt-1 h-1 rounded-full bg-[#f2f4f7] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(firstPassRate, 100)}%`, background: GREEN }} />
              </div>
            </div>
          </div>
        </div>

        {/* Compliance & Control Health */}
        <div className="bg-white border border-[#eaecf0] rounded-[14px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: complianceBg, border: `1px solid ${complianceBorder}` }}>
                <HeartPulse size={11} style={{ color: complianceColor }} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#344054] leading-none">Compliance & Control</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">Policy adherence · current period</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ color: complianceColor, background: complianceBg, borderColor: complianceBorder }}>
              {complianceStatus}
            </span>
          </div>

          {/* Score hero */}
          <div className="px-4 pt-4 pb-3 border-b border-[#f2f4f7] flex items-center gap-4">
            <div className="relative size-[64px] shrink-0">
              <svg viewBox="0 0 64 64" className="size-[64px] -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f2f4f7" strokeWidth="7" />
                <circle cx="32" cy="32" r="26" fill="none" strokeWidth="7"
                  stroke={complianceColor}
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - complianceScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[16px] font-bold text-[#344054] leading-none">{complianceScore}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#98a2b3] mb-2">out of 100 · {failedCount + warningCount} {failedCount + warningCount === 1 ? "check" : "checks"} need attention</p>
              <div className="flex gap-1.5 flex-wrap">
                {passedCount > 0 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d]">{passedCount} passed</span>}
                {warningCount > 0 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#b45309]">{warningCount} warnings</span>}
                {failedCount > 0 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#be123c]">{failedCount} failed</span>}
              </div>
            </div>
          </div>

          {/* Dimension rows */}
          <div className="flex flex-col flex-1">
            {complianceDimensions.map((d, i) => {
              const status = dimStatus(d)
              const color  = dimColor(d)
              return (
                <div key={d.label} className={cn("flex items-center gap-3 px-4 py-2.5", i < complianceDimensions.length - 1 && "border-b border-[#f2f4f7]")}>
                  <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
                  <p className="flex-1 text-[12px] text-[#344054] leading-none min-w-0 truncate">{d.label}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-[44px] h-1.5 rounded-full bg-[#f2f4f7] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.rate}%`, background: color }} />
                    </div>
                    <span className="text-[12px] font-semibold w-[32px] text-right" style={{ color }}>{d.rate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_COLOR: Record<InvoiceStatus, { bg: string; text: string }> = {
  pending_review: { bg: "#eff8ff", text: "#175cd3" },
  approved:       { bg: "#ecfdf3", text: "#027a48" },
  rejected:       { bg: "#fef3f2", text: "#b42318" },
  paid:           { bg: "#f2f4f7", text: "#344054" },
  overdue:        { bg: "#fff6ed", text: "#c4320a" },
  partially_paid: { bg: "#fffaeb", text: "#b54708" },
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending_review: "Pending",
  approved:       "Approved",
  rejected:       "Rejected",
  paid:           "Paid",
  overdue:        "Overdue",
  partially_paid: "Part Paid",
}

const CATEGORY_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  utility:              { icon: Zap,           color: "#185FA5", label: "Utility" },
  subscription:         { icon: RefreshCw,     color: "#534AB7", label: "Subscription" },
  payroll:              { icon: Users,          color: "#1D9E75", label: "Payroll" },
  regulatory:           { icon: Landmark,       color: "#E24B4A", label: "Regulatory" },
  local_supplier:       { icon: Truck,          color: "#1D9E75", label: "Local Supplier" },
  foreign_supplier:     { icon: Globe,          color: "#185FA5", label: "Foreign Supplier" },
  office_rental:        { icon: Building2,      color: "#BA7517", label: "Office Rental" },
  capex:                { icon: Wrench,         color: "#888780", label: "CAPEX" },
  staff_claim:          { icon: Receipt,        color: "#BA7517", label: "Staff Claim" },
  petty_cash:           { icon: Banknote,       color: "#1D9E75", label: "Petty Cash" },
  staff_credit_card:    { icon: CreditCard,     color: "#534AB7", label: "Staff Credit Card" },
  freelancer:           { icon: UserCheck,      color: "#BA7517", label: "Freelancer" },
  interco:              { icon: ArrowLeftRight, color: "#534AB7", label: "Interco Chargeback" },
  professional_service: { icon: Briefcase,      color: "#BA7517", label: "Professional Service" },
  opex:                 { icon: HeartPulse,     color: "#E24B4A", label: "OPEX" },
}

function getCat(category?: string | null) {
  return CATEGORY_MAP[category ?? ""] ?? { icon: FileText, color: "#888780", label: "Unknown" }
}

function urgencyLabel(inv: InvoiceListItem): string {
  if (inv.status === "paid") return "Paid"
  const dateStr = (inv as any).payment_needed_by ?? inv.due_date
  if (!dateStr) return ""
  const due = new Date(dateStr)
  const diff = Math.floor((due.getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return "Due today"
  if (diff <= 7) return `Due ${diff}d`
  return due.toLocaleDateString("en-MY", { day: "numeric", month: "short" })
}

function urgencyColor(inv: InvoiceListItem): string {
  if (inv.status === "paid") return "text-[#667085]"
  const dateStr = (inv as any).payment_needed_by ?? inv.due_date
  if (!dateStr) return "text-[#667085]"
  const diff = Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return "text-red-500 font-medium"
  if (diff <= 7) return "text-amber-500 font-medium"
  return "text-[#667085]"
}

// ─── Channel Toggle ───────────────────────────────────────────────────────────

function ChannelToggle({
  channel, onChange,
}: { channel: "form" | "email"; onChange: (v: "form" | "email") => void }) {
  return (
    <div className="flex bg-[#e7e6e6] border border-[#f2f4f7] rounded-[10px] p-0.5 gap-0" style={{ fontFamily: "Inter" }}>
      {(["form", "email"] as const).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "px-3 py-1.5 rounded-[8px] text-[13px] capitalize transition-all duration-150 cursor-pointer",
            channel === v
              ? "bg-white text-[#344054] shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]"
              : "text-[#667085] hover:text-[#344054]"
          )}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  )
}

// ─── Metrics Board ────────────────────────────────────────────────────────────

function MetricsBoard({
  metrics, pinned, expanded,
}: {
  metrics: ReturnType<typeof getMockMetrics>
  pinned: string[]
  expanded: boolean
}) {
  const toShow = expanded
    ? Object.values(metrics)
    : pinned.map(k => metrics[k as keyof typeof metrics]).filter(Boolean)

  const cols = expanded ? "grid-cols-3" : "grid-cols-2"

  return (
    <div className={cn("grid gap-2", cols)}>
      {toShow.map(m => (
        <div
          key={m.key}
          className={cn(
            "rounded-[15px] p-4 cursor-pointer transition-colors duration-150",
            m.color === "gradient" ? "border border-[#eaecf0]" : "bg-white border border-[#eaecf0] hover:border-[#d0d5dd]"
          )}
          style={m.color === "gradient" ? {
            background: "linear-gradient(135deg, #5d5ef4 0%, #4546c8 50%, #3a3ab5 100%)",
          } : {}}
        >
          <p className={cn("text-[14px] leading-5 truncate", m.color === "gradient" ? "text-white/80" : "text-[#667085]")}
             style={{ fontFamily: "Inter", fontWeight: 400 }}>
            {m.label}
          </p>
          <p className={cn(
            "text-[24px] font-semibold leading-8 mt-1.5",
            m.color === "gradient" ? "text-white" :
            m.color === "red"      ? "text-red-500" :
            m.color === "amber"    ? "text-amber-500" :
            "text-[#344054]"
          )}
             style={{ fontFamily: "Inter" }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({
  label, active, heading, options, selected, onSelect,
}: {
  label: string
  active: boolean
  heading: string
  options: { value: string; label: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 border rounded-[10px] pl-3 pr-2.5 py-[7px] text-[13px] font-medium shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] cursor-pointer transition-colors focus:outline-none",
          active || open
            ? "bg-[#eef0ff] border-[#c7c9fb] text-[#5d5ef4]"
            : "bg-white border-[#eaecf0] text-[#344054] hover:bg-[#f9fafb]"
        )}
        style={{ fontFamily: "Inter" }}
      >
        {label}
        <ChevronDown size={13} className={cn("transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-[176px] bg-white border border-[#eaecf0] rounded-[10px] shadow-[0px_4px_16px_0px_rgba(16,24,40,0.10)] z-50 py-1 overflow-hidden">
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] font-semibold text-[#98a2b3] uppercase tracking-wider" style={{ fontFamily: "Inter" }}>{heading}</p>
          </div>
          <div className="h-px bg-[#f2f4f7] mx-2 mb-1" />
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors hover:bg-[#f9fafb]",
                selected === opt.value ? "font-semibold text-[#5d5ef4]" : "font-normal text-[#344054]"
              )}
              style={{ fontFamily: "Inter" }}
            >
              <span className={cn("size-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                selected === opt.value ? "bg-[#5d5ef4] border-[#5d5ef4]" : "border-[#d0d5dd]"
              )}>
                {selected === opt.value && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Request List Item ────────────────────────────────────────────────────────

function RequestListItem({
  inv, selected, expanded, onSelect,
}: { inv: InvoiceListItem; selected: boolean; expanded: boolean; onSelect: () => void }) {
  const cat = getCat(inv.invoice_category)
  const CatIcon = cat.icon
  const amount = (inv.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })
  const pr = (inv as any).pr_number as string | undefined
  const statusColor = STATUS_COLOR[inv.status as InvoiceStatus]

  const rowBg = selected
    ? "bg-[#f2f4f7] border-[#d0d5dd]"
    : "bg-white border-transparent hover:bg-[#f9fafb] hover:border-[#eaecf0]"

  // Urgency chip style
  const urgLabel = urgencyLabel(inv)
  const urgChipStyle = (() => {
    if (inv.status === "paid") return null
    if (!urgLabel) return null
    if (urgLabel.includes("overdue")) return { bg: "#fef3f2", text: "#b42318" }
    if (urgLabel === "Due today") return { bg: "#fff6ed", text: "#c4320a" }
    if (urgLabel.startsWith("Due")) return { bg: "#fffaeb", text: "#b54708" }
    return null
  })()

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-0 rounded-[10px] cursor-pointer transition-all duration-150 border overflow-hidden",
        rowBg
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {/* Category icon */}
        <div
          className="size-9 rounded-[9px] flex items-center justify-center shrink-0 border"
          style={{ background: cat.color + "12", borderColor: cat.color + "28" }}
          title={cat.label}
        >
          <CatIcon size={15} style={{ color: cat.color }} strokeWidth={1.7} />
        </div>

        {/* Middle: vendor + invoice ref */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#101828] truncate leading-tight">
            {toTitleCase(inv.vendor_name_raw ?? "")}
          </p>
          <p className="text-[11px] text-[#98a2b3] truncate mt-0.5 leading-tight">
            {inv.invoice_number}{pr && <span className="text-[#d0d5dd]"> · </span>}{pr && <span>{pr}</span>}
          </p>
        </div>

        {/* Right: amount + status */}
        <div className="shrink-0 text-right">
          <p className="text-[13px] font-bold text-[#101828] tabular-nums leading-tight">
            {amount}
          </p>
          <span
            className="inline-block text-[10px] font-semibold rounded-[5px] px-1.5 py-0.5 mt-0.5 leading-none"
            style={{ background: statusColor.bg, color: statusColor.text }}
          >
            {STATUS_LABEL[inv.status as InvoiceStatus]}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-1.5 px-3 pb-2.5 pl-[52px] flex-wrap">
        {/* Requestor */}
        <span className="text-[11px] text-[#98a2b3] truncate max-w-[100px]">
          {(inv as any).requestor_name}
        </span>

        {/* Urgency chip */}
        {urgChipStyle ? (
          <span
            className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px]"
            style={{ background: urgChipStyle.bg, color: urgChipStyle.text }}
          >
            {urgLabel}
          </span>
        ) : urgLabel ? (
          <span className="text-[11px] text-[#98a2b3]">{urgLabel}</span>
        ) : null}

        {/* Risk chips */}
        {inv.risk_level === "warning" && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] bg-[#fffaeb] text-[#b54708]">
            <AlertTriangle size={9} strokeWidth={2.5} /> {inv.risk_count}
          </span>
        )}
        {inv.risk_level === "fail" && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] bg-[#fef3f2] text-[#b42318]">
            <XCircle size={9} strokeWidth={2.5} /> {inv.risk_count}
          </span>
        )}
        {inv.risk_level === "pass" && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] bg-[#ecfdf3] text-[#027a48]">
            <CheckCircle2 size={9} strokeWidth={2.5} /> Clear
          </span>
        )}

        {/* Expanded-only chips */}
        {expanded && inv.duplicate_risk !== "none" && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] bg-[#fef3f2] text-[#b42318]">
            <Minus size={9} strokeWidth={3} /> Dup
          </span>
        )}
        {expanded && (inv as any).sla_warning && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] bg-[#fff6ed] text-[#c4320a]">
            <Clock size={9} strokeWidth={2.5} /> {(inv as any).sla_warning}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({ invoice, onTabChange }: { invoice: InvoiceListItem; onTabChange?: (tab: string) => void }) {
  const inv = invoice as any

  const checks = getMockCompliance(invoice.id) ?? []
  const passCount = checks.filter((c: any) => c.result === "pass").length
  const warnCount = checks.filter((c: any) => c.result === "warning").length
  const failCount = checks.filter((c: any) => c.result === "fail").length
  const totalChecks = checks.length || 1
  const complianceScore = checks.length > 0
    ? Math.round((passCount / totalChecks) * 100)
    : inv.risk_level === "pass" ? 92 : inv.risk_level === "warning" ? 78 : 45

  const vendorFields = [
    { label: "Vendor Name",    value: toTitleCase(invoice.vendor_name_raw ?? "") },
    { label: "TIN",            value: inv.vendor_tin ?? "—" },
    { label: "Reg No.",        value: inv.vendor_reg_no ?? "—" },
    { label: "Address",        value: inv.vendor_address ?? "—" },
  ]
  const billToFields = [
    { label: "Company",   value: inv.bill_to_name ?? "—" },
    { label: "TIN",       value: inv.bill_to_tin ?? "—" },
    { label: "Address",   value: inv.bill_to_address ?? "—" },
  ]
  const invoiceFields = [
    { label: "Invoice No.",    value: invoice.invoice_number ?? "—" },
    { label: "Invoice Date",   value: formatDate(inv.invoice_date) },
    { label: "Due Date",       value: formatDate(invoice.due_date) },
    { label: "Pay Terms",      value: inv.payment_terms ?? "—" },
    { label: "Currency",       value: inv.currency ?? "MYR" },
    { label: "PO Ref",         value: inv.po_reference ?? "—" },
    { label: "DO No.",         value: inv.do_number ?? "—" },
  ]
  const amountFields = [
    { label: "Subtotal",  value: `MYR ${(inv.subtotal_myr ?? 0).toFixed(2)}`,    bold: false },
    { label: "Tax",       value: `MYR ${(inv.tax_amount_myr ?? 0).toFixed(2)}`,  bold: false },
    { label: "Total",     value: `MYR ${(invoice.total_myr ?? 0).toFixed(2)}`,   bold: true  },
  ]

  function Section({ title, fields }: { title: string; fields: { label: string; value: string; bold?: boolean }[] }) {
    return (
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3] mb-2" style={{ fontFamily: "Inter" }}>{title}</p>
        <div className="bg-[#fafafa] border border-[#f2f4f7] rounded-[10px] overflow-hidden">
          {fields.map((f, i) => (
            <div key={i} className={cn("flex items-start justify-between px-3.5 py-2.5", i < fields.length - 1 && "border-b border-[#f2f4f7]")} style={{ fontFamily: "Inter" }}>
              <span className="text-[12px] text-[#98a2b3] shrink-0 w-28">{f.label}</span>
              <span className={cn("text-[12px] text-[#344054] text-right ml-2", f.bold ? "font-bold text-[#111]" : "font-medium")}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Next-action derivation ──────────────────────────────────────
  const steps: any[] = inv.approval_steps ?? []
  const currentStep = steps.find((s: any) => s.status === "current")
  const thread: any[] = inv.comment_thread ?? []
  const openQueries = thread.filter((t: any) => t.type === "comment" && t.is_query && !t.resolved)

  function initials(name: string) {
    return name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
  }

  // Derive who is blocking: prefer an open query directed back at requestor, else current approval step
  const blockingQuery = openQueries.length > 0 ? openQueries[openQueries.length - 1] : null
  const hasBlock = currentStep || blockingQuery

  return (
    <div>
      {/* Next Action — who needs to act now */}
      {hasBlock && (
        <div className="rounded-[12px] border border-[#e4e7ec] bg-white mb-4 overflow-hidden" style={{ fontFamily: "Inter" }}>
          <div className="px-3.5 py-2.5 border-b border-[#f2f4f7] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-[#98a2b3]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">Waiting On</span>
            </div>
            {currentStep?.sla_at_risk && (
              <span className="text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">SLA at risk</span>
            )}
          </div>

          {/* Current approval step */}
          {currentStep && (
            <div className="flex items-center gap-3 px-3.5 py-3 border-b border-[#f9fafb]">
              <div className="size-7 rounded-full bg-[#eef0ff] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#5d5ef4]">{initials(currentStep.assignee)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#344054] leading-none">{currentStep.assignee}</p>
                <p className="text-[11px] text-[#98a2b3] mt-0.5 leading-none">{currentStep.title}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-[11px] font-medium text-[#5d5ef4] hover:bg-[#eef0ff] hover:text-[#5d5ef4] shrink-0"
                onClick={() => onTabChange?.("approval")}
              >
                View →
              </Button>
            </div>
          )}

          {/* Open queries */}
          {blockingQuery && (
            <div className="flex items-start gap-3 px-3.5 py-3">
              <div className="size-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-amber-600">{initials(blockingQuery.author)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[12px] font-semibold text-[#344054] leading-none">{blockingQuery.author}</p>
                  <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1 py-0.5 rounded-full leading-none">query</span>
                </div>
                <p className="text-[11px] text-[#667085] leading-[1.4] line-clamp-2">{blockingQuery.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-[11px] font-medium text-[#5d5ef4] hover:bg-[#eef0ff] hover:text-[#5d5ef4] shrink-0 mt-0.5"
                onClick={() => onTabChange?.("comments")}
              >
                Reply →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Jomie Compliance — unified card */}
      {inv.risk_level && (
        <div className={cn(
          "rounded-[12px] p-4 mb-4 border",
          failCount > 0
            ? "bg-red-50 border-red-200"
            : warnCount > 0
            ? "bg-amber-50 border-amber-200"
            : "bg-[#f0fdf4] border-[#bbf7d0]"
        )}>
          {/* Top row: label + score */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-6 rounded-[6px] flex items-center justify-center shrink-0",
                failCount > 0 ? "bg-red-100" : warnCount > 0 ? "bg-amber-100" : "bg-[#dcfce7]"
              )}>
                {failCount > 0 || warnCount > 0
                  ? <AlertTriangle size={12} className={failCount > 0 ? "text-red-500" : "text-amber-500"} />
                  : <CheckCircle2 size={12} className="text-[#16a34a]" />
                }
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#344054] leading-none" style={{ fontFamily: "Inter" }}>
                  {failCount > 0 || warnCount > 0 ? "Action Required" : "All Clear"}
                </p>
                <p className="text-[10px] text-[#667085] mt-0.5 leading-none" style={{ fontFamily: "Inter" }}>
                  ✦ Jomie Compliance
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-[20px] font-bold leading-none",
                failCount > 0 ? "text-red-600" : warnCount > 0 ? "text-amber-600" : "text-[#16a34a]"
              )} style={{ fontFamily: "Inter" }}>{complianceScore}</span>
              <span className="text-[12px] text-[#98a2b3] font-medium" style={{ fontFamily: "Inter" }}> / 100</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden mb-3">
            <div className={cn(
              "h-full rounded-full transition-all",
              failCount > 0 ? "bg-red-500" : warnCount > 0 ? "bg-amber-500" : "bg-[#16a34a]"
            )} style={{ width: `${complianceScore}%` }} />
          </div>

          {/* Bottom row: status + CTA */}
          <div className="flex items-center justify-between">
            <p className={cn(
              "text-[11px]",
              failCount > 0 ? "text-red-700" : warnCount > 0 ? "text-amber-700" : "text-[#15803d]"
            )} style={{ fontFamily: "Inter" }}>
              {failCount > 0
                ? `${failCount} fail${failCount !== 1 ? "s" : ""}, ${warnCount} warning${warnCount !== 1 ? "s" : ""} detected`
                : warnCount > 0
                ? `${warnCount} warning${warnCount !== 1 ? "s" : ""} detected — review before approving`
                : "All compliance checks passed"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-[11px] font-medium text-[#5d5ef4] hover:bg-transparent hover:underline shrink-0 ml-1"
              onClick={() => onTabChange?.("checks")}
            >
              View Checks →
            </Button>
          </div>
        </div>
      )}

      {/* Amounts highlight */}
      <div className="bg-[#fafafa] border border-[#f2f4f7] rounded-[10px] px-4 py-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#98a2b3] font-medium uppercase tracking-[0.08em]" style={{ fontFamily: "Inter" }}>Total Amount</p>
          <p className="text-[20px] font-bold text-[#111] mt-0.5 leading-none" style={{ fontFamily: "Inter" }}>
            MYR {(invoice.total_myr ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#98a2b3] font-medium uppercase tracking-[0.08em]" style={{ fontFamily: "Inter" }}>Due</p>
          <p className="text-[13px] font-semibold text-[#344054] mt-0.5" style={{ fontFamily: "Inter" }}>{formatDate(invoice.due_date)}</p>
        </div>
      </div>

      {/* PR Info */}
      {inv.pr_number && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3] mb-2" style={{ fontFamily: "Inter" }}>Payment Request</p>
          <div className="bg-[#fafafa] border border-[#f2f4f7] rounded-[10px] overflow-hidden">
            {[
              { label: "PR Number", value: inv.pr_number },
              { label: "Requestor", value: inv.requestor_name ?? "—" },
              { label: "Pay By",    value: formatDate(inv.payment_needed_by) },
              { label: "Channel",   value: inv.intake_channel ?? "—" },
              { label: "Urgency",   value: inv.urgency_level ?? "normal" },
            ].map((f, i, arr) => (
              <div key={i} className={cn("flex items-start justify-between px-3.5 py-2.5", i < arr.length - 1 && "border-b border-[#f2f4f7]")} style={{ fontFamily: "Inter" }}>
                <span className="text-[12px] text-[#98a2b3] shrink-0 w-28">{f.label}</span>
                <span className="text-[12px] font-medium text-[#344054] text-right ml-2">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Vendor"  fields={vendorFields} />
      <Section title="Bill To" fields={billToFields} />
      <Section title="Invoice" fields={invoiceFields} />
      <Section title="Amounts" fields={amountFields} />
    </div>
  )
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

function CommentsTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const [localThread, setLocalThread] = React.useState<CommentThreadItem[]>(
    () => inv.comment_thread ?? []
  )
  const [message, setMessage] = React.useState("")
  const CURRENT_USER = "Thony"

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true })
  }
  function formatDate(ts: string) {
    return new Date(ts).toLocaleDateString("en-MY", { day: "numeric", month: "short" })
  }

  function handleSend() {
    if (!message.trim()) return
    setLocalThread(prev => [...prev, {
      id: `local-${Date.now()}`,
      type: "comment",
      is_query: false,
      resolved: false,
      timestamp: new Date().toISOString(),
      author: CURRENT_USER,
      role: "Requestor",
      message: message.trim(),
    } as CommentThreadItem])
    setMessage("")
  }

  function handleResolve(id: string) {
    setLocalThread(prev => prev.map(it =>
      it.id === id ? { ...it, resolved: true, resolved_by: CURRENT_USER } : it
    ))
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  type RenderRow =
    | { kind: "activity"; item: CommentThreadItem }
    | { kind: "group"; items: CommentThreadItem[] }
  const rows: RenderRow[] = []
  for (const item of localThread) {
    if (item.type === "activity") {
      rows.push({ kind: "activity", item })
    } else {
      const last = rows[rows.length - 1]
      if (last?.kind === "group" && last.items[last.items.length - 1].author === item.author) {
        last.items.push(item)
      } else {
        rows.push({ kind: "group", items: [item] })
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 pt-3 pb-2">
      <div className="flex flex-col flex-1 min-h-0">
      <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport className="focus:outline-none focus-visible:ring-0">
            <MessageScrollerContent className="gap-1 pb-2 px-4">
              <div className="flex-1" />
              {rows.length === 0 && (
                <p className="text-[13px] text-[#98a2b3] text-center py-8" style={{ fontFamily: "Inter" }}>
                  No comments yet.
                </p>
              )}
              {rows.map((row) => {
                if (row.kind === "activity") {
                  const item = row.item
                  return (
                    <MessageScrollerItem key={item.id} messageId={item.id} className="[content-visibility:visible]">
                      <Marker className="my-1.5">
                        <MarkerContent className="text-[11px] italic text-[#98a2b3] flex items-center gap-1.5" style={{ fontFamily: "Inter" }}>
                          <span className="size-1.5 rounded-full bg-[#d0d5dd] shrink-0 not-italic" />
                          {item.description}
                          <span className="ml-1 text-[10px] text-[#c0c5ce] tabular-nums not-italic">
                            {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                          </span>
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>
                  )
                }

                const groupItems = row.items
                const firstItem = groupItems[0]
                const isMine = firstItem.author === CURRENT_USER
                const anyQuery = groupItems.some(it => it.is_query)

                return (
                  <MessageScrollerItem
                    key={firstItem.id}
                    messageId={firstItem.id}
                    scrollAnchor={anyQuery || isMine}
                    className="[content-visibility:visible]"
                  >
                    <MessageGroup>
                      {groupItems.map((item, i) => {
                        const isLastInGroup = i === groupItems.length - 1
                        const isQuery = item.is_query
                        const initials = (item.author ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

                        return (
                          <Message key={item.id} align={isMine ? "end" : "start"} className="mb-0.5 group/message">
                            <MessageAvatar>
                              {isLastInGroup && (
                                <Avatar className="size-8">
                                  <AvatarFallback className="text-[11px] font-semibold text-[#5d5ef4] bg-[#f2f4f7]">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </MessageAvatar>
                            <MessageContent>
                              {i === 0 && (
                                <MessageHeader className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[12px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{item.author}</span>
                                  {item.role && (
                                    <span className="text-[10px] bg-[#f2f4f7] rounded-full px-1.5 py-px text-[#667085]" style={{ fontFamily: "Inter" }}>{item.role}</span>
                                  )}
                                  {isQuery && !item.resolved && (
                                    <span className="text-[10px] bg-[#eef0fe] rounded-full px-1.5 py-px text-[#5d5ef4] font-medium" style={{ fontFamily: "Inter" }}>Query</span>
                                  )}
                                  {isQuery && item.resolved && (
                                    <span className="text-[10px] bg-[#ecfdf3] rounded-full px-1.5 py-px text-[#027a48] font-medium flex items-center gap-0.5" style={{ fontFamily: "Inter" }}>
                                      <CheckCircle2 size={9} /> Resolved
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[#98a2b3] ml-auto tabular-nums" style={{ fontFamily: "Inter" }}>
                                    {formatTime(item.timestamp)}
                                  </span>
                                </MessageHeader>
                              )}
                              <div className={cn("flex items-center gap-2", isMine ? "flex-row-reverse justify-start" : "flex-row")}>
                                <Bubble
                                  align={isMine ? "end" : "start"}
                                  variant={isMine ? "default" : "outline"}
                                  className={cn(
                                    "rounded-[10px] shrink-0",
                                    isMine ? "rounded-tr-[4px]" : "rounded-tl-[4px]",
                                    isQuery && !item.resolved && "*:data-[slot=bubble-content]:!bg-[#f5f5ff] *:data-[slot=bubble-content]:!border-[#c7c8fa]",
                                    isQuery && item.resolved && "*:data-[slot=bubble-content]:!bg-[#f6fef9] *:data-[slot=bubble-content]:!border-[#abefc6]"
                                  )}
                                >
                                  <BubbleContent className="py-1.5 px-3">
                                    <p className={cn(
                                      "text-[13px] leading-[1.45]",
                                      isMine ? "text-white" : "text-[#344054]",
                                      isQuery && item.resolved && "opacity-60"
                                    )} style={{ fontFamily: "Inter" }}>
                                      {item.message}
                                    </p>
                                  </BubbleContent>
                                </Bubble>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/message:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => handleCopy(item.message)}
                                    className="p-1 rounded-md text-[#c0c5ce] hover:text-[#667085] hover:bg-[#f2f4f7] transition-colors cursor-pointer"
                                    title="Copy"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  {isQuery && !item.resolved && (
                                    <button
                                      onClick={() => handleResolve(item.id)}
                                      className="p-1 rounded-md text-[#c0c5ce] hover:text-[#5d5ef4] hover:bg-[#eef0fe] transition-colors cursor-pointer"
                                      title="Resolve"
                                    >
                                      <CheckCircle2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {item.attachment && (
                                <Attachment size="sm" className="mt-1.5 bg-[#f9fafb] border-[#eaecf0]">
                                  <AttachmentMedia className="bg-[#f2f4f7]">
                                    <FileText size={14} />
                                  </AttachmentMedia>
                                  <AttachmentContent>
                                    <AttachmentTitle>{item.attachment}</AttachmentTitle>
                                    <AttachmentDescription>PDF</AttachmentDescription>
                                  </AttachmentContent>
                                  <AttachmentActions>
                                    <AttachmentAction
                                      aria-label={`Download ${item.attachment}`}
                                      onClick={() => toast("Coming soon", { description: "File download will be available in the next release." })}
                                    >
                                      <Download size={12} />
                                    </AttachmentAction>
                                  </AttachmentActions>
                                </Attachment>
                              )}
                            </MessageContent>
                          </Message>
                        )
                      })}
                    </MessageGroup>
                  </MessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      </div>

      {/* Compose — pinned to bottom */}
      <div className="pt-1 pb-4 px-4 shrink-0">
        <div className="bg-[#f9fafb] rounded-[12px] focus-within:ring-2 focus-within:ring-[#5d5ef4]/10 transition-all">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Add a comment or query…"
            rows={2}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-[13px] text-[#344054] resize-none focus:outline-none placeholder:text-[#98a2b3]"
            style={{ fontFamily: "Inter" }}
          />
          <div className="flex justify-between items-center px-2 pb-2">
            <div className="flex items-center gap-1">
              <button className="text-[#c0c5ce] hover:text-[#667085] transition-colors cursor-pointer p-1 rounded-md hover:bg-[#eaecf0]"><Paperclip size={13} /></button>
              <button className="text-[#c0c5ce] hover:text-[#667085] transition-colors cursor-pointer p-1 rounded-md hover:bg-[#eaecf0]"><AlertTriangle size={13} /></button>
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="bg-[#5d5ef4] text-white rounded-[8px] px-3.5 py-1.5 text-[12px] font-medium hover:bg-[#4546d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ fontFamily: "Inter" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Checks Tab ───────────────────────────────────────────────────────────────

const CATEGORY_LABEL_MAP: Record<string, string> = {
  document_completeness:  "Document Completeness",
  vendor_integrity:       "Vendor Integrity",
  financial_accuracy:     "Financial Accuracy",
  approval_authorisation: "Approval & Authorisation",
  tax_compliance:         "Tax Compliance",
  project_costing:        "Project & Costing",
}

function ChecksTab({ invoice }: { invoice: InvoiceListItem }) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const checks = getMockCompliance(invoice.id) ?? []

  const grouped = checks.reduce((acc: Record<string, any[]>, c: any) => {
    const cat = c.category ?? "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  const passCount = checks.filter((c: any) => c.result === "pass").length
  const warnCount = checks.filter((c: any) => c.result === "warning").length
  const failCount = checks.filter((c: any) => c.result === "fail").length
  const total = checks.length || 1
  const score = Math.round((passCount / total) * 100)

  if (checks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No compliance checks</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Checks will appear after processing.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Score card */}
      <div className="bg-gradient-to-br from-[#f7f7fe] to-white border border-[#e0e1fd] rounded-[16px] p-5 mb-5">
        <div className="flex items-end gap-1 mb-2">
          <span className="text-[32px] font-bold text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>{score}</span>
          <span className="text-[16px] text-[#98a2b3] mb-1" style={{ fontFamily: "Inter" }}> / 100</span>
        </div>
        <div className="h-2 rounded-full bg-[#eaecf0] overflow-hidden mb-2">
          <div className="h-full rounded-full bg-[#5d5ef4] transition-all duration-500" style={{ width: `${score}%` }} />
        </div>
        <p className="text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
          {passCount} passed · {warnCount} warnings · {failCount} critical
        </p>
      </div>

      {Object.entries(grouped).map(([cat, catChecks]) => (
        <div key={cat} className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] border-b border-[#f2f4f7] pb-2 mb-2" style={{ fontFamily: "Inter" }}>
            {CATEGORY_LABEL_MAP[cat] ?? cat}
          </p>
          {(catChecks as any[]).map((check: any, i: number) => {
            const key = `${cat}-${i}`
            const isOpen = expanded[key]
            return (
              <div key={i}>
                <div
                  className="flex items-center gap-3 h-10 hover:bg-[#f9fafb] rounded-[8px] px-2 cursor-pointer transition-colors"
                  onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                >
                  {check.result === "pass"    && <CheckCircle2  size={16} className="text-green-500 shrink-0" />}
                  {check.result === "warning" && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                  {check.result === "fail"    && <XCircle       size={16} className="text-red-500 shrink-0" />}
                  {check.result === "na"      && <Minus         size={16} className="text-[#98a2b3] shrink-0" />}
                  <span className="text-[13px] text-[#344054] flex-1" style={{ fontFamily: "Inter" }}>{check.title}</span>
                  {check.result === "warning" && (
                    <span className="bg-amber-50 text-amber-600 rounded-[6px] px-2 py-0.5 text-[11px]" style={{ fontFamily: "Inter" }}>
                      Warning
                    </span>
                  )}
                  {check.result === "fail" && (
                    <span className="bg-red-50 text-red-600 rounded-[6px] px-2 py-0.5 text-[11px]" style={{ fontFamily: "Inter" }}>
                      Critical
                    </span>
                  )}
                  <ChevronDown size={14} className={cn("text-[#98a2b3] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                </div>
                {isOpen && (
                  <div className="ml-9 pb-3">
                    <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{check.description}</p>
                    {check.skill_citation && (
                      <p className="text-[10px] font-mono text-[#98a2b3]/60 mt-1" style={{ fontFamily: "Inter" }}>{check.skill_citation}</p>
                    )}
                    <button className="text-[11px] text-[#5d5ef4] hover:underline mt-1 cursor-pointer" style={{ fontFamily: "Inter" }}>Override →</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Approval Tab ─────────────────────────────────────────────────────────────

function ApprovalTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const steps: ApprovalStep[] = inv.approval_steps ?? []

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No approval route</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>Approval steps will appear once configured.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-[#f9fafb] border border-[#eaecf0] rounded-[10px] p-3 mb-5 flex items-center gap-2">
        <p className="text-[11px] text-[#667085] flex-1" style={{ fontFamily: "Inter" }}>
          Auto-determined by approvalMatrix.md@v1.3
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const circleClass =
            step.status === "completed" ? "bg-green-500 text-white" :
            step.status === "current"   ? "bg-[#5d5ef4] text-white" :
            step.status === "skipped"   ? "bg-[#f2f4f7]/40 text-[#98a2b3]/40" :
            "bg-[#f2f4f7] text-[#98a2b3] border border-[#eaecf0]"

          const badgeClass =
            step.status === "completed" ? "bg-green-50 text-green-600" :
            step.status === "current"   ? "bg-[#f7f7fe] text-[#5d5ef4] border border-[#c7c9fb]" :
            step.status === "skipped"   ? "bg-[#f2f4f7]/40 text-[#98a2b3]/40" :
            "bg-[#f2f4f7] text-[#98a2b3]"

          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold", circleClass)}>
                  {step.status === "completed" ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                {!isLast && <div className="w-px flex-1 bg-[#eaecf0] my-1" />}
              </div>
              <div className={cn("pb-5 min-h-[72px]", isLast && "pb-0")}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{step.title}</span>
                  <span className={cn("text-[11px] rounded-full px-2 py-0.5", badgeClass)} style={{ fontFamily: "Inter" }}>
                    {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </span>
                </div>
                {step.assignee && (
                  <p className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>{step.assignee}</p>
                )}
                {step.timestamp && (
                  <p className="text-[11px] text-[#98a2b3]" style={{ fontFamily: "Inter" }}>
                    {new Date(step.timestamp).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                {step.note && (
                  <p className="text-[12px] italic text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>"{step.note}"</p>
                )}
                {step.sla_at_risk && step.sla && (
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    <Clock size={11} />
                    <span className="text-[11px]" style={{ fontFamily: "Inter" }}>SLA: {step.sla}</span>
                  </div>
                )}
                {step.skip_reason && (
                  <p className="text-[11px] italic text-[#98a2b3]/60 mt-0.5" style={{ fontFamily: "Inter" }}>{step.skip_reason}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Emails Tab ───────────────────────────────────────────────────────────────

function EmailsTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const thread = (inv.email_thread ?? []) as any[]
  const [showAll, setShowAll] = React.useState(false)

  const finance = thread.filter((e: any) => e.tier === "finance")
  const context = thread.filter((e: any) => e.tier === "context")
  const toShow = showAll ? thread : [...finance, ...context]

  if (thread.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText size={40} className="text-[#d0d5dd] mb-3" />
        <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No emails</p>
        <p className="text-[13px] text-[#667085] mt-1" style={{ fontFamily: "Inter" }}>No email thread for this request.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowAll(false)}
          className={cn("text-[12px] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer",
            !showAll ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]")}
          style={{ fontFamily: "Inter" }}>
          Finance-relevant {finance.length}
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={cn("text-[12px] px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer",
            showAll ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]")}
          style={{ fontFamily: "Inter" }}>
          All emails {thread.length}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {toShow.map((email: any) => (
          <div key={email.id} className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{email.subject}</p>
                <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>
                  {email.from_name} · {new Date(email.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-[6px] shrink-0 ml-2",
                email.tier === "finance" ? "bg-[#eff8ff] text-[#175cd3]" : "bg-[#f2f4f7] text-[#667085]")}
                style={{ fontFamily: "Inter" }}>
                {email.tier === "finance" ? "Finance" : "Context"}
              </span>
            </div>
            <p className="text-[12px] text-[#667085] border-t border-[#f2f4f7] pt-2 leading-5" style={{ fontFamily: "Inter" }}>
              {email.body?.split("\n\n")[0]}
            </p>
            {email.attachments?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {email.attachments.map((att: string) => (
                  <div key={att} className="inline-flex items-center gap-1 bg-[#f2f4f7] border border-[#eaecf0] rounded-[6px] px-2 py-1">
                    <Paperclip size={10} className="text-[#5d5ef4]" />
                    <span className="text-[11px] text-[#5d5ef4]" style={{ fontFamily: "Inter" }}>{att}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PV Tab ───────────────────────────────────────────────────────────────────

function PVTab({ invoice }: { invoice: InvoiceListItem }) {
  const inv = invoice as any
  const pvs = inv.payment_vouchers ?? []
  const total = inv.total_myr ?? 0
  const paid = inv.amount_paid ?? 0
  const outstanding = inv.amount_outstanding ?? (total - paid)

  return (
    <div className="flex flex-col gap-4">
      {/* Balance summary — always shown */}
      <div className="bg-[#f9fafb] border border-[#eaecf0] rounded-[12px] p-4">
        <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7]">
          <span className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>Invoice total</span>
          <span className="text-[13px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>MYR {total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-[#f2f4f7]">
          <span className="text-[12px] text-[#667085]" style={{ fontFamily: "Inter" }}>Amount paid</span>
          <span className="text-[13px] font-medium text-green-600" style={{ fontFamily: "Inter" }}>MYR {paid.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-[12px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Outstanding</span>
          <span className={cn("text-[13px] font-bold", outstanding <= 0 ? "text-green-600" : "text-[#5d5ef4]")} style={{ fontFamily: "Inter" }}>
            {outstanding <= 0 ? "✓ Fully paid" : `MYR ${outstanding.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* PV list or empty */}
      {pvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="size-10 rounded-full bg-[#f2f4f7] flex items-center justify-center">
            <FileText size={18} className="text-[#98a2b3]" />
          </div>
          <p className="text-[13px] font-medium text-[#344054]" style={{ fontFamily: "Inter" }}>No payment vouchers yet</p>
          <p className="text-[12px] text-[#667085] text-center max-w-[180px]" style={{ fontFamily: "Inter" }}>
            A voucher will be auto-created once this request is fully approved
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pvs.map((pv: any, i: number) => (
            <div key={i} className="bg-white border border-[#eaecf0] rounded-[12px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>{pv.pv_number}</span>
                <span className="bg-green-50 text-green-600 text-[11px] rounded-[6px] px-2 py-0.5" style={{ fontFamily: "Inter" }}>{pv.status}</span>
              </div>
              <p className="text-[14px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>MYR {pv.amount.toFixed(2)}</p>
              <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>{pv.payment_method} · {pv.payment_date}</p>
              {pv.bank_name && (
                <p className="text-[11px] text-[#98a2b3] mt-0.5" style={{ fontFamily: "Inter" }}>{pv.bank_name} · {pv.bank_account_no}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  invoice, activeTab, onTabChange, onOpenPDF, onQuery, onApprove, onReject,
}: {
  invoice: InvoiceListItem
  activeTab: string
  onTabChange: (tab: string) => void
  onOpenPDF: () => void
  onQuery: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const cat = getCat(invoice.invoice_category)
  const CatIcon = cat.icon
  const inv = invoice as any
  const [confirmAction, setConfirmAction] = React.useState<"approve" | "reject" | null>(null)

  return (
    <div className="flex-1 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-4 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-[40px] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: cat.color + "18" }}>
            <CatIcon size={20} style={{ color: cat.color }} strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-[#344054] leading-6 truncate max-w-[260px]" style={{ fontFamily: "Inter" }}>
              {toTitleCase(invoice.vendor_name_raw ?? "")}
            </p>
            <p className="text-[12px] text-[#98a2b3] mt-0.5" style={{ fontFamily: "Inter" }}>
              {invoice.invoice_number}{inv.pr_number && ` · ${inv.pr_number}`}
              {inv.requestor_name && <span className="ml-1.5">· {inv.requestor_name}</span>}
            </p>
            {/* Summary row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {invoice.total_myr != null && (
                <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>
                  RM {invoice.total_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </span>
              )}
              <span className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                invoice.status === "paid"           && "bg-[#ecfdf3] text-[#027a48]",
                invoice.status === "approved"       && "bg-[#eef0fe] text-[#5d5ef4]",
                invoice.status === "pending_review" && "bg-[#f2f4f7] text-[#667085]",
                invoice.status === "rejected"       && "bg-[#fff1f0] text-[#b42318]",
              )} style={{ fontFamily: "Inter" }}>
                {invoice.status === "pending_review" ? "Pending" : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              {urgencyLabel(invoice) && (
                <span className={cn("text-[11px]", urgencyColor(invoice))} style={{ fontFamily: "Inter" }}>
                  {urgencyLabel(invoice)}
                </span>
              )}
              {inv.urgency_level && inv.urgency_level !== "normal" && (
                <span className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  inv.urgency_level === "critical" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                )} style={{ fontFamily: "Inter" }}>
                  {inv.urgency_level === "critical" ? "Critical" : "Urgent"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <button
            onClick={onQuery}
            className="bg-white border border-[#eaecf0] rounded-[10px] px-3 py-[6px] text-[13px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#f2f4f7] transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Query
          </button>
          <button
            onClick={() => setConfirmAction("reject")}
            className="bg-white border border-[#fda29b] rounded-[10px] p-[7px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-red-50 hover:border-[#f97066] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus:ring-offset-1 transition-colors cursor-pointer">
            <X size={16} className="text-[#b42318]" />
          </button>
          <button
            onClick={() => setConfirmAction("approve")}
            className="bg-[#5d5ef4] border border-[#5d5ef4] rounded-[10px] px-3 py-[6px] text-[13px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#4546d4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Approve
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div
        key={activeTab}
        className={cn(
          "flex-1 min-h-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-150",
          activeTab === "comments" ? "flex flex-col overflow-hidden" : "overflow-y-auto px-4 py-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#d0d5dd] [&::-webkit-scrollbar-thumb]:rounded-full"
        )}
      >
        {activeTab === "details"  && <DetailsTab  invoice={invoice} onTabChange={onTabChange} />}
        {activeTab === "comments" && <CommentsTab invoice={invoice} />}
        {activeTab === "checks"   && <ChecksTab   invoice={invoice} />}
        {activeTab === "approval" && <ApprovalTab invoice={invoice} />}
        {activeTab === "emails"   && <EmailsTab   invoice={invoice} />}
        {activeTab === "pv"       && <PVTab       invoice={invoice} />}
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "approve" ? "Approve this payment request?" : "Reject this payment request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "approve"
                ? `${invoice.invoice_number} will move to the next step in the approval flow.`
                : `${invoice.invoice_number} will be rejected and sent back to the requestor.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === "approve") onApprove()
                else if (confirmAction === "reject") onReject()
                setConfirmAction(null)
              }}
              className={confirmAction === "reject" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {confirmAction === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentRequestsPage() {
  const { l2Open, setL2 } = useSidebar()
  const metrics = getMockMetrics()

  const [invoices, setInvoices]         = React.useState(() => getMockInvoices())
  const [isLoading, setIsLoading]       = React.useState(true)
  const [channel, setChannel]           = React.useState<"form" | "email">("form")
  const [pinnedMetrics]                 = React.useState(DEFAULT_PINNED_METRICS)
  const [viewTab, setViewTab]           = React.useState<"all" | "dashboard" | "my_request" | "awaiting">("all")
  const [selected, setSelected]         = React.useState<InvoiceListItem | null>(null)
  const [activeTab, setActiveTab]       = React.useState("details")
  const [rightOpen, setRightOpen]       = React.useState(false)
  const [leftWidth, setLeftWidth]       = React.useState(320)
  const [rightWidth, setRightWidth]     = React.useState(440)
  const [middleCollapsed, setMiddleCollapsed] = React.useState(false)
  const [search, setSearch]             = React.useState("")
  const [statusFilter, setStatusFilter]       = React.useState<InvoiceStatus | "all">("all")
  const [dateSort, setDateSort]               = React.useState<"newest" | "oldest" | "due_soonest" | "due_latest">("newest")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevL2Open   = React.useRef(l2Open)

  // Simulate loading — replace setTimeout body with real fetch later
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const filteredInvoices = React.useMemo(() => {
    let list = invoices.filter(inv => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (inv.vendor_name_raw ?? "").toLowerCase().includes(q) ||
        (inv.invoice_number ?? "").toLowerCase().includes(q) ||
        ((inv as any).pr_number ?? "").toLowerCase().includes(q)
      )
    })
    if (dateSort === "oldest")      list = [...list].sort((a, b) => new Date(a.invoice_date ?? 0).getTime() - new Date(b.invoice_date ?? 0).getTime())
    if (dateSort === "newest")      list = [...list].sort((a, b) => new Date(b.invoice_date ?? 0).getTime() - new Date(a.invoice_date ?? 0).getTime())
    if (dateSort === "due_soonest") list = [...list].sort((a, b) => new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime())
    if (dateSort === "due_latest")  list = [...list].sort((a, b) => new Date(b.due_date ?? 0).getTime() - new Date(a.due_date ?? 0).getTime())
    return list
  }, [invoices, search, statusFilter, dateSort])

  // V7 — auto-select first invoice once loaded
  React.useEffect(() => {
    if (!isLoading && !selected && filteredInvoices.length > 0) {
      setSelected(filteredInvoices[0])
      setActiveTab("details")
    }
  }, [isLoading, filteredInvoices])

  // V9 — when sidebar re-expands (l2Open false→true), close PDF panel
  React.useEffect(() => {
    if (l2Open && !prevL2Open.current) {
      setRightOpen(false)
    }
    prevL2Open.current = l2Open
  }, [l2Open])

  const handleLeftDrag = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startW = leftWidth
    const onMove = (ev: MouseEvent) => {
      const maxW = (containerRef.current?.offsetWidth ?? 1200) - 400 - 4
      setLeftWidth(Math.max(280, Math.min(maxW, startW + ev.clientX - startX)))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const handleRightDrag = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startW = rightWidth
    const GUTTER_W = 60
    const onMove = (ev: MouseEvent) => {
      const containerW = containerRef.current?.offsetWidth ?? 1200
      const bWidth = middleCollapsed ? 0 : leftWidth
      const maxRightW = containerW - bWidth - GUTTER_W - 600 - 8
      setRightWidth(Math.max(320, Math.min(maxRightW, startW - (ev.clientX - startX))))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden pb-6" style={{ backgroundColor: "#f4f4f1" }}>

      {/* Header */}
      <div className="relative flex items-center px-4 pt-4 pb-0 shrink-0">
        {/* Left: title */}
        <div>
          <p className="text-[12px] font-light text-[#344054]" style={{ fontFamily: "Inter" }}>
            AP / Payment Requests
          </p>
          <h1 className="text-[30px] font-semibold leading-[38px] text-[#171b1d] mt-0" style={{ fontFamily: "Inter" }}>
            Payment Requests
          </h1>
        </div>

        {/* Centre: channel toggle — absolutely centred */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ChannelToggle channel={channel} onChange={setChannel} />
        </div>

        {/* Right: action buttons */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => toast("Coming soon", { description: "Export will be available in the next release." })}
            className="bg-white border border-[#d0d5dd] rounded-[12px] px-4 py-[10px] text-[14px] text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            Export ↓
          </button>
          <button
            onClick={() => toast("Coming soon", { description: "Create Request form is coming in the next release." })}
            className="bg-[#171b1d] border border-[#171b1d] rounded-[12px] px-4 py-[10px] text-[14px] text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#2a2f31] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171b1d]/40 focus:ring-offset-1 transition-colors cursor-pointer"
            style={{ fontFamily: "Inter" }}>
            + Create Request
          </button>
        </div>
      </div>

      {/* View tabs — separate section from header */}
      <div className="flex items-center gap-0.5 mt-2 px-4 flex-wrap shrink-0">
        {[
          { key: "all",        label: "All",         count: filteredInvoices.length },
          { key: "dashboard",  label: "Dashboard",   count: null },
          { key: "my_request", label: "My Request",  count: 2 },
          { key: "awaiting",   label: "Awaiting Me", count: 1 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewTab(tab.key as any)}
            className={cn(
              "px-3 py-2 rounded-[10px] text-[14px] transition-colors whitespace-nowrap cursor-pointer",
              viewTab === tab.key ? "bg-[#171b1d] text-white" : "text-[#667085] hover:text-[#344054]"
            )}
            style={{ fontFamily: "Inter" }}
          >
            {tab.label}
            {tab.count !== null && <span className="ml-1 text-[11px] opacity-70">{tab.count}</span>}
          </button>
        ))}
        <button
          onClick={() => toast("Coming soon", { description: "Custom views are coming in the next release." })}
          className="p-2 rounded-[8px] transition-colors cursor-pointer text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus-visible:ring-offset-1 ml-1"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Body */}
      {viewTab === "dashboard" && <APDashboard invoices={invoices} />}
      <div ref={containerRef} className={cn("flex flex-1 overflow-hidden mt-9 px-4 pb-4 gap-2", viewTab === "dashboard" && "hidden")}>

        {/* Left panel */}
        <div
          className={cn(
            "flex flex-col gap-3 overflow-hidden",
            middleCollapsed ? "flex-1" : "shrink-0"
          )}
          style={middleCollapsed ? undefined : { width: leftWidth }}
        >

          <>
              {/* Search + Filters — inline when wide, wraps when narrow */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search invoice number, vendor..."
                    className="w-[320px] bg-white border border-[#eaecf0] rounded-[10px] pl-9 pr-3 py-[7px] text-[14px] text-[#667085] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] focus:outline-none focus:border-[#5d5ef4] focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/20 transition-colors"
                    style={{ fontFamily: "Inter" }}
                  />
                </div>
                {/* Status filter dropdown */}
                <FilterDropdown
                  label={statusFilter === "all" ? "Status" : STATUS_LABEL[statusFilter as InvoiceStatus]}
                  active={statusFilter !== "all"}
                  heading="Filter by Status"
                  options={[
                    { value: "all",            label: "All Statuses" },
                    { value: "pending_review", label: "Pending" },
                    { value: "approved",       label: "Approved" },
                    { value: "rejected",       label: "Rejected" },
                    { value: "paid",           label: "Paid" },
                    { value: "overdue",        label: "Overdue" },
                    { value: "partially_paid", label: "Part Paid" },
                  ]}
                  selected={statusFilter}
                  onSelect={v => setStatusFilter(v as any)}
                />

                {/* Date sort dropdown */}
                <FilterDropdown
                  label={dateSort === "newest" ? "Datetime" : dateSort === "oldest" ? "Oldest First" : dateSort === "due_soonest" ? "Due: Soonest" : "Due: Latest"}
                  active={dateSort !== "newest"}
                  heading="Sort by Date"
                  options={[
                    { value: "newest",      label: "Newest First" },
                    { value: "oldest",      label: "Oldest First" },
                    { value: "due_soonest", label: "Due: Soonest" },
                    { value: "due_latest",  label: "Due: Latest" },
                  ]}
                  selected={dateSort}
                  onSelect={v => setDateSort(v as any)}
                />
                <button
                  onClick={() => {}}
                  className="shrink-0 p-2 rounded-[8px] transition-colors cursor-pointer text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus-visible:ring-offset-1"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              {/* Metrics — hidden */}

              {/* Request list */}
              <div className="flex flex-col bg-white border border-[#eaecf0] rounded-[12px] p-2 gap-2 flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3] px-2 pt-1 pb-0.5" style={{ fontFamily: "Inter" }}>
                  VENDOR / INVOICE
                </p>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-2 p-2">
                        <Skeleton className="size-[38px] rounded-[8px] shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <Skeleton className="h-3 w-3/4 rounded" />
                          <Skeleton className="h-2.5 w-1/2 rounded" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-[6px]" />
                      </div>
                    ))
                  : filteredInvoices.map(inv => (
                      <RequestListItem
                        key={inv.id}
                        inv={inv}
                        selected={selected?.id === inv.id}
                        expanded={middleCollapsed || leftWidth > 480}
                        onSelect={() => { setSelected(inv); setActiveTab("details") }}
                      />
                    ))
                }
                {filteredInvoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search size={24} className="text-[#d0d5dd] mb-2" />
                    <p className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>No requests found</p>
                    <p className="text-[12px] text-[#667085] mt-0.5" style={{ fontFamily: "Inter" }}>Try adjusting your filters</p>
                  </div>
                )}
              </div>
          </>

        </div>

        {/* Drag handle */}
        {!middleCollapsed && (
          <div
            className="w-1 cursor-col-resize hover:bg-[#5d5ef4]/20 active:bg-[#5d5ef4]/30 transition-colors shrink-0 rounded-full"
            onMouseDown={handleLeftDrag}
          />
        )}

        {/* Gutter — always shrink-0, never grows, sized to its own content only */}
        <TooltipProvider>
          <div className="flex flex-col items-center gap-2 shrink-0 self-start pt-2 mr-1 pb-2">
            {[
              { icon: FileText,      key: "details",  title: "Info" },
              { icon: ListChecks,    key: "checks",   title: "Checks" },
              { icon: UserCheck,     key: "approval", title: "Approval" },
              { icon: Mail,          key: "emails",   title: "Emails" },
              { icon: Receipt,       key: "pv",       title: "PV" },
              { icon: MessageSquare, key: "comments", title: "Activity" },
              { icon: Paperclip,     key: "pdf",      title: "Documents" },
            ].map(btn => {
              const BtnIcon = btn.icon
              const isActive = btn.key === "pdf"
                ? rightOpen
                : (activeTab === btn.key && selected !== null)
              return (
                <Tooltip key={btn.key}>
                  <TooltipTrigger
                    render={
                      <button
                        onClick={() => {
                          if (btn.key === "pdf") {
                            const opening = !rightOpen
                            setRightOpen(opening)
                            setL2(!opening)
                          } else {
                            if (!selected) return
                            setActiveTab(btn.key)
                            if (middleCollapsed) setMiddleCollapsed(false)
                          }
                        }}
                        className={cn(
                          "p-2 rounded-[8px] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1",
                          isActive ? "bg-[#e7e6e6] text-[#344054]" : "text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6]"
                        )}
                      />
                    }
                  >
                    <BtnIcon size={16} />
                  </TooltipTrigger>
                  <TooltipContent side="right">{btn.title}</TooltipContent>
                </Tooltip>
              )
            })}

            {/* Collapse toggle — last item, directly below Documents */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    onClick={() => setMiddleCollapsed(!middleCollapsed)}
                    className="p-2 rounded-[8px] transition-colors cursor-pointer text-[#667085] hover:text-[#344054] hover:bg-[#e7e6e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5d5ef4]/40 focus:ring-offset-1"
                  />
                }
              >
                {middleCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </TooltipTrigger>
              <TooltipContent side="right">{middleCollapsed ? "Expand panel" : "Collapse panel"}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* D — detail panel, slides in/out like a drawer */}
        <div className={cn(
          "overflow-hidden transition-[width] duration-200 flex flex-col h-full",
          middleCollapsed ? "w-0 pointer-events-none" : "flex-1 min-w-[600px]"
        )}>
          {!middleCollapsed && (selected ? (
            <DetailPanel
              invoice={selected}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenPDF={() => setRightOpen(true)}
              onQuery={() => setActiveTab("comments")}
              onApprove={() => {
                setInvoices(prev => prev.map(inv => inv.id === selected.id ? { ...inv, status: "approved" as InvoiceStatus } : inv))
                toast.success("Payment request approved", { description: `${selected.invoice_number} has been approved.` })
              }}
              onReject={() => {
                setInvoices(prev => prev.map(inv => inv.id === selected.id ? { ...inv, status: "rejected" as InvoiceStatus } : inv))
                toast.warning("Payment request rejected", { description: `${selected.invoice_number} has been rejected.` })
              }}
            />
          ) : (
            <div className="flex-1 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col items-center justify-center gap-4 p-8 h-full">
              <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No payment request selected illustration">
                <rect x="20" y="25" width="60" height="70" rx="6" fill="#f2f4f7" stroke="#eaecf0" strokeWidth="1.5"/>
                <rect x="28" y="15" width="60" height="70" rx="6" fill="#f7f7fe" stroke="#e0e1fd" strokeWidth="1.5"/>
                <rect x="36" y="5" width="60" height="70" rx="6" fill="white" stroke="#c7c9fb" strokeWidth="1.5"/>
                <rect x="46" y="20" width="36" height="3" rx="1.5" fill="#5d5ef4" opacity="0.6"/>
                <rect x="46" y="28" width="28" height="2" rx="1" fill="#eaecf0"/>
                <rect x="46" y="34" width="32" height="2" rx="1" fill="#eaecf0"/>
                <rect x="46" y="40" width="24" height="2" rx="1" fill="#eaecf0"/>
                <circle cx="88" cy="60" r="16" fill="white" stroke="#eaecf0" strokeWidth="1.5"/>
                <path d="M81 60 L86 65 L95 55" stroke="#5d5ef4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-center">
                <p className="text-[15px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>Select a request to review</p>
                <p className="text-[13px] text-[#98a2b3] mt-1 max-w-[200px]" style={{ fontFamily: "Inter" }}>Choose from the list to see details, compliance checks, and approval status</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#c0c5ce]" style={{ fontFamily: "Inter" }}>
                <span className="bg-[#f2f4f7] border border-[#eaecf0] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">↑</span>
                <span className="bg-[#f2f4f7] border border-[#eaecf0] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">↓</span>
                <span>to navigate</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel — PDF preview */}
        {rightOpen && (
            <div style={{ width: rightWidth }} className="relative shrink-0 bg-white border border-[#eaecf0] rounded-[20px] flex flex-col overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#5d5ef4]/20 active:bg-[#5d5ef4]/30 transition-colors z-10"
                onMouseDown={handleRightDrag}
              />
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaecf0] shrink-0">
              <span className="text-[13px] font-semibold text-[#344054]" style={{ fontFamily: "Inter" }}>PDF Preview</span>
              <div className="flex items-center gap-3">
                <select
                  className="text-[12px] border border-[#eaecf0] rounded-[8px] px-2 py-1 text-[#344054] cursor-pointer"
                  style={{ fontFamily: "Inter" }}>
                  <option>{selected?.invoice_number}.pdf</option>
                  <option>DO0626-0020.pdf</option>
                </select>
                <button
                  onClick={() => setRightOpen(false)}
                  className="p-1 rounded-[6px] hover:bg-[#f2f4f7] text-[#667085] cursor-pointer transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* PDF viewer area */}
            <div className="flex-1 flex flex-col items-center overflow-auto py-6 px-4" style={{ backgroundColor: "#3a3a3a" }}>
              {/* A4 document — ratio 1:1.414 */}
              <div className="bg-white w-full flex flex-col" style={{ maxWidth: 360, minHeight: 509, boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)" }}>
                {/* Vendor header */}
                <div className="flex items-start justify-between px-8 pt-7 pb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 bg-[#111] flex items-center justify-center rounded-[2px] shrink-0">
                      <span className="text-[8px] font-black text-white" style={{ fontFamily: "Georgia, serif" }}>
                        {(selected?.vendor_name_raw ?? "??").split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[7px] font-semibold tracking-[0.12em] text-[#555] uppercase" style={{ fontFamily: "Inter" }}>
                      {(selected?.vendor_name_raw ?? "").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="px-8 pb-5">
                  <p className="text-[18px] font-black text-[#111] tracking-tight leading-none" style={{ fontFamily: "Georgia, serif" }}>TAX INVOICE</p>
                </div>

                {/* Meta grid */}
                <div className="px-8 pb-4 flex gap-8">
                  <div>
                    <p className="text-[6.5px] text-[#999] uppercase tracking-[0.1em] mb-0.5" style={{ fontFamily: "Inter" }}>Invoice no.</p>
                    <p className="text-[9px] font-bold text-[#111]" style={{ fontFamily: "Inter" }}>{selected?.invoice_number ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[6.5px] text-[#999] uppercase tracking-[0.1em] mb-0.5" style={{ fontFamily: "Inter" }}>Date</p>
                    <p className="text-[9px] font-bold text-[#111]" style={{ fontFamily: "Inter" }}>
                      {selected?.created_at ? new Date(selected.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  {selected?.due_date && (
                    <div>
                      <p className="text-[6.5px] text-[#999] uppercase tracking-[0.1em] mb-0.5" style={{ fontFamily: "Inter" }}>Due date</p>
                      <p className="text-[9px] font-bold text-[#111]" style={{ fontFamily: "Inter" }}>
                        {new Date(selected.due_date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mx-8 border-t border-[#e8e8e8] mb-4" />

                {/* Bill to */}
                <div className="px-8 mb-5">
                  <p className="text-[6.5px] text-[#999] uppercase tracking-[0.1em] mb-1.5" style={{ fontFamily: "Inter" }}>Bill to</p>
                  <p className="text-[9px] font-bold text-[#111]" style={{ fontFamily: "Inter" }}>Jomie Invoice Sdn Bhd</p>
                  <p className="text-[8px] text-[#666] mt-0.5" style={{ fontFamily: "Inter" }}>Suite 12-5, Menara KL Eco City</p>
                  <p className="text-[8px] text-[#666]" style={{ fontFamily: "Inter" }}>Kuala Lumpur, 59200</p>
                </div>

                <div className="mx-8 border-t border-[#e8e8e8] mb-0" />

                {/* Line items header */}
                <div className="flex justify-between px-8 py-1.5 bg-[#f9f9f9]">
                  <p className="text-[6.5px] font-semibold text-[#888] uppercase tracking-[0.08em]" style={{ fontFamily: "Inter" }}>Description</p>
                  <p className="text-[6.5px] font-semibold text-[#888] uppercase tracking-[0.08em]" style={{ fontFamily: "Inter" }}>Amount</p>
                </div>
                <div className="mx-8 border-t border-[#e8e8e8]" />

                {/* Line item */}
                <div className="flex justify-between items-start px-8 py-3 border-b border-[#f0f0f0]">
                  <div>
                    <p className="text-[8.5px] text-[#111]" style={{ fontFamily: "Inter" }}>
                      {selected?.invoice_number ? `Services — ${selected.invoice_number}` : "Professional Services"}
                    </p>
                    <p className="text-[7px] text-[#999] mt-0.5" style={{ fontFamily: "Inter" }}>1 unit</p>
                  </div>
                  <p className="text-[8.5px] font-semibold text-[#111]" style={{ fontFamily: "Inter" }}>
                    {selected?.total_myr != null ? `RM ${selected.total_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                  </p>
                </div>

                {/* Totals */}
                <div className="px-8 pt-3 pb-4 flex flex-col items-end gap-1.5">
                  <div className="flex gap-8 items-center">
                    <p className="text-[7.5px] text-[#888]" style={{ fontFamily: "Inter" }}>Subtotal</p>
                    <p className="text-[7.5px] text-[#555] w-20 text-right" style={{ fontFamily: "Inter" }}>
                      {selected?.total_myr != null ? `RM ${selected.total_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                    </p>
                  </div>
                  <div className="flex gap-8 items-center">
                    <p className="text-[7.5px] text-[#888]" style={{ fontFamily: "Inter" }}>Tax (0%)</p>
                    <p className="text-[7.5px] text-[#555] w-20 text-right" style={{ fontFamily: "Inter" }}>RM 0.00</p>
                  </div>
                  <div className="h-px bg-[#e8e8e8] w-32 my-0.5" />
                  <div className="flex gap-8 items-center">
                    <p className="text-[8px] font-bold text-[#888] uppercase tracking-[0.06em]" style={{ fontFamily: "Inter" }}>Total due</p>
                    <p className="text-[11px] font-black text-[#111] w-20 text-right" style={{ fontFamily: "Inter" }}>
                      {selected?.total_myr != null ? `RM ${selected.total_myr.toLocaleString("en-MY", { minimumFractionDigits: 2 })}` : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Footer */}
                <div className="px-8 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 border border-[#d0d5dd] rounded-[3px] px-2 py-1">
                    <div className="size-1.5 rounded-full bg-[#10b981] shrink-0" />
                    <span className="text-[7px] font-semibold tracking-[0.1em] text-[#667085] uppercase" style={{ fontFamily: "Inter" }}>AI Extracted · 91%</span>
                  </div>
                  <p className="text-[7px] text-[#ccc]" style={{ fontFamily: "Inter" }}>Page 1 of 3</p>
                </div>
              </div>
              <p className="text-[10px] text-white/25 mt-4" style={{ fontFamily: "Inter" }}>
                Real PDF when connected to backend
              </p>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-[#eaecf0] shrink-0 text-[11px] text-[#667085]" style={{ fontFamily: "Inter" }}>
              <div className="flex items-center gap-2">
                <button className="cursor-pointer hover:text-[#344054]">−</button>
                <span>100%</span>
                <button className="cursor-pointer hover:text-[#344054]">+</button>
              </div>
              <div className="flex items-center gap-2">
                <span>Page 1 / 3</span>
                <button className="cursor-pointer hover:text-[#344054]">‹</button>
                <button className="cursor-pointer hover:text-[#344054]">›</button>
              </div>
              <div className="flex items-center gap-2">
                <button title="Download" className="cursor-pointer hover:text-[#344054]"><Download size={12} /></button>
                <button title="Print"    className="cursor-pointer hover:text-[#344054]"><Printer size={12} /></button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
