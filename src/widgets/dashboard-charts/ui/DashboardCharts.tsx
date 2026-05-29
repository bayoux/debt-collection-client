import { CampaignBarChart } from "./CampaignBarChart"
import { CasesDonutChart } from "./CasesDonutChart"

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <CampaignBarChart />
      </div>
      <CasesDonutChart />
    </div>
  )
}
