import { apiClient } from "@/shared/api/client"
import type { IntegrationConfig, IntegrationConfigCreate } from "../model/types"

export const integrationApi = {
  list: () => apiClient.get<IntegrationConfig[]>("/integrations/"),

  create: (data: IntegrationConfigCreate) =>
    apiClient.post<IntegrationConfig>("/integrations/", data),

  update: (id: string, data: Partial<IntegrationConfigCreate>) =>
    apiClient.patch<IntegrationConfig>(`/integrations/${id}/`, data),

  delete: (id: string) => apiClient.delete<void>(`/integrations/${id}/`),

  // API contract: POST /integrations/{id}/test/ — no request body
  test: (id: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/integrations/${id}/test/`,
      {}
    ),
}
