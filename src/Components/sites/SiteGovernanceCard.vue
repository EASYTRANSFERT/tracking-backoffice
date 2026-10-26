<script setup lang="ts">
import { nameOr } from '@/utils/people'
import type { EnterpriseUser } from '@/types/administrator'

/**
 * Qui encadre le site : son responsable (choisi sur le site), le superviseur de sa mission
 * et le chef de l'équipe qui y travaille.
 */
defineProps<{
  manager?: EnterpriseUser
  missionSupervisor?: EnterpriseUser
  teamLead?: EnterpriseUser
  hasMission: boolean
  hasTeam: boolean
  /** Vrai tant que les noms sont en cours de chargement. */
  loading?: boolean
}>()
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
      <v-list-item prepend-icon="mdi-account-tie-outline" title="Responsable du site" :subtitle="loading && !manager ? '…' : nameOr(manager)" />
      <v-list-item prepend-icon="mdi-account-eye-outline" title="Superviseur de la mission" :subtitle="!hasMission ? 'Aucune mission' : loading && !missionSupervisor ? '…' : nameOr(missionSupervisor, 'Non renseigné')" />
      <v-list-item prepend-icon="mdi-briefcase-account-outline" title="Chef d’équipe" :subtitle="!hasTeam ? 'Aucune équipe affectée' : loading && !teamLead ? '…' : nameOr(teamLead, 'Non désigné')" />
    </v-list>
  </v-card>
</template>
