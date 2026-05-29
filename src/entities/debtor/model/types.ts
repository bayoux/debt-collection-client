export interface Debtor {
  id: string
  full_name: string
  phone: string
  email: string | null
  whatsapp_number: string | null
  telegram_id: string | null
}

export interface DebtorCreate {
  full_name: string
  phone: string
  email?: string
  whatsapp_number?: string
  telegram_id?: string
}

export interface DebtorUpdate {
  full_name?: string
  phone?: string
  email?: string
  whatsapp_number?: string
  telegram_id?: string
}
