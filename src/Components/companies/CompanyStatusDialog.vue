<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CompanyStatus } from '@/types/operator'

const props = defineProps<{
  modelValue: boolean
  companyName: string
  status: CompanyStatus
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
}>()

const reason = ref('')
const isSuspension = computed(() => props.status === 'active')
const actionLabel = computed(() => {
  if (props.status === 'pending') return 'Activer'
  if (props.status === 'suspended') return 'Réactiver'
  return 'Suspendre'
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) reason.value = ''
  },
)

function confirm() {
  if (isSuspension.value && !reason.value.trim()) return
  emit('confirm', reason.value.trim())
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 pt-6">
        <v-avatar :color="isSuspension ? 'red-lighten-5' : 'green-lighten-5'" size="42">
          <v-icon :icon="isSuspension ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'" :color="isSuspension ? 'error' : 'success'" />
        </v-avatar>
        <span>{{ actionLabel }} l’entreprise</span>
      </v-card-title>

      <v-card-text class="px-6 py-5">
        <p class="mb-5 text-sm leading-6 text-[#747985]">
          Vous êtes sur le point de {{ actionLabel.toLocaleLowerCase('fr') }}
          <strong class="text-[#252830]">{{ companyName }}</strong>.
          <template v-if="isSuspension">Les accès seront limités, mais les données resteront conservées.</template>
          <template v-else-if="status === 'pending'">Le compte et ses accès deviendront opérationnels.</template>
        </p>
        <v-textarea
          v-if="isSuspension"
          v-model="reason"
          label="Motif de la suspension"
          placeholder="Précisez la raison de cette intervention"
          rows="3"
          hide-details="auto"
          :rules="[(value: string) => Boolean(value?.trim()) || 'Le motif est obligatoire']"
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn :color="isSuspension ? 'error' : 'success'" variant="flat" @click="confirm">
          {{ actionLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
