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
      <h1 class="text-4xl font-bold tracking-tight text-gray-700">
        {{ title }}
      </h1>

      <img
        src="@/assets/kaybiclogo.png"
        alt="Kaybic Africa"
        class="mx-auto mt-4 h-16 w-auto object-contain"
      />

      <p
        v-if="description"
        class="mt-5 text-sm leading-6 text-gray-600"
      >
        {{ description }}
      </p>
    </header>
    <v-card-text class="pa-0">
      <slot />
    </v-card-text>
  </v-card>
</template>
