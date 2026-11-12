import { computed, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

/** Tailles de page proposées dans le sélecteur « Lignes par page » du pied de tableau. */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

/** Pagination côté client d'une liste déjà chargée, à brancher sur AppTableFooter (mode numéroté). */
export function usePagination<T>(items: Ref<T[]>, defaultPageSize: MaybeRefOrGetter<number> = 6) {
  const page = ref(1)
  // Taille modifiable par l'utilisateur ; repart de la valeur par défaut si elle change.
  const pageSize = ref(toValue(defaultPageSize))
  watch(() => toValue(defaultPageSize), (size) => { pageSize.value = size })
  // La taille par défaut du tableau doit toujours figurer dans les choix proposés.
  const pageSizeOptions = computed(() => [...new Set([...PAGE_SIZE_OPTIONS, pageSize.value])].sort((a, b) => a - b))

  const total = computed(() => items.value.length)
  const pageCount = computed(() => Math.max(Math.ceil(total.value / pageSize.value), 1))
  const start = computed(() => (page.value - 1) * pageSize.value)
  const end = computed(() => Math.min(start.value + pageSize.value, total.value))
  const displayed = computed(() => items.value.slice(start.value, end.value))

  // Liste raccourcie (filtre, suppression) : on revient sur une page qui existe encore.
  watch(pageCount, (count) => { if (page.value > count) page.value = count })
  // Nouvelle taille de page : on repart de la première page.
  watch(pageSize, () => { page.value = 1 })

  /** Tout ce dont AppTableFooter a besoin (hors `label`) : `<AppTableFooter v-bind="footerProps" label="…" />`. */
  const footerProps = computed(() => ({
    page: page.value,
    pageCount: pageCount.value,
    start: start.value + 1,
    end: end.value,
    total: total.value,
    pageSize: pageSize.value,
    pageSizeOptions: pageSizeOptions.value,
    'onUpdate:page': (value: number) => { page.value = value },
    'onUpdate:pageSize': (value: number) => { pageSize.value = value },
  }))

  return { page, pageCount, start, end, total, displayed, pageSize, pageSizeOptions, footerProps }
}
