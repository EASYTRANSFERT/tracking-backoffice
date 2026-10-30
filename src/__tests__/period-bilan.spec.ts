import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { periodService } from '@/Services/period.service'
import { usePeriodBilanStore } from '@/stores/period-bilan.store'
import { reportErrorMessage, reportFilename } from '@/utils/period-report'
import * as download from '@/utils/download'
import type { PeriodTotalsResponse } from '@/types/period'

const apiError = (status: number, data: unknown) => new AxiosError('error', 'ERR_BAD_REQUEST', undefined, undefined, { status, data } as AxiosResponse)
const counters = { sessionsCount: 0, workedMinutes: 0, lateMinutes: 0, absencesCount: 0 }
const totals: PeriodTotalsResponse = {
  period: { periodId: 'per_1', teamId: 'tea_1', teamName: 'Équipe Plateau', from: '2026-10-01', to: '2026-10-31', state: 'OPEN', final: false, pending: 0, open: 0, forced: false, unvalidatedCount: 0 },
  agents: [], team: { ...counters, agents: 0, daysWorked: 0 }, sites: [],
}

describe('period report', () => {
  it('builds the file name from the team and the dates', () => {
    expect(reportFilename(totals.period, 'xlsx')).toBe('bilan-equipe-plateau-2026-10-01-2026-10-31.xlsx')
    expect(reportFilename({ ...totals.period, teamName: '' }, 'pdf')).toBe('bilan-equipe-2026-10-01-2026-10-31.pdf')
  })

  it('shows « Bilan trop volumineux » for EXPORT_ROW_LIMIT_EXCEEDED', () => {
    expect(reportErrorMessage(apiError(422, { code: 'EXPORT_ROW_LIMIT_EXCEEDED', detail: 'Trop de lignes' }))).toBe('Bilan trop volumineux')
  })

  it('explains a 404', () => {
    expect(reportErrorMessage(apiError(404, {}))).toMatch(/introuvable ou hors périmètre/)
  })
})

describe('period bilan store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('downloads the report as a blob under the built file name', async () => {
    vi.spyOn(periodService, 'totals').mockResolvedValue(totals)
    const report = vi.spyOn(periodService, 'report').mockResolvedValue(new Blob(['x']))
    const open = vi.spyOn(download, 'openDownload').mockImplementation(() => undefined)
    URL.createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:x')
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    const store = usePeriodBilanStore()
    await store.loadTotals('per_1')
    await store.downloadReport('per_1', 'xlsx')
    expect(report).toHaveBeenCalledWith('per_1', 'xlsx')
    expect(open).toHaveBeenCalledWith('blob:x', 'bilan-equipe-plateau-2026-10-01-2026-10-31.xlsx')
    expect(store.downloading).toBeNull()
  })

  it('resets the loading indicator when the download fails', async () => {
    vi.spyOn(periodService, 'totals').mockResolvedValue(totals)
    vi.spyOn(periodService, 'report').mockRejectedValue(apiError(422, { code: 'EXPORT_ROW_LIMIT_EXCEEDED' }))
    const store = usePeriodBilanStore()
    await store.loadTotals('per_1')
    await expect(store.downloadReport('per_1', 'pdf')).rejects.toThrow(/.+/)
    expect(store.downloading).toBeNull()
  })
})
