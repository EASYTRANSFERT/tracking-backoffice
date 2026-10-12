<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    retryLabel?: string
  }>(),
  {
    title: 'Une erreur est survenue',
    description: 'Impossible de charger les informations demandées.',
    retryLabel: 'Réessayer',
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
    <v-avatar color="red-lighten-5" size="64"><v-icon icon="mdi-alert-circle-outline" color="error" size="32" /></v-avatar>
    <h2 class="mt-4 text-lg font-bold text-[#252830]">{{ title }}</h2>
    <p class="mt-2 max-w-md text-sm leading-6 text-[#747985]">{{ description }}</p>
    <v-btn class="mt-5" color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="emit('retry')">{{ retryLabel }}</v-btn>
  </div>
</template>
