const failureMessages: Record<string, string> = {
  EXPORT_ROW_LIMIT_EXCEEDED: 'Trop de lignes pour ce format (5 000 en PDF, 200 000 en Excel) : resserrez les filtres, ou choisissez Excel.',
  EXPORT_REQUESTER_NOT_ALLOWED: 'Votre compte n’est plus autorisé à exporter ces données.',
  INTERNAL_ERROR: 'Une erreur est survenue pendant la production du fichier. Réessayez dans un instant.',
}

/** Explication d'un export en échec (status FAILED), d'après son errorCode. */
export const exportFailureMessage = (errorCode?: string) =>
  (errorCode && failureMessages[errorCode]) || 'La production du fichier a échoué. Réessayez dans un instant.'

const downloadMessages: Record<string, string> = {
  EXPORT_NOT_READY: 'Le fichier est encore en production, ou a échoué.',
  EXPORT_EXPIRED: 'Ce fichier n’est plus disponible (conservation de 7 jours dépassée) : relancez l’export.',
}

/** Message français d'un code de refus de GET /exports/{id}/download, null s'il est inconnu. */
export const exportDownloadMessage = (code?: string) => (code ? downloadMessages[code] ?? null : null)
