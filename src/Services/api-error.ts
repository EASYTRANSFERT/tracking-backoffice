import { isAxiosError } from 'axios'

import type { ApiProblemDetails } from '@/types/api'

const messagesByCode: Record<string, string> = {
  VALIDATION_FAILED: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  FORBIDDEN: 'Votre profil ne permet pas cette action.',
  SITE_MANAGER_INVALID: 'Le responsable doit être un administrateur ou un superviseur actif.',
  MISSION_STATUS_CONFLICT: 'Cette mission ne permet plus d’ajouter de site.',
  SITE_ARCHIVED: 'Ce site est archivé et ne peut plus être modifié.',
  ASSIGNMENT_OVERLAP: 'Un agent a déjà un créneau sur cette plage horaire, sur ce site ou sur un autre.',
  ASSIGNMENT_AGENT_INVALID: 'Un des comptes choisis n’est pas un agent actif.',
  ASSIGNMENT_AGENT_NOT_IN_SITE_TEAM: 'Un des agents n’appartient pas à l’équipe affectée à ce site.',
  ASSIGNMENT_SITE_WITHOUT_TEAM: 'Affectez une équipe à ce site avant de planifier des créneaux.',
  ASSIGNMENT_CANCELLED: 'Ce créneau a été annulé : il ne peut plus être modifié.',
  STEP_UP_REQUIRED: 'Confirmez votre identité avec votre code de vérification, puis réessayez.',
  TOTP_INVALID: 'Le code de vérification est incorrect.',
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiProblemDetails>(error)) return error instanceof Error ? error.message : fallback
  const problem = error.response?.data
  return (problem?.code && messagesByCode[problem.code]) || problem?.detail || fallback
}
