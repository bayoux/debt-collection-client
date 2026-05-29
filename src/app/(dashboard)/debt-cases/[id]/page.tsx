import { DebtCaseDetailPage } from "@/views/debt-cases/ui/DebtCaseDetailPage"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DebtCaseDetailPage id={id} />
}
