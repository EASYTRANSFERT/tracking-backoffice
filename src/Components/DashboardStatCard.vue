<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    value: string | number
    icon?: string
    iconSrc?: string
    crossedOut?: boolean
    change: string
    changeColor?: 'success' | 'warning' | 'secondary' | 'primary'
  }>(),
  {
    changeColor: 'success',
  },
)
</script>

<template>
  <v-card class="h-full min-h-[158px] pa-5" rounded="lg" elevation="1">
    <div class="flex h-full items-start gap-4">
      <v-avatar color="red-lighten-5" size="50" rounded="lg">
        <span v-if="iconSrc" class="relative inline-flex h-7 w-7 items-center justify-center">
          <img :src="iconSrc" alt="" aria-hidden="true" class="h-7 w-7 object-contain" />
          <span v-if="crossedOut" aria-hidden="true" class="absolute h-[3px] w-9 rotate-45 rounded-full bg-[#D80F16] shadow-[0_0_0_2px_white]" />
        </span>
        <v-icon v-else :icon="icon" color="primary" size="26" />
      </v-avatar>

      <div class="flex min-h-[116px] min-w-0 flex-1 flex-col items-start">
        <p class="text-[13px] font-medium text-[#747985]">{{ title }}</p>
        <p class="mt-1 text-[29px] font-bold leading-none text-[#252830]">{{ value }}</p>

        <v-chip :color="changeColor" variant="tonal" class="mt-3 self-start">
          {{ change }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>
