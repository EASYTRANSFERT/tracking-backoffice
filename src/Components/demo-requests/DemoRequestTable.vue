<script setup lang="ts">
import { formatAuditDate } from '@/Components/audit/audit-format'
import { demoRequestStatusConfig, formatDemoDate } from '@/Components/demo-requests/demo-request-format'
import type { DemoRequestResponse } from '@/types/demo-request'

defineProps<{ requests: DemoRequestResponse[] }>()

const emit = defineEmits<{ view: [request: DemoRequestResponse] }>()
</script>

<template>
  <div class="overflow-x-auto">
    <v-table hover density="comfortable" class="min-w-[960px]">
      <thead>
        <tr>
          <th class="w-40">Reçue le</th>
          <th>Contact</th>
          <th>Entreprise</th>
          <th>Coordonnées</th>
          <th class="w-40">Démo</th>
          <th class="w-40">Statut</th>
          <th class="w-12"><span class="sr-only">Détail</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests" :key="request.id" class="cursor-pointer" @click="emit('view', request)">
          <td class="text-sm whitespace-nowrap text-[#535865]">{{ formatAuditDate(request.createdAt) }}</td>
          <td>
            <p class="font-semibold text-[#292d38]">{{ request.fullName }}</p>
            <p v-if="request.message" class="max-w-[260px] truncate text-xs text-[#848484]" :title="request.message">{{ request.message }}</p>
          </td>
          <td class="text-sm font-medium text-[#535865]">{{ request.company }}</td>
          <td class="text-sm text-[#535865]">
            <p>{{ request.email }}</p>
            <p v-if="request.phone" class="text-xs text-[#848484]">{{ request.phone }}</p>
          </td>
          <td class="text-sm whitespace-nowrap text-[#535865]">{{ request.demoAt ? formatDemoDate(request.demoAt) : '—' }}</td>
          <td>
            <v-chip
              :color="demoRequestStatusConfig(request.status).color"
              :prepend-icon="demoRequestStatusConfig(request.status).icon"
              size="small"
              variant="tonal"
            >
              {{ demoRequestStatusConfig(request.status).label }}
            </v-chip>
          </td>
          <td><v-icon icon="mdi-chevron-right" color="secondary" /></td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
