<script setup lang="ts">
import { computed } from 'vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { Site } from '@/types/administrator'
const props = defineProps<{ site: Site; loading?: boolean }>()
const emit = defineEmits<{ regenerate: [site: Site]; details: [site: Site] }>()
const rotatedAt = computed(() => props.site.qrRotatedAt
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(props.site.qrRotatedAt))
  : null)
</script>
<template>
  <v-card class="h-full">
    <v-card-text class="flex h-full flex-col pa-6">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-bold text-[#292d38]">{{ site.name }}</p>
          <p class="mt-1 text-xs text-[#848484]">{{ site.city || site.address }}</p>
          </div>
          <AppStatusChip :status="site.status" />
          </div>
          <div class="mx-auto my-6 grid h-40 w-40 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <img v-if="site.qrImage" :src="site.qrImage" :alt="`QR code du site ${site.name}`" class="h-full w-full object-contain [image-rendering:pixelated]" />
            <v-icon v-else icon="mdi-qrcode" size="128" color="grey-lighten-1" />
            </div>
            <p class="rounded bg-gray-100 px-3 py-2 text-center text-xs text-[#535865]">
              {{ site.qrImage ? `Généré le ${rotatedAt}` : rotatedAt ? `Dernière génération le ${rotatedAt} · régénérez pour l’afficher` : 'QR code pas encore généré' }}</p>
              <v-spacer />
              <div class="mt-5 grid grid-cols-2 gap-3">
                <v-btn
                variant="outlined"
                color="secondary"
                prepend-icon="mdi-eye-outline"
                @click="emit('details', site)">Voir
                </v-btn>
                <v-btn color="primary"
                        :prepend-icon="site.qrRotatedAt ? 'mdi-refresh' : 'mdi-qrcode-plus'"
                        :loading="loading" :disabled="site.status === 'inactive'"
                        @click="emit('regenerate', site)">
                        {{ site.qrRotatedAt ? 'Régénérer' : 'Générer' }}
                        </v-btn>
                        </div>
                        </v-card-text>
                    </v-card>
</template>
