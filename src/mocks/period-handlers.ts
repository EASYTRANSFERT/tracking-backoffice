import { http, HttpResponse } from 'msw'

import type { ClosePeriodRequest, CreatePeriodRequest, PeriodBlockers, PeriodResponse, ReopenPeriodRequest } from '@/types/period'

type Problem = (status: number, code: string, detail: string) => Response
const now = () => new Date().toISOString()
const today = () => now().slice(0, 10)

// Une période en validation, une close, une ouverte : de quoi parcourir tout le cycle en mode démonstration.
const periods: PeriodResponse[] = [
  { id: 'per_mock_003', teamId: 'team-1', from: '2026-10-01', to: '2026-10-31', state: 'OPEN', createdBy: 'user-1' },
  { id: 'per_mock_002', teamId: 'team-2', from: '2026-09-01', to: '2026-09-30', state: 'IN_VALIDATION', createdBy: 'user-1', validationStartedAt: '2026-10-01T00:00:00.000Z' },
  { id: 'per_mock_001', teamId: 'team-1', from: '2026-08-01', to: '2026-08-31', state: 'CLOSED', createdBy: 'user-1', validationStartedAt: '2026-09-01T00:00:00.000Z', closeRequestedBy: 'user-1', closeRequestedAt: '2026-09-02T08:00:00.000Z', closedBy: 'user-1', closedAt: '2026-09-02T08:00:05.000Z', forced: false, unvalidatedCount: 0 },
]
// Blocages simulés de la période en validation : levés par une clôture forcée.
const blockersOf = (period: PeriodResponse): PeriodBlockers => period.id === 'per_mock_002'
  ? { pending: 3, open: 1, sampleSessionIds: ['ses_mock_011', 'ses_mock_012', 'ses_mock_013', 'ses_mock_014'] }
  : { pending: 0, open: 0, sampleSessionIds: [] }
// État « clôture en cours » : passe à CLOSED à la deuxième consultation.
const closingPolls = new Map<string, number>()

export function periodHandlers(api: (path: string) => string, problem: Problem) {
  const view = (period: PeriodResponse) => period.state === 'CLOSED' ? period : { ...period, blockers: blockersOf(period) }

  return [
    http.get(api('/periods'), ({ request }) => {
      const state = new URL(request.url).searchParams.get('state')
      const items = [...periods].sort((a, b) => b.from.localeCompare(a.from)).filter((period) => !state || period.state === state)
      return HttpResponse.json({ items, nextCursor: null })
    }),
    http.get(api('/periods/:id'), ({ params }) => {
      const period = periods.find((item) => item.id === String(params.id))
      if (!period) return problem(404, 'NOT_FOUND', 'Période introuvable.')
      if (period.state === 'CLOSING') {
        const polls = (closingPolls.get(period.id) ?? 0) + 1
        closingPolls.set(period.id, polls)
        if (polls >= 2) Object.assign(period, { state: 'CLOSED', closedBy: period.closeRequestedBy, closedAt: now() })
      }
      return HttpResponse.json(view(period))
    }),
    http.post(api('/periods'), async ({ request }) => {
      const { teamId, from, to } = (await request.json()) as CreatePeriodRequest
      if (!teamId) return problem(400, 'VALIDATION_ERROR', 'L’équipe est obligatoire.')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(to ?? '') || to < from) return problem(400, 'PERIOD_RANGE_INVALID', 'Journée illisible, ou fin avant début.')
      if (periods.some((period) => period.teamId === teamId && from <= period.to && period.from <= to)) return problem(409, 'PERIOD_OVERLAP', 'Cette période chevauche une période existante.')
      const period: PeriodResponse = { id: `per_mock_${Date.now()}`, teamId, from, to, state: to < today() ? 'IN_VALIDATION' : 'OPEN', createdBy: 'user-1' }
      periods.push(period)
      return HttpResponse.json(period, { status: 201 })
    }),
    http.post(api('/periods/:id/reopen'), async ({ params, request }) => {
      const period = periods.find((item) => item.id === String(params.id))
      if (!period) return problem(404, 'NOT_FOUND', 'Période introuvable.')
      const { reason } = ((await request.json().catch(() => ({}))) ?? {}) as ReopenPeriodRequest
      if (!reason?.trim()) return problem(400, 'PERIOD_REOPEN_REASON_REQUIRED', 'Le motif de la réouverture est obligatoire.')
      if (period.state !== 'IN_VALIDATION') return problem(409, 'PERIOD_INVALID_TRANSITION', 'La période n’est pas en validation.')
      Object.assign(period, { state: 'OPEN', reopenedAt: now(), reopenedBy: 'user-1', reopenReason: reason.trim() })
      return HttpResponse.json(period)
    }),
    http.post(api('/periods/:id/close'), async ({ params, request }) => {
      // Le jeton « élevé » n'est délivré que par /auth/step-up.
      if (!request.headers.get('Authorization')?.startsWith('Bearer mock-elevated-token')) return problem(403, 'STEP_UP_REQUIRED', 'Une ré-authentification TOTP récente est requise.')
      const period = periods.find((item) => item.id === String(params.id))
      if (!period) return problem(404, 'NOT_FOUND', 'Période introuvable.')
      if (period.state === 'CLOSED' || period.state === 'CLOSING') return problem(409, 'PERIOD_ALREADY_CLOSED', 'La période est déjà clôturée ou en cours de clôture.')
      if (period.state !== 'IN_VALIDATION') return problem(409, 'PERIOD_INVALID_TRANSITION', 'La période n’est pas encore terminée.')
      const { force, reason } = ((await request.json().catch(() => ({}))) ?? {}) as ClosePeriodRequest
      const blockers = blockersOf(period)
      const blocked = blockers.pending + blockers.open > 0
      if (blocked && !force) {
        return HttpResponse.json({ title: 'PERIOD_NOT_CLOSABLE', status: 422, code: 'PERIOD_NOT_CLOSABLE', detail: 'Des sessions sont en attente de décision ou encore ouvertes.', ...blockers }, { status: 422, headers: { 'Content-Type': 'application/problem+json' } })
      }
      if (force && !reason?.trim()) return problem(400, 'PERIOD_FORCE_REASON_REQUIRED', 'Le motif de la clôture forcée est obligatoire.')
      Object.assign(period, {
        state: 'CLOSING', closeRequestedBy: 'user-1', closeRequestedAt: now(),
        ...(blocked && force ? { forced: true, forceReason: reason!.trim(), unvalidatedCount: blockers.pending + blockers.open } : { forced: false }),
      })
      closingPolls.set(period.id, 0)
      return HttpResponse.json(period, { status: 202 })
    }),
  ]
}
