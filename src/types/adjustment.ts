import type { ApiSessionStatus, ApiSessionValidation } from '@/types/attendance'

/** État d'une session, avant ou après une régularisation. */
export interface AdjustedValues {
  inAt: string
  outAt?: string
  /** Durée travaillée, en minutes. */
  minutes?: number
  lateMin?: number
  status: ApiSessionStatus
  validation: ApiSessionValidation
}

/** Régularisation d'une session (GET /sessions/{id}/adjustments). Elle ne se modifie jamais. */
export interface AdjustmentResponse {
  id: string
  sessionId: string
  periodId?: string
  before: AdjustedValues
  after: AdjustedValues
  reason: string
  authorId: string
  createdAt: string
}

/** Corps de POST /sessions/{id}/adjustments : seuls les champs corrigés sont envoyés, le motif est obligatoire. */
export interface CreateAdjustmentRequest {
  inAt?: string
  outAt?: string
  /** 0 à 1440 ; 0 lève le retard. */
  lateMin?: number
  /** 500 caractères au maximum. */
  reason: string
}
