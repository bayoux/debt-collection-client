import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type { User, UserCreate, UserUpdate } from "../model/types"

export const userApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    apiClient.get<Pagination<User>>("/users/", { params }),

  get: (id: string) => apiClient.get<User>(`/users/${id}/`),

  create: (data: UserCreate) => apiClient.post<User>("/users/", data),

  update: (id: string, data: UserUpdate) =>
    apiClient.patch<User>(`/users/${id}/`, data),

  delete: (id: string) => apiClient.delete<void>(`/users/${id}/`),

  assignRoles: (id: string, role_ids: string[]) =>
    apiClient.put<void>(`/users/${id}/roles/`, { role_ids }),
}
