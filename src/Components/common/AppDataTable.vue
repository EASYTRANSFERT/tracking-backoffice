<script setup lang="ts" generic="T extends object">
import { computed, ref, watch } from 'vue'
import { VCard } from 'vuetify/components/VCard'
import { usePagination } from '@/composables/usePagination'
import { matchesSearch } from '@/utils/search'
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppTableFooter from '@/Components/common/AppTableFooter.vue'

export interface AppDataTableColumn {
  /** Identifie la colonne : le contenu de la cellule se personnalise via le slot `cell-<key>`. */
  key: string
  title: string
  /** Classes de l'en-tête (ex. `w-16`). */
  class?: string
  /** En-tête masqué visuellement mais lu par les lecteurs d'écran (colonne d'actions). */
  srOnly?: boolean
  /** Classes appliquées à chaque cellule de la colonne (ex. `text-sm text-[#535865]`). */
  cellClass?: string
  /** Faux : la colonne n'est pas affichée (ex. colonne Site avec un seul site). */
  show?: boolean
}

/**
 * Tableau Vuetify unique de l'application : carte, en-tête, recherche, tableau, état vide
 * et pied de page (pagination + « Lignes par page »). Le contenu des cellules passe par
 * des slots : `#cell-<key>="{ item }"`, `#filters`, `#actions`.
 */
const props = withDefaults(defineProps<{
  items: T[]
  columns: AppDataTableColumn[]
  title?: string
  subtitle?: string
  /** Clé unique d'une ligne ; par défaut `id`. */
  itemKey?: string
  /** Texte(s) interrogé(s) par la recherche ; sans cette fonction, le champ de recherche n'apparaît pas. */
  searchText?: (item: T) => (string | null | undefined)[]
  searchPlaceholder?: string
  /** Libellé du pied de tableau (« équipes »). */
  label?: string
  /** Sans carte ni en-tête : le tableau s'insère dans la carte de la page (qui garde ses filtres). */
  bare?: boolean
  /** Faux : toutes les lignes sont affichées, sans pied de page (pagination gérée par le parent, ex. curseur serveur). */
  paginate?: boolean
  hideHeader?: boolean
  density?: 'default' | 'comfortable' | 'compact'
  pageSize?: number
  clickable?: boolean
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  /** Classes de la ligne, selon l'élément. */
  rowClass?: (item: T) => string | undefined
  /** Classes du tableau (ex. `min-w-[800px]`). */
  tableClass?: string
  /** Classes de l'en-tête de la carte (point de bascule en ligne selon la place des filtres). */
  headerClass?: string
  /** Chargement en cours : barre de progression, et pas d'état vide tant qu'on ne sait rien. */
  loading?: boolean
  /** Valeurs des filtres du parent : un changement ramène à la première page. */
  resetOn?: unknown[]
}>(), {
  headerClass: 'sm:flex-row sm:items-center',
  label: 'éléments',
  paginate: true,
  itemKey: 'id',
  searchPlaceholder: 'Rechercher',
  pageSize: 8,
  clickable: false,
  emptyTitle: 'Aucun résultat',
  emptyDescription: 'Aucun élément à afficher pour le moment.',
})

const emit = defineEmits<{
  'click:row': [item: T]
  /** La dernière page vient d'être atteinte : le parent peut charger la suite (liste partielle). */
  reachedEnd: []
}>()

const search = ref('')
const filtered = computed(() => {
  const textOf = props.searchText
  if (!textOf) return props.items
  return props.items.filter((item) => matchesSearch(search.value, ...textOf(item)))
})
const { page, pageCount, displayed: pageRows, footerProps } = usePagination(filtered, () => props.pageSize)
const rows = computed(() => (props.paginate ? pageRows.value : filtered.value))
watch(search, () => { page.value = 1 })
watch(() => props.resetOn?.join('|'), () => { page.value = 1 })
watch([page, pageCount], ([current, count]) => { if (props.paginate && current === count) emit('reachedEnd') })

const visibleColumns = computed(() => props.columns.filter((column) => column.show !== false))

const keyOf = (item: T) => String((item as Record<string, unknown>)[props.itemKey])
</script>

<template>
  <component :is="bare ? 'div' : VCard" :class="bare ? undefined : 'overflow-hidden'">
    <slot v-if="!bare" name="header">
      <div v-if="title || searchText || $slots.filters || $slots.actions" class="flex flex-col gap-4 px-5 py-5" :class="headerClass">
        <div v-if="title">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-[#252830]">{{ title }}</h2>
            <slot name="title-extra" :count="filtered.length" />
          </div>
          <p v-if="subtitle" class="mt-1 text-xs text-[#747985]">{{ subtitle }}</p>
        </div>
        <v-spacer />
        <slot name="filters" />
        <v-text-field v-if="searchText" v-model="search" prepend-inner-icon="mdi-magnify" :placeholder="searchPlaceholder" density="compact" hide-details clearable class="w-full sm:max-w-xs" />
        <slot name="actions" />
      </div>
    </slot>
    <v-divider v-if="!bare" />
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <slot v-if="$slots.body" name="body" :items="filtered" />
    <template v-else>
    <div v-if="filtered.length" class="overflow-x-auto">
      <v-table hover :density="density" :class="tableClass">
        <thead v-if="!hideHeader">
          <tr>
            <th v-for="column in visibleColumns" :key="column.key" :class="column.class">
              <span :class="{ 'sr-only': column.srOnly }">{{ column.title }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in rows" :key="keyOf(item)" :class="[clickable && 'cursor-pointer', rowClass?.(item)]" @click="clickable && emit('click:row', item)">
            <td v-for="column in visibleColumns" :key="column.key" :class="column.cellClass">
              <slot :name="`cell-${column.key}`" :item="item">{{ (item as Record<string, unknown>)[column.key] }}</slot>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <AppEmptyState v-else-if="!loading" :icon="emptyIcon" :title="emptyTitle" :description="emptyDescription">
      <slot name="empty" />
    </AppEmptyState>
    <AppTableFooter v-if="paginate && filtered.length" v-bind="footerProps" :label="label" />
    </template>
    <slot name="footer" />
  </component>
</template>
