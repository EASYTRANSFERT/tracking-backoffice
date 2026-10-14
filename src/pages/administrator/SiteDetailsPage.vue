<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import QrCodeCard from '@/Components/sites/QrCodeCard.vue'
import SiteAgentsCard from '@/Components/sites/SiteAgentsCard.vue'
import SiteGovernanceCard from '@/Components/sites/SiteGovernanceCard.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { EnterpriseUser } from '@/types/administrator'

const route = useRoute()
const store = useAdministratorStore()
const site = computed(() => store.getSiteById(route.params.siteId as string))
const supervisor = computed(() => site.value?.managerId
  ? store.getUserById(site.value.managerId)
  : undefined)

// Ces relations restent volontairement visuelles tant que les endpoints
// d’affectation d’un chef de projet et des agents au site n’existent pas.
const projectLead = computed<EnterpriseUser | undefined>(() => undefined)
const siteAgents = computed<EnterpriseUser[]>(() => [])
</script>

<template>
  <div class="mx-auto w-full max-w-[1180px]">
    <PageHeader>
      <template #title>{{ site?.name ?? 'Site introuvable' }}</template>
      <template #description>Configuration, périmètre, encadrement et personnel affecté.</template>
      <template #actions>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-sites' }">Retour</v-btn>
        <v-btn v-if="site" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-site-edit', params: { siteId: site.id } }">Modifier</v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="!site" type="error" variant="tonal" title="Site introuvable" />

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <v-card>
          <v-card-title class="flex items-center justify-between px-6 py-5">
            <div class="flex items-center gap-3">
              <v-avatar color="red-lighten-5" rounded="lg">
                <v-icon icon="mdi-office-building-marker-outline" color="primary" />
              </v-avatar>
              <div>
                <h2 class="text-base font-bold">Informations du site</h2>
                <p class="mt-1 text-xs font-normal text-[#747985]">Identité et localisation</p>
              </div>
            </div>
            <AppStatusChip :status="site.status" />
          </v-card-title>
          <v-divider />
          <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div><p class="text-xs text-[#848484]">Nom</p><p class="mt-1 font-medium">{{ site.name }}</p></div>
            <div><p class="text-xs text-[#848484]">Ville</p><p class="mt-1 font-medium">{{ site.city || 'À compléter' }}</p></div>
            <div class="sm:col-span-2"><p class="text-xs text-[#848484]">Adresse</p><p class="mt-1 font-medium">{{ site.address || 'À compléter' }}</p></div>
          </v-card-text>
          <v-divider />
          <v-card-actions class="px-6 py-4">
            <v-btn variant="tonal" :color="site.status === 'active' ? 'error' : 'success'" @click="store.toggleSiteStatus(site.id)">
              {{ site.status === 'active' ? 'Désactiver le site' : 'Activer le site' }}
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card>
          <v-card-title class="flex items-center gap-3 px-6 py-5">
            <v-avatar color="red-lighten-5" rounded="lg">
              <v-icon icon="mdi-crosshairs-gps" color="primary" />
            </v-avatar>
            <div>
              <h2 class="text-base font-bold">Périmètre autorisé</h2>
              <p class="mt-1 text-xs font-normal text-[#747985]">Zone géographique de présence et de pointage</p>
            </div>
          </v-card-title>
          <v-divider />
          <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-3">
            <div><p class="text-xs text-[#848484]">Latitude</p><p class="mt-1 font-medium">{{ site.latitude || 'À compléter' }}</p></div>
            <div><p class="text-xs text-[#848484]">Longitude</p><p class="mt-1 font-medium">{{ site.longitude || 'À compléter' }}</p></div>
            <div><p class="text-xs text-[#848484]">Rayon</p><p class="mt-1 font-medium">{{ site.radiusM ? `${site.radiusM} mètres` : 'À compléter' }}</p></div>
          </v-card-text>
          <v-divider />
          <v-card-text class="px-6 py-4">
            <div class="flex items-center gap-3 rounded-xl bg-[#f6f6f7] px-4 py-4">
              <v-icon icon="mdi-map-marker-radius-outline" color="primary" size="28" />
              <div><p class="text-sm font-semibold">Zone de contrôle</p><p class="mt-1 text-xs text-[#747985]">Les contrôles de présence s’appliqueront à l’intérieur du rayon défini.</p></div>
            </div>
          </v-card-text>
        </v-card>

        <SiteAgentsCard :agents="siteAgents" />
      </div>

      <div class="space-y-6">
        <SiteGovernanceCard :supervisor="supervisor" :project-lead="projectLead" />
        <QrCodeCard :site="site" @details="() => {}" @regenerate="store.regenerateQrCode($event.id)" />
      </div>
    </div>
  </div>
</template>
