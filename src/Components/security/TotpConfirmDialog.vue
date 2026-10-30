<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Confirmation d'une opération sensible par le code TOTP (ré-authentification « step-up »).
 * Le dialogue ne fait qu'émettre le code : l'appel reste dans le store.
 */
const props = defineProps<{ modelValue: boolean; title: string; message: string; confirmText?: string; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [code: string] }>()

const code = ref('')
const validationError = ref<string | null>(null)
watch(() => props.modelValue, (open) => { if (open) { code.value = ''; validationError.value = null } })

const onInput = (value: string) => { code.value = value.replace(/\D/g, '').slice(0, 6) }

function submit() {
  validationError.value = null
  if (!/^\d{6}$/.test(code.value)) {
    validationError.value = 'Saisissez le code à 6 chiffres de votre application d’authentification.'
    return
  }
  emit('confirm', code.value)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="460" persistent @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 pt-6">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-shield-key-outline" color="primary" /></v-avatar>
        <h2 class="text-lg font-bold">{{ title }}</h2>
      </v-card-title>
      <v-card-text class="space-y-4 px-6 py-2">
        <p class="text-sm text-[#535865]">{{ message }}</p>
        <v-text-field
          :model-value="code"
          label="Code de vérification"
          hint="Code à 6 chiffres de votre application d’authentification"
          persistent-hint
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          autofocus
          :disabled="loading"
          @update:model-value="onInput"
          @keyup.enter="submit"
        />
        <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="submit">{{ confirmText ?? 'Confirmer' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
