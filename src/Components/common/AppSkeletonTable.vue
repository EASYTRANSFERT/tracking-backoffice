<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; columns?: number }>(), { rows: 5, columns: 5 })
</script>

<template>
  <v-card aria-label="Chargement du tableau" role="status">
    <div class="flex items-center justify-between px-6 py-5">
      <v-skeleton-loader type="heading" width="220" />
      <v-skeleton-loader type="button" width="180" />
    </div>
    <v-divider />
    <div class="space-y-1 px-6 py-3">
      <div v-for="row in rows" :key="row" class="grid min-h-14 items-center gap-5 border-b border-gray-100" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
        <v-skeleton-loader v-for="column in columns" :key="column" type="text" />
      </div>
    </div>
    <span class="sr-only">Chargement en cours</span>
  </v-card>
</template>
