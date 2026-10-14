<script setup lang="ts">
import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import type { EnterpriseUser } from '@/types/administrator'

defineProps<{ agents: EnterpriseUser[] }>()

const fullName = (user: EnterpriseUser) => `${user.firstName} ${user.lastName}`
</script>

<template>
  <v-card class="overflow-hidden">
    <v-card-title class="flex items-center justify-between px-6 py-5">
      <div class="flex items-center gap-3">
        <v-avatar color="red-lighten-5" rounded="lg">
          <v-icon icon="mdi-account-group-outline" color="primary" />
        </v-avatar>
        <div>
          <h2 class="text-base font-bold">Agents affectés</h2>
          <p class="mt-1 text-xs font-normal text-[#747985]">Personnel autorisé à intervenir sur ce site</p>
        </div>
      </div>
      <v-chip color="primary" variant="tonal">{{ agents.length }}</v-chip>
    </v-card-title>
    <v-divider />
    <v-list v-if="agents.length" lines="two">
      <v-list-item
        v-for="agent in agents"
        :key="agent.id"
        :title="fullName(agent)"
        :subtitle="`${agent.employeeNumber} · ${agent.email}`"
        prepend-icon="mdi-account-outline"
      >
        <template #append>
          <v-chip color="success" variant="tonal" size="small">Autorisé</v-chip>
        </template>
      </v-list-item>
    </v-list>
    <AppEmptyState
      v-else
      icon="mdi-account-clock-outline"
      title="Aucun agent affiché"
      description="Les agents affectés apparaîtront ici lorsque l’endpoint correspondant sera disponible."
    />
  </v-card>
</template>
