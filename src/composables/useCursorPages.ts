import { computed, ref, type Ref } from 'vue'

interface CursorPage<T> {
  items: T[]
  nextCursor?: string | null
}

/**
 * Pagination serveur par curseur, à brancher sur AppTableFooter (mode cursor).
 * L'API ne sait pas reculer : on garde le curseur de chaque page déjà vue.
 */
export function useCursorPages<T>(fetchPage: (cursor: string | undefined) => Promise<CursorPage<T>>) {
  const items = ref<T[]>([]) as Ref<T[]>
  const page = ref(1)
  const nextCursor = ref<string | null>(null)
  /** Curseur de chaque page déjà vue (undefined pour la première). */
  const cursorHistory = ref<(string | undefined)[]>([])
  const isLoading = ref(false)

  const hasNext = computed(() => nextCursor.value !== null)
  const hasPrevious = computed(() => page.value > 1)

  async function load(cursor: string | undefined) {
    isLoading.value = true
    try {
      const response = await fetchPage(cursor)
      items.value = response.items
      nextCursor.value = response.nextCursor ?? null
      return response
    } finally {
      isLoading.value = false
    }
  }

  /** Repart de la première page (nouveaux filtres, nouvelle taille de page). */
  async function first() {
    const response = await load(undefined)
    cursorHistory.value = [undefined]
    page.value = 1
    return response
  }

  async function next() {
    if (!nextCursor.value) return
    const cursor = nextCursor.value
    const response = await load(cursor)
    cursorHistory.value.push(cursor)
    page.value += 1
    return response
  }

  async function previous() {
    if (page.value <= 1) return
    const response = await load(cursorHistory.value[page.value - 2])
    cursorHistory.value.pop()
    page.value -= 1
    return response
  }

  function reset() {
    items.value = []
    page.value = 1
    nextCursor.value = null
    cursorHistory.value = []
  }

  return { items, page, nextCursor, isLoading, hasNext, hasPrevious, first, next, previous, reset }
}
