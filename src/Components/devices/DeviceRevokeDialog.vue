<script setup lang="ts">
import { ref, watch } from 'vue'
import { deviceTitle } from '@/Components/devices/device-format'
import type { DeviceResponse } from '@/types/device'

const props = defineProps<{ device: DeviceResponse | null; agentName?: string | null; loading?: boolean; errorMessage?: string | null }>()
const emit = defineEmits<{ submit: [reason: string, code: string]; cancel: [] }>()

const reason = ref('')
const code = ref('')
const validationError = ref<string | null>(null)

watch(() => props.device?.id, () => { reason.value = ''; code.value = ''; validationError.value = null })

function onCodeInput(value: string) { code.value = value.replace(/\D/g, '').slice(0, 6) }

function submit() {
  validationError.value = null
  if (reason.value.trim().length < 5) { validationError.value = 'Indiquez le motif de la révocation.'; return }
  if (!/^\d{6}$/.test(code.value)) { validationError.value = 'Saisissez le code à 6 chiffres de votre application d’authentification.'; return }
  emit('submit', reason.value.trim(), code.value)
}
</script>

<template>
  <v-dialog :model-value="Boolean(device)" persistent max-width="520">
    <v-card v-if="device" rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="error-lighten-5" size="42"><v-icon color="error" icon="mdi-cellphone-remove" /></v-avatar>
        Révoquer cet appareil ?
      </v-card-title>
      <v-form @submit.prevent="submit">
        <v-card-text class="space-y-4">
          <p class="text-sm text-[#535865]">
            <strong>{{ deviceTitle(device) }}</strong><template v-if="agentName"> de {{ agentName }}</template> ne pourra plus pointer ni renouveler sa session.
            L’appareil reste dans l’historique. Cette action est définitive.
          </p>
          <v-alert v-if="validationError || errorMessage" type="error" variant="tonal" density="compact">{{ validationError ?? errorMessage }}</v-alert>
          <v-textarea v-model="reason" label="Motif de la révocation" placeholder="Ex. : téléphone déclaré perdu par l’agent le 12/10/2026." rows="3" auto-grow counter="500" maxlength="500" :disabled="loading" />
          <v-text-field :model-value="code" label="Code de vérification" hint="Code à 6 chiffres de votre application d’authentification" persistent-hint inputmode="numeric" autocomplete="one-time-code" prepend-inner-icon="mdi-shield-key-outline" :disabled="loading" @update:model-value="onCodeInput" />
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" :disabled="loading" @click="emit('cancel')">Annuler</v-btn>
          <v-btn type="submit" color="error" variant="flat" :loading="loading">Révoquer</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
