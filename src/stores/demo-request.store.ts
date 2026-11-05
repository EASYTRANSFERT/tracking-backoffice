import { ref } from 'vue'
import { defineStore } from 'pinia'

import { useCursorPages } from '@/composables/useCursorPages'
import { demoRequestService } from '@/Services/demo-request.service'
import type { DemoRequestListQuery, DemoRequestResponse, UpdateDemoRequestRequest } from '@/types/demo-request'

export type DemoRequestFilters = Omit<DemoRequestListQuery, 'cursor' | 'limit'>

export const DEMO_REQUEST_PAGE_SIZES = [25, 50, 100, 200]

export const useDemoRequestStore = defineStore('demo-request', () => {
  const filters = ref<DemoRequestFilters>({})
  const pageSize = ref(50)
  const isSaving = ref(false)

  const pages = useCursorPages<DemoRequestResponse>((cursor) => demoRequestService.list({ ...activeFilters(), cursor, limit: pageSize.value }))
  const { items: requests, page, isLoading, hasNext, hasPrevious } = pages

  /** Repart de la première page avec de nouveaux filtres ou une nouvelle taille de page. */
  async function loadRequests(nextFilters: DemoRequestFilters = filters.value, nextPageSize = pageSize.value) {
    filters.value = { ...nextFilters }
    pageSize.value = nextPageSize
    await pages.first()
  }

  const nextPage = () => pages.next()
  const previousPage = () => pages.previous()

  /** Version à jour (historique compris), reportée dans la liste. */
  async function fetchRequest(id: string) {
    const request = await demoRequestService.findOne(id)
    replace(request)
    return request
  }

  async function updateRequest(id: string, payload: UpdateDemoRequestRequest) {
    isSaving.value = true
    try {
      const request = await demoRequestService.update(id, payload)
      replace(request)
      return request
    } finally {
      isSaving.value = false
    }
  }

  function replace(request: DemoRequestResponse) {
    requests.value = requests.value.map((item) => item.id === request.id ? request : item)
  }

  function activeFilters() {
    return Object.fromEntries(Object.entries(filters.value).filter(([, value]) => Boolean(value))) as DemoRequestFilters
  }

  function resetData() {
    pages.reset()
    filters.value = {}
  }

  return {
    requests, filters, pageSize, page, isLoading, isSaving, hasNext, hasPrevious,
    loadRequests, nextPage, previousPage, fetchRequest, updateRequest, resetData,
  }
})
