<script setup lang="ts">
import { addDays, startOfWeek, weekLabel } from '@/Components/sites/site-schedule'

/** Navigation de semaine des plannings : précédente, suivante, retour à la semaine en cours. */
defineProps<{ weekStart: string }>()
const emit = defineEmits<{ change: [weekStart: string] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center rounded-lg border border-[#e3e5ea]">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" density="comfortable" aria-label="Semaine précédente" @click="emit('change', addDays(weekStart, -7))" />
      <span class="min-w-[230px] px-1 text-center text-sm font-semibold text-[#252830]">{{ weekLabel(weekStart) }}</span>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" density="comfortable" aria-label="Semaine suivante" @click="emit('change', addDays(weekStart, 7))" />
    </div>
    <v-btn variant="text" size="small" class="normal-case" :disabled="weekStart === startOfWeek()" @click="emit('change', startOfWeek())">Aujourd’hui</v-btn>
  </div>
</template>
