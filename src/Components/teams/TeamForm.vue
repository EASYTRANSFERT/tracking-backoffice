<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import type { EnterpriseUser, Team, TeamInput } from '@/types/administrator'

/** leaders : comptes actifs portant le rôle Chef d'équipe (TEAM_LEAD). */
const props = defineProps<{ team?: Team; leaders: EnterpriseUser[]; loading?: boolean; leadersLoading?: boolean }>()
const emit = defineEmits<{
  submit: [payload: TeamInput]
  cancel: []
  dirtyChange: [dirty: boolean]
}>()

const form = ref()
const data = reactive<TeamInput>({
  name: props.team?.name ?? '',
  leadUserId: props.team?.leadUserId ?? '',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const fullName = (user: EnterpriseUser) => `${user.firstName} ${user.lastName}`

watch(data, () => emit('dirtyChange', true), { deep: true })

async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { name: data.name.trim(), leadUserId: data.leadUserId })
}
</script>

<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg">
          <v-icon icon="mdi-account-multiple-plus-outline" color="primary" />
        </v-avatar>
        <div>
          <h2 class="text-base font-bold">Informations de l’équipe</h2>
          <p class="mt-1 text-xs font-normal text-[#747985]">Définissez l’équipe et son chef</p>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
        <v-alert v-if="!team" class="md:col-span-2 mb-4" type="info" variant="tonal" density="compact">
          Le nom de l’équipe et son chef sont obligatoires. Le chef est un compte au rôle « Chef d’équipe » : créez-le d’abord depuis la page Agents s’il n’existe pas.
        </v-alert>
        <v-text-field v-model="data.name" label="Nom de l’équipe" :rules="[required]" />
        <v-select
          v-model="data.leadUserId"
          label="Chef d’équipe"
          :items="leaders"
          :item-title="fullName"
          item-value="id"
          :loading="leadersLoading"
          :disabled="Boolean(team)"
          :rules="[required]"
          :hint="team ? 'Le chef d’équipe ne se modifie pas depuis ce formulaire.' : undefined"
          :persistent-hint="Boolean(team)"
          no-data-text="Aucun chef d’équipe actif : créez d’abord un compte au rôle Chef d’équipe."
        />
      </v-card-text>
    </v-card>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn variant="outlined" color="secondary" size="large" :disabled="loading" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn>
      <v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading">
        {{ team ? 'Enregistrer les modifications' : 'Créer l’équipe' }}
      </v-btn>
    </div>
  </v-form>
</template>
