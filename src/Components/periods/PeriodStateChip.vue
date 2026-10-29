<script setup lang="ts">
import { computed } from 'vue'
import { periodStateConfig } from '@/utils/period-format'
import type { ApiPeriodState } from '@/types/period'

const props = defineProps<{ state: ApiPeriodState }>()
const config = computed(() => periodStateConfig(props.state))
</script>

<template>
  <v-chip :color="config.color" :prepend-icon="config.icon" variant="tonal" size="small" class="min-w-[128px] justify-center font-weight-medium">
    {{ config.label }}
  </v-chip>
</template>
