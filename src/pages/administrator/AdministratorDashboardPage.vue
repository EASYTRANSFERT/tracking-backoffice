<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { Mission } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore()
const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const { users, sites, missions, teams, activeUsersCount, pendingDeviceActivationsCount } = storeToRefs(store)
const viewMission = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
</script>
<template>
  <div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Tableau de bord</template><template #description>Consultez les données disponibles pour votre entreprise.</template><template #actions><v-btn v-if="mockMode" color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn><v-btn v-else color="primary" prepend-icon="mdi-account-plus-outline" size="large" :to="{ name: 'admin-user-create' }">Nouvel agent</v-btn></template></PageHeader>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatCard title="Agents actifs" :value="activeUsersCount" icon="mdi-account-group-outline" change="Sur la page chargée" /><DashboardStatCard title="Équipes affichées" :value="teams.length" icon="mdi-account-multiple-outline" change="Sur la page chargée" /><DashboardStatCard title="Appareils en cours d’activation" :value="pendingDeviceActivationsCount" icon="mdi-cellphone-check" change="En attente" change-color="warning" /><DashboardStatCard title="Accès API" value="OK" icon="mdi-cloud-check-outline" change="Annuaire disponible" change-color="success" /></div>
    <div class="mt-6 grid gap-6" :class="mockMode ? 'xl:grid-cols-[1.65fr_0.75fr]' : 'xl:grid-cols-1'"><MissionTable v-if="mockMode" :missions="missions" :sites="sites" :users="users" :teams="teams" :page-size="4" title="Missions récentes" description="Prototype local : aucun endpoint mission n’est publié actuellement." :show-actions="false" @view="viewMission" />
      <v-card class="h-fit"><v-card-title class="px-5 py-5">Actions rapides</v-card-title><v-divider /><v-card-text class="grid gap-3"><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-plus-outline" class="justify-start" :to="{ name: 'admin-user-create' }">Ajouter un agent</v-btn><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-account-multiple-plus-outline" class="justify-start" :to="{ name: 'admin-team-create' }">Créer une équipe</v-btn><v-btn v-if="mockMode" size="large" variant="tonal" color="primary" prepend-icon="mdi-map-marker-plus-outline" class="justify-start" :to="{ name: 'admin-site-create' }">Configurer un site</v-btn><v-btn size="large" variant="tonal" color="primary" prepend-icon="mdi-lock-reset" class="justify-start" :to="{ name: 'change-password' }">Changer mon mot de passe</v-btn></v-card-text><v-divider /><v-card-text class="text-xs text-[#747985]">{{ users.length }} agents · {{ teams.length }} équipes sur les pages chargées</v-card-text></v-card></div>
  </div>
</template>
