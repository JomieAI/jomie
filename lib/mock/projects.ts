export interface MockProject {
  id: string
  tenant_id: string
  project_code: string
  name: string
  description: string | null
  budget_amount: number
  status: string
  committed_amount: number
  actual_amount: number
  created_at: string
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "00000000-0000-0000-0001-000000000001",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    project_code: "PROJ-IT-2026",
    name: "IT Infrastructure Upgrade FY2026",
    description: "Full office network and server refresh for Bangsar office",
    budget_amount: 50000.00,
    status: "active",
    committed_amount: 42400.00,
    actual_amount: 21200.00,
    created_at: "2026-01-15T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000002",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    project_code: "PROJ-SEC-2026",
    name: "VAPT Security Assessment 2026",
    description: "Vulnerability Assessment & Penetration Testing — AGMO CSPS SPA",
    budget_amount: 20000.00,
    status: "active",
    committed_amount: 16329.60,
    actual_amount: 8164.80,
    created_at: "2026-04-01T08:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000003",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    project_code: "PROJ-REN-2025",
    name: "Office Renovation Phase 2",
    description: "Pantry and meeting room renovation",
    budget_amount: 80000.00,
    status: "completed",
    committed_amount: 78500.00,
    actual_amount: 78500.00,
    created_at: "2025-11-01T08:00:00Z",
  },
]
