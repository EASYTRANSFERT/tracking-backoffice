import { http, HttpResponse } from 'msw'

import { mockPeriods } from '@/mocks/period-handlers'
import type { SiteResponse } from '@/types/site'
import type { MissionOverviewPeriod, MissionOverviewResponse } from '@/types/mission'

type Problem = (status: number, code: string, detail: string) => Response

const DAY_MS = 86_400_000
const MAX_WINDOW_DAYS = 366

/** GET /missions/{id}/overview : sites du jour et périodes des équipes de la mission (données de démonstration). */
export function missionOverviewHandlers(api: (path: string) => string, problem: Problem, getSites: () => SiteResponse[]) {
  return [
    http.get(api('/missions/:id/overview'), ({ params, request }) => {
      const query = new URL(request.url).searchParams
      const to = query.get('to') ?? new Date().toISOString().slice(0, 10)
      const from = query.get('from') ?? new Date(Date.parse(to) - 90 * DAY_MS).toISOString().slice(0, 10)
      if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to)) || to < from || (Date.parse(to) - Date.parse(from)) / DAY_MS > MAX_WINDOW_DAYS) {
        return problem(400, 'VALIDATION_FAILED', 'Fenêtre illisible, à l’envers ou trop longue.')
      }

      const sites = getSites().filter((site) => site.missionId === String(params.id))
      if (!sites.length) return problem(404, 'NOT_FOUND', 'Mission introuvable, ou hors périmètre.')

      const teamIds = [...new Set(sites.map((site) => site.teamId).filter((id): id is string => Boolean(id)))]
      const body: MissionOverviewResponse = {
        window: { from, to },
        sites: sites.map((site, index) => ({
          siteId: site.id, name: site.name, status: site.status, teamId: site.teamId ?? undefined, teamName: site.teamId ? `Équipe ${site.teamId}` : undefined,
          todaySessions: site.teamId ? 4 + index : 0, todayOpen: site.teamId ? 2 : 0, todayPendingValidation: site.teamId ? index : 0, todayAbsences: site.teamId ? 1 : 0,
        })),
        teams: teamIds.map((teamId) => ({
          teamId,
          teamName: `Équipe ${teamId}`,
          sites: sites.filter((site) => site.teamId === teamId).map((site) => site.id),
          periods: mockPeriods
            .filter((period) => period.teamId === teamId && period.to >= from && period.from <= to)
            .sort((a, b) => b.from.localeCompare(a.from))
            .map((period): MissionOverviewPeriod => {
              const closed = period.state === 'CLOSED'
              return {
                periodId: period.id, from: period.from, to: period.to, state: period.state, final: closed,
                totals: { sessionsCount: 42, workedMinutes: 19_530, lateMinutes: 95, absencesCount: 3, agents: 6, daysWorked: 38 },
                bySite: sites.filter((site) => site.teamId === teamId).map((site) => ({
                  siteId: site.id, agents: 4, sessionsCount: 28, workedMinutes: 13_020, lateMinutes: 60, absencesCount: 2,
                })),
                pending: closed ? 0 : 3, open: closed ? 0 : 1,
              }
            }),
        })),
      }
      return HttpResponse.json(body)
    }),
  ]
}
