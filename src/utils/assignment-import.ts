import { readRejectedPayload } from '@/utils/import-rejection'
import type { AssignmentImportReport } from '@/types/assignment'

/** Rapport d'un fichier refusé en bloc (422 ASSIGNMENT_IMPORT_REJECTED). */
export function readRejectedAssignmentReport(error: unknown): AssignmentImportReport | null {
  const candidate = readRejectedPayload<AssignmentImportReport>(error)
  if (!candidate) return null
  return {
    read: candidate.read ?? 0,
    planned: 0,
    rejected: candidate.rejected as AssignmentImportReport['rejected'],
    applied: false,
  }
}

const reasonLabels: Record<string, string> = {
  MATRICULE_EMPTY: 'Matricule vide',
  MATRICULE_UNKNOWN: 'Aucun agent avec ce matricule',
  SITE_EMPTY: 'Site vide',
  SITE_UNKNOWN: 'Site inexistant ou hors de votre périmètre',
  SITE_AMBIGUOUS: 'Plusieurs sites actifs portent ce nom : écrivez son identifiant',
  SITE_ARCHIVED: 'Site archivé',
  SITE_WITHOUT_TEAM: 'Site sans équipe',
  MISSION_NOT_OPEN: 'La mission du site n’est pas ouverte',
  DATE_UNREADABLE: 'Date illisible (JJ/MM/AAAA ou AAAA-MM-JJ)',
  START_UNREADABLE: 'Heure de début illisible (ex. 06:00)',
  END_UNREADABLE: 'Heure de fin illisible (ex. 14:00)',
  SLOT_TOO_SHORT: 'Créneau trop court (moins de 15 minutes)',
  SLOT_TOO_LONG: 'Créneau trop long (plus de 24 heures)',
  AGENT_INVALID: 'Ni agent ni chef d’équipe, ou compte désactivé',
  AGENT_WITHOUT_TEAM: 'Agent sans équipe',
  AGENT_NOT_IN_SITE_TEAM: 'L’agent n’appartient pas à l’équipe du site',
  OVERLAP_IN_FILE: 'Chevauche un autre créneau du fichier',
  OVERLAP_EXISTING: 'Chevauche un créneau déjà planifié',
}

export const assignmentImportReasonLabel = (reason: string) => reasonLabels[reason] ?? reason

/** Modèle à remplir : une ligne d'en-tête et les cinq colonnes attendues par l'API. */
export const ASSIGNMENT_IMPORT_TEMPLATE = 'matricule;site;date;debut;fin\nAG-0042;Dépôt Yopougon;30/10/2026;06:00;14:00\n'
