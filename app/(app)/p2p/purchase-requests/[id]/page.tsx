import PRDetailView from "./pr-detail-view"

export function generateStaticParams() {
  return [
    { id: "PR-0089" },
    { id: "PR-0088" },
    { id: "PR-0087" },
    { id: "PR-0086" },
    { id: "PR-0085" },
    { id: "PR-0084" },
  ]
}

export default function PRDetailPage() {
  return <PRDetailView />
}
