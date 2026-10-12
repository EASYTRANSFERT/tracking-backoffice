<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description: string
  }>(),
  { icon: 'mdi-database-off-outline' },
)
</script>

<template>
  <div class="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
    <v-avatar color="grey-lighten-4" size="64">
      <v-icon :icon="icon" color="secondary" size="30" />
    </v-avatar>
    <h3 class="mt-4 text-base font-bold text-[#252830]">{{ title }}</h3>
    <p class="mt-2 max-w-md text-sm leading-6 text-[#747985]">{{ description }}</p>
    <div class="mt-5"><slot /></div>
  </div>
</template>
