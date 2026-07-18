"use client"

import * as React from "react"
import { FileText, Mail, MessageSquare, Sparkles } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMockInvoiceDetail, isMockMode } from "@/lib/mock"
import { getInvoice } from "@/lib/api"
import {
  InvoiceDetail, mapApiResponse, FieldsTab, EmailThreadTab, CommentsTab, DEMO_DETAILS,
} from "@/app/(app)/ap/invoices/[id]/InvoiceDetailClient"

interface Props {
  invoiceId: string
}

export function InvoiceDetailPanel({ invoiceId }: Props) {
  const [invoice, setInvoice] = React.useState<InvoiceDetail | null>(null)
  const [loading, setLoading]   = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("fields")

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (isMockMode()) {
      const raw = getMockInvoiceDetail(invoiceId)
      if (!cancelled) {
        setInvoice(raw ? mapApiResponse(raw) : (DEMO_DETAILS[invoiceId] ?? null))
        setLoading(false)
      }
      return () => { cancelled = true }
    }

    getInvoice(invoiceId)
      .then(raw => { if (!cancelled) setInvoice(mapApiResponse(raw)) })
      .catch(() => { if (!cancelled) setInvoice(DEMO_DETAILS[invoiceId] ?? null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [invoiceId])

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center h-32">
        <Sparkles size={18} className="text-brand/30 animate-pulse" strokeWidth={2}/>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="shrink-0 h-9 bg-muted">
          <TabsTrigger value="fields" className="text-[12px] gap-1">
            <FileText size={11} strokeWidth={2}/> Fields
          </TabsTrigger>
          <TabsTrigger value="email" className="text-[12px] gap-1">
            <Mail size={11} strokeWidth={2}/> Email
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-[12px] gap-1">
            <MessageSquare size={11} strokeWidth={2}/> Comments
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto jomie-scrollbar pt-4">
          {activeTab === "fields"   && <FieldsTab invoice={invoice}/>}
          {activeTab === "email"    && <EmailThreadTab invoice={invoice}/>}
          {activeTab === "comments" && <CommentsTab/>}
        </div>
      </Tabs>
    </div>
  )
}
