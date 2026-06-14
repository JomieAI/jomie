import PRDetailView from "./pr-detail-view"

export function generateStaticParams() {
  // Seed PRs
  const seed = ["PR-0084","PR-0085","PR-0086","PR-0087","PR-0088","PR-0089"]
  // Dynamic slots: PR-0090 → PR-0299
  const dynamic = Array.from({ length: 210 }, (_, i) =>
    ({ id: `PR-${String(90 + i).padStart(4, "0")}` })
  )
  return [...seed.map(id => ({ id })), ...dynamic]
}

export default function PRDetailPage() {
  return <PRDetailView />
}
