import { apiClient } from "@/shared/api/client"
import type { NikitaSendMessage, NikitaResult } from "../model/types"

export const nikitaApi = {
  send: (data: NikitaSendMessage) =>
    apiClient.post<NikitaResult>("/nikita/send/", data),

  test: () =>
    apiClient.post<{ success: boolean; message: string }>("/nikita/test/", {}),
}
