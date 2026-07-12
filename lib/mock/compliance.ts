export type ComplianceResult = "pass" | "warning" | "fail" | "not_applicable"
export type ComplianceCategory =
  | "document_completeness"
  | "vendor_integrity"
  | "financial_accuracy"
  | "tax_compliance"
  | "project_costing"

export interface ComplianceCheck {
  check_name: string
  result: ComplianceResult
  category: ComplianceCategory
  title: string
  description?: string
  severity: "info" | "warning" | "error"
  skill_citation?: string
}

// Keyed by invoice id for O(1) lookup
export const MOCK_COMPLIANCE: Record<string, ComplianceCheck[]> = {
  // NA0626-0023 — pending_review NETASSIST VAPT final invoice
  "00000000-0000-0000-0000-000000000001": [
    {
      check_name: "invoice_received",
      result: "pass",
      category: "document_completeness",
      title: "Invoice received",
      severity: "info",
    },
    {
      check_name: "do_received",
      result: "pass",
      category: "document_completeness",
      title: "Delivery order received",
      severity: "info",
    },
    {
      check_name: "do_signed_returned",
      result: "warning",
      category: "document_completeness",
      title: "DO sign-off pending",
      description: "Delivery order DO0626-0020 not yet signed and returned to vendor. Required for their audit purposes.",
      severity: "warning",
    },
    {
      check_name: "quotation_linked",
      result: "pass",
      category: "document_completeness",
      title: "Contract on file",
      description: "Quotation NASB-Q-TT-20260423 signed 28 Apr 2026. Total contract value RM 16,329.60.",
      skill_citation: "jomie-internal-controls-baseline.md@v1.2",
      severity: "info",
    },
    {
      check_name: "bank_details_match",
      result: "pass",
      category: "vendor_integrity",
      title: "Bank details verified",
      description: "Email bank account 122200010052904 matches vendor master record.",
      severity: "info",
    },
    {
      check_name: "myinvois_validated",
      result: "pass",
      category: "vendor_integrity",
      title: "MyInvois validated",
      description: "LHDN QR code present. This is a valid e-invoice.",
      skill_citation: "jomie-sst-baseline.md@v1.5",
      severity: "info",
    },
    {
      check_name: "duplicate_check",
      result: "warning",
      category: "financial_accuracy",
      title: "Possible duplicate — same amount",
      description: "Invoice total RM 8,164.80 matches prior invoice NA0526-0010 from same vendor. Expected — both are 50% milestones of the same contract.",
      skill_citation: "duplicateDetection.md@v1.1",
      severity: "warning",
    },
    {
      check_name: "amount_matches_milestone",
      result: "pass",
      category: "financial_accuracy",
      title: "Amount matches contract milestone",
      description: "RM 8,164.80 matches the final 50% milestone (M2+M3 combined) of contract RM 16,329.60.",
      severity: "info",
    },
    {
      check_name: "sst_treatment_correct",
      result: "warning",
      category: "tax_compliance",
      title: "SST not claimable",
      description: "Service Tax RM 604.80 is a blocked input — not claimable as input tax for professional IT services.",
      skill_citation: "jomie-sst-baseline.md@v1.5 · SST18:S38",
      severity: "warning",
    },
    {
      check_name: "milestone_evidence_found",
      result: "pass",
      category: "project_costing",
      title: "Milestone evidence on file",
      description: "M2: VAPT First Assessment delivery confirmed. M3: VAPT Final Assessment delivery confirmed.",
      severity: "info",
    },
  ],
}
