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
  code: string
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
