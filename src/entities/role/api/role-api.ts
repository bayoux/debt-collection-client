import { apiClient } from "@/shared/api/client"
import type { Role, RoleCreate } from "../model/types"

export const roleApi = {
  list: () => apiClient.get<Role[]>("/roles/"),

  create: (data: RoleCreate) => apiClient.post<Role>("/roles/", data),

  assignPermissions: (id: string, permission_ids: string[]) =>
    apiClient.put<void>(`/roles/${id}/permissions/`, { permission_ids }),
}
