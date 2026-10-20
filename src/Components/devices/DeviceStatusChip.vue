<script setup lang="ts">
import { computed } from 'vue'
import { deviceStatusConfig } from '@/Components/devices/device-format'
import type { ApiDeviceStatus } from '@/types/device'

const props = defineProps<{ status: ApiDeviceStatus }>()
const config = computed(() => deviceStatusConfig(props.status))
</script>

<template>
  <v-chip :color="config.color" :prepend-icon="config.icon" variant="tonal" size="small" class="min-w-[108px] justify-center font-weight-medium">
    {{ config.label }}
  </v-chip>
</template>
