export interface MockMilestone {
  id: string
  sequence: number
  description: string
  percentage: number
  amount: number
  status: string
  invoice_id: string
  evidence?: string
}

export interface MockContract {
  id: string
  contract_ref: string
  contract_type: string
  vendor_id: string
  our_signed_by: string
  our_signed_at: string
  vendor_contact_name: string
  total_value: number
  amount_invoiced: number
  amount_paid: number
  is_milestone_based: boolean
  milestone_structure: string
  status: string
  milestones: MockMilestone[]
}

export const MOCK_CONTRACTS: MockContract[] = [
  {
    id: "contract-001",
    contract_ref: "NASB-Q-TT-20260423-AGMO-CSPS-SPA-VAPT-001v0.1",
    contract_type: "quotation",
    vendor_id: "v-001",
    our_signed_by: "Thony Chwa",
    our_signed_at: "2026-04-28",
    vendor_contact_name: "Thomas Tay",
    total_value: 16329.60,
    amount_invoiced: 16329.60,
    amount_paid: 8164.80,
    is_milestone_based: true,
    milestone_structure: "50% on PO / 40% initial report / 10% final report",
    status: "active",
    milestones: [
      {
        id: "m-001",
        sequence: 1,
        description: "50% upon issuance of Purchase Order",
        percentage: 50,
        amount: 8164.80,
        status: "paid",
        invoice_id: "00000000-0000-0000-0000-000000000002",
      },
      {
        id: "m-002",
        sequence: 2,
        description: "40% upon completion of initial report",
        percentage: 40,
        amount: 6531.84,
        status: "invoiced",
        invoice_id: "00000000-0000-0000-0000-000000000001",
        evidence: "VAPT First Assessment Reports email",
      },
      {
        id: "m-003",
        sequence: 3,
        description: "10% upon completion of final report",
        percentage: 10,
        amount: 1632.96,
        status: "invoiced",
        invoice_id: "00000000-0000-0000-0000-000000000001",
        evidence: "VAPT Final Assessment Reports email",
      },
    ],
  },
]
