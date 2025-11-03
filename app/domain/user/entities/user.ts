export type UserRole = "admin" | "staff" | "viewer"

export interface User {
  id: string
  oidcSub: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
