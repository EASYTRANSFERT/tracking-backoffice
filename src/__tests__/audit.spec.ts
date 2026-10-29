import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { auditTargetRoute, dayBoundToIso, parseAuditTarget } from '@/Components/audit/audit-format'
import { auditService } from '@/Services/audit.service'
import { useAuditStore } from '@/stores/audit.store'
import type { AuditLogResponse } from '@/types/audit'

const log = (id: string) => ({ id, tenantId: 't', action: 'A', target: 'user:u', outcome: 'SUCCESS', at: '2026-10-01T00:00:00Z' }) as AuditLogResponse

describe('audit store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('goes forward and back through cursor pages, keeping the filters', async () => {
    const pages: Record<string, { items: AuditLogResponse[]; nextCursor: string | null }> = {
      first: { items: [log('1')], nextCursor: 'b' },
      b: { items: [log('2')], nextCursor: 'c' },
      c: { items: [log('3')], nextCursor: null },
    }
    const list = vi.spyOn(auditService, 'list').mockImplementation(async (query) => pages[query?.cursor ?? 'first']!)
    const store = useAuditStore()

    await store.loadLogs({ action: 'A', outcome: undefined }, 25)
    await store.nextPage()
    await store.nextPage()
    expect(store.page).toBe(3)
    expect(store.hasNext).toBe(false)

    await store.previousPage()
    expect(store.page).toBe(2)
    expect(store.logs[0]!.id).toBe('2')
    await store.previousPage()
    expect(store.logs[0]!.id).toBe('1')
    expect(store.hasPrevious).toBe(false)
    expect(list).toHaveBeenLastCalledWith({ action: 'A', cursor: undefined, limit: 25 })
  })
})

describe('audit format', () => {
  it('splits a target into type and id', () => {
    expect(parseAuditTarget('device:dev_1')).toMatchObject({ type: 'device', typeLabel: 'Appareil', id: 'dev_1' })
    expect(parseAuditTarget('opaque')).toMatchObject({ type: '', id: 'opaque' })
  })

  it('links a target only for the role that has its detail page', () => {
    expect(auditTargetRoute('user:u1', 'administrator')).toEqual({ name: 'admin-user-details', params: { userId: 'u1' } })
    expect(auditTargetRoute('user:u1', 'operator')).toBeNull()
  })

  it('turns a day into inclusive local bounds', () => {
    expect(new Date(dayBoundToIso('2026-10-28', 'start')).getHours()).toBe(0)
    expect(new Date(dayBoundToIso('2026-10-28', 'end')).getMilliseconds()).toBe(999)
  })
})
