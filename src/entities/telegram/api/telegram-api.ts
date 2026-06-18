import { apiClient } from "@/shared/api/client"
import type {
  TelegramSendMessage,
  TelegramSendNotification,
  TelegramSendAlert,
  TelegramResult,
} from "../model/types"

export const telegramApi = {
  send: (data: TelegramSendMessage) =>
    apiClient.post<TelegramResult>("/telegram/send/", data),

  notify: (data: TelegramSendNotification) =>
    apiClient.post<TelegramResult>("/telegram/notify/", data),

  alert: (data: TelegramSendAlert) =>
    apiClient.post<TelegramResult>("/telegram/alert/", data),
}
