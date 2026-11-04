import { http, HttpResponse } from 'msw'

import type { CheckScheduleResponse, CreateCheckScheduleRequest, UpdateCheckScheduleRequest } from '@/types/check'

type Problem = (status: number, code: string, detail: string) => Response
const now = () => new Date().toISOString()

// Un programme de chaque mode, dont un suspendu, pour voir la liste complète en mode démonstration.
const schedules: CheckScheduleResponse[] = [
  { id: 'cks_mock_003', name: 'Contrôle toutes les 2 h', mode: 'INTERVAL', everyMin: 120, startDate: '2026-11-01', teamIds: ['team-2'], active: false, createdBy: 'user-1', createdAt: '2026-11-01T08:00:00.000Z', updatedAt: '2026-11-01T08:00:00.000Z' },
  { id: 'cks_mock_002', name: 'Contrôle quotidien à 10:30', mode: 'DAILY', time: '10:30', startDate: '2026-11-03', endDate: '2026-12-31', teamIds: [], active: true, createdBy: 'user-1', createdAt: '2026-10-30T08:00:00.000Z', updatedAt: '2026-10-30T08:00:00.000Z' },
  { id: 'cks_mock_001', name: 'Contrôle surprise', mode: 'ONCE', date: '2026-11-20', time: '15:00', teamIds: ['team-1'], active: true, createdBy: 'user-1', createdAt: '2026-10-28T08:00:00.000Z', updatedAt: '2026-10-28T08:00:00.000Z' },
]

// Champs propres à chaque mode : un changement de mode efface ceux de l'ancien, comme l'API.
const modeFields = { ONCE: ['date', 'time'], DAILY: ['time', 'startDate', 'endDate'], INTERVAL: ['everyMin', 'startDate', 'endDate'] } as const
const allModeFields = ['date', 'time', 'everyMin', 'startDate', 'endDate'] as const

function invalid(schedule: Partial<CheckScheduleResponse>) {
  if (schedule.mode === 'ONCE' && (!schedule.date || !schedule.time)) return 'Date et heure requises en mode ONCE.'
  if (schedule.mode === 'DAILY' && !schedule.time) return 'Heure requise en mode DAILY.'
  if (schedule.mode === 'INTERVAL' && (!schedule.everyMin || schedule.everyMin < 15 || schedule.everyMin > 720)) return 'everyMin doit être entre 15 et 720.'
  if (schedule.startDate && schedule.endDate && schedule.endDate < schedule.startDate) return 'endDate avant startDate.'
  return null
}
const inPast = (schedule: Partial<CheckScheduleResponse>) => schedule.mode === 'ONCE' && new Date(`${schedule.date}T${schedule.time}`) < new Date()

export function checkScheduleHandlers(api: (path: string) => string, problem: Problem) {
  return [
    http.get(api('/checks/schedules'), () => HttpResponse.json(schedules)),
    http.get(api('/checks/schedules/:id'), ({ params }) => {
      const schedule = schedules.find((item) => item.id === String(params.id))
      return schedule ? HttpResponse.json(schedule) : problem(404, 'NOT_FOUND', 'Le programme n’existe pas.')
    }),
    http.post(api('/checks/schedules'), async ({ request }) => {
      const payload = (await request.json()) as CreateCheckScheduleRequest
      const error = invalid(payload)
      if (error) return problem(400, 'VALIDATION_FAILED', error)
      if (inPast(payload)) return problem(422, 'CHECK_SCHEDULE_IN_PAST', 'Ce moment est déjà passé.')
      const schedule: CheckScheduleResponse = { ...payload, id: `cks_${Date.now()}`, teamIds: payload.teamIds ?? [], active: payload.active ?? true, createdBy: 'user-1', createdAt: now(), updatedAt: now() }
      schedules.unshift(schedule)
      return HttpResponse.json(schedule, { status: 201 })
    }),
    http.patch(api('/checks/schedules/:id'), async ({ params, request }) => {
      const index = schedules.findIndex((item) => item.id === String(params.id))
      if (index < 0) return problem(404, 'NOT_FOUND', 'Le programme n’existe pas.')
      const payload = (await request.json()) as UpdateCheckScheduleRequest
      const current = { ...schedules[index]! }
      if (payload.mode && payload.mode !== current.mode) {
        for (const field of allModeFields) if (!(modeFields[payload.mode] as readonly string[]).includes(field)) delete current[field]
      }
      const updated = { ...current, ...payload, updatedAt: now() }
      const error = invalid(updated)
      if (error) return problem(400, 'VALIDATION_FAILED', error)
      if ((payload.date || payload.time || payload.mode) && inPast(updated)) return problem(422, 'CHECK_SCHEDULE_IN_PAST', 'Ce moment est déjà passé.')
      schedules[index] = updated
      return HttpResponse.json(updated)
    }),
    http.delete(api('/checks/schedules/:id'), ({ params }) => {
      const index = schedules.findIndex((item) => item.id === String(params.id))
      if (index < 0) return problem(404, 'NOT_FOUND', 'Le programme n’existe pas.')
      schedules.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
