export type NotificationChannel = "whatsapp" | "sms" | "telegram" | "email"
export type NotificationLogStatus = "queued" | "sent" | "delivered" | "failed"
export type ScheduledTaskStatus = "pending" | "sent" | "cancelled" | "failed"

export interface NotificationTemplate {
  id: string
  name: string
  channel: NotificationChannel
  subject: string | null
  body: string
  language: string
}

export interface NotificationTemplateCreate {
  name: string
  channel: NotificationChannel
  subject?: string
  body: string
  language?: string
}

export interface NotificationLog {
  id: string
  debt_case_id: string
  template: NotificationTemplate
  channel: NotificationChannel
  status: NotificationLogStatus
  sent_at: string | null
  response_raw: string | null
}

export interface ScheduledTask {
  id: string
  debt_case_id: string
  template: NotificationTemplate
  channel: NotificationChannel
  scheduled_at: string
  task_status: ScheduledTaskStatus
}

export interface ScheduledTaskCreate {
  debt_case_id: string
  template_id: string
  channel: NotificationChannel
  scheduled_at: string
}
