<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import type { Mission } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore()
const { users, sites, missions, teams, activeUsersCount, pendingDeviceActivationsCount } = storeToRefs(store)
const viewMission = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
</script>
<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader><template #title>Tableau de bord</template>
      <template #description>Consultez les données disponibles pour votre entreprise.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn></template></PageHeader>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Agents actifs" :value="activeUsersCount" icon="mdi-account-group-outline" change="Sur la page chargée" />
      <DashboardStatCard title="Équipes affichées" :value="teams.length" icon="mdi-account-multiple-outline" change="Sur la page chargée" />
      <DashboardStatCard title="Appareils en cours d'activation" :value="pendingDeviceActivationsCount" icon="mdi-cellphone-check" change="En attente" change-color="warning" />
      <DashboardStatCard title="Accès API" value="OK" icon="mdi-cloud-check-outline" change="Annuaire disponible" change-color="success" /></div>
    <div class="mt-6">
      <MissionTable :missions="missions" :sites="sites" :users="users" :teams="teams" :page-size="4" title="Missions récentes" description="Suivez les dernières missions planifiées et leur état d’avancement." :show-actions="false" @view="viewMission" />
    </div>
  </div>
</template>
