import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { missionService } from '@/Services/mission.service'
import { useMissionOverviewStore } from '@/stores/mission-overview.store'
import { formatMinutes } from '@/utils/duration'

describe('formatMinutes', () => {
  it('shows minutes as hours and minutes', () => {
    expect(formatMinutes(465)).toBe('7 h 45')
    expect(formatMinutes(0)).toBe('0 h 00')
    expect(formatMinutes(60)).toBe('1 h 00')
    expect(formatMinutes(undefined)).toBe('—')
  })
})

describe('mission overview store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('loads the overview of a mission over the chosen window', async () => {
    const body = { sites: [], teams: [] }
    const spy = vi.spyOn(missionService, 'overview').mockResolvedValue(body)
    const store = useMissionOverviewStore()
    await store.load('mis_1', { from: '2026-08-01', to: '2026-10-30' })
    expect(spy).toHaveBeenCalledWith('mis_1', { from: '2026-08-01', to: '2026-10-30' })
    expect(store.overview).toEqual(body)
    expect(store.isLoading).toBe(false)
  })

  it('clears the loading flag when the API refuses the window', async () => {
    vi.spyOn(missionService, 'overview').mockRejectedValue(new Error('VALIDATION_FAILED'))
    const store = useMissionOverviewStore()
    await expect(store.load('mis_1', {})).rejects.toThrow(/.+/)
    expect(store.isLoading).toBe(false)
    expect(store.overview).toBeNull()
  })
})
