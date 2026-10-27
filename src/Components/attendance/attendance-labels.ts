import type { ApiSessionStatus, ApiSessionValidation, SessionFlag, WorkSessionResponse } from '@/types/attendance'

/** Libellés français des pointages, partagés par la liste et l'examen d'une session. */
export const flagLabels: Record<SessionFlag, string> = {
  OUT_OF_GEOFENCE: 'Hors zone',
  LOW_ACCURACY: 'Précision GPS faible',
  MOCK_POSITION: 'Position simulée',
  CLOCK_DRIFT: 'Heure du téléphone décalée',
  SUSPECT_SPEED: 'Déplacement suspect',
  INTEGRITY_FAILED: 'Téléphone non fiable',
  SIGNATURE_INVALID: 'Signature invalide',
  QR_MISMATCH: 'QR code d’un autre site',
  PROXY_POINTING: 'Pointage pour un tiers',
}

export const statusLabels: Record<ApiSessionStatus, string> = {
  OPEN: 'En cours',
  CLOSED: 'Terminée',
  MISSING_EXIT: 'Sortie manquante',
  ABSENCE: 'Absence',
}

export const validationConfig: Record<ApiSessionValidation, { label: string; color: string }> = {
  PENDING: { label: 'À valider', color: 'warning' },
  AUTO_VALIDATED: { label: 'Validée automatiquement', color: 'success' },
  VALIDATED: { label: 'Validée', color: 'success' },
  REJECTED: { label: 'Rejetée', color: 'error' },
  CORRECTED: { label: 'Régularisée', color: 'info' },
}

/** L'API refuse de décider une session déjà tranchée ou encore ouverte (409). */
export const isDecidable = (session: WorkSessionResponse) => session.validation === 'PENDING' && session.status !== 'OPEN'

export const formatDateTime = (value?: string) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : 'Non renseignée'

/** 465 → « 7 h 45 ». */
export const formatMinutes = (value?: number) => {
  if (value === undefined || value === null) return '—'
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return hours ? `${hours} h ${String(minutes).padStart(2, '0')}` : `${minutes} min`
}
