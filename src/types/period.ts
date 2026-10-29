/** OPEN → IN_VALIDATION (automatique à la fin de la période) → CLOSING → CLOSED, immuable. */
export type ApiPeriodState = 'OPEN' | 'IN_VALIDATION' | 'CLOSING' | 'CLOSED' | (string & {})

/** Sessions qui empêchent la clôture (RG-17). */
export interface PeriodBlockers {
  /** Sessions en attente de décision : sorties manquantes, absences, anomalies, pointages hors planning. */
  pending: number
  /** Sessions encore ouvertes : l'agent n'a pas pointé sa sortie. */
  open: number
  /** Premières sessions concernées, pour aller les traiter. */
  sampleSessionIds: string[]
}

/** Blocages constatés au dernier échec de clôture. */
export interface PeriodClosureFailure extends PeriodBlockers {
  at: string
}

export interface PeriodResponse {
  id: string
  /** Première journée, AAAA-MM-JJ dans le fuseau de l'entreprise, incluse. */
  from: string
  /** Dernière journée, incluse. */
  to: string
  state: ApiPeriodState
  createdBy: string
  validationStartedAt?: string
  reopenedAt?: string
  reopenedBy?: string
  reopenReason?: string
  closeRequestedBy?: string
  closeRequestedAt?: string
  /** Clôture forcée malgré des sessions à valider. */
  forced?: boolean
  forceReason?: string
  /** Sessions figées sans décision par une clôture forcée, hors des totaux. */
  unvalidatedCount?: number
  lastClosureFailure?: PeriodClosureFailure
  closedBy?: string
  closedAt?: string
  rulesVersion?: string
  /** Blocages de clôture à l'instant, rendus par GET /periods/{id} tant que la période n'est pas close. */
  blockers?: PeriodBlockers
}

export interface CreatePeriodRequest {
  from: string
  to: string
}

export interface ReopenPeriodRequest {
  /** Obligatoire, 500 caractères au maximum. */
  reason: string
}

export interface ClosePeriodRequest {
  /** Clôture malgré des sessions à valider : elles sont figées et restent hors des totaux. */
  force?: boolean
  /** Obligatoire pour une clôture forcée, 500 caractères au maximum. */
  reason?: string
}

export interface PeriodListQuery {
  cursor?: string
  limit?: number
  state?: ApiPeriodState
}

export interface PeriodPageResponse {
  items: PeriodResponse[]
  nextCursor?: string | null
}
