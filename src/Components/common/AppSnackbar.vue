<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    message: string
    color?: 'success' | 'error' | 'warning' | 'info'
    timeout?: number
  }>(),
  { color: 'success', timeout: 4000 },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const icon = computed(() => ({
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  warning: 'mdi-alert-outline',
  info: 'mdi-information-outline',
})[props.color])
</script>

<template>
  <v-snackbar
    :model-value="modelValue"
    :color="color"
    :timeout="timeout"
    location="top right"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex items-center gap-3">
      <v-icon :icon="icon" />
      <span>{{ message }}</span>
    </div>
    <template #actions><v-btn icon="mdi-close" variant="text" aria-label="Fermer la notification" @click="emit('update:modelValue', false)" /></template>
  </v-snackbar>
</template>
