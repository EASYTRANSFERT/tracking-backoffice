import { formatDateTime, formatMinutes, statusLabels, validationConfig } from '@/Components/attendance/attendance-labels'
import { apiErrorCode } from '@/utils/period-format'
import type { AdjustedValues, AdjustmentResponse, CreateAdjustmentRequest } from '@/types/adjustment'
import type { WorkSessionResponse } from '@/types/attendance'
import type { PeriodResponse } from '@/types/period'

export interface AdjustmentChange {
  key: keyof AdjustedValues
  label: string
  before: string
  after: string
}

const instant = (value?: string) => value ? new Date(value).getTime() : undefined

const fields: { key: keyof AdjustedValues; label: string; format: (value: never) => string; same?: (a?: string, b?: string) => boolean }[] = [
  { key: 'inAt', label: 'Entrée', format: formatDateTime as (value: never) => string, same: (a, b) => instant(a) === instant(b) },
  { key: 'outAt', label: 'Sortie', format: formatDateTime as (value: never) => string, same: (a, b) => instant(a) === instant(b) },
  { key: 'minutes', label: 'Durée travaillée', format: formatMinutes as (value: never) => string },
  { key: 'lateMin', label: 'Retard', format: formatMinutes as (value: never) => string },
  { key: 'status', label: 'Statut', format: ((value: keyof typeof statusLabels) => statusLabels[value] ?? value) as (value: never) => string },
  { key: 'validation', label: 'Validation', format: ((value: keyof typeof validationConfig) => validationConfig[value]?.label ?? value) as (value: never) => string },
]

/** Ce que la régularisation a réellement changé, champ par champ (avant → après). */
export function adjustmentChanges(adjustment: Pick<AdjustmentResponse, 'before' | 'after'>): AdjustmentChange[] {
  return fields
    .filter(({ key, same }) => !(same ? same(adjustment.before[key] as string | undefined, adjustment.after[key] as string | undefined) : adjustment.before[key] === adjustment.after[key]))
    .map(({ key, label, format }) => ({ key, label, before: format(adjustment.before[key] as never), after: format(adjustment.after[key] as never) }))
}

const pad = (value: number) => String(value).padStart(2, '0')

/** ISO → valeur d'un champ datetime-local, dans le fuseau du navigateur. */
export function toLocalInput(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export interface AdjustmentFormValues {
  inAt: string
  outAt: string
  lateMin: number | string | null | undefined
  reason: string
}

/**
 * Ne retient que ce qui change par rapport à la session : l'API refuse une régularisation qui ne corrige rien.
 * Renvoie soit le corps à envoyer, soit le message à montrer.
 */
export function buildAdjustmentRequest(session: WorkSessionResponse, form: AdjustmentFormValues): { request: CreateAdjustmentRequest } | { error: string } {
  const reason = form.reason.trim()
  if (!reason) return { error: 'Indiquez le motif de la régularisation.' }

  const request: CreateAdjustmentRequest = { reason }
  if (form.inAt && form.inAt !== toLocalInput(session.inAt)) request.inAt = new Date(form.inAt).toISOString()
  if (form.outAt && form.outAt !== toLocalInput(session.outAt)) request.outAt = new Date(form.outAt).toISOString()

  const lateText = form.lateMin === null || form.lateMin === undefined ? '' : String(form.lateMin).trim()
  if (lateText !== '') {
    const late = Number(lateText)
    if (!Number.isInteger(late) || late < 0 || late > 1440) return { error: 'Le retard est un nombre de minutes entier, de 0 à 1 440.' }
    if (late !== (session.lateMin ?? 0)) request.lateMin = late
  }

  if (request.inAt === undefined && request.outAt === undefined && request.lateMin === undefined) {
    return { error: 'Modifiez au moins l’entrée, la sortie ou le retard.' }
  }
  const inAt = instant(request.inAt ?? session.inAt)
  const outAt = instant(request.outAt ?? session.outAt)
  if (inAt !== undefined && outAt !== undefined && outAt <= inAt) return { error: 'La sortie doit être postérieure à l’entrée.' }
  if (session.status === 'OPEN' && !session.outAt && request.outAt === undefined) {
    return { error: 'Une session encore ouverte ne se régularise qu’en renseignant sa sortie.' }
  }
  return { request }
}

const errorMessages: Record<string, string> = {
  ADJUSTMENT_REASON_REQUIRED: 'Indiquez le motif de la régularisation.',
  PERIOD_CLOSED: 'La période de cette session est en clôture ou clôturée : elle ne peut plus être régularisée.',
  FORBIDDEN: 'Votre rôle ne permet pas de régulariser cette session.',
}

/** Message français d'un refus de régularisation ; null si le code est inconnu (on garde alors le message de l'API). */
export const adjustmentErrorMessage = (error: unknown) => errorMessages[apiErrorCode(error) ?? ''] ?? null

/** Une période en clôture ou clôturée n'accepte plus de régularisation (409 PERIOD_CLOSED). */
export const isPeriodClosed = (period?: Pick<PeriodResponse, 'state'> | null) => period?.state === 'CLOSING' || period?.state === 'CLOSED'
