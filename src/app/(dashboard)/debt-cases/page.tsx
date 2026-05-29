import { Suspense } from "react"
import { DebtCasesPage } from "@/views/debt-cases/ui/DebtCasesPage"
import { Skeleton } from "@/shared/components/ui/skeleton"

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DebtCasesPage />
    </Suspense>
  )
}
