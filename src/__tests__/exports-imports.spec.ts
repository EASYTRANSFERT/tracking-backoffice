import { AxiosError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { exportService } from '@/Services/export.service'
import { useExportStore } from '@/stores/export.store'
import { readRejectedAssignmentReport } from '@/utils/assignment-import'
import * as download from '@/utils/download'
import type { ExportResponse } from '@/types/export'

const exportItem = (status: string, extra: Partial<ExportResponse> = {}): ExportResponse => ({
  id: 'exp_1', type: 'ASSIGNMENTS', format: 'XLSX', status, params: {}, createdAt: '2026-10-29T08:00:00.000Z', availableUntil: '2026-11-05T08:00:00.000Z', ...extra,
})

function unprocessable(data: unknown) {
  return new AxiosError('rejected', 'ERR_BAD_REQUEST', undefined, undefined, { status: 422, data } as AxiosResponse)
}

describe('export store', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('polls until READY, then downloads the signed URL', async () => {
    vi.spyOn(exportService, 'requestAssignments').mockResolvedValue(exportItem('PENDING'))
    const findOne = vi.spyOn(exportService, 'findOne').mockResolvedValueOnce(exportItem('RUNNING')).mockResolvedValueOnce(exportItem('READY'))
    vi.spyOn(exportService, 'download').mockResolvedValue({ url: 'https://files/x', expiresIn: 300, filename: 'planning.xlsx' })
    const open = vi.spyOn(download, 'openDownload').mockImplementation(() => undefined)

    const store = useExportStore()
    const promise = store.exportAssignments({ format: 'XLSX' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toMatchObject({ status: 'READY' })
    expect(findOne).toHaveBeenCalledTimes(2)
    expect(open).toHaveBeenCalledWith('https://files/x', 'planning.xlsx')
    expect(store.isExporting).toBe(false)
  })

  it('explains a FAILED export from its errorCode and never downloads', async () => {
    vi.spyOn(exportService, 'requestAssignments').mockResolvedValue(exportItem('PENDING'))
    vi.spyOn(exportService, 'findOne').mockResolvedValue(exportItem('FAILED', { errorCode: 'EXPORT_ROW_LIMIT_EXCEEDED' }))
    const downloadSpy = vi.spyOn(exportService, 'download')

    const outcome = useExportStore().exportAssignments({ format: 'PDF' }).catch((error: Error) => error)
    await vi.runAllTimersAsync()

    expect(await outcome).toMatchObject({ message: expect.stringMatching(/5 000 en PDF/) })
    expect(downloadSpy).not.toHaveBeenCalled()
  })
})

describe('readRejectedAssignmentReport', () => {
  it('reads the report of a 422 from the problem root or its extensions', () => {
    const rejected = [{ rowNumber: 3, reason: 'SITE_UNKNOWN', matricule: 'AG-1', site: 'X', date: '', start: '', end: '' }]
    expect(readRejectedAssignmentReport(unprocessable({ read: 4, rejected }))).toEqual({ read: 4, planned: 0, rejected, applied: false })
    expect(readRejectedAssignmentReport(unprocessable({ extensions: { read: 4, rejected } }))?.rejected).toEqual(rejected)
  })

  it('ignores other errors', () => {
    expect(readRejectedAssignmentReport(new Error('boom'))).toBeNull()
    expect(readRejectedAssignmentReport(unprocessable({ detail: 'x' }))).toBeNull()
  })
})
