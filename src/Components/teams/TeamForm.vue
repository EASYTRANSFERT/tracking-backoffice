<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type { EnterpriseUser, Team, TeamInput } from '@/types/administrator'

const props = defineProps<{ team?: Team; users: EnterpriseUser[]; loading?: boolean }>()
const emit = defineEmits<{
  submit: [payload: TeamInput]
  cancel: []
  dirtyChange: [dirty: boolean]
}>()

const form = ref()
const data = reactive<TeamInput>({
  name: props.team?.name ?? '',
  supervisorUserId: props.team?.supervisorUserId ?? '',
})
const supervisors = computed(() => props.users.filter(
  (user) => user.role === 'supervisor' && user.status === 'active',
))
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const fullName = (user: EnterpriseUser) => `${user.firstName} ${user.lastName}`

watch(data, () => emit('dirtyChange', true), { deep: true })

async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', { name: data.name.trim(), supervisorUserId: data.supervisorUserId })
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
          <p class="mt-1 text-xs font-normal text-[#747985]">Définissez l’équipe et le superviseur responsable</p>
          <v-alert class="md:col-span-2 m-5" type="info" variant="tonal">
          Le nom de l'équipe et le superviseur sont obligatoire pour la création.
        </v-alert>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">

        <v-text-field v-model="data.name" label="Nom de l’équipe" :rules="[required]" />
        <v-select
          v-model="data.supervisorUserId"
          label="Superviseur"
          :items="supervisors"
          :item-title="fullName"
          item-value="id"
          :rules="[required]"
          no-data-text="Aucun superviseur actif disponible"
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
