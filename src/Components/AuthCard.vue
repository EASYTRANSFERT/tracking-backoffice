<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <v-card
  width="100%"
  max-width="400"
  elevation="8"
  color="rgba(255,  255, 255, 0.20)"
  rounded="xl"
  class="relative z-10 border border-white/70 px-10 py-12 backdrop-blur-2xl sm:px-14"
  >
    <header class="mb-8 text-center">
      <img
        src="@/assets/icon.svg"
        alt="Kaybic Africa"
        class="mx-auto h-auto w-full max-w-72 object-contain"
      />

      <h1 class="mt-4 text-2xl font-bold tracking-tight text-gray-700">
        {{ title }}
      </h1>

      <p
        v-if="description"
        class="mt-3 text-sm leading-6 text-gray-600"
      >
        {{ description }}
      </p>
    </header>
    <v-card-text class="pa-0">
      <slot />
    </v-card-text>
  </v-card>
</template>
