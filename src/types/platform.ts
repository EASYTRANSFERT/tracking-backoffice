export interface CursorPage<T> {
  items: T[]
  nextCursor?: string | null
}

export interface RetentionSettings {
  selfieDays: number
  dataYears: number
  anonymizeAfterYears: number
  exportDays: number
}

export interface TenantSettings {
  radiusM: number
  lateToleranceMin: number
  maxAccuracyM: number
  missingExitAfterMin: number
  checksPerSession: number
  retention: RetentionSettings
}

export interface TenantPlan {
  offerId: string
  code: string
  name: string
  maxAgents: number
  assignedAt: string
}

export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

export interface TenantResponse {
  id: string
  name: string
  country: string
  timezone: string
  status: TenantStatus
  plan?: TenantPlan | null
  contractFrom: string
  contractTo?: string | null
  activatedAt?: string | null
  suspendedAt?: string | null
  suspensionReason?: string | null
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

export interface CreateTenantRequest {
  name: string
  country: string
  timezone?: string
  contractFrom: string
  contractTo?: string
  offerId?: string
  settings?: TenantSettings
}

export type UpdateTenantRequest = Partial<
  Omit<CreateTenantRequest, 'offerId'>
>

export interface SuspendTenantRequest {
  reason: string
}

export interface AssignTenantPlanRequest {
  offerId: string
}

export type OfferStatusResponse = 'ACTIVE' | 'INACTIVE'

export interface OfferResponse {
  id: string
  code: string
  name: string
  description: string
  maxAgents: number
  status: OfferStatusResponse
  createdAt: string
  updatedAt: string
}

export interface CreateOfferRequest {
  name: string
  description: string
  maxAgents: number
}

export interface CursorQuery {
  cursor?: string
  limit?: number
  status?: TenantStatus
  search?: string
}
