<script setup lang="ts">
withDefaults(defineProps<{
  page: number
  pageCount: number
  start: number
  end: number
  total?: number
  label: string
  mode?: 'numbered' | 'cursor'
  hasNext?: boolean
  hasPrevious?: boolean
  /** Affiche le choix du nombre de lignes par page quand des tailles sont proposées. */
  pageSize?: number
  pageSizeOptions?: number[]
}>(), {
  mode: 'numbered',
  hasNext: false,
  hasPrevious: false,
})

const emit = defineEmits<{
  'update:page': [page: number]
  next: []
  previous: []
  'update:pageSize': [pageSize: number]
}>()
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-xs text-[#747985]">
      <template v-if="mode === 'numbered'">
        Affichage de {{ start }} à {{ end }} sur {{ total ?? 0 }} {{ label }}
      </template>
      <template v-else>
        Page {{ page }} · {{ Math.max(end - start + 1, 0) }} {{ label }} sur cette page
      </template>
    </p>

    <div class="flex flex-wrap items-center justify-start gap-4 sm:justify-end">
      <div v-if="pageSizeOptions?.length" class="flex items-center gap-2 text-xs text-[#747985]">
        <span>Lignes par page</span>
        <v-select
          :model-value="pageSize"
          :items="pageSizeOptions"
          density="compact"
          hide-details
          class="w-24"
          @update:model-value="emit('update:pageSize', $event)"
        />
      </div>
      <v-pagination
        v-if="mode === 'numbered'"
        :model-value="page"
        :length="Math.max(pageCount, 1)"
        :total-visible="5"
        density="compact"
        size="small"
        rounded="lg"
        @update:model-value="emit('update:page', $event)"
      />
      <!-- Même rendu que la pagination numérotée : seule la page courante est connue,
           les flèches avancent ou reculent d'une page via le curseur. -->
      <v-pagination
        v-else
        aria-label="Navigation par curseur"
        :model-value="page"
        :length="hasNext ? page + 1 : page"
        :total-visible="1"
        density="compact"
        size="small"
        rounded="lg"
        @update:model-value="$event > page ? emit('next') : emit('previous')"
      />
    </div>
  </div>
</template>
