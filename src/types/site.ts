export type ApiSiteStatus = 'ACTIVE' | 'ARCHIVED'

export interface SiteCoordinate {
  latitude: number
  longitude: number
}

export interface SiteResponse {
  id: string
  /** Facultative : un site peut exister sans mission et y être rattaché plus tard. */
  missionId?: string | null
  teamId?: string
  name: string
  address?: string
  locationDescription?: string
  /** Contour du site, dans l'ordre du tracé. */
  area: SiteCoordinate[]
  /** Tolérance autour du contour, en mètres. */
  radiusM: number
  managerId?: string
  status: ApiSiteStatus
  qrRotatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSiteRequest {
  name: string
  address?: string
  locationDescription?: string
  /** 3 à 50 points délimitant une surface. */
  area: SiteCoordinate[]
  toleranceRadius?: number
  responsibleId: string
  missionId?: string
  teamId?: string
}

/** missionId : rattache à une mission un site qui n'en a pas encore. */
export type UpdateSiteRequest = Partial<CreateSiteRequest>

export interface SiteListQuery {
  cursor?: string
  limit?: number
  status?: ApiSiteStatus
  missionId?: string
  teamId?: string
  managerId?: string
}

export interface SitePageResponse {
  items: SiteResponse[]
  nextCursor?: string | null
}

export interface SiteQrCodeResponse {
  siteId: string
  /** Image PNG en URI de données. */
  qrCode: string
  rotatedAt: string
}
