import { getApiErrorMessage } from '@/utils/api-error'
import { apiErrorCode } from '@/utils/api-error'
import type { PeriodReportFormat } from '@/types/period'

/** bilan-<equipe>-<from>-<to>.xlsx : le serveur n'expose pas encore Content-Disposition en CORS. */
export function reportFilename(period: { teamName: string; from: string; to: string }, format: PeriodReportFormat) {
  const team = period.teamName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'equipe'
  return `bilan-${team}-${period.from}-${period.to}.${format}`
}

/** Message français d'un échec de téléchargement du bilan. */
export function reportErrorMessage(error: unknown) {
  const code = apiErrorCode(error)
  if (code === 'EXPORT_ROW_LIMIT_EXCEEDED') return 'Bilan trop volumineux'
  if (code === 'NOT_FOUND' || (error as { response?: { status?: number } })?.response?.status === 404) return 'Période introuvable ou hors périmètre.'
  return getApiErrorMessage(error, 'Impossible de télécharger le bilan.')
}
