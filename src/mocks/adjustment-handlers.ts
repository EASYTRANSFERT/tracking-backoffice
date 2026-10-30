import { http, HttpResponse } from 'msw'

import { mockPeriods } from '@/mocks/period-handlers'
import type { AdjustedValues, AdjustmentResponse, CreateAdjustmentRequest } from '@/types/adjustment'
import type { WorkSessionResponse } from '@/types/attendance'

type Problem = (status: number, code: string, detail: string) => Response

const valuesOf = (session: WorkSessionResponse): AdjustedValues => ({
  inAt: session.inAt, outAt: session.outAt, minutes: session.minutes, lateMin: session.lateMin, status: session.status, validation: session.validation,
})

/** Régularisations fictives, par session, de la plus ancienne à la plus récente. */
const adjustments: Record<string, AdjustmentResponse[]> = {}

export function adjustmentHandlers(api: (path: string) => string, problem: Problem, getSessions: () => WorkSessionResponse[]) {
  return [
    http.get(api('/sessions/:id/adjustments'), ({ params }) => {
      const id = String(params.id)
      if (!getSessions().some((session) => session.id === id)) return problem(404, 'NOT_FOUND', 'Session introuvable ou hors périmètre.')
      return HttpResponse.json(adjustments[id] ?? [])
    }),
    http.post(api('/sessions/:id/adjustments'), async ({ params, request }) => {
      const session = getSessions().find((item) => item.id === String(params.id))
      if (!session) return problem(404, 'NOT_FOUND', 'Session introuvable ou hors périmètre.')
      const payload = (await request.json()) as CreateAdjustmentRequest
      if (!payload.reason?.trim()) return problem(400, 'ADJUSTMENT_REASON_REQUIRED', 'Le motif est obligatoire.')
      const period = mockPeriods.find((item) => item.id === session.periodId)
      if (period && (period.state === 'CLOSED' || period.state === 'CLOSING')) return problem(409, 'PERIOD_CLOSED', 'La période est en clôture ou clôturée.')

      const before = valuesOf(session)
      const inAt = payload.inAt ?? session.inAt
      const outAt = payload.outAt ?? session.outAt
      const lateMin = payload.lateMin ?? session.lateMin
      if (payload.inAt === undefined && payload.outAt === undefined && payload.lateMin === undefined) return problem(422, 'ADJUSTMENT_INVALID', 'Rien à corriger.')
      if (session.status === 'OPEN' && !outAt) return problem(422, 'ADJUSTMENT_INVALID', 'Une session ouverte sans sortie ne se régularise pas.')
      if (outAt && new Date(outAt) <= new Date(inAt)) return problem(422, 'ADJUSTMENT_INVALID', 'La sortie est antérieure à l’entrée.')

      // Une sortie corrigée ferme la session ; la durée se recalcule, elle ne se saisit pas.
      Object.assign(session, {
        inAt, outAt, lateMin, validation: 'CORRECTED',
        status: outAt ? 'CLOSED' : session.status,
        minutes: outAt ? Math.round((new Date(outAt).getTime() - new Date(inAt).getTime()) / 60_000) : session.minutes,
      })
      const created: AdjustmentResponse = {
        id: `adj_mock_${Date.now()}`, sessionId: session.id, periodId: session.periodId, before, after: valuesOf(session),
        reason: payload.reason.trim(), authorId: 'user-2', createdAt: new Date().toISOString(),
      }
      adjustments[session.id] = [...(adjustments[session.id] ?? []), created]
      return HttpResponse.json(created, { status: 201 })
    }),
  ]
}
