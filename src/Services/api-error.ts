import { isAxiosError } from 'axios'

import type { ApiProblemDetails } from '@/types/api'

const messagesByCode: Record<string, string> = {
  VALIDATION_FAILED: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  FORBIDDEN: 'Votre profil ne permet pas cette action.',
  SITE_MANAGER_INVALID: 'Le responsable doit être un administrateur ou un superviseur actif.',
  MISSION_STATUS_CONFLICT: 'Cette mission ne permet plus d’ajouter de site.',
  SITE_ARCHIVED: 'Ce site est archivé et ne peut plus être modifié.',
  STEP_UP_REQUIRED: 'Confirmez votre identité avec votre code de vérification, puis réessayez.',
  USER_DISABLED: 'Ce compte est désactivé : réactivez-le avant d’enrôler un appareil.',
  TOTP_INVALID: 'Le code de vérification est incorrect.',
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiProblemDetails>(error)) return error instanceof Error ? error.message : fallback
  const problem = error.response?.data
  return (problem?.code && messagesByCode[problem.code]) || problem?.detail || fallback
}
