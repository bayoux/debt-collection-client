import type { User } from "@/entities/user/model/types"
import type { NotificationChannel } from "@/entities/notification/model/types"

export interface DashboardSummary {
  total_open_cases: number
  total_overdue_cases: number
  total_amount_outstanding: number
  ptp_pending: number
  ptp_kept_this_month: number
  notifications_sent_today: number
  collection_rate_percent: number
}

export interface CampaignReport {
  report_date: string
  channel: NotificationChannel | "all"
  total_sent: number
  total_delivered: number
  total_ptp: number
  collected_amount: number
}

export interface AgentActivityLog {
  id: string
  agent: User
  debt_case_id: string
  action_type: string
  performed_at: string
  note: string | null
}
