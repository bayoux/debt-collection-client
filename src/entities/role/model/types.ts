export interface Permission {
  id: string
  codename: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface RoleCreate {
  name: string
  description?: string
}
