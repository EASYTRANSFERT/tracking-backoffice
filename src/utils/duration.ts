/** 465 → « 7 h 45 » ; les durées de l'API arrivent en minutes. */
export function formatMinutes(minutes?: number | null) {
  if (minutes === undefined || minutes === null || Number.isNaN(minutes)) return '—'
  const total = Math.max(Math.round(minutes), 0)
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return `${hours} h ${String(rest).padStart(2, '0')}`
}
