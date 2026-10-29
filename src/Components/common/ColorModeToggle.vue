<script setup lang="ts">
import { useColorMode } from '@/composables/useColorMode'

const { isDark, toggle } = useColorMode()
</script>

<template>
  <v-btn
    :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    variant="text"
    :aria-label="isDark ? 'Passer au mode clair' : 'Passer au mode sombre'"
    @click="toggle"
  />
</template>
