<script setup lang="ts">
import { computed, ref } from 'vue'

import { matchesSearch } from '@/utils/search'
import type { Site } from '@/types/administrator'

/** Choix d'un site parmi ceux d'une mission : liste défilante avec recherche, qui reste lisible avec des dizaines de sites. */
const props = defineProps<{ sites: Site[]; selectedId?: string; teamName?: (teamId: string) => string }>()
const emit = defineEmits<{ select: [siteId: string] }>()

const search = ref('')
const displayed = computed(() => props.sites.filter((site) => matchesSearch(search.value, site.name, site.address, site.city)))
const subtitle = (site: Site) => (site.teamId && props.teamName ? props.teamName(site.teamId) : [site.address, site.city].filter(Boolean).join(', ')) || 'Aucune équipe'
</script>

<template>
  <v-card class="overflow-hidden">
    <div class="flex items-center justify-between px-5 pt-5">
      <h2 class="text-base font-bold">Mes sites</h2>
      <v-chip color="primary" variant="tonal">{{ sites.length }}</v-chip>
    </div>
    <div class="px-5 pb-4 pt-3">
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un site" density="compact" hide-details clearable />
    </div>
    <v-divider />
    <v-list v-if="displayed.length" class="max-h-[360px] overflow-y-auto py-0" lines="two">
      <v-list-item
        v-for="site in displayed"
        :key="site.id"
        :active="site.id === selectedId"
        color="primary"
        prepend-icon="mdi-map-marker-outline"
        :title="site.name"
        :subtitle="subtitle(site)"
        @click="emit('select', site.id)"
      />
    </v-list>
    <p v-else class="px-5 py-8 text-center text-sm text-[#747985]">Aucun site ne correspond à cette recherche.</p>
  </v-card>
</template>
