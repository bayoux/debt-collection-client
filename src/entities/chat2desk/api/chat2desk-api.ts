import { apiClient } from "@/shared/api/client"
import type { Chat2DeskSendMessage, Chat2DeskResult } from "../model/types"

export const chat2deskApi = {
  send: (data: Chat2DeskSendMessage) =>
    apiClient.post<Chat2DeskResult>("/chat2desk/send/", data),

  test: () =>
    apiClient.post<{ success: boolean; message: string }>("/chat2desk/test/", {}),
}
