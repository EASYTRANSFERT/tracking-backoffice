<script setup lang="ts">
import buildingIcon from '@/assets/building (2).png'

withDefaults(
  defineProps<{
    suspended?: boolean
    size?: number
  }>(),
  { suspended: false, size: 28 },
)
</script>

<template>
  <span class="relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <img :src="buildingIcon" alt="" aria-hidden="true" class="h-full w-full object-contain" />
    <span
      v-if="suspended"
      aria-hidden="true"
      class="absolute h-[3px] w-[125%] rotate-45 rounded-full bg-[#D80F16] shadow-[0_0_0_2px_white]"
    />
  </span>
</template>
