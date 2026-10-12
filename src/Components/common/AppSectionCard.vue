<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <v-card>
    <v-card-title class="flex items-start gap-3 px-6 py-5">
      <v-avatar v-if="icon" color="red-lighten-5" rounded="lg" size="40">
        <v-icon :icon="icon" color="primary" size="21" />
      </v-avatar>
      <div>
        <h2 class="text-base font-bold text-[#252830]">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-xs font-normal text-[#747985]">{{ description }}</p>
      </div>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>
    <v-divider />
    <v-card-text class="px-6 py-6"><slot /></v-card-text>
  </v-card>
</template>
