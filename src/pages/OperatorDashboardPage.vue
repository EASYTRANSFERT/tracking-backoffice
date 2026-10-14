<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import CompanyTable from '@/Components/CompanyTable.vue'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import companyIcon from '@/assets/building (2).png'
import offerIcon from '@/assets/coin (1).png'
import { useOperatorStore } from '@/stores/operator.store'

const router = useRouter()
const store = useOperatorStore()
const { companies, offers, activeCompaniesCount, activeOffersCount, suspendedCompaniesCount } = storeToRefs(store)
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px]">
    <PageHeader>
      <template #actions><v-btn color="primary" prepend-icon="mdi-plus" size="large" :to="{ name: 'company-create' }">Nouvelle entreprise</v-btn></template>
    </PageHeader>

    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Entreprises actives"
          :value="activeCompaniesCount"
          :icon-src="companyIcon"
          change="Sur la page chargée"
        />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Offres disponibles"
          :value="activeOffersCount"
          :icon-src="offerIcon"
          change="Sur la page chargée"
        />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard title="Demandes en attente" :value="companies.filter((company) => company.status === 'pending').length" icon="mdi-clock-outline" change="Sur la page chargée" change-color="warning" />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard title="Entreprises suspendues" :value="suspendedCompaniesCount" :icon-src="companyIcon" crossed-out change="Sur la page chargée" change-color="secondary" />
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" lg="8">
        <CompanyTable
          :companies="companies"
          :offers="offers"
          title="Entreprises récentes"
          description="Les derniers comptes ajoutés à la plateforme"
          :searchable="false"
          :page-size="4"
          @view="router.push({ name: 'company-details', params: { companyId: $event.id } })"
          @edit="router.push({ name: 'company-edit', params: { companyId: $event.id } })"
          @change-status="router.push({ name: 'company-details', params: { companyId: $event.id } })"
        />
      </v-col>

      <v-col cols="12" lg="4">
        <div class="flex h-full flex-col gap-6">
          <v-card>
            <v-card-title class="px-5 pt-5">Catalogue disponible</v-card-title>
            <v-card-subtitle class="px-5">Données fournies par l’API des offres</v-card-subtitle>
            <v-list lines="two">
              <v-list-item v-for="offer in offers.slice(0, 4)" :key="offer.id" :title="offer.name" :subtitle="`${offer.maxActiveAgents} agents maximum`" prepend-icon="mdi-cash-multiple" />
            </v-list>
            <v-card-actions><v-btn color="primary" variant="text" :to="{ name: 'offers' }">Voir les offres</v-btn></v-card-actions>
          </v-card>
          <v-card>
            <v-card-title class="px-5 pt-5">Actions rapides</v-card-title>
            <v-card-text class="grid gap-3">
              <v-btn variant="tonal" color="primary" prepend-icon="mdi-domain-plus" class="justify-start" :to="{ name: 'company-create' }">Créer une entreprise</v-btn>
              <v-btn variant="tonal" color="primary" prepend-icon="mdi-cash-plus" class="justify-start" :to="{ name: 'offer-create' }">Créer une offre</v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
