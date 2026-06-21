import { ApprovalClient } from "./ApprovalClient"

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ApprovalClient id={id} />
}
