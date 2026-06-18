import type { Debtor } from "@/entities/debtor/model/types"
import type { User } from "@/entities/user/model/types"

export type DebtCaseStatus = "new" | "in_progress" | "promised" | "closed" | "overdue"

export interface DebtCase {
  id: string
  debtor: Debtor
  assigned_agent: User | null
  amount: number
  due_date: string
  dpd: number
  status: DebtCaseStatus
  created_at: string
}

export interface DebtCaseCreate {
  debtor_id: string
  assigned_agent_id?: string | null
  amount: number
  due_date: string
}

export interface DebtCaseUpdate {
  assigned_agent_id?: string | null
  status?: DebtCaseStatus
}

export interface DPDSnapshot {
  id: string
  debt_case_id: string
  dpd_value: number
  snapshot_date: string
}

export interface ImportDebtCaseError {
  row: number
  field: string
  message: string
}

export interface ImportDebtCaseResult {
  imported: number
  skipped: number
  errors: ImportDebtCaseError[]
}
