import { isAxiosError } from 'axios'

import type { MatriculeImportReport } from '@/types/user'

const isReport = (value: unknown): value is MatriculeImportReport =>
  Boolean(value && typeof value === 'object' && Array.isArray((value as MatriculeImportReport).rejected))

/**
 * Un fichier refusé en bloc (422 MATRICULE_IMPORT_REJECTED) porte son rapport ligne par ligne
 * dans les extensions du problème (RFC 9457) : à la racine, ou sous `extensions`.
 */
export function readRejectedImportReport(error: unknown): MatriculeImportReport | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const body = error.response.data as Record<string, unknown> | undefined
  const candidate = isReport(body) ? body : isReport(body?.extensions) ? body.extensions : null
  if (!candidate) return null
  return {
    read: candidate.read ?? 0,
    matched: candidate.matched ?? 0,
    unchanged: candidate.unchanged ?? 0,
    rejected: candidate.rejected ?? [],
    warnings: candidate.warnings ?? [],
    applied: false,
  }
}

const reasonLabels: Record<string, string> = {
  PHONE_UNREADABLE: 'Numéro de téléphone illisible',
  PHONE_UNKNOWN: 'Aucun compte avec ce numéro',
  PHONE_DUPLICATED_IN_FILE: 'Numéro présent plusieurs fois dans le fichier',
  MATRICULE_EMPTY: 'Matricule vide',
  MATRICULE_DUPLICATED_IN_FILE: 'Matricule présent plusieurs fois dans le fichier',
  MATRICULE_ALREADY_USED: 'Matricule déjà attribué à un autre compte',
  NAME_DIFFERS: 'Le nom diffère de celui du compte',
}

export const importReasonLabel = (reason: string) => reasonLabels[reason] ?? reason

/** Modèle à remplir : une ligne d'en-tête et les trois colonnes attendues par l'API. */
export const MATRICULE_IMPORT_TEMPLATE = 'nom;telephone;matricule\nKoffi Yao;+2250700000000;EMP-104\n'
