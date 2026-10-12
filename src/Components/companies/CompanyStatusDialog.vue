<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  companyName: string
  suspended: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string]
}>()

const reason = ref('')

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) reason.value = ''
  },
)

function confirm() {
  if (!props.suspended && !reason.value.trim()) return
  emit('confirm', reason.value.trim())
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 pt-6">
        <v-avatar :color="suspended ? 'green-lighten-5' : 'red-lighten-5'" size="42">
          <v-icon :icon="suspended ? 'mdi-play-circle-outline' : 'mdi-pause-circle-outline'" :color="suspended ? 'success' : 'error'" />
        </v-avatar>
        <span>{{ suspended ? 'Réactiver' : 'Suspendre' }} l’entreprise</span>
      </v-card-title>

      <v-card-text class="px-6 py-5">
        <p class="mb-5 text-sm leading-6 text-[#747985]">
          Vous êtes sur le point de {{ suspended ? 'réactiver' : 'suspendre' }}
          <strong class="text-[#252830]">{{ companyName }}</strong>.
          <template v-if="!suspended">Les accès seront limités, mais les données resteront conservées.</template>
        </p>
        <v-textarea
          v-if="!suspended"
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
        <v-btn :color="suspended ? 'success' : 'error'" variant="flat" @click="confirm">
          {{ suspended ? 'Réactiver' : 'Suspendre' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
