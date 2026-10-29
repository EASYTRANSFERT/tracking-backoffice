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

export interface DeviceReplacementRequest {
  /** Repris dans le journal d'audit ; « Remplacement de téléphone » par défaut. */
  reason?: string
}

/** Réponse de POST /users/{id}/device-replacement. */
export interface DeviceReplacementResponse {
  userId: string
  /** PENDING_ACTIVATION : le porteur peut activer son nouveau téléphone. */
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'DISABLED' | (string & {})
  /** Vide si le compte n'avait plus d'appareil actif (téléphone perdu déjà révoqué, par exemple). */
  revokedDeviceIds: string[]
}
