export type ApiSiteStatus = 'ACTIVE' | 'ARCHIVED'

export interface SiteCoordinate {
  latitude: number
  longitude: number
}

export interface SiteResponse {
  id: string
  missionId: string
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
  missionId: string
  teamId?: string
}

export type UpdateSiteRequest = Partial<Omit<CreateSiteRequest, 'missionId'>>

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
