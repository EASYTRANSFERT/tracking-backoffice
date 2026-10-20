/** Valeurs connues ; l'API peut en renvoyer d'autres, affichées telles quelles. */
export type ApiDeviceStatus = 'PENDING_ENROLLMENT' | 'ACTIVE' | 'REVOKED' | (string & {})

export type DevicePlatform = 'android' | 'ios' | (string & {})

export interface DeviceResponse {
  id: string
  userId: string
  /** Empreinte tronquée de la clé publique de l'appareil. */
  publicKeyHash?: string
  platform: DevicePlatform
  model?: string
  osVersion?: string
  appVersion?: string
  status: ApiDeviceStatus
  /** Dernier verdict d'intégrité (ex. PLAY_STRONG). */
  lastIntegrityVerdict?: string | null
  lastIntegrityAt?: string | null
  hasKeyAttestation?: boolean
  enrolledAt?: string | null
  lastSeenAt?: string | null
  revokedAt?: string | null
  revokedReason?: string | null
}

export interface DeviceListQuery {
  cursor?: string
  /** 200 au maximum. */
  limit?: number
  userId?: string
  status?: ApiDeviceStatus
}

export interface DevicePageResponse {
  items: DeviceResponse[]
  nextCursor?: string | null
}

export interface RevokeDeviceRequest {
  reason: string
}
