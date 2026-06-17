export interface Chat2DeskSendMessage {
  phone: string
  text: string
}

export interface Chat2DeskResult {
  success: boolean
  message_id?: string
}

export interface BroadcastResultItem {
  debtCaseId: string
  logId: string
  status: string
}

export interface BroadcastResult {
  total: number
  sent: number
  failed: number
  results: BroadcastResultItem[]
}
