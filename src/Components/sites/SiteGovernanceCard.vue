<script setup lang="ts">
import type { EnterpriseUser } from '@/types/administrator'

defineProps<{
  supervisor?: EnterpriseUser
  projectLead?: EnterpriseUser
}>()

const fullName = (user?: EnterpriseUser) => user
  ? `${user.firstName} ${user.lastName}`
  : 'Non affecté'
</script>

<template>
  <v-card>
    <v-card-title class="flex items-center gap-3 px-5 py-5">
      <v-avatar color="red-lighten-5" rounded="lg">
        <v-icon icon="mdi-account-hard-hat-outline" color="primary" />
      </v-avatar>
      <div>
        <h2 class="text-base font-bold">Encadrement du site</h2>
        <p class="mt-1 text-xs font-normal text-[#747985]">Responsables opérationnels</p>
      </div>
    </v-card-title>
    <v-divider />
    <v-list lines="two" class="py-2">
      <v-list-item
        prepend-icon="mdi-account-tie-outline"
        title="Superviseur"
        :subtitle="fullName(supervisor)"
      />
      <v-list-item
        prepend-icon="mdi-briefcase-account-outline"
        title="Chef d'équipe"
        :subtitle="fullName(projectLead)"
      />
    </v-list>
    <v-divider />
    <v-card-text class="px-5 py-4">
      <v-chip color="secondary" variant="tonal" prepend-icon="mdi-api-off" size="small">
        Affectations API à venir
      </v-chip>
    </v-card-text>
  </v-card>
</template>
