<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useDeviceStore } from '@/stores/device.store'
import type { Mission } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore()
const { missions, teams, activeUsersCount, isMissionsLoading } = storeToRefs(store)
const deviceStore = useDeviceStore()
const pendingEnrollments = computed(() => {
  const count = deviceStore.pendingEnrollmentCount
  if (count === null) return '—'
  return deviceStore.hasMorePendingEnrollments ? `${count}+` : count
})
onMounted(() => { deviceStore.loadPendingEnrollmentCount().catch(() => undefined) })
const viewMission = (mission: Mission) => router.push({ name: 'admin-mission-details', params: { missionId: mission.id } })
</script>
<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Tableau de bord</template>
      <template #description>Consultez les données disponibles pour votre entreprise.</template>
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'admin-mission-create' }">Nouvelle mission</v-btn>
      </template>
    </PageHeader>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardStatCard title="Agents actifs" :value="activeUsersCount" icon="mdi-account-group-outline" change="Dans l’entreprise" />
      <DashboardStatCard title="Nombres d'Équipes" :value="teams.length" icon="mdi-account-multiple-outline" change="Dans l’entreprise" />
      <DashboardStatCard title="Appareils en cours d'activation" :value="pendingEnrollments" icon="mdi-cellphone-check" change="En attente" change-color="warning" :to="{ name: 'admin-devices' }" />
    </div>
    <div class="mt-6">
      <MissionTable :missions="missions" :loading="isMissionsLoading" :page-size="4" title="Missions récentes" description="Suivez les dernières missions planifiées et leur état d’avancement." :show-actions="false" @view="viewMission" />
    </div>
  </div>
</template>
