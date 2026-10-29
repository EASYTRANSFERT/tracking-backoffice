import { isAxiosError } from 'axios'

const hasRejectedRows = (value: unknown): value is { rejected: unknown[] } =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as { rejected?: unknown }).rejected))

/**
 * Un fichier refusé en bloc (422) porte son rapport ligne par ligne dans les extensions
 * du problème (RFC 9457) : à la racine, ou sous `extensions`. null si l'erreur n'en est pas un.
 */
export function readRejectedPayload<T extends { rejected: unknown[] }>(error: unknown): (Partial<T> & { rejected: unknown[] }) | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const body = error.response.data as Record<string, unknown> | undefined
  const payload = hasRejectedRows(body) ? body : hasRejectedRows(body?.extensions) ? body.extensions : null
  return payload as (Partial<T> & { rejected: unknown[] }) | null
}
