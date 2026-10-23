import { isAxiosError } from 'axios'

import { SessionExpiredError } from '@/Services/api-client'

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
    const problem = typeof error.response.data === 'object' ? error.response.data : undefined
    return problem?.detail?.trim() || problem?.title?.trim() || describeNonApiResponse(error.response.status, error.response.headers)
  }

  // Seules les erreurs levées volontairement par l'application (new Error('…') en français)
  // sont affichées ; une TypeError ou autre erreur technique ne l'est jamais.
  if (error instanceof Error && error.name === 'Error' && error.message.trim()) return error.message.trim()

  return null
}

/**
 * Réponse qui ne vient pas de l'API (page d'erreur HTML d'un tunnel ou du proxy de Vite) :
 * on explique d'où vient le problème plutôt que de n'afficher que l'action.
 */
function describeNonApiResponse(status: number, headers: unknown): string {
  const ngrokError = (headers as Record<string, string | undefined> | undefined)?.['ngrok-error-code']
  if (ngrokError) return `le tunnel ngrok de l’API est hors ligne ou injoignable (${ngrokError}).`
  if (status >= 500) return `le serveur de l’API ne répond pas correctement (erreur ${status}).`
  return `le serveur a renvoyé une réponse inattendue (erreur ${status}).`
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
  if (!reason) {
    // Erreur technique (bug de l'application) : non affichée, mais visible dans la console.
    if (error instanceof Error && error.name !== 'Error') console.error(error)
    return action
  }

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
