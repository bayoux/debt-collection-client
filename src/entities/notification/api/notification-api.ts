import { apiClient } from "@/shared/api/client"
import type { Pagination } from "@/shared/types/pagination"
import type {
  NotificationTemplate,
  NotificationTemplateCreate,
  NotificationLog,
  ScheduledTask,
  ScheduledTaskCreate,
  NotificationChannel,
  NotificationLogStatus,
  ScheduledTaskStatus,
} from "../model/types"

export const notificationApi = {
  templates: {
    list: (params?: { channel?: NotificationChannel }) =>
      apiClient.get<NotificationTemplate[]>("/notification-templates/", {
        params,
      }),

    get: (id: string) =>
      apiClient.get<NotificationTemplate>(`/notification-templates/${id}/`),

    create: (data: NotificationTemplateCreate) =>
      apiClient.post<NotificationTemplate>("/notification-templates/", data),

    update: (id: string, data: NotificationTemplateCreate) =>
      apiClient.patch<NotificationTemplate>(
        `/notification-templates/${id}/`,
        data
      ),

    delete: (id: string) =>
      apiClient.delete<void>(`/notification-templates/${id}/`),
  },

  send: (data: {
    debt_case_id: string
    template_id: string
    channel: NotificationChannel
  }) =>
    apiClient.post<{ log_id: string; status: string }>(
      "/notifications/send/",
      data
    ),

  logs: {
    list: (params?: {
      page?: number
      page_size?: number
      debt_case_id?: string
      channel?: NotificationChannel
      status?: NotificationLogStatus
    }) =>
      apiClient.get<Pagination<NotificationLog>>("/notifications/logs/", {
        params,
      }),
  },

  scheduler: {
    list: (params?: {
      page?: number
      page_size?: number
      task_status?: ScheduledTaskStatus
    }) =>
      apiClient.get<Pagination<ScheduledTask>>("/scheduled-tasks/", { params }),

    create: (data: ScheduledTaskCreate) =>
      apiClient.post<ScheduledTask>("/scheduled-tasks/", data),

    // API contract: POST /scheduled-tasks/{id}/cancel/ — no request body required
    cancel: (id: string) =>
      apiClient.post<{ status: string }>(`/scheduled-tasks/${id}/cancel/`, {}),
  },
}
