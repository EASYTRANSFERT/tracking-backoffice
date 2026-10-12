export type ApiUserRole =
  | 'OPERATOR'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'TEAM_LEAD'
  | 'AGENT'

export type ApiUserStatus =
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'DISABLED'

export interface UserResponse {
  id: string
  matricule: string
  names: string
  email?: string
  phone: string
  roles: ApiUserRole[]
  teamId?: string
  status: ApiUserStatus
  createdAt: string
  updatedAt: string
}
