export type ExportFormat = 'XLSX' | 'PDF'

/** PENDING puis RUNNING, enfin READY (téléchargeable) ou FAILED (voir errorCode). */
export type ExportStatus = 'PENDING' | 'RUNNING' | 'READY' | 'FAILED' | (string & {})

/** Corps de POST /exports/assignments : mêmes filtres que GET /assignments. */
export interface AssignmentExportRequest {
  format: ExportFormat
  userId?: string
  siteId?: string
  status?: 'PLANNED' | 'CANCELLED'
  /** Journée du planning, AAAA-MM-JJ dans le fuseau de l'entreprise. */
  day?: string
  /** Créneaux commençant à partir de cet instant, ISO 8601. */
  from?: string
  /** Créneaux commençant avant cet instant, ISO 8601 (exclu). */
  to?: string
}

export interface ExportResponse {
  id: string
  type: 'ASSIGNMENTS' | (string & {})
  format: ExportFormat | 'JSON' | 'CSV'
  status: ExportStatus
  /** Filtres de la demande, tels que reçus. */
  params: Record<string, unknown>
  rowCount?: number
  byteLength?: number
  filename?: string
  /** Si FAILED : EXPORT_ROW_LIMIT_EXCEEDED, EXPORT_REQUESTER_NOT_ALLOWED, INTERNAL_ERROR. */
  errorCode?: string
  createdAt: string
  completedAt?: string
  /** Fin du téléchargement ; le fichier est supprimé dans la nuit qui suit. */
  availableUntil: string
}

/** URL signée de 5 minutes : l'ouvrir déclenche le téléchargement. */
export interface ExportDownloadResponse {
  url: string
  /** Validité de l'URL, en secondes. */
  expiresIn: number
  filename: string
}
