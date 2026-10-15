<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppLoadingState from '@/Components/common/AppLoadingState.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionDetailsCard from '@/Components/missions/MissionDetailsCard.vue'
import { useProfileScope } from '@/composables/useProfileScope'
import { useAdministratorStore } from '@/stores/administrator.store'

const route = useRoute()
const store = useAdministratorStore()
const { scopedMissions, missionsRoute } = useProfileScope()

const missionId = computed(() => String(route.params.missionId))
const mission = computed(() => scopedMissions.value.find((item) => item.id === missionId.value))
const site = computed(() => mission.value?.siteId ? store.getSiteById(mission.value.siteId) : undefined)
const team = computed(() => mission.value?.teamId ? store.getTeamById(mission.value.teamId) : undefined)
const supervisor = computed(() => {
  const id = mission.value?.supervisorId ?? team.value?.supervisorUserId
  return id ? store.getUserById(id) : undefined
})

onMounted(async () => {
  if (store.getMissionById(missionId.value)) return
  await store.loadMission(missionId.value)
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px]">
    <PageHeader>
      <template #title>{{ mission?.title ?? 'Détail de la mission' }}</template>
      <template #description>Informations complètes disponibles pour cette mission.</template>
      <template #actions><v-btn variant="outlined" prepend-icon="mdi-arrow-left" :to="{ name: missionsRoute }">Retour aux missions</v-btn></template>
    </PageHeader>

    <AppLoadingState v-if="store.isMissionsLoading" message="Chargement de la mission…" />
    <v-alert
      v-else-if="!mission"
      type="warning"
      variant="tonal"
      title="Mission indisponible"
      text="Cette mission n’existe pas ou ne fait pas partie de votre périmètre."
    />
    <MissionDetailsCard v-else :mission="mission" :site="site" :team="team" :supervisor="supervisor" />
  </div>
</template>
