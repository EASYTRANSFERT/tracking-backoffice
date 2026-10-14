export type ApiMissionStatus = 'PLANNED' | 'OPEN' | 'CLOSED'

export interface MissionResponse {
  id: string
  code: string
  name: string
  description?: string
  startAt?: string
  endAt?: string
  status: ApiMissionStatus
  openedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMissionRequest {
  code: string
  name: string
  description?: string
  startAt?: string
  endAt?: string
}

export type UpdateMissionRequest = Partial<CreateMissionRequest>

export interface MissionListQuery {
  cursor?: string
  limit?: number
  status?: ApiMissionStatus
}

export interface MissionPageResponse {
  items: MissionResponse[]
  nextCursor?: string | null
}
