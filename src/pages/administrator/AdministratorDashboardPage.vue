<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { Mission } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore()
const { users, sites, missions, teams, activeUsersCount, pendingDeviceActivationsCount, activeSitesCount, ongoingMissionsCount } = storeToRefs(store)
const viewMission = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
</script>
<template>
  <div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Bonjour Aïcha</template><template #description>Voici l’activité de votre entreprise aujourd’hui.</template><template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn></template></PageHeader>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatCard title="Utilisateurs actifs" :value="activeUsersCount" icon="mdi-account-group-outline" change="Personnel autorisé" /><DashboardStatCard title="Sites actifs" :value="activeSitesCount" icon="mdi-map-marker-radius-outline" change="QR codes disponibles" /><DashboardStatCard title="Missions en cours" :value="ongoingMissionsCount" icon="mdi-clipboard-text-clock-outline" change="À suivre" change-color="warning" /><DashboardStatCard title="Appareils en cours d’activation" :value="pendingDeviceActivationsCount" icon="mdi-cellphone-clock" change="En attente" change-color="secondary" /></div>
    <div class="mt-6 grid gap-6 xl:grid-cols-[1.65fr_0.75fr]"><MissionTable :missions="missions" :sites="sites" :users="users" :teams="teams" :page-size="4" title="Missions récentes" description="Filtrez les dernières missions par période et statut." :show-actions="false" @view="viewMission" />
      <v-card class="h-fit"><v-card-title class="px-5 py-5">Actions rapides</v-card-title><v-divider /><v-card-text class="grid gap-3"><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-plus-outline" class="justify-start" :to="{ name: 'admin-user-create' }">Ajouter un utilisateur</v-btn><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-multiple-plus-outline" class="justify-start" :to="{ name: 'admin-team-create' }">Créer une équipe</v-btn><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-map-marker-plus-outline" class="justify-start" :to="{ name: 'admin-site-create' }">Configurer un site</v-btn><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-qrcode-scan" class="justify-start" :to="{ name: 'admin-qr-codes' }">Gérer les QR codes</v-btn></v-card-text><v-divider /><v-card-text class="text-xs text-[#747985]">{{ users.length }} utilisateurs · {{ teams.length }} équipes · {{ sites.length }} sites · {{ missions.length }} missions</v-card-text></v-card></div>
  </div>
</template>
