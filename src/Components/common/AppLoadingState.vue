<script setup lang="ts">
withDefaults(defineProps<{ message?: string; compact?: boolean }>(), {
  message: 'Chargement en cours…',
  compact: false,
})
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'min-h-32 p-4' : 'min-h-72 p-8'"
  >
    <v-progress-circular indeterminate color="primary" :size="compact ? 36 : 48" :width="4" />
    <p class="mt-4 text-sm font-medium text-[#747985]">{{ message }}</p>
  </div>
</template>
