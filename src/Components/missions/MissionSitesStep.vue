<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import MissionSiteAttachDialog from '@/Components/missions/MissionSiteAttachDialog.vue'
import { useMissionSites } from '@/composables/useMissionSites'
import { siteAddress } from '@/utils/site-format'
import type { Mission } from '@/types/administrator'

/** Étape « Sites » du formulaire de mission : les sites sont rattachés tout de suite, la mission existant déjà. */
const props = defineProps<{ mission: Mission }>()
const router = useRouter()
const { missionSites, availableSites, isSitesLoading, attachDialog, isAttachLoading, isAttaching, openAttachDialog, attachSites } = useMissionSites(() => props.mission.id)

// L'API refuse d'ajouter un site à une mission terminée ou annulée (MISSION_STATUS_CONFLICT).
const canAddSite = computed(() => props.mission.status === 'scheduled' || props.mission.status === 'ongoing')
// Le nouveau site est pré-rattaché à la mission ; une fois créé, « Retour à la mission » ramène à cette étape.
const createSite = () => router.push({ name: 'admin-site-create', query: { missionId: props.mission.id, from: 'mission-form' } })
</script>

<template>
  <v-card-text class="space-y-4 px-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-[#535865]">{{ missionSites.length }} site{{ missionSites.length > 1 ? 's' : '' }} rattaché{{ missionSites.length > 1 ? 's' : '' }} à la mission</p>
      <div v-if="canAddSite" class="flex flex-wrap gap-2">
        <v-btn variant="outlined" color="primary" prepend-icon="mdi-link-variant-plus" @click="openAttachDialog">Attribuer un site</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-map-marker-plus-outline" @click="createSite">Nouveau site</v-btn>
      </div>
    </div>
    <v-progress-linear v-if="isSitesLoading" indeterminate color="primary" />
    <v-list v-if="missionSites.length" lines="two" class="rounded-lg border border-[#e4e6ea] py-0">
      <template v-for="(site, index) in missionSites" :key="site.id">
        <v-divider v-if="index" />
        <v-list-item prepend-icon="mdi-map-marker-outline" :title="site.name" :subtitle="siteAddress(site)">
          <template #append><AppStatusChip :status="site.status" /></template>
        </v-list-item>
      </template>
    </v-list>
    <div v-else-if="!isSitesLoading" class="rounded-lg border border-dashed border-[#d9dce2] px-6 py-8 text-center">
      <v-icon icon="mdi-map-marker-question-outline" color="secondary" size="36" />
      <p class="mt-2 font-semibold text-[#292d38]">Aucun site pour l’instant</p>
      <p class="mt-1 text-sm text-[#747985]">Attribuez un site existant ou créez-en un : chacun a son périmètre, son équipe et son QR code.</p>
    </div>
    <v-alert type="info" variant="tonal" density="compact" text="Les sites sont rattachés immédiatement. Cette étape est facultative : vous pourrez en ajouter plus tard depuis la fiche de la mission." />
  </v-card-text>
  <MissionSiteAttachDialog v-model="attachDialog" :sites="availableSites" :loading="isAttachLoading" :saving="isAttaching" @confirm="attachSites" />
</template>
