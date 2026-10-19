export type ApiSiteStatus = 'ACTIVE' | 'ARCHIVED'

/** Point GeoJSON : [longitude, latitude]. */
export interface SiteLocation {
  type: 'Point'
  coordinates: [number, number]
}

export interface SiteResponse {
  id: string
  missionId: string
  teamId?: string
  name: string
  address?: string
  locationDescription?: string
  location: SiteLocation
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
  location: SiteLocation
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
