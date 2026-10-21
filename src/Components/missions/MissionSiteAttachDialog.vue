<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { Site } from '@/types/administrator'

const props = defineProps<{ modelValue: boolean; sites: Site[]; loading?: boolean; saving?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [siteIds: string[]] }>()

const search = ref('')
const selected = ref<string[]>([])

// Recherche sur le nom, l'adresse et la ville, sans tenir compte des accents ni de la casse.
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr')
const filtered = computed(() => {
  const q = normalize(search.value?.trim() ?? '')
  return q ? props.sites.filter((site) => normalize(`${site.name} ${site.address ?? ''} ${site.city ?? ''}`).includes(q)) : props.sites
})

watch(() => props.modelValue, (open) => { if (open) { search.value = ''; selected.value = [] } })

function toggle(siteId: string) {
  selected.value = selected.value.includes(siteId) ? selected.value.filter((id) => id !== siteId) : [...selected.value, siteId]
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="px-6 pt-6"><h2 class="text-lg font-bold">Attribuer des sites</h2><p class="mt-1 text-sm font-normal text-[#747985]">Seuls les sites sans mission sont proposés. Un site rattaché ne peut plus changer de mission.</p></v-card-title>
      <div class="px-6 pb-3"><v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un site" density="compact" hide-details clearable /></div>
      <v-divider />
      <v-card-text class="px-3 py-2" style="max-height: 380px">
        <v-progress-linear v-if="loading" indeterminate color="primary" />
        <v-list v-else-if="filtered.length" density="comfortable">
          <v-list-item v-for="site in filtered" :key="site.id" rounded="lg" @click="toggle(site.id)">
            <template #prepend><v-checkbox-btn :model-value="selected.includes(site.id)" color="primary" @click.stop="toggle(site.id)" /></template>
            <v-list-item-title class="font-semibold">{{ site.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ [site.address, site.city].filter(Boolean).join(', ') || 'Adresse à compléter' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <p v-else class="px-3 py-8 text-center text-sm text-[#747985]">{{ search ? `Aucun site sans mission ne correspond à « ${search} ».` : 'Tous les sites sont déjà rattachés à une mission.' }}</p>
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="!selected.length" @click="emit('confirm', selected)">Attribuer{{ selected.length ? ` (${selected.length})` : '' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
