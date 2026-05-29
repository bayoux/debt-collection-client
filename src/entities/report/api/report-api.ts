import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type { DashboardSummary, CampaignReport, AgentActivityLog } from "../model/types"

export const reportApi = {
  summary: () => apiClient.get<DashboardSummary>("/reports/summary/"),

  campaign: (params: {
    date_from: string
    date_to: string
    channel?: string
  }) =>
    apiClient.get<CampaignReport[]>("/reports/campaign/", { params }),

  agentActivity: (params?: {
    page?: number
    page_size?: number
    agent_id?: string
    date_from?: string
    date_to?: string
  }) =>
    apiClient.get<Pagination<AgentActivityLog>>("/reports/agent-activity/", {
      params,
    }),
}
