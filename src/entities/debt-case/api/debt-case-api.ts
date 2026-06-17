import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type {
  DebtCase,
  DebtCaseCreate,
  DebtCaseUpdate,
  DPDSnapshot,
  DebtCaseStatus,
} from "../model/types"

export const debtCaseApi = {
  list: (params?: {
    page?: number
    page_size?: number
    status?: DebtCaseStatus
    dpd_min?: number
    dpd_max?: number
    assigned_agent_id?: string
    search?: string
    ordering?: string
    debtor_id?: string
  }) =>
    apiClient.get<Pagination<DebtCase>>("/debt-cases/", { params }),

  get: (id: string) => apiClient.get<DebtCase>(`/debt-cases/${id}/`),

  create: (data: DebtCaseCreate) =>
    apiClient.post<DebtCase>("/debt-cases/", data),

  update: (id: string, data: DebtCaseUpdate) =>
    apiClient.patch<DebtCase>(`/debt-cases/${id}/`, data),

  delete: (id: string) => apiClient.delete<void>(`/debt-cases/${id}/`),

  dpdHistory: (id: string) =>
    apiClient.get<DPDSnapshot[]>(`/debt-cases/${id}/dpd-history/`),
}
