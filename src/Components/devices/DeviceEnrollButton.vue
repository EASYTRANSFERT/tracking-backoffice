<script setup lang="ts">
import { ref } from 'vue'
import DeviceEnrollDialog from '@/Components/devices/DeviceEnrollDialog.vue'
import { useDeviceStore } from '@/stores/device.store'

withDefaults(defineProps<{ userId?: string; variant?: 'flat' | 'tonal' }>(), { variant: 'flat' })
const store = useDeviceStore()
const open = ref(false)
</script>

<template>
  <v-btn v-if="store.canEnrollDevices" color="primary" :variant="variant" prepend-icon="mdi-cellphone-plus" @click="open = true">Enrôler un appareil</v-btn>
  <v-tooltip v-else text="Bientôt disponible : l’API ne propose pas encore l’enrôlement." location="bottom">
    <template #activator="{ props: tooltipProps }">
      <span v-bind="tooltipProps"><v-btn color="primary" :variant="variant" prepend-icon="mdi-cellphone-plus" disabled>Enrôler un appareil</v-btn></span>
    </template>
  </v-tooltip>
  <DeviceEnrollDialog v-model="open" :user-id="userId" />
</template>
