<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Team } from '@/types/administrator'

const props = defineProps<{ modelValue: boolean; teams: Team[]; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; submit: [teamId: string, from: string, to: string] }>()

const teamId = ref<string | null>(null)
const from = ref('')
const to = ref('')
const validationError = ref<string | null>(null)

watch(() => props.modelValue, (open) => { if (open) { teamId.value = null; from.value = ''; to.value = ''; validationError.value = null } })

function submit() {
  validationError.value = null
  if (!teamId.value) { validationError.value = 'Choisissez l’équipe concernée.'; return }
  if (!from.value || !to.value) { validationError.value = 'Renseignez la première et la dernière journée.'; return }
  if (to.value < from.value) { validationError.value = 'La dernière journée ne peut pas précéder la première.'; return }
  emit('submit', teamId.value, from.value, to.value)
}
</script>

<template>
  <v-dialog :model-value="modelValue" persistent max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="red-lighten-5" size="42"><v-icon color="primary" icon="mdi-calendar-plus" /></v-avatar>
        Nouvelle période
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <p class="text-sm text-[#535865]">
            Les deux journées sont incluses, dans le fuseau de l’entreprise. Un pointage appartient à la période de sa journée de rattachement,
            même pour un poste de nuit qui finit le lendemain. La période passe d’elle-même en validation une fois sa dernière journée écoulée.
          </p>
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
          <v-autocomplete
            v-model="teamId"
            :items="teams"
            item-title="name"
            item-value="id"
            label="Équipe"
            placeholder="Rechercher une équipe"
            prepend-inner-icon="mdi-magnify"
            no-data-text="Aucune équipe ne correspond à cette recherche."
            clearable
            :disabled="loading"
          />
          <div class="grid gap-3 sm:grid-cols-2">
            <v-text-field v-model="from" type="date" label="Du" :disabled="loading" />
            <v-text-field v-model="to" type="date" label="Au" :disabled="loading" />
          </div>
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false)">Annuler</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="loading">Créer la période</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
