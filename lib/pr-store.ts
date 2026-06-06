/**
 * Jomie PR Store — localStorage persistence
 * Option A: user-created PRs prepend to seed data across all screens
 */

export type PRStatus     = "pending" | "review" | "approved" | "draft"
export type Phase        = "A1" | "A2" | "B" | "C" | "D" | "F" | "G"
export type PurchaseType = "trade" | "capex" | "service" | "recurring" | "nontrade"

/** Shape stored per user-created request */
export interface StoredPR {
  id:                string
  title:             string
  sub:               string       // short subtitle shown in table
  message:           string       // original user message → justification in detail view
  requester:         string
  requesterInitials: string
  date:              string
  dept:              string
  amount:            string
  budget:            string
  status:            PRStatus
  phase:             Phase
  purchaseType:      PurchaseType
  aiFlags:           number
  createdAt:         number       // ms timestamp — stamped by the caller, not Date.now() here
}

const LS_KEY = "jomie_prs_v1"

export function getSavedPRs(): StoredPR[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as StoredPR[]) : []
  } catch {
    return []
  }
}

export function savePR(pr: StoredPR): void {
  if (typeof window === "undefined") return
  const list = getSavedPRs()
  const idx  = list.findIndex(p => p.id === pr.id)
  if (idx >= 0) list[idx] = pr
  else          list.unshift(pr)
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)) } catch { /* storage quota */ }
}

/** Returns the next PR ID — e.g. "PR-0090", "PR-0091" */
export function buildNextPRId(savedCount: number): string {
  return `PR-${String(90 + savedCount).padStart(4, "0")}`
}

/** Seed PR IDs that exist as statically pre-rendered pages */
export const SEED_IDS = ["PR-0089", "PR-0088", "PR-0087", "PR-0086", "PR-0085", "PR-0084"]
