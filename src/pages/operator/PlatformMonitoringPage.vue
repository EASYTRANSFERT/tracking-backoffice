<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import SupportInterventionDialog from '@/Components/monitoring/SupportInterventionDialog.vue'
import PlatformLogTable from '@/Components/monitoring/PlatformLogTable.vue'
import { useOperatorStore } from '@/stores/operator.store'

const store = useOperatorStore()
const { companies, activeAgentsCount, activities, supportInterventions } = storeToRefs(store)
const interventionDialog = ref(false)
const priorityColor = { low: 'success', medium: 'warning', high: 'error' } as const
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #title>Supervision de la plateforme</template>
      <template #description>Consultez les indicateurs agrégés et suivez les interventions support.</template>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="interventionDialog = true">Nouvelle intervention</v-btn></template>
    </PageHeader>

    <v-alert type="info" variant="tonal" class="mb-6" icon="mdi-shield-account-outline">
      Cette vue présente uniquement des données agrégées. Les fiches, selfies et pointages individuels des agents ne sont pas accessibles à l’opérateur KAYBIC.
    </v-alert>

    <v-row>
      <v-col cols="12" sm="6" lg="3"><DashboardStatCard title="Agents actifs" :value="activeAgentsCount" icon="mdi-account-group-outline" change="Toutes entreprises" /></v-col>
      <v-col cols="12" sm="6" lg="3"><DashboardStatCard title="Pointages aujourd’hui" value="1 842" icon="mdi-qrcode-scan" change="+8,4 %" /></v-col>
      <v-col cols="12" sm="6" lg="3"><DashboardStatCard title="Disponibilité" value="OK" icon="mdi-server-network" change="Services opérationnels" /></v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" lg="7"><PlatformLogTable :activities="activities" /></v-col>

      <v-col cols="12" lg="5">
        <AppSectionCard title="Interventions support" description="Demandes nécessitant un suivi" icon="mdi-lifebuoy">
          <div class="space-y-3">
            <div v-for="ticket in supportInterventions" :key="ticket.id" class="rounded-xl border border-gray-200 p-4">
              <div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold text-[#252830]">{{ ticket.subject }}</p><p class="mt-1 text-xs text-[#747985]">{{ ticket.companyName }}</p></div><v-chip :color="priorityColor[ticket.priority]" variant="tonal" size="x-small">{{ ticket.priority }}</v-chip></div>
              <div class="mt-4 flex items-center justify-between"><AppStatusChip :status="ticket.status" /><span class="text-[11px] text-[#9a9da5]">{{ new Date(ticket.createdAt).toLocaleDateString('fr-FR') }}</span></div>
            </div>
          </div>
        </AppSectionCard>
      </v-col>
    </v-row>

    <SupportInterventionDialog v-model="interventionDialog" :companies="companies" @submit="store.createSupportIntervention" />
  </div>
</template>
