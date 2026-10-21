import { isAxiosError } from 'axios'

import { SessionExpiredError } from './api-client'

import type { ApiProblemDetails } from '@/types/api'

const NETWORK_ERROR_REASON = 'impossible de joindre le serveur, vérifiez votre connexion.'

/**
 * Explication d'une erreur, telle qu'elle doit être montrée à l'utilisateur :
 * le `detail` de l'API (rédigé pour l'utilisateur final), à défaut son `title`,
 * ou le message d'une erreur levée par l'application. null si aucune n'est disponible.
 */
export function getErrorReason(error: unknown): string | null {
  if (isAxiosError<ApiProblemDetails>(error)) {
    if (!error.response) return NETWORK_ERROR_REASON
    const problem = error.response.data
    return problem?.detail?.trim() || problem?.title?.trim() || null
  }

  // Seules les erreurs levées volontairement par l'application (new Error('…') en français)
  // sont affichées ; une TypeError ou autre erreur technique ne l'est jamais.
  if (error instanceof Error && error.name === 'Error' && error.message.trim()) return error.message.trim()

  return null
}

/**
 * Message d'erreur d'une action : « <action> : <explication> ».
 * Exemple : « Impossible d’archiver le site : votre rôle ne permet pas d’accéder à cette ressource. »
 * Sans explication disponible, l'action seule est renvoyée.
 */
export function getApiErrorMessage(error: unknown, action: string): string {
  // Fin de session : la redirection vers la connexion suffit, aucun message n'est affiché.
  if (error instanceof SessionExpiredError) return ''

  const reason = getErrorReason(error)
  if (!reason) return action

  return `${action.trim().replace(/[.!…]+$/, '')} : ${lowerFirst(withFinalPunctuation(reason))}`
}

/** Minuscule initiale, sauf pour un sigle (« QR code », « API »). */
function lowerFirst(text: string) {
  const [first = '', second = ''] = text
  return second && second === second.toLocaleUpperCase('fr') && second !== second.toLocaleLowerCase('fr')
    ? text
    : first.toLocaleLowerCase('fr') + text.slice(1)
}

function withFinalPunctuation(text: string) {
  return /[.!?…]$/.test(text) ? text : `${text}.`
}
