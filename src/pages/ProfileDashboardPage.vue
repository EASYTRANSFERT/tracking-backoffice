<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionTable from '@/Components/missions/MissionTable.vue'
import { useProfileScope } from '@/composables/useProfileScope'
import type { Mission } from '@/types/administrator'

const router = useRouter()
const {
  activeRole,
  currentUser,
  supervisedTeams,
  scopedMissions,
  missionDetailsRoute,
} = useProfileScope()

const firstName = computed(() =>
  currentUser.value?.names.split(/\s+/)[0] ?? 'Utilisateur',
)

const ongoingCount = computed(() =>
  scopedMissions.value.filter((mission) => mission.status === 'ongoing').length,
)
const scheduledCount = computed(() =>
  scopedMissions.value.filter((mission) => mission.status === 'scheduled').length,
)
const completedCount = computed(() =>
  scopedMissions.value.filter((mission) => mission.status === 'completed').length,
)

const description = computed(() => activeRole.value === 'supervisor'
  ? 'Suivez vos missions, vos équipes supervisées et les pointages à valider.'
  : "Consultez les missions affectées à votre équipe et leurs informations.")

function viewMission(mission: Mission) {
  void router.push({
    name: missionDetailsRoute.value,
    params: { missionId: mission.id },
  })
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Bonjour {{ firstName }}</template>
      <template #description>{{ description }}</template>
      <template #actions>
        <v-btn
          v-if="activeRole === 'supervisor'"
          color="primary"
          prepend-icon="mdi-clock-check-outline"
          :to="{ name: 'supervisor-attendance' }"
        >
          Valider les pointages
        </v-btn>
        <span v-else />
      </template>
    </PageHeader>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard title="Missions planifiées" :value="scheduledCount" icon="mdi-calendar-clock-outline" change="À venir" />
      <DashboardStatCard title="Missions en cours" :value="ongoingCount" icon="mdi-progress-clock" change="À suivre" change-color="warning" />
      <DashboardStatCard title="Missions terminées" :value="completedCount" icon="mdi-check-circle-outline" change="Clôturées" />
      <DashboardStatCard
        v-if="activeRole === 'supervisor'"
        title="Équipes supervisées"
        :value="supervisedTeams.length"
        icon="mdi-account-multiple-outline"
        change="Votre périmètre"
      />
      <DashboardStatCard v-else title="Total des missions" :value="scopedMissions.length" icon="mdi-clipboard-text-clock-outline" change="Votre périmètre" />
    </div>

    <MissionTable
      :missions="scopedMissions"
      title="Mes missions"
      description="Ouvrez une mission pour consulter toutes les informations disponibles."
      :show-actions="false"
      row-clickable
      @view="viewMission"
    />
  </div>
</template>
