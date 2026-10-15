<script setup lang="ts">
import { computed } from 'vue'

import type { EnterpriseUser, Site } from '@/types/administrator'

const props = withDefaults(defineProps<{
  modelValue: boolean
  sites: Site[]
  users: EnterpriseUser[]
  selectedSiteId?: string
  loading?: boolean
}>(), {
  selectedSiteId: undefined,
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:selectedSiteId': [value: string | undefined]
  confirm: []
}>()

const selectedSite = computed(() => props.sites.find((site) => site.id === props.selectedSiteId))
const supervisorName = computed(() => {
  const supervisor = props.users.find((user) => user.id === selectedSite.value?.managerId)
  return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : 'Non affecté'
})
const siteLabel = (site: Site) => `${site.name}${site.city ? ` · ${site.city}` : ''}`
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="660" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="flex items-start gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-map-marker-plus-outline" color="primary" /></v-avatar>
        <div class="flex-1"><h2 class="text-lg font-bold text-[#252830]">Affecter un site</h2><p class="mt-1 text-sm font-normal text-[#747985]">La mission utilisera le périmètre et l’encadrement configurés sur le site.</p></div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Fermer" @click="emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />
      <v-card-text class="px-6 py-6">
        <v-autocomplete
          :model-value="selectedSiteId"
          :items="sites"
          :item-title="siteLabel"
          item-value="id"
          label="Rechercher et sélectionner un site"
          prepend-inner-icon="mdi-magnify"
          clearable
          no-data-text="Aucun site trouvé"
          @update:model-value="emit('update:selectedSiteId', $event)"
        />

        <v-card v-if="selectedSite" variant="tonal" color="secondary" class="mt-2">
          <v-card-text class="grid gap-4 text-sm sm:grid-cols-2">
            <div><p class="text-xs text-[#747985]">Adresse</p><p class="mt-1 font-semibold text-[#292d38]">{{ [selectedSite.address, selectedSite.city].filter(Boolean).join(', ') || 'À compléter' }}</p></div>
            <div><p class="text-xs text-[#747985]">Superviseur</p><p class="mt-1 font-semibold text-[#292d38]">{{ supervisorName }}</p></div>
            <div><p class="text-xs text-[#747985]">Périmètre</p><p class="mt-1 font-semibold text-[#292d38]">{{ selectedSite.radiusM ? `${selectedSite.radiusM} mètres` : 'À compléter' }}</p></div>
            <div><p class="text-xs text-[#747985]">Configuration</p><p class="mt-1 font-semibold text-[#292d38]">{{ selectedSite.status === 'active' ? 'Site actif' : 'Configuration incomplète' }}</p></div>
          </v-card-text>
        </v-card>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-end gap-2 px-6 py-4">
        <v-btn variant="outlined" color="secondary" :disabled="loading" @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" prepend-icon="mdi-map-marker-check-outline" :disabled="!selectedSiteId" :loading="loading" @click="emit('confirm')">Affecter ce site</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
