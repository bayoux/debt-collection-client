export interface NikitaSendMessage {
  phone: string
  text: string
}

export interface NikitaResult {
  status: "sent" | "failed"
  message_id: string | null
  error: string | null
}
