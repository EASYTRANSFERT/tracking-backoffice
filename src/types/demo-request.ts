export type DemoRequestStatus = 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'CLOSED'

/** Une modification de la demande : chaque champ changé, avec sa valeur avant et après. */
export interface DemoRequestChangeResponse {
  at: string
  /** Opérateur auteur de la modification. */
  actorId?: string
  changes: Record<string, { from: unknown; to: unknown }>
}

export interface DemoRequestResponse {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  message?: string
  status: DemoRequestStatus
  /** Date de la démonstration convenue avec le prospect. */
  demoAt?: string
  /** Notes internes, jamais montrées au prospect. */
  notes?: string
  history: DemoRequestChangeResponse[]
  createdAt: string
  updatedAt: string
}

export interface DemoRequestListQuery {
  cursor?: string
  /** 200 au maximum. */
  limit?: number
  status?: DemoRequestStatus
  /** Recherche dans le nom, l'entreprise et l'adresse ; 100 caractères au maximum. */
  q?: string
}

export interface DemoRequestPageResponse {
  items: DemoRequestResponse[]
  nextCursor: string | null
}

/** `null` efface un champ facultatif. */
export interface UpdateDemoRequestRequest {
  fullName?: string
  company?: string
  email?: string
  phone?: string | null
  message?: string | null
  status?: DemoRequestStatus
  demoAt?: string | null
  notes?: string | null
}
