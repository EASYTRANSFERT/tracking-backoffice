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

export interface CreateUserRequest {
  matricule: string
  names: string
  email?: string
  phone: string
  role: ApiUserRole
  teamId?: string
  password: string
}

export interface CreateTenantUserRequest extends CreateUserRequest {
  role: 'ADMIN'
}

export type UpdateUserRequest = Omit<CreateUserRequest, 'password'>

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UserListQuery {
  cursor?: string
  limit?: number
  status?: ApiUserStatus
  role?: ApiUserRole
  teamId?: string
}

export interface UserPageResponse {
  items: UserResponse[]
  nextCursor?: string | null
}
