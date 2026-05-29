import { Suspense } from "react"
import { DebtorsPage } from "@/views/debtors/ui/DebtorsPage"
import { Skeleton } from "@/shared/components/ui/skeleton"

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DebtorsPage />
    </Suspense>
  )
}
