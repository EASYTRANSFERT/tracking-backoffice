<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import CompanyTable from '@/Components/CompanyTable.vue'
import DashboardStatCard from '@/Components/DashboardStatCard.vue'
import OfferDistributionCard from '@/Components/OfferDistributionCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import companyIcon from '@/assets/building (2).png'
import offerIcon from '@/assets/coin (1).png'
import { useOperatorStore } from '@/stores/operator.store'

const router = useRouter()
const store = useOperatorStore()
const {
  companies,
  offers,
  activeCompaniesCount,
  activeOffersCount,
  suspendedCompaniesCount,
} = storeToRefs(store)
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
          change="Toutes entreprises confondues"
        />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Offres disponibles"
          :value="activeOffersCount"
          :icon-src="offerIcon"
          change="Dans le catalogue"
        />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard title="Demandes en attente" :value="companies.filter((company) => company.status === 'pending').length" icon="mdi-clock-outline" change="Toutes entreprises confondues" change-color="warning" />
      </v-col>

      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard title="Entreprises suspendues" :value="suspendedCompaniesCount" :icon-src="companyIcon" crossed-out change="Toutes entreprises confondues" change-color="secondary" />
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
          @view="router.push({ name: 'company-details', params: { companyId: $event.id } })"
          @edit="router.push({ name: 'company-edit', params: { companyId: $event.id } })"
          @change-status="router.push({ name: 'company-details', params: { companyId: $event.id } })"
        />
      </v-col>

      <v-col cols="12" lg="4">
        <OfferDistributionCard :companies="companies" :offers="offers" />
      </v-col>
    </v-row>
  </div>
</template>
