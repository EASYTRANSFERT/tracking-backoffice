<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { EnterpriseUser } from '@/types/administrator'
import { getApiErrorMessage } from '@/utils/api-error'
import { fullName, nameOr } from '@/utils/people'
import { matchesSearch } from '@/utils/search'

const route = useRoute()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const teamId = computed(() => route.params.teamId as string)
const team = computed(() => store.findTeam(teamId.value))
const members = ref<EnterpriseUser[]>([])
const loading = ref(true)
const lead = computed(() => members.value.find((member) => member.id === team.value?.leadUserId) ?? store.findUser(team.value?.leadUserId ?? ''))
const agents = computed(() => members.value.filter((member) => member.id !== team.value?.leadUserId))
const search = ref('')
const orderedMembers = computed(() => [...(lead.value ? [lead.value] : []), ...agents.value])
const displayedMembers = computed(() => orderedMembers.value.filter((member) => matchesSearch(search.value, fullName(member), member.employeeNumber, member.email, member.phone)))
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))

onMounted(async () => {
  try {
    await store.loadTeam(teamId.value)
    members.value = await store.listTeamMembers(teamId.value)
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger cette équipe.'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader>
      <template #title>{{ team?.name ?? 'Équipe' }}</template>
      <template #description>Chef d’équipe, agents affectés et dernière mise à jour.</template>
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-teams' }">Retour</v-btn>
        <v-btn v-if="team" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'admin-team-edit', params: { teamId: team.id } }">Modifier</v-btn>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-else-if="!team" type="error" variant="tonal" title="Équipe introuvable" />
    <template v-else>
      <div class="mb-6 grid gap-4 md:grid-cols-3">
        <v-card class="px-5 py-4">
          <p class="text-xs text-[#747985]">Chef d’équipe</p>
          <p class="mt-1 font-semibold">{{ lead ? nameOr(lead) : 'Non défini' }}</p>
        </v-card>
        <v-card class="px-5 py-4">
          <p class="text-xs text-[#747985]">Membres</p>
          <p class="mt-1 font-semibold">{{ members.length }}</p>
        </v-card>
        <v-card class="px-5 py-4">
          <p class="text-xs text-[#747985]">Dernière mise à jour</p>
          <p class="mt-1 font-semibold">{{ formatDate(team.updatedAt) }}</p>
        </v-card>
      </div>

      <v-card>
        <div class="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
          <h2 class="text-base font-bold">Membres de l’équipe</h2>
          <v-spacer />
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un membre" density="compact" hide-details clearable class="w-full sm:max-w-xs" />
        </div>
        <v-divider />
        <v-list v-if="displayedMembers.length" class="py-0" lines="two">
          <template v-for="(member, index) in displayedMembers" :key="member.id">
            <v-list-item :title="fullName(member)" :subtitle="`${member.employeeNumber} · ${member.email || member.phone}`" :to="{ name: 'admin-user-details', params: { userId: member.id } }">
              <template #prepend><v-avatar color="red-lighten-5" size="38"><v-icon icon="mdi-account-outline" color="primary" /></v-avatar></template>
              <template #append>
                <v-chip v-if="member.id === team.leadUserId" color="primary" variant="tonal" size="small">Chef d’équipe</v-chip>
                <AppStatusChip v-else :status="member.status" />
              </template>
            </v-list-item>
            <v-divider v-if="index < displayedMembers.length - 1" />
          </template>
        </v-list>
        <p v-else class="px-6 py-8 text-center text-sm text-[#747985]">{{ search ? 'Aucun membre ne correspond à cette recherche.' : 'Aucun agent n’est encore affecté à cette équipe.' }}</p>
      </v-card>
    </template>
  </div>
</template>
