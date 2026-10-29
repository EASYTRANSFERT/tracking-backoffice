<script setup lang="ts">
import { computed } from 'vue'

import AppLogo from '@/Components/common/AppLogo.vue'
import { useColorMode } from '@/composables/useColorMode'

interface Props {
  title: string
  description?: string
}

defineProps<Props>()

const { isDark } = useColorMode()
// Verre dépoli clair le jour ; noir translucide la nuit pour que la carte se fonde dans le fond noir.
const cardColor = computed(() => (isDark.value ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.20)'))
</script>

<template>
  <v-card
  width="100%"
  max-width="400"
  elevation="8"
  :color="cardColor"
  rounded="xl"
  class="relative z-10 border border-white/70 px-10 dark:border-white/15 py-12 backdrop-blur-2xl sm:px-14"
  >
    <header class="mb-8 text-center">
      <AppLogo class="mx-auto h-auto w-full max-w-72 object-contain" />

      <h1 class="mt-4 text-2xl font-bold tracking-tight text-gray-700 dark:text-white">
        {{ title }}
      </h1>

      <p
        v-if="description"
        class="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300"
      >
        {{ description }}
      </p>
    </header>
    <v-card-text class="pa-0">
      <slot />
    </v-card-text>
  </v-card>
</template>
