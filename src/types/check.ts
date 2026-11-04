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

/** Selfie pris par le chef d'équipe en réponse au contrôle. */
export interface CheckSelfieResponse {
  /** URL signée, valable 5 minutes. */
  url: string
  expiresIn: number
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

export type ApiCheckScheduleMode = 'ONCE' | 'DAILY' | 'INTERVAL'

/**
 * Programme de contrôles : lance tout seul le même contrôle d'équipe que POST /checks/trigger.
 * ONCE : `date` à `time` ; DAILY : chaque jour à `time` ; INTERVAL : toutes les `everyMin` minutes
 * depuis le début du créneau planifié de l'équipe. Heures dans le fuseau de l'entreprise.
 */
export interface CheckScheduleResponse {
  id: string
  name: string
  mode: ApiCheckScheduleMode
  /** AAAA-MM-JJ (ONCE). */
  date?: string
  /** HH:mm (ONCE, DAILY). */
  time?: string
  /** 15 à 720 (INTERVAL). */
  everyMin?: number
  /** Bornes incluses (DAILY, INTERVAL) ; absentes : dès aujourd'hui, sans fin. */
  startDate?: string
  endDate?: string
  /** Vide : toutes les équipes. */
  teamIds: string[]
  /** Faux : programme suspendu. */
  active: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCheckScheduleRequest {
  name: string
  mode: ApiCheckScheduleMode
  date?: string
  time?: string
  everyMin?: number
  startDate?: string
  endDate?: string
  teamIds?: string[]
  active?: boolean
}

/** Changer de mode efface les champs de l'ancien mode. */
export type UpdateCheckScheduleRequest = Partial<CreateCheckScheduleRequest>
