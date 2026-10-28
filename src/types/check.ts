export type ApiCheckResult = 'PENDING' | 'ANSWERED' | 'MISSED' | 'ABSENT'

/** Contrôle de présence d'un agent : le chef d'équipe y répond avec un selfie, ou le déclare absent. */
export interface CheckResponse {
  id: string
  /** Contrôle d'équipe qui regroupe les agents contrôlés ensemble. */
  campaignId?: string
  teamId?: string
  sessionId: string
  userId: string
  dueAt: string
  /** Au-delà, le contrôle est manqué. */
  deadlineAt: string
  result: ApiCheckResult
  /** Heure de confiance de la réponse. */
  answeredAt?: string
  eventId?: string
  /** Compte qui a répondu. */
  attestedBy?: string
  remote: boolean
  /** Auteur du déclenchement. */
  triggeredBy?: string
}

export interface TriggerCheckRequest {
  teamId: string
}

/** Un contrôle par agent de l'équipe en session ouverte. */
export interface CheckCampaignResponse {
  campaignId: string
  teamId: string
  dueAt: string
  deadlineAt: string
  checks: CheckResponse[]
}

export interface CheckListQuery {
  cursor?: string
  /** 200 au maximum. */
  limit?: number
  teamId?: string
  campaignId?: string
  userId?: string
  result?: ApiCheckResult
  /** Borne basse sur dueAt, incluse. */
  from?: string
  /** Borne haute sur dueAt, exclue. */
  to?: string
}

export interface CheckPageResponse {
  items: CheckResponse[]
  nextCursor?: string | null
}
