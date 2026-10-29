import { isAxiosError } from 'axios'

import type { ApiPeriodState, PeriodBlockers, PeriodResponse } from '@/types/period'

const stateConfigs: Record<string, { label: string; color: string; icon: string }> = {
  OPEN: { label: 'Ouverte', color: 'info', icon: 'mdi-calendar-clock' },
  IN_VALIDATION: { label: 'En validation', color: 'warning', icon: 'mdi-clipboard-check-outline' },
  CLOSING: { label: 'Clôture en cours', color: 'secondary', icon: 'mdi-progress-clock' },
  CLOSED: { label: 'Clôturée', color: 'success', icon: 'mdi-lock-check-outline' },
}

export const periodStateConfig = (state: ApiPeriodState) =>
  stateConfigs[state] ?? { label: state, color: 'secondary', icon: 'mdi-help-circle-outline' }

export const periodStateOptions = (['OPEN', 'IN_VALIDATION', 'CLOSING', 'CLOSED'] as const).map((value) => ({ title: periodStateConfig(value).label, value }))

/** 2026-10-31 → « 31/10/2026 » (une journée sans heure : aucun fuseau à appliquer). */
/** La journée AAAA-MM-JJ appartient-elle à l'une des périodes (bornes incluses) ? */
export function dayInPeriods(day: string, periods: PeriodResponse[]) {
  return periods.some((period) => period.from <= day && day <= period.to)
}

/** Périodes d'un superviseur : celles des équipes qui travaillent sur les sites de ses missions. */
export function periodsOfTeams(periods: PeriodResponse[], teamIds: Set<string>) {
  return periods.filter((period) => period.teamId && teamIds.has(period.teamId))
}

export function formatPeriodDay(day?: string) {
  const [year, month, date] = (day ?? '').split('-')
  return year && month && date ? `${date}/${month}/${year}` : '—'
}

export const formatPeriodRange = (period: { from: string; to: string }) => `${formatPeriodDay(period.from)} → ${formatPeriodDay(period.to)}`

const isBlockers = (value: unknown): value is PeriodBlockers =>
  Boolean(value && typeof value === 'object' && typeof (value as PeriodBlockers).pending === 'number' && typeof (value as PeriodBlockers).open === 'number')

/**
 * Refus de clôture (422 PERIOD_NOT_CLOSABLE) : les blocages sont dans les extensions du problème
 * (RFC 9457), à la racine, sous `extensions` ou sous `blockers`. null si l'erreur n'en porte pas.
 */
export function readClosureBlockers(error: unknown): PeriodBlockers | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const body = error.response.data as Record<string, unknown> | undefined
  const found = [body, body?.blockers, body?.extensions, (body?.extensions as Record<string, unknown> | undefined)?.blockers].find(isBlockers)
  return found ? { pending: found.pending, open: found.open, sampleSessionIds: found.sampleSessionIds ?? [] } : null
}

/** Code d'erreur métier d'une réponse de l'API (problem details), s'il y en a un. */
export const apiErrorCode = (error: unknown) =>
  isAxiosError<{ code?: string }>(error) ? error.response?.data?.code : undefined

const errorMessages: Record<string, string> = {
  PERIOD_OVERLAP: 'Cette période chevauche une période existante.',
  PERIOD_RANGE_INVALID: 'Dates invalides : la fin ne peut pas précéder le début.',
  PERIOD_REOPEN_REASON_REQUIRED: 'Indiquez le motif de la réouverture.',
  PERIOD_FORCE_REASON_REQUIRED: 'Indiquez le motif de la clôture forcée.',
  PERIOD_INVALID_TRANSITION: 'Cette période n’est pas dans un état qui permet cette action (une période se clôture une fois terminée).',
  PERIOD_ALREADY_CLOSED: 'Cette période est déjà clôturée ou en cours de clôture.',
}

/** Message français d'un code d'erreur de période, null s'il est inconnu (l'appelant retombe sur le message de l'API). */
export const periodErrorMessage = (error: unknown) => errorMessages[apiErrorCode(error) ?? ''] ?? null
