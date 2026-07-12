import { ApprovalClient } from "./ApprovalClient"

export async function generateStaticParams() {
  return [
    { id: "00000000-0000-0000-0000-000000000001" },
    { id: "00000000-0000-0000-0000-000000000002" },
    { id: "00000000-0000-0000-0000-000000000003" },
    { id: "00000000-0000-0000-0000-000000000004" },
    { id: "081878a6-2942-40c4-959d-7b8c86f376bc" },
  ]
}

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApprovalClient id={id} />
}
