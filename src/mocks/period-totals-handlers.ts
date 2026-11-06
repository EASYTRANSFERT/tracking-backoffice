import { http, HttpResponse } from 'msw'

import { mockPeriods } from '@/mocks/period-handlers'
import type { PeriodAgentTotals, PeriodDailyTotals, PeriodTotalsResponse } from '@/types/period'

type Problem = (status: number, code: string, detail: string) => Response

const agents: PeriodAgentTotals[] = [
  { userId: 'usr_mock_1', matricule: 'COU-1996', firstName: 'Agent', lastName: 'Demo5', daysWorked: 18, sessionsCount: 18, workedMinutes: 8_370, lateMinutes: 25, absencesCount: 1 },
  { userId: 'usr_mock_2', matricule: 'COU-2001', firstName: 'Agent', lastName: 'Demo6', daysWorked: 20, sessionsCount: 20, workedMinutes: 9_300, lateMinutes: 70, absencesCount: 0 },
]
const sum = (key: 'sessionsCount' | 'workedMinutes' | 'lateMinutes' | 'absencesCount') => agents.reduce((total, agent) => total + agent[key], 0)

/** Bilan, détail par jour et fichier d'une période (données de démonstration). */
export function periodTotalsHandlers(api: (path: string) => string, problem: Problem) {
  return [
    http.get(api('/periods/:id/totals'), ({ params }) => {
      const period = mockPeriods.find((item) => item.id === String(params.id))
      if (!period) return problem(404, 'NOT_FOUND', 'Période introuvable, ou hors périmètre.')
      const closed = period.state === 'CLOSED'
      const body: PeriodTotalsResponse = {
        period: {
          periodId: period.id, teamId: period.teamId ?? '', teamName: 'EquipeDemo3', from: period.from, to: period.to, state: period.state,
          final: closed, pending: closed ? 0 : 3, open: closed ? 0 : 1, forced: Boolean(period.forced), unvalidatedCount: period.unvalidatedCount ?? 0,
        },
        agents,
        team: { sessionsCount: sum('sessionsCount'), workedMinutes: sum('workedMinutes'), lateMinutes: sum('lateMinutes'), absencesCount: sum('absencesCount'), agents: agents.length, daysWorked: agents.reduce((total, agent) => total + agent.daysWorked, 0) },
        sites: [{ siteId: 'sit_mock_1', siteName: 'SiteDemo4', agents: agents.length, sessionsCount: sum('sessionsCount'), workedMinutes: sum('workedMinutes'), lateMinutes: sum('lateMinutes'), absencesCount: sum('absencesCount') }],
      }
      return HttpResponse.json(body)
    }),
    http.get(api('/periods/:id/totals/daily'), ({ params, request }) => {
      const period = mockPeriods.find((item) => item.id === String(params.id))
      if (!period) return problem(404, 'NOT_FOUND', 'Période introuvable, ou hors périmètre.')
      const query = new URL(request.url).searchParams
      const limit = Math.min(Math.max(Number(query.get('limit') ?? 20), 1), 200)
      const start = Math.max(Number(query.get('cursor') ?? 0), 0)
      const days: PeriodDailyTotals[] = Array.from({ length: 31 }, (_, index) => {
        const day = new Date(Date.parse(period.from) + index * 86_400_000).toISOString().slice(0, 10)
        return { userId: query.get('userId') ?? undefined, day, sessionsCount: 1, workedMinutes: 465, lateMinutes: index % 5 === 0 ? 10 : 0, absencesCount: 0 }
      }).filter((entry) => entry.day <= period.to)
      const next = start + limit
      return HttpResponse.json({ items: days.slice(start, next), nextCursor: next < days.length ? String(next) : null })
    }),
    http.get(api('/periods/:id/report'), ({ params, request }) => {
      if (!mockPeriods.some((item) => item.id === String(params.id))) return problem(404, 'NOT_FOUND', 'Période introuvable, ou hors périmètre.')
      const format = new URL(request.url).searchParams.get('format')
      if (format !== 'xlsx' && format !== 'pdf') return problem(400, 'VALIDATION_FAILED', 'Format inconnu.')
      return new HttpResponse('bilan de démonstration', { headers: { 'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
    }),
  ]
}
