import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type { Debtor, DebtorCreate, DebtorUpdate } from "../model/types"

export const debtorApi = {
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    apiClient.get<Pagination<Debtor>>("/debtors/", { params }),

  get: (id: string) => apiClient.get<Debtor>(`/debtors/${id}/`),

  create: (data: DebtorCreate) => apiClient.post<Debtor>("/debtors/", data),

  update: (id: string, data: DebtorUpdate) =>
    apiClient.patch<Debtor>(`/debtors/${id}/`, data),

  delete: (id: string) => apiClient.delete<void>(`/debtors/${id}/`),

  import: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiClient.post<{ task_id: string; message: string }>(
      "/debtors/import/",
      form
    )
  },
}
