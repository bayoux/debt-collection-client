import type { User } from "@/entities/user/model/types"

export type PTPStatus = "pending" | "kept" | "broken"

export interface PTPRecord {
  id: string
  debt_case_id: string
  agent: User
  promise_date: string
  promised_amount: number
  status: PTPStatus
  created_at: string
}

export interface PTPCreate {
  debt_case_id: string
  promise_date: string
  promised_amount: number
}
