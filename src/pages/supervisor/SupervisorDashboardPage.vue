<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { getApiErrorMessage } from '@/Services/api-error'
import { useAuthStore } from '@/stores/auth.store'
import { useSupervisorStore } from '@/stores/supervisor.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Mission } from '@/types/administrator'

const router = useRouter()
const authStore = useAuthStore()
const store = useSupervisorStore()
const feedback = useUiFeedbackStore()
const { missions, sites, teamCount, isLoading } = storeToRefs(store)

const firstName = computed(() => authStore.currentUser?.names.split(/\s+/)[0] ?? 'Utilisateur')
const countByStatus = (status: Mission['status']) => missions.value.filter((mission) => mission.status === status).length

onMounted(async () => {
  try { await store.loadScope() }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger vos missions.')) }
})

const viewMission = (mission: Mission) => router.push({ name: 'supervisor-mission-details', params: { missionId: mission.id } })
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Bonjour {{ firstName }}</template>
      <template #description>Suivez les missions de vos sites, leurs équipes et leurs agents.</template>
      <template #actions><span /></template>
    </PageHeader>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Missions en cours" :value="countByStatus('ongoing')" icon="mdi-progress-clock" change="À suivre" change-color="warning" />
      <DashboardStatCard title="Missions planifiées" :value="countByStatus('scheduled')" icon="mdi-calendar-clock-outline" change="À venir" />
      <DashboardStatCard title="Mes sites" :value="sites.length" icon="mdi-map-marker-radius-outline" change="Votre périmètre" />
      <DashboardStatCard title="Équipes sur mes sites" :value="teamCount" icon="mdi-account-multiple-outline" change="Votre périmètre" />
    </div>

    <MissionTable :missions="missions" :loading="isLoading" title="Mes missions" description="Missions qui ont au moins un de vos sites. Cliquez pour voir les équipes et les agents." :show-actions="false" row-clickable @view="viewMission" />
  </div>
</template>
