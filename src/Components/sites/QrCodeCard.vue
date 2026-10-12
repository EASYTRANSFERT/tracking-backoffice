<script setup lang="ts">
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { Site } from '@/types/administrator'
defineProps<{ site: Site }>()
const emit = defineEmits<{ regenerate: [site: Site]; details: [site: Site] }>()
</script>
<template>
  <v-card class="h-full"><v-card-text class="flex h-full flex-col pa-6"><div class="flex items-start justify-between gap-3"><div><p class="font-bold text-[#292d38]">{{ site.name }}</p><p class="mt-1 text-xs text-[#848484]">{{ site.city }}</p></div><AppStatusChip :status="site.status" /></div><div class="mx-auto my-6 grid h-40 w-40 place-items-center rounded-xl border border-gray-200 bg-white shadow-sm"><v-icon icon="mdi-qrcode" size="128" color="black" /></div><code class="block truncate rounded bg-gray-100 px-3 py-2 text-center text-xs text-[#535865]">{{ site.qrCode }}</code><v-spacer /><div class="mt-5 grid grid-cols-2 gap-3"><v-btn variant="outlined" color="secondary" prepend-icon="mdi-eye-outline" @click="emit('details', site)">Voir</v-btn><v-btn color="primary" prepend-icon="mdi-refresh" @click="emit('regenerate', site)">Régénérer</v-btn></div></v-card-text></v-card>
</template>
