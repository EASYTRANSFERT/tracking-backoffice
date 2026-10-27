export type ApiSessionStatus = 'OPEN' | 'CLOSED' | 'MISSING_EXIT' | 'ABSENCE'
export type ApiSessionValidation = 'PENDING' | 'AUTO_VALIDATED' | 'VALIDATED' | 'REJECTED' | 'CORRECTED'

/** Anomalies d'une session : elles la qualifient sans jamais bloquer le pointage. */
export type SessionFlag =
  | 'OUT_OF_GEOFENCE'
  | 'LOW_ACCURACY'
  | 'MOCK_POSITION'
  | 'CLOCK_DRIFT'
  | 'SUSPECT_SPEED'
  | 'INTEGRITY_FAILED'
  | 'SIGNATURE_INVALID'
  | 'QR_MISMATCH'
  | 'PROXY_POINTING'

/** Session de travail (GET /sessions) ; à ne pas confondre avec la session d'authentification. */
export interface WorkSessionResponse {
  id: string
  userId: string
  siteId: string
  /** Créneau de rattachement. */
  assignmentId?: string
  /** Heure de confiance de l'entrée. */
  inAt: string
  outAt?: string
  /** Durée travaillée, en minutes. */
  minutes?: number
  /** Retard retenu, en minutes. */
  lateMin?: number
  /** Départ anticipé, en minutes. */
  earlyMin?: number
  flags: SessionFlag[]
  status: ApiSessionStatus
  validation: ApiSessionValidation
  validatedBy?: string
  validatedAt?: string
  rulesVersion: string
  periodId?: string
}

export interface SessionListQuery {
  cursor?: string
  /** 200 au maximum. */
  limit?: number
  userId?: string
  siteId?: string
  status?: ApiSessionStatus
  validation?: ApiSessionValidation
  /** Borne basse sur l'entrée, incluse. */
  from?: string
  /** Borne haute sur l'entrée, exclue. */
  to?: string
  /** Seulement les sessions portant au moins une anomalie. */
  flagged?: boolean
}

export interface SessionPageResponse {
  items: WorkSessionResponse[]
  nextCursor?: string | null
}

export interface SessionSelfieResponse {
  /** URL signée, valable 5 minutes. */
  url: string
  /** Validité, en secondes. */
  expiresIn: number
}

export interface DecideSessionRequest {
  decision: 'VALIDATE' | 'REJECT'
  /** Obligatoire pour un rejet (3 à 500 caractères) : c'est le texte que l'agent lira. */
  reason?: string
}
