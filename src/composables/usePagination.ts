import { computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

/** Pagination côté client d'une liste déjà chargée, à brancher sur AppTableFooter (mode numéroté). */
export function usePagination<T>(items: Ref<T[]>, pageSize: MaybeRefOrGetter<number> = 6) {
  const page = ref(1)
  const total = computed(() => items.value.length)
  const pageCount = computed(() => Math.max(Math.ceil(total.value / toValue(pageSize)), 1))
  const start = computed(() => (page.value - 1) * toValue(pageSize))
  const end = computed(() => Math.min(start.value + toValue(pageSize), total.value))
  const displayed = computed(() => items.value.slice(start.value, end.value))

  // Liste raccourcie (filtre, suppression) : on revient sur une page qui existe encore.
  watch(pageCount, (count) => { if (page.value > count) page.value = count })

  return { page, pageCount, start, end, total, displayed }
}
