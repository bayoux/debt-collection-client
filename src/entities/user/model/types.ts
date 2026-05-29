import type { Role } from "@/entities/role/model/types"

export interface User {
  id: string
  username: string
  email: string
  roles: Role[]
  created_at: string
}

export interface UserCreate {
  username: string
  email: string
  password: string
  role_ids?: string[]
}

export interface UserUpdate {
  email?: string
  password?: string
}
