import { ref } from 'vue'
import { defineStore } from 'pinia'

import { searchLocations } from '@/Services/geocoding.service'
import type { GeocodingResult } from '@/types/geocoding'

const MIN_REQUEST_INTERVAL_MS = 1_000

export const useGeocodingStore = defineStore('geocoding', () => {
  const results = ref<GeocodingResult[]>([])
  const isSearching = ref(false)
  const errorMessage = ref<string | null>(null)
  const cache = new Map<string, GeocodingResult[]>()

  let lastRequestAt = 0
  let activeController: AbortController | null = null

  async function search(query: string) {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ')
    errorMessage.value = null

    if (normalizedQuery.length < 3) {
      results.value = []
      errorMessage.value = 'Saisissez au moins 3 caractères.'
      return
    }

    activeController?.abort()
    activeController = null
    isSearching.value = false

    const cacheKey = normalizedQuery.toLocaleLowerCase('fr')
    const cachedResults = cache.get(cacheKey)
    if (cachedResults) {
      results.value = cachedResults
      return
    }

    const controller = new AbortController()
    activeController = controller
    isSearching.value = true

    try {
      const waitTime = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt))
      if (waitTime > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, waitTime))
      }

      lastRequestAt = Date.now()
      const foundLocations = await searchLocations(normalizedQuery, controller.signal)
      cache.set(cacheKey, foundLocations)
      results.value = foundLocations

      if (!foundLocations.length) {
        errorMessage.value = 'Aucun lieu ne correspond à cette recherche.'
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      results.value = []
      errorMessage.value = error instanceof Error
        ? error.message
        : 'La recherche du lieu a échoué.'
    } finally {
      if (activeController === controller) isSearching.value = false
    }
  }

  function clearResults() {
    activeController?.abort()
    activeController = null
    isSearching.value = false
    results.value = []
    errorMessage.value = null
  }

  return { results, isSearching, errorMessage, search, clearResults }
})
