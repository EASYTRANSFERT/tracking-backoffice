import type { AssignmentResponse } from '@/types/assignment'
import type { AttendanceSessionResponse } from '@/types/attendance-session'

/** Où en est le pointage d'un créneau, vu par le superviseur. */
export type ShiftAttendanceState =
  | 'upcoming' // créneau à venir, rien à pointer
  | 'noClockIn' // créneau commencé ou passé, aucun pointage
  | 'inProgress' // arrivée pointée, créneau en cours
  | 'pending' // à valider
  | 'missingExit' // arrivée sans départ, créneau terminé
  | 'validated'
  | 'rejected'

export function shiftAttendanceState(shift: AssignmentResponse, session: AttendanceSessionResponse | undefined, now = new Date()): ShiftAttendanceState {
  if (!session) return now < new Date(shift.startAt) ? 'upcoming' : 'noClockIn'
  if (session.validation === 'REJECTED') return 'rejected'
  if (session.validation === 'VALIDATED' || session.validation === 'AUTO_VALIDATED') return 'validated'
  if (!session.outAt) return session.status === 'MISSING_EXIT' || now > new Date(shift.endAt) ? 'missingExit' : 'inProgress'
  return 'pending'
}

/** Seuls ces états attendent une décision du superviseur. */
export const isDecidable = (state: ShiftAttendanceState) => state === 'pending' || state === 'missingExit'

export const attendanceStateDisplay: Record<ShiftAttendanceState, { label: string; color: string; icon: string } | null> = {
  upcoming: null,
  noClockIn: { label: 'Aucun pointage', color: 'grey', icon: 'mdi-account-off-outline' },
  inProgress: { label: 'En poste', color: 'info', icon: 'mdi-timer-sand' },
  pending: { label: 'À valider', color: 'warning', icon: 'mdi-clock-alert-outline' },
  missingExit: { label: 'Sortie manquante', color: 'warning', icon: 'mdi-logout-variant' },
  validated: { label: 'Validé', color: 'success', icon: 'mdi-check-circle-outline' },
  rejected: { label: 'Rejeté', color: 'error', icon: 'mdi-close-circle-outline' },
}

/** Libellés des anomalies (codes à confirmer avec l'API) ; un code inconnu reste lisible. */
const flagLabels: Record<string, string> = {
  OUT_OF_ZONE: 'Hors zone',
  LOW_ACCURACY: 'Position imprécise',
  OUTSIDE_ASSIGNMENT: 'Hors créneau',
  MOCK_LOCATION: 'Position simulée',
  SUSPECT: 'Pointage suspect',
  LATE: 'Retard',
  EARLY_EXIT: 'Départ anticipé',
  MISSING_EXIT: 'Sortie manquante',
  TEAM_MODE: 'Mode équipe',
  BIOMETRY_UNAVAILABLE: 'Biométrie indisponible',
  OFFLINE: 'Envoyé hors ligne',
}
export const flagLabel = (flag: string) => flagLabels[flag] ?? flag.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
