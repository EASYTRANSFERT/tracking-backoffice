import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { adjustmentService } from '@/Services/adjustment.service'
import { periodService } from '@/Services/period.service'
import { sessionService } from '@/Services/session.service'
import { useAdjustmentStore } from '@/stores/adjustment.store'
import { adjustmentChanges, adjustmentErrorMessage, buildAdjustmentRequest, isPeriodClosed, toLocalInput } from '@/utils/adjustment-format'
import type { AdjustedValues, AdjustmentResponse } from '@/types/adjustment'
import type { WorkSessionResponse } from '@/types/attendance'

const session = (extra: Partial<WorkSessionResponse> = {}): WorkSessionResponse => ({
  id: 'ses_1', userId: 'usr_1', siteId: 'sit_1', inAt: '2026-10-27T07:30:00.000Z', outAt: '2026-10-27T15:00:00.000Z', minutes: 450, lateMin: 30,
  flags: [], status: 'CLOSED', validation: 'PENDING', rulesVersion: '2026.10', periodId: 'per_1', ...extra,
})
const values = (extra: Partial<AdjustedValues> = {}): AdjustedValues => ({ inAt: '2026-10-27T07:30:00.000Z', outAt: '2026-10-27T15:00:00.000Z', minutes: 450, lateMin: 30, status: 'CLOSED', validation: 'PENDING', ...extra })
const adjustment = (extra: Partial<AdjustmentResponse> = {}): AdjustmentResponse => ({
  id: 'adj_1', sessionId: 'ses_1', periodId: 'per_1', before: values(), after: values({ inAt: '2026-10-27T07:02:00.000Z', minutes: 478, lateMin: 2, validation: 'CORRECTED' }), reason: 'Badge oublié', authorId: 'usr_9', createdAt: '2026-10-28T08:00:00.000Z', ...extra,
})
const apiError = (code: string) => new AxiosError('refused', 'ERR', undefined, undefined, { status: 409, data: { code } } as AxiosResponse)

describe('adjustmentChanges', () => {
  it('lists only the fields that changed, before and after', () => {
    const changes = adjustmentChanges(adjustment())
    expect(changes.map((change) => change.key)).toEqual(['inAt', 'minutes', 'lateMin', 'validation'])
    expect(changes.find((change) => change.key === 'validation')).toMatchObject({ before: 'À valider', after: 'Régularisée' })
    expect(changes.find((change) => change.key === 'minutes')).toMatchObject({ before: '7 h 30', after: '7 h 58' })
  })

  it('treats the same instant written differently as unchanged', () => {
    const same = adjustment({ after: values({ inAt: '2026-10-27T07:30:00Z' }) })
    expect(adjustmentChanges(same)).toEqual([])
  })
})

describe('buildAdjustmentRequest', () => {
  const form = (extra = {}) => ({ inAt: toLocalInput(session().inAt), outAt: toLocalInput(session().outAt), lateMin: 30, reason: 'Badge oublié', ...extra })

  it('requires a reason', () => {
    expect(buildAdjustmentRequest(session(), form({ reason: '  ' }))).toEqual({ error: 'Indiquez le motif de la régularisation.' })
  })

  it('refuses a correction that changes nothing', () => {
    expect(buildAdjustmentRequest(session(), form())).toEqual({ error: 'Modifiez au moins l’entrée, la sortie ou le retard.' })
  })

  it('sends only the changed fields, with the trimmed reason', () => {
    const result = buildAdjustmentRequest(session(), form({ inAt: '2026-10-27T08:00', lateMin: '0', reason: ' Badge oublié ' }))
    expect(result).toEqual({ request: { inAt: new Date('2026-10-27T08:00').toISOString(), lateMin: 0, reason: 'Badge oublié' } })
  })

  it('refuses an exit before the entry and an invalid delay', () => {
    expect(buildAdjustmentRequest(session(), form({ outAt: '2000-01-01T00:00' }))).toEqual({ error: 'La sortie doit être postérieure à l’entrée.' })
    expect(buildAdjustmentRequest(session(), form({ lateMin: 1441 }))).toMatchObject({ error: expect.stringContaining('0 à 1 440') })
    expect(buildAdjustmentRequest(session(), form({ lateMin: 2.5 }))).toMatchObject({ error: expect.any(String) })
  })

  it('needs an exit to regularise an open session', () => {
    const open = session({ status: 'OPEN', outAt: undefined, minutes: undefined })
    expect(buildAdjustmentRequest(open, { inAt: toLocalInput(open.inAt), outAt: '', lateMin: 5, reason: 'x' })).toMatchObject({ error: expect.stringContaining('sortie') })
    expect(buildAdjustmentRequest(open, { inAt: toLocalInput(open.inAt), outAt: '2026-10-27T15:00', lateMin: 30, reason: 'x' })).toMatchObject({ request: { outAt: new Date('2026-10-27T15:00').toISOString() } })
  })
})

