export interface TelegramSendMessage {
  chat_id: string
  text: string
}

export interface TelegramSendNotification {
  chat_id: string
  title: string
  body: string
}

export interface TelegramSendAlert {
  chat_id: string
  message: string
}

export interface TelegramResult {
  ok: boolean
}
