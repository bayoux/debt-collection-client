import type { NotificationChannel } from "@/entities/notification/model/types"

export interface IntegrationConfig {
  id: string
  channel: NotificationChannel
  provider: string
  webhook_url: string | null
  is_active: boolean
}

export interface IntegrationConfigCreate {
  channel: NotificationChannel
  provider: string
  api_key: string
  webhook_url?: string
  is_active?: boolean
}