describe('helpers', () => {
  it('maps adjustment error codes and detects a closed period', () => {
    expect(adjustmentErrorMessage(apiError('PERIOD_CLOSED'))).toContain('clôturée')
    expect(adjustmentErrorMessage(apiError('SOMETHING_ELSE'))).toBeNull()
    expect(isPeriodClosed({ state: 'CLOSED' })).toBe(true)
    expect(isPeriodClosed({ state: 'CLOSING' })).toBe(true)
    expect(isPeriodClosed({ state: 'IN_VALIDATION' })).toBe(false)
    expect(isPeriodClosed(null)).toBe(false)
  })
})

describe('adjustment store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.restoreAllMocks())

  it('selects a session, loading its history and its period', async () => {
    vi.spyOn(adjustmentService, 'list').mockResolvedValue([adjustment()])
    vi.spyOn(periodService, 'findOne').mockResolvedValue({ id: 'per_1', from: '2026-10-01', to: '2026-10-31', state: 'CLOSED', createdBy: 'usr_1' })

    const store = useAdjustmentStore()
    await store.select(session())

    expect(store.history).toHaveLength(1)
    expect(store.isLocked()).toBe(true)
  })

  it('does not lock a session whose period is unknown or still open', async () => {
    vi.spyOn(adjustmentService, 'list').mockResolvedValue([])
    const findOne = vi.spyOn(periodService, 'findOne').mockRejectedValue(new Error('403'))

    const store = useAdjustmentStore()
    await store.select(session())
    expect(findOne).toHaveBeenCalled()
    expect(store.isLocked()).toBe(false)

    await store.select(session({ periodId: undefined }))
    expect(store.isLocked()).toBe(false)
  })

  it('regularizes the selected session, appends it to the history and refreshes the session', async () => {
    vi.spyOn(adjustmentService, 'list').mockResolvedValue([])
    vi.spyOn(periodService, 'findOne').mockResolvedValue({ id: 'per_1', from: '2026-10-01', to: '2026-10-31', state: 'OPEN', createdBy: 'usr_1' })
    const create = vi.spyOn(adjustmentService, 'create').mockResolvedValue(adjustment())
    vi.spyOn(sessionService, 'findOne').mockResolvedValue(session({ validation: 'CORRECTED', lateMin: 2 }))

    const store = useAdjustmentStore()
    await store.select(session())
    await store.regularize({ lateMin: 2, reason: 'Badge oublié' })

    expect(create).toHaveBeenCalledWith('ses_1', { lateMin: 2, reason: 'Badge oublié' })
    expect(store.history).toHaveLength(1)
    expect(store.selected).toMatchObject({ validation: 'CORRECTED', lateMin: 2 })
  })

  it('searches sessions with the filters and pages with the cursor', async () => {
    const list = vi.spyOn(sessionService, 'list')
      .mockResolvedValueOnce({ items: [session()], nextCursor: 'c2' })
      .mockResolvedValueOnce({ items: [session({ id: 'ses_2' })], nextCursor: null })

    const store = useAdjustmentStore()
    await store.search({ userId: 'usr_1' })
    expect(list).toHaveBeenLastCalledWith({ userId: 'usr_1', limit: 50 })
    expect(store.nextCursor).toBe('c2')

    await store.loadMore()
    expect(list).toHaveBeenLastCalledWith({ userId: 'usr_1', limit: 50, cursor: 'c2' })
    expect(store.results.map((item) => item.id)).toEqual(['ses_1', 'ses_2'])
    expect(store.nextCursor).toBeNull()
  })
})
