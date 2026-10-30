<script setup lang="ts">
import { formatDateTime } from '@/Components/attendance/attendance-labels'
import { adjustmentChanges } from '@/utils/adjustment-format'
import type { AdjustmentResponse } from '@/types/adjustment'

/** Historique des régularisations d'une session, de la plus ancienne à la plus récente, avec l'avant → après de chaque champ. */
defineProps<{ adjustments: AdjustmentResponse[]; authorName: (id?: string) => string }>()
</script>

<template>
  <v-timeline density="compact" side="end" class="px-6 py-6">
    <v-timeline-item v-for="adjustment in adjustments" :key="adjustment.id" dot-color="primary" size="x-small">
      <p class="text-sm"><strong>Régularisée</strong> le {{ formatDateTime(adjustment.createdAt) }} par {{ authorName(adjustment.authorId) }}</p>
      <p class="mt-1 text-sm text-[#535865]">« {{ adjustment.reason }} »</p>
      <ul class="mt-2 space-y-1">
        <li v-for="change in adjustmentChanges(adjustment)" :key="change.key" class="flex flex-wrap items-center gap-x-2 text-sm">
          <span class="w-36 text-xs text-[#848484]">{{ change.label }}</span>
          <span class="text-[#747985] line-through">{{ change.before }}</span>
          <v-icon icon="mdi-arrow-right" size="14" color="secondary" />
          <strong>{{ change.after }}</strong>
        </li>
      </ul>
    </v-timeline-item>
  </v-timeline>
</template>
