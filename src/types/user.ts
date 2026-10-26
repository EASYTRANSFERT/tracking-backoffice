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

/** Ligne refusée par l'import des matricules (rien n'est écrit tant qu'il en reste une). */
export interface MatriculeImportRejectedRow {
  /** Numéro de ligne dans le fichier, en-tête compris. */
  rowNumber: number
  reason: 'PHONE_UNREADABLE' | 'PHONE_UNKNOWN' | 'PHONE_DUPLICATED_IN_FILE' | 'MATRICULE_EMPTY' | 'MATRICULE_DUPLICATED_IN_FILE' | 'MATRICULE_ALREADY_USED' | string
  name: string
  phone: string
  matricule: string
}

/** Avertissement : l'import s'applique quand même (c'est le téléphone qui fait foi). */
export interface MatriculeImportWarning {
  rowNumber: number
  reason: 'NAME_DIFFERS' | string
  phone: string
}

/** Rapport de POST /users/matricules/import, en simulation (dryRun) comme en application. */
export interface MatriculeImportReport {
  read: number
  matched: number
  unchanged: number
  rejected: MatriculeImportRejectedRow[]
  warnings: MatriculeImportWarning[]
  /** Faux en simulation, ou si le fichier a été refusé en bloc. */
  applied: boolean
}
