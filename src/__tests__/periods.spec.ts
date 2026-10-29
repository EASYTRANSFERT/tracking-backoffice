import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { periodService } from '@/Services/period.service'
import { useAuthStore } from '@/stores/auth.store'
import { usePeriodStore } from '@/stores/period.store'
import { dayInPeriods, formatPeriodDay, formatPeriodRange, periodErrorMessage, periodsOfTeams, readClosureBlockers } from '@/utils/period-format'
import type { PeriodResponse } from '@/types/period'

const period = (state: string, extra: Partial<PeriodResponse> = {}): PeriodResponse => ({ id: 'per_1', from: '2026-10-01', to: '2026-10-31', state, createdBy: 'usr_1', ...extra })

function apiError(status: number, data: unknown) {
  return new AxiosError('error', 'ERR_BAD_REQUEST', undefined, undefined, { status, data } as AxiosResponse)
}

describe('period formats', () => {
  it('formats a day without applying any timezone', () => {
    expect(formatPeriodDay('2026-10-31')).toBe('31/10/2026')
    expect(formatPeriodRange(period('OPEN'))).toBe('01/10/2026 → 31/10/2026')
    expect(formatPeriodDay(undefined)).toBe('—')
  })

  it('reads the closure blockers of a 422 from the root or its extensions', () => {
    const blockers = { pending: 3, open: 1, sampleSessionIds: ['ses_1'] }
    expect(readClosureBlockers(apiError(422, { code: 'PERIOD_NOT_CLOSABLE', ...blockers }))).toEqual(blockers)
    expect(readClosureBlockers(apiError(422, { extensions: { blockers } }))).toEqual(blockers)
    expect(readClosureBlockers(apiError(409, blockers))).toBeNull()
    expect(readClosureBlockers(new Error('boom'))).toBeNull()
  })

  it('translates the business error codes', () => {
    expect(periodErrorMessage(apiError(409, { code: 'PERIOD_OVERLAP' }))).toMatch(/chevauche/)
    expect(periodErrorMessage(apiError(500, { code: 'UNKNOWN' }))).toBeNull()
  })
})

describe('period store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('steps up, requests the closure and follows the period until it is closed', async () => {
    const stepUp = vi.spyOn(useAuthStore(), 'stepUp').mockResolvedValue()
    const close = vi.spyOn(periodService, 'close').mockResolvedValue(period('CLOSING'))
    const findOne = vi.spyOn(periodService, 'findOne').mockResolvedValueOnce(period('CLOSING')).mockResolvedValueOnce(period('CLOSED'))

    const store = usePeriodStore()
    const result = store.closePeriod('per_1', { force: true, reason: 'Contrôle terminé' }, '123456')
    await vi.runAllTimersAsync()

    await expect(result).resolves.toMatchObject({ state: 'CLOSED' })
    expect(stepUp).toHaveBeenCalledWith('123456')
    expect(close).toHaveBeenCalledWith('per_1', { force: true, reason: 'Contrôle terminé' })
    expect(findOne).toHaveBeenCalledTimes(2)
    expect(store.findPeriod('per_1')?.state).toBe('CLOSED')
  })

  it('skips the step-up when no code is given (recent step-up still valid)', async () => {
    const stepUp = vi.spyOn(useAuthStore(), 'stepUp')
    vi.spyOn(periodService, 'close').mockResolvedValue(period('CLOSED'))

    await usePeriodStore().closePeriod('per_1', { force: true, reason: 'Motif' })

    expect(stepUp).not.toHaveBeenCalled()
  })

  it('creates a period for the chosen team', async () => {
    const create = vi.spyOn(periodService, 'create').mockResolvedValue(period('OPEN', { teamId: 'tea_1' }))

    const store = usePeriodStore()
    await store.createPeriod('tea_1', '2026-10-01', '2026-10-31')

    expect(create).toHaveBeenCalledWith({ teamId: 'tea_1', from: '2026-10-01', to: '2026-10-31' })
    expect(store.findPeriod('per_1')?.teamId).toBe('tea_1')
  })
})

describe('periodsOfTeams', () => {
  it('keeps only the periods of the supervisor\'s teams', () => {
    const mine = period('OPEN', { id: 'per_mine', teamId: 'tea_1' })
    const other = period('OPEN', { id: 'per_other', teamId: 'tea_2' })
    const noTeam = period('OPEN', { id: 'per_none', teamId: undefined })

    expect(periodsOfTeams([mine, other, noTeam], new Set(['tea_1']))).toEqual([mine])
    expect(periodsOfTeams([mine, other], new Set())).toEqual([])
  })
})

describe('team planning days', () => {
  const periods = [period('OPEN', { from: '2026-10-01', to: '2026-10-31' }), period('CLOSED', { id: 'per_2', from: '2026-12-10', to: '2026-12-12' })]

  it('allows the days of a period, bounds included, and nothing else', () => {
    expect(dayInPeriods('2026-10-01', periods)).toBe(true)
    expect(dayInPeriods('2026-10-31', periods)).toBe(true)
    expect(dayInPeriods('2026-12-11', periods)).toBe(true)
    expect(dayInPeriods('2026-11-15', periods)).toBe(false)
    expect(dayInPeriods('2026-09-30', periods)).toBe(false)
    expect(dayInPeriods('2026-10-01', [])).toBe(false)
  })

  it('loads the periods of the team with the teamId query', async () => {
    setActivePinia(createPinia())
    const list = vi.spyOn(periodService, 'list').mockResolvedValue({ items: periods, nextCursor: null })

    const store = usePeriodStore()
    await store.loadTeamPeriods('tea_1')

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'tea_1' }))
    expect(store.teamPeriods['tea_1']).toEqual(periods)
    vi.restoreAllMocks()
  })
})
