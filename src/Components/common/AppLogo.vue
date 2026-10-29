<script setup lang="ts">
import darkLogo from '@/assets/Icon_web_app_Dark_Dark-04.svg'
import lightLogo from '@/assets/icon.svg'
import { useColorMode } from '@/composables/useColorMode'

const { isDark } = useColorMode()
</script>

<template>
  <img :src="isDark ? darkLogo : lightLogo" alt="Kaybic Africa" />
</template>
