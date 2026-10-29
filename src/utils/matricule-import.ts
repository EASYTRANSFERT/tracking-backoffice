import { readRejectedPayload } from '@/utils/import-rejection'
import type { MatriculeImportReport } from '@/types/user'

/** Rapport d'un fichier refusé en bloc (422 MATRICULE_IMPORT_REJECTED). */
export function readRejectedImportReport(error: unknown): MatriculeImportReport | null {
  const candidate = readRejectedPayload<MatriculeImportReport>(error)
  if (!candidate) return null
  return {
    read: candidate.read ?? 0,
    matched: candidate.matched ?? 0,
    unchanged: candidate.unchanged ?? 0,
    rejected: candidate.rejected as MatriculeImportReport['rejected'],
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
