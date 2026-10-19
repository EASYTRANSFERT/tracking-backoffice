import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getCurrentPosition, reverseGeocode, suggestLocations } from '@/Services/geocoding.service'
import type { GeocodingResult, GeoPosition } from '@/types/geocoding'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 350

export const useGeocodingStore = defineStore('geocoding', () => {
  // Chaque champ de recherche a sa propre clé pour ne pas mélanger les suggestions.
  const suggestions = ref<Record<string, GeocodingResult[]>>({})
  const loading = ref<Record<string, boolean>>({})
  const errors = ref<Record<string, string | null>>({})
  const cache = new Map<string, GeocodingResult[]>()
  const timers = new Map<string, number>()
  const controllers = new Map<string, AbortController>()

  function cancel(key: string) {
    window.clearTimeout(timers.get(key))
    timers.delete(key)
    controllers.get(key)?.abort()
    controllers.delete(key)
    loading.value[key] = false
  }

  function requestSuggestions(key: string, query: string) {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ')
    cancel(key)
    errors.value[key] = null

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      suggestions.value[key] = []
      return
    }

    const cached = cache.get(normalizedQuery.toLocaleLowerCase('fr'))
    if (cached) {
      suggestions.value[key] = cached
      return
    }

    loading.value[key] = true
    timers.set(key, window.setTimeout(() => void fetchSuggestions(key, normalizedQuery), DEBOUNCE_MS))
  }

  async function fetchSuggestions(key: string, query: string) {
    const controller = new AbortController()
    controllers.set(key, controller)

    try {
      const results = await suggestLocations(query, controller.signal)
      cache.set(query.toLocaleLowerCase('fr'), results)
      suggestions.value[key] = results
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      suggestions.value[key] = []
      errors.value[key] = error instanceof Error ? error.message : 'La recherche du lieu a échoué.'
    } finally {
      if (controllers.get(key) === controller) {
        controllers.delete(key)
        loading.value[key] = false
      }
    }
  }

  function clearSuggestions(key: string) {
    cancel(key)
    delete suggestions.value[key]
    delete errors.value[key]
    delete loading.value[key]
  }

  async function findAddress(position: GeoPosition): Promise<string | null> {
    try {
      const result = await reverseGeocode(position)
      return result?.displayName ?? null
    } catch {
      return null
    }
  }

  function locateCurrentPosition(): Promise<GeoPosition> {
    return getCurrentPosition()
  }

  return {
    suggestions,
    loading,
    errors,
    requestSuggestions,
    clearSuggestions,
    findAddress,
    locateCurrentPosition,
  }
})
