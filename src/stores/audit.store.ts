import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useCursorPages } from '@/composables/useCursorPages'
import { auditService } from '@/Services/audit.service'
import { tenantService } from '@/Services/tenant.service'
import { listAllPages } from '@/utils/pagination'
import type { AuditLogListQuery, AuditLogResponse } from '@/types/audit'
import type { TenantResponse } from '@/types/platform'

export type AuditFilters = Omit<AuditLogListQuery, 'cursor' | 'limit'>

export const AUDIT_PAGE_SIZES = [25, 50, 100, 200]

export const useAuditStore = defineStore('audit', () => {
  const filters = ref<AuditFilters>({})
  const pageSize = ref(50)
  const tenants = ref<TenantResponse[]>([])
  /** Les actions rencontrées alimentent les suggestions du filtre, la liste de l'API n'étant pas fermée. */
  const seenActions = ref<string[]>([])

  const pages = useCursorPages<AuditLogResponse>(async (cursor) => {
    const response = await auditService.list({ ...activeFilters(), cursor, limit: pageSize.value })
    seenActions.value = [...new Set([...seenActions.value, ...response.items.map((log) => log.action)])].sort()
    return response
  })
  const { items: logs, page, nextCursor, isLoading, hasNext, hasPrevious } = pages

  const tenantName = (id: string) => tenants.value.find((tenant) => tenant.id === id)?.name ?? null

  /** Repart de la première page avec de nouveaux filtres ou une nouvelle taille de page. */
  async function loadLogs(nextFilters: AuditFilters = filters.value, nextPageSize = pageSize.value) {
    filters.value = { ...nextFilters }
    pageSize.value = nextPageSize
    await pages.first()
  }

  const nextPage = () => pages.next()
  const previousPage = () => pages.previous()

  /** Opérateur : noms des entreprises pour le filtre et la colonne « Entreprise ». */
  async function loadTenants() {
    if (tenants.value.length) return
    tenants.value = await listAllPages((query) => tenantService.list(query))
  }

  function activeFilters() {
    return Object.fromEntries(Object.entries(filters.value).filter(([, value]) => Boolean(value))) as AuditFilters
  }

  function resetData() {
    pages.reset()
    filters.value = {}
    tenants.value = []
    seenActions.value = []
  }

  return {
    logs, filters, pageSize, page, nextCursor, tenants, isLoading, seenActions, hasNext, hasPrevious,
    tenantName, loadLogs, nextPage, previousPage, loadTenants, resetData,
  }
})
