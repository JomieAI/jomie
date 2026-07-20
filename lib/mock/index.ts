import type { InvoiceDetailResponse, InvoiceListItem } from "@/lib/api"
import { MOCK_INVOICE_DETAILS } from "./ap-invoices"
import { MOCK_PROJECTS } from "./projects"
import { MOCK_CONTRACTS } from "./contracts"
import { MOCK_COMPLIANCE } from "./compliance"

export type { MockProject } from "./projects"
export type { MockContract, MockMilestone } from "./contracts"
export type { ComplianceCheck, ComplianceResult, ComplianceCategory } from "./compliance"

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true"
}

export function getMockInvoices(): InvoiceListItem[] {
  return MOCK_INVOICE_DETAILS as InvoiceListItem[]
}

export function getMockInvoiceDetail(id: string): InvoiceDetailResponse | undefined {
  return MOCK_INVOICE_DETAILS.find(inv => inv.id === id)
}

export function getMockProjects() {
  return MOCK_PROJECTS
}

export function getMockProject(id: string) {
  return MOCK_PROJECTS.find(p => p.id === id)
}

export function getMockContracts() {
  return MOCK_CONTRACTS
}

export function getMockContractByRef(contract_ref: string) {
  return MOCK_CONTRACTS.find(c => c.contract_ref === contract_ref)
}

export function getMockCompliance(invoice_id: string) {
  return MOCK_COMPLIANCE[invoice_id] ?? []
}

export const DEFAULT_PINNED_METRICS = ['due_this_week', 'awaiting_action']

export function getMockMetrics() {
  return {
    due_this_week:   { key: 'due_this_week',   label: 'Due This Week',      value: 1,              color: 'gradient' as const },
    due_two_weeks:   { key: 'due_two_weeks',   label: 'Due 2 Weeks',        value: 12,             color: 'default'  as const },
    overdue:         { key: 'overdue',         label: 'Overdue',            value: 1,              color: 'red'      as const },
    awaiting_action: { key: 'awaiting_action', label: 'Awaiting Me',        value: 2,              color: 'amber'    as const },
    high_risk:       { key: 'high_risk',       label: 'High Risk',          value: 1,              color: 'amber'    as const },
    total_pending:   { key: 'total_pending',   label: 'Total Pending',      value: 'RM 33,414.80', color: 'default'  as const },
  }
}
