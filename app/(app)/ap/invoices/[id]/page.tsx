import { InvoiceDetailClient } from "./InvoiceDetailClient"

export async function generateStaticParams() {
  return [
    { id: "00000000-0000-0000-0000-000000000001" },
    { id: "00000000-0000-0000-0000-000000000002" },
    { id: "00000000-0000-0000-0000-000000000003" },
    { id: "00000000-0000-0000-0000-000000000004" },
    // legacy real-data UUID kept for backwards compat
    { id: "081878a6-2942-40c4-959d-7b8c86f376bc" },
  ]
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InvoiceDetailClient id={id} />
}
