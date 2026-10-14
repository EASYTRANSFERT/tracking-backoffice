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
}>(), {
  mode: 'numbered',
  hasNext: false,
  hasPrevious: false,
})

const emit = defineEmits<{
  'update:page': [page: number]
  next: []
  previous: []
}>()
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-xs text-[#747985]">
      <template v-if="mode === 'numbered'">
        Affichage de {{ start }} à {{ end }} sur {{ total ?? 0 }} {{ label }}
      </template>
      <template v-else>
        Page {{ page }} · {{ Math.max(end - start + 1, 0) }} {{ label }} affiché{{ end - start + 1 > 1 ? 's' : '' }}
      </template>
    </p>

    <div class="flex justify-start sm:justify-end">
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
      <div v-else class="flex items-center gap-2" aria-label="Navigation par curseur">
        <v-btn
          variant="outlined"
          color="secondary"
          size="small"
          prepend-icon="mdi-chevron-left"
          :disabled="!hasPrevious"
          @click="emit('previous')"
        >
          Précédent
        </v-btn>
        <v-btn
          variant="outlined"
          color="secondary"
          size="small"
          append-icon="mdi-chevron-right"
          :disabled="!hasNext"
          @click="emit('next')"
        >
          Suivant
        </v-btn>
      </div>
    </div>
  </div>
</template>
