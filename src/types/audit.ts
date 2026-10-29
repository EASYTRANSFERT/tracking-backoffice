export type AuditOutcome = 'SUCCESS' | 'FAILURE'

export interface AuditLogResponse {
  id: string
  tenantId: string
  /** Auteur ; absent pour une action du système. */
  actorId?: string | null
  deviceId?: string | null
  /** Code de l'action (ex. DEVICE_REVOKED) ; la liste n'est pas fermée. */
  action: string
  /** Ressource visée, sous la forme `type:identifiant`. */
  target: string
  outcome: AuditOutcome
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
  metadata?: Record<string, unknown> | null
  /** Identifiant de corrélation. */
  requestId?: string | null
  /** Heure de l'action. */
  at: string
}

export interface AuditLogListQuery {
  cursor?: string
  /** 200 au maximum. */
  limit?: number
  /** Opérateur uniquement : refusé (403) à l'administrateur. */
  tenantId?: string
  /** Bornes incluses, ISO 8601. */
  from?: string
  to?: string
  action?: string
  target?: string
  actorId?: string
  outcome?: AuditOutcome
}

export interface AuditLogPageResponse {
  items: AuditLogResponse[]
  nextCursor?: string | null
}
