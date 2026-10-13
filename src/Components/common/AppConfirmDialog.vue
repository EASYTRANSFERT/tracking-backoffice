<script setup lang="ts">
import type { FeedbackColor } from '@/stores/ui-feedback.store'

withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  color?: FeedbackColor
}>(), {
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  color: 'warning',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <v-dialog :model-value="modelValue" persistent max-width="480">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar :color="`${color}-lighten-5`" size="42">
          <v-icon :color="color" icon="mdi-alert-circle-outline" />
        </v-avatar>
        {{ title }}
      </v-card-title>

      <v-card-text class="text-body-1 text-medium-emphasis">
        {{ message }}
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <v-btn variant="text" @click="emit('cancel')">{{ cancelText }}</v-btn>
        <v-btn :color="color" variant="flat" @click="emit('confirm')">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
