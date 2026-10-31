import type { AssignmentSlot } from '@/types/assignment'

/**
 * Le planning est affiché dans le fuseau du navigateur. L'API range un créneau dans la journée
 * de l'entreprise (`day`) : les deux coïncident tant que l'administrateur est dans ce fuseau.
 */
export interface ScheduleDay {
  key: string
  weekday: string
  date: string
  isToday: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')

export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDayKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

export function addDays(key: string, days: number) {
  const date = fromDayKey(key)
  date.setDate(date.getDate() + days)
  return toDayKey(date)
}

/** Lundi de la semaine contenant `date`. */
export function startOfWeek(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return toDayKey(monday)
}

export function weekDays(weekStart: string): ScheduleDay[] {
  const today = toDayKey(new Date())
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(weekStart, index)
    const date = fromDayKey(key)
    return {
      key,
      weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''),
      date: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date).replace('.', ''),
      isToday: key === today,
    }
  })
}

export function weekLabel(weekStart: string) {
  const format = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
  return `Semaine du ${format.format(fromDayKey(weekStart))} au ${format.format(fromDayKey(addDays(weekStart, 6)))}`
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function timeOf(iso: string) {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Une fin antérieure ou égale au début désigne un poste de nuit, qui finit le lendemain. */
export function toSlot(dayKey: string, start: string, end: string): AssignmentSlot {
  const startAt = new Date(`${dayKey}T${start}:00`)
  const endAt = new Date(`${dayKey}T${end}:00`)
  if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1)
  return { startAt: startAt.toISOString(), endAt: endAt.toISOString() }
}

export function endsNextDay(start: string, end: string) {
  return Boolean(start && end) && end <= start
}

/** Durée d'un créneau pour l'affichage (« 23 h », « 8 h 30 »), un poste de nuit comptant jusqu'au lendemain. */
export function shiftDurationLabel(start: string, end: string) {
  const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  const minutes = (minutesOf(end) - minutesOf(start) + 1440) % 1440 || 1440
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}` : `${minutes / 60} h`
}

/** Bornes ISO d'une semaine (lundi inclus, lundi suivant exclu), telles que les attend GET /assignments. */
export function weekRange(weekStart: string) {
  return { from: fromDayKey(weekStart).toISOString(), to: fromDayKey(addDays(weekStart, 7)).toISOString() }
}
