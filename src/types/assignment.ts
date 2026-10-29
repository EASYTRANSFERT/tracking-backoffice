export type ApiAssignmentStatus = 'PLANNED' | 'CANCELLED'

/** Vacation : prise et fin de poste, ISO 8601. La fin peut tomber le lendemain (poste de nuit). */
export interface AssignmentSlot {
  startAt: string
  endAt: string
}

export interface AssignmentResponse {
  id: string
  userId: string
  siteId: string
  startAt: string
  endAt: string
  /** Journée de la prise de poste, AAAA-MM-JJ dans le fuseau de l'entreprise. */
  day: string
  durationMin: number
  recurrenceId?: string
  status: ApiAssignmentStatus
  createdAt: string
  updatedAt: string
}

export interface CreateAssignmentsRequest {
  siteId: string
  /** Membres actifs de l'équipe du site, 200 au maximum. */
  userIds: string[]
  /** 50 vacations au maximum, posées pour chacun des agents. */
  slots: AssignmentSlot[]
}

export interface UpdateAssignmentRequest {
  startAt?: string
  endAt?: string
  siteId?: string
}

export interface AssignmentListQuery {
  cursor?: string
  limit?: number
  userId?: string
  siteId?: string
  status?: ApiAssignmentStatus
  day?: string
  from?: string
  to?: string
}

export interface AssignmentPageResponse {
  items: AssignmentResponse[]
  nextCursor?: string | null
}

export interface AssignmentBatchResponse {
  count: number
  items: AssignmentResponse[]
}

/** Ligne refusée par l'import des affectations (rien n'est écrit tant qu'il en reste une). */
export interface AssignmentImportRejection {
  /** Numéro de ligne dans le fichier, en-tête compris. */
  rowNumber: number
  reason: 'MATRICULE_EMPTY' | 'MATRICULE_UNKNOWN' | 'SITE_EMPTY' | 'SITE_UNKNOWN' | 'SITE_AMBIGUOUS' | 'SITE_ARCHIVED' | 'SITE_WITHOUT_TEAM' | 'MISSION_NOT_OPEN' | 'DATE_UNREADABLE' | 'START_UNREADABLE' | 'END_UNREADABLE' | 'SLOT_TOO_SHORT' | 'SLOT_TOO_LONG' | 'AGENT_INVALID' | 'AGENT_WITHOUT_TEAM' | 'AGENT_NOT_IN_SITE_TEAM' | 'OVERLAP_IN_FILE' | 'OVERLAP_EXISTING' | (string & {})
  /** Valeurs telles qu'écrites dans le fichier. */
  matricule: string
  site: string
  date: string
  start: string
  end: string
  /** OVERLAP_IN_FILE : ligne du fichier avec laquelle celle-ci se recouvre. */
  conflictingRowNumber?: number
  /** OVERLAP_EXISTING : créneau déjà planifié qu'elle recouvre. */
  conflictingAssignmentId?: string
}

/** Rapport de POST /assignments/import, en simulation (dryRun) comme en application. */
export interface AssignmentImportReport {
  /** Lignes de données lues, en-tête exclu. */
  read: number
  /** Créneaux créés, ou qui le seraient en simulation. */
  planned: number
  rejected: AssignmentImportRejection[]
  /** Prise de poste du premier créneau retenu. */
  from?: string
  /** Fin du dernier créneau retenu. */
  to?: string
  /** Faux en simulation, ou si le fichier a été refusé en bloc. */
  applied: boolean
}
