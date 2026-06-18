import { DashboardWelcome } from "@/widgets/dashboard-welcome/ui/DashboardWelcome"
import { DashboardSummary } from "@/widgets/dashboard-summary/ui/DashboardSummary"
import { DashboardCharts } from "@/widgets/dashboard-charts/ui/DashboardCharts"

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardWelcome />
      <DashboardSummary />
      <DashboardCharts />
    </div>
  )
}
