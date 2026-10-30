export type ApiMissionStatus = 'PLANNED' | 'OPEN' | 'CLOSED'

export interface MissionResponse {
  id: string
  code: string
  name: string
  description?: string
  startAt?: string
  endAt?: string
  status: ApiMissionStatus
  /** Superviseur de la mission. Absent du Swagger au 23/10 : facultatif tant que l'API ne le garantit pas. */
  supervisorUserId?: string | null
  openedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMissionRequest {
  name: string
  /** Compte actif portant le rôle SUPERVISOR. Obligatoire. */
  supervisorUserId: string
  description?: string
  startAt?: string
  endAt?: string
}

export type UpdateMissionRequest = Partial<CreateMissionRequest>

export interface AssignMissionSupervisorRequest {
  userId: string
}

export interface MissionListQuery {
  cursor?: string
  limit?: number
  status?: ApiMissionStatus
}

export interface MissionPageResponse {
  items: MissionResponse[]
  nextCursor?: string | null
}

/** Compteurs d'une période, d'un agent ou d'un site (durées en minutes). */
export interface TotalsCounters {
  sessionsCount: number
  workedMinutes: number
  lateMinutes: number
  absencesCount: number
}

export interface MissionOverviewQuery {
  /** AAAA-MM-JJ ; 90 jours par défaut côté API, un an au maximum (sinon 400 VALIDATION_FAILED). */
  from?: string
  to?: string
}

/** Un site de la mission, aujourd'hui. Sans teamId : aucune équipe affectée. */
export interface MissionOverviewSite {
  siteId: string
  name: string
  status: 'ACTIVE' | 'ARCHIVED'
  teamId?: string
  teamName?: string
  todaySessions: number
  /** Sessions ouvertes en ce moment. */
  todayOpen: number
  /** Sessions d'aujourd'hui à décider. */
  todayPendingValidation: number
  todayAbsences: number
}

export interface MissionOverviewPeriod {
  periodId: string
  from: string
  to: string
  state: string
  /** false : totaux provisoires, une validation ou une régularisation peut encore les changer. */
  final: boolean
  /** Totaux de l'équipe entière, sites d'autres missions compris. */
  totals: TotalsCounters & { agents: number; daysWorked: number }
  /** Limité aux sites de cette mission. */
  /** Le nom du site est dans `sites` de la réponse. */
  bySite: (TotalsCounters & { siteId: string; agents: number })[]
  pending: number
  open: number
}

export interface MissionOverviewTeam {
  teamId: string
  teamName: string
  sites: string[]
  periods: MissionOverviewPeriod[]
}

export interface MissionOverviewResponse {
  mission?: { missionId: string; code: string; name: string; status: string }
  /** Fenêtre retenue, bornes incluses. */
  window?: { from: string; to: string }
  sites: MissionOverviewSite[]
  teams: MissionOverviewTeam[]
}
