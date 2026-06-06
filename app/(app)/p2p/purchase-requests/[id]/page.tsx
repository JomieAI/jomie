import PRDetailView from "./pr-detail-view"

export function generateStaticParams() {
  return [
    // Seed PRs (hardcoded data)
    { id: "PR-0089" }, { id: "PR-0088" }, { id: "PR-0087" },
    { id: "PR-0086" }, { id: "PR-0085" }, { id: "PR-0084" },
    // Pre-rendered slots for user-created PRs (data comes from localStorage client-side)
    { id: "PR-0090" }, { id: "PR-0091" }, { id: "PR-0092" },
    { id: "PR-0093" }, { id: "PR-0094" }, { id: "PR-0095" },
    { id: "PR-0096" }, { id: "PR-0097" }, { id: "PR-0098" },
    { id: "PR-0099" },
  ]
}

export default function PRDetailPage() {
  return <PRDetailView />
}
