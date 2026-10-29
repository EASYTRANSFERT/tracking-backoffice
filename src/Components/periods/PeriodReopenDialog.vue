<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; submit: [reason: string] }>()

const reason = ref('')
const validationError = ref<string | null>(null)

watch(() => props.modelValue, (open) => { if (open) { reason.value = ''; validationError.value = null } })

function submit() {
  validationError.value = null
  if (reason.value.trim().length < 5) { validationError.value = 'Indiquez le motif de la réouverture.'; return }
  emit('submit', reason.value.trim())
}
</script>

<template>
  <v-dialog :model-value="modelValue" persistent max-width="500" @update:model-value="emit('update:modelValue', $event)">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="warning-lighten-5" size="42"><v-icon color="warning" icon="mdi-lock-open-variant-outline" /></v-avatar>
        Rouvrir cette période ?
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <p class="text-sm text-[#535865]">
            La période repasse « Ouverte » pour corriger des pointages. Elle ne repasse pas d’elle-même en validation : elle reste ouverte jusqu’à sa clôture.
          </p>
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
          <v-textarea v-model="reason" label="Motif de la réouverture" rows="3" auto-grow counter="500" maxlength="500" :disabled="loading" />
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false)">Annuler</v-btn>
          <v-btn type="submit" color="warning" variant="flat" :loading="loading">Rouvrir</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
