<script setup lang="ts">
import type { Company } from '@/types/operator'

defineProps<{ company: Company }>()
</script>

<template>
  <v-timeline side="end" align="start" density="compact" truncate-line="both">
    <v-timeline-item v-if="company.status === 'suspended'" dot-color="error" size="small">
      <p class="text-sm font-semibold text-[#252830]">Entreprise suspendue</p>
      <p class="mt-1 text-xs leading-5 text-[#747985]">{{ company.suspensionReason }}</p>
      <p class="mt-1 text-[11px] text-[#9a9da5]">Intervention de l’opérateur</p>
    </v-timeline-item>
    <v-timeline-item dot-color="primary" size="small">
      <p class="text-sm font-semibold text-[#252830]">Compte entreprise créé</p>
      <p class="mt-1 text-xs leading-5 text-[#747985]">Le compte entreprise a été enregistré sur la plateforme.</p>
      <p class="mt-1 text-[11px] text-[#9a9da5]">{{ new Date(company.createdAt).toLocaleString('fr-FR') }}</p>
    </v-timeline-item>
  </v-timeline>
</template>
