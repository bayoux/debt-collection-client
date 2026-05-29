import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type { PTPRecord, PTPCreate, PTPStatus } from "../model/types"

export const ptpApi = {
  list: (params?: {
    page?: number
    page_size?: number
    status?: PTPStatus
    debt_case_id?: string
  }) =>
    apiClient.get<Pagination<PTPRecord>>("/ptp/", { params }),

  create: (data: PTPCreate) => apiClient.post<PTPRecord>("/ptp/", data),

  updateStatus: (
    id: string,
    status: Exclude<PTPStatus, "pending">,
    note?: string
  ) =>
    apiClient.patch<PTPRecord>(`/ptp/${id}/status/`, {
      status,
      ...(note !== undefined && { note }),
    }),
}
