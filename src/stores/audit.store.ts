import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { auditService } from '@/Services/audit.service'
import { tenantService } from '@/Services/tenant.service'
import { listAllPages } from '@/utils/pagination'
import type { AuditLogListQuery, AuditLogResponse } from '@/types/audit'
import type { TenantResponse } from '@/types/platform'

export type AuditFilters = Omit<AuditLogListQuery, 'cursor' | 'limit'>

export const AUDIT_PAGE_SIZES = [25, 50, 100, 200]

export const useAuditStore = defineStore('audit', () => {
  const logs = ref<AuditLogResponse[]>([])
  const filters = ref<AuditFilters>({})
  const pageSize = ref(50)
  const page = ref(1)
  const nextCursor = ref<string | null>(null)
  /** Curseur de chaque page déjà vue (undefined pour la première) : l'API ne sait pas reculer. */
  const cursorHistory = ref<(string | undefined)[]>([])
  const tenants = ref<TenantResponse[]>([])
  const isLoading = ref(false)
  /** Les actions rencontrées alimentent les suggestions du filtre, la liste de l'API n'étant pas fermée. */
  const seenActions = ref<string[]>([])

  const hasNext = computed(() => nextCursor.value !== null)
  const hasPrevious = computed(() => page.value > 1)
  const tenantName = (id: string) => tenants.value.find((tenant) => tenant.id === id)?.name ?? null

  async function fetchPage(cursor: string | undefined) {
    isLoading.value = true
    try {
      const response = await auditService.list({ ...activeFilters(), cursor, limit: pageSize.value })
      logs.value = response.items
      nextCursor.value = response.nextCursor ?? null
      seenActions.value = [...new Set([...seenActions.value, ...response.items.map((log) => log.action)])].sort()
    } finally {
      isLoading.value = false
    }
  }

  /** Repart de la première page avec de nouveaux filtres ou une nouvelle taille de page. */
  async function loadLogs(nextFilters: AuditFilters = filters.value, nextPageSize = pageSize.value) {
    filters.value = { ...nextFilters }
    pageSize.value = nextPageSize
    await fetchPage(undefined)
    cursorHistory.value = [undefined]
    page.value = 1
  }

  async function nextPage() {
    if (!nextCursor.value) return
    const cursor = nextCursor.value
    await fetchPage(cursor)
    cursorHistory.value.push(cursor)
    page.value += 1
  }

  async function previousPage() {
    if (page.value <= 1) return
    await fetchPage(cursorHistory.value[page.value - 2])
    cursorHistory.value.pop()
    page.value -= 1
  }

  /** Opérateur : noms des entreprises pour le filtre et la colonne « Entreprise ». */
  async function loadTenants() {
    if (tenants.value.length) return
    tenants.value = await listAllPages((query) => tenantService.list(query))
  }

  function activeFilters() {
    return Object.fromEntries(Object.entries(filters.value).filter(([, value]) => Boolean(value))) as AuditFilters
  }

  function resetData() {
    logs.value = []
    filters.value = {}
    page.value = 1
    nextCursor.value = null
    cursorHistory.value = []
    tenants.value = []
    seenActions.value = []
  }

  return {
    logs, filters, pageSize, page, nextCursor, tenants, isLoading, seenActions, hasNext, hasPrevious,
    tenantName, loadLogs, nextPage, previousPage, loadTenants, resetData,
  }
})
