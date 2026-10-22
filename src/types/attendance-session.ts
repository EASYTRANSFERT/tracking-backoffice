/*
 * Sessions de pointage (une arrivée et son départ), d'après le DAT KBA-TRC-DAT-001 :
 * collection `sessions`, endpoints GET /sessions et POST /sessions/{id}/decision.
 * Le contrat exact n'était pas encore publié dans le Swagger : les noms de filtres,
 * d'états et d'anomalies marqués « à confirmer » sont à aligner sur l'API.
 */

/** État du pointage. À confirmer. */
export type ApiSessionStatus = 'OPEN' | 'CLOSED' | 'MISSING_EXIT'

/** Validation du pointage. AUTO_VALIDATED : conforme, validé sans intervention (RG-16). À confirmer. */
export type ApiSessionValidation = 'PENDING' | 'AUTO_VALIDATED' | 'VALIDATED' | 'REJECTED'

export interface AttendanceSessionResponse {
  id: string
  userId: string
  siteId: string
  /** Créneau auquel le pointage est rattaché, absent pour un pointage hors créneau. */
  assignmentId?: string | null
  inAt: string
  outAt?: string | null
  minutes?: number | null
  lateMin?: number | null
  earlyMin?: number | null
  /** Anomalies relevées (hors zone, précision GPS…). À confirmer. */
  flags: string[]
  status: ApiSessionStatus
  validation: ApiSessionValidation
  decisionReason?: string | null
}

export interface AttendanceSessionListQuery {
  cursor?: string
  limit?: number
  siteId?: string
  userId?: string
  /** Bornes sur l'heure d'arrivée (ISO 8601). À confirmer. */
  from?: string
  to?: string
}

export interface AttendanceSessionPageResponse {
  items: AttendanceSessionResponse[]
  nextCursor?: string | null
}

export interface AttendanceSessionDecisionRequest {
  decision: 'VALIDATE' | 'REJECT'
  /** Obligatoire pour un rejet. */
  reason?: string
  /** Heure de sortie corrigée, obligatoire pour valider une sortie manquante. */
  correctedOutAt?: string
}
