import type { ApiCheckScheduleMode, CheckScheduleResponse, CreateCheckScheduleRequest } from '@/types/check'

/** Refus prévus par POST /checks/trigger et les programmes, reformulés pour l'administrateur et le superviseur. */
export const checkRefusals: Record<string, string> = {
  CHECK_NO_OPEN_SESSION: 'Aucun agent de cette équipe n’est pointé en ce moment : il n’y a personne à contrôler.',
  CHECK_TEAM_WITHOUT_LEAD: 'Cette équipe n’a pas de chef d’équipe pour répondre au contrôle.',
  CHECK_TRIGGER_RATE_LIMITED: 'Un contrôle a déjà été lancé pour cette équipe il y a moins d’une heure.',
  CHECK_SCHEDULE_IN_PAST: 'Ce moment est déjà passé : choisissez une date et une heure à venir.',
  FORBIDDEN: 'Votre rôle ne permet pas de modifier les programmes de contrôles.',
}

export const checkModeLabels: Record<ApiCheckScheduleMode, string> = { ONCE: 'Une fois', DAILY: 'Chaque jour', INTERVAL: 'Intervalle' }

/** Bornes de la fréquence en mode intervalle, en minutes (limites de l'API). */
export const INTERVAL_MIN = 15
export const INTERVAL_MAX = 720

/** 90 → « 1 h 30 », 60 → « 1 h », 30 → « 30 min ». */
export function formatInterval(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
}

const formatDay = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`))

/** Résumé d'une ligne : « Chaque jour · 10:30 », « Toutes les 1 h 30 », « 20/11 · 10:30 ». */
export function describeSchedule(schedule: Pick<CheckScheduleResponse, 'mode' | 'date' | 'time' | 'everyMin'>) {
  if (schedule.mode === 'ONCE') return [schedule.date && formatDay(schedule.date), schedule.time].filter(Boolean).join(' · ')
  if (schedule.mode === 'DAILY') return `Chaque jour · ${schedule.time ?? ''}`.trim()
  return `Toutes les ${formatInterval(schedule.everyMin ?? 0)}`
}

/** Période d'application d'un programme récurrent : « Du 03/11 au 31/12 », « Dès le 03/11 », ou rien. */
export function describePeriod(schedule: Pick<CheckScheduleResponse, 'mode' | 'startDate' | 'endDate'>) {
  if (schedule.mode === 'ONCE') return ''
  const { startDate, endDate } = schedule
  if (startDate && endDate) return `Du ${formatDay(startDate)} au ${formatDay(endDate)}`
  if (startDate) return `Dès le ${formatDay(startDate)}`
  return endDate ? `Jusqu’au ${formatDay(endDate)}` : ''
}

/** Nom proposé quand l'utilisateur n'en saisit pas (l'API l'exige). */
export function defaultScheduleName(schedule: Pick<CheckScheduleResponse, 'mode' | 'date' | 'time' | 'everyMin'>) {
  if (schedule.mode === 'ONCE') return `Contrôle du ${describeSchedule(schedule).replace(' · ', ' à ')}`
  if (schedule.mode === 'DAILY') return `Contrôle quotidien à ${schedule.time ?? ''}`.trim()
  return `Contrôle toutes les ${formatInterval(schedule.everyMin ?? 0)}`
}

const pad = (value: number) => String(value).padStart(2, '0')
const toDate = (value: Date) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`

/** Valeurs pré-remplies du formulaire : dans une heure (arrondie à la demi-heure), 10:00 chaque jour, toutes les 1 h 30. */
export function scheduleDefaults(now = new Date()): Required<Pick<CreateCheckScheduleRequest, 'date' | 'time' | 'everyMin' | 'startDate'>> {
  const inOneHour = new Date(now.getTime() + 60 * 60_000)
  inOneHour.setMinutes(inOneHour.getMinutes() < 30 ? 30 : 60, 0, 0)
  return { date: toDate(inOneHour), time: `${pad(inOneHour.getHours())}:${pad(inOneHour.getMinutes())}`, everyMin: 90, startDate: toDate(now) }
}
