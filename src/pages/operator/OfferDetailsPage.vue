<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import AppSnackbar from '@/Components/common/AppSnackbar.vue'
import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'

const route = useRoute()
const store = useOperatorStore()
const { canUpdateOffers } = storeToRefs(store)
const offerId = computed(() => route.params.offerId as string)
const offer = computed(() => store.getOfferById(offerId.value))
const assignedCompanies = computed(() => store.companies.filter((company) => company.offerId === offerId.value))
const showSuccess = ref(route.query.created === '1' || route.query.updated === '1')
const successMessage = computed(() => route.query.created === '1' ? 'Offre créée avec succès.' : 'Offre mise à jour avec succès.')
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <template v-if="offer">
      <PageHeader>
        <template #title>{{ offer.name }}</template>
        <template #description>Détails et utilisation de l’offre.</template>
        <template #actions><v-btn v-if="canUpdateOffers" color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'offer-edit', params: { offerId } }">Modifier l’offre</v-btn></template>
      </PageHeader>
      <v-row>
        <v-col cols="12" md="7">
          <AppSectionCard title="Configuration" description="Paramètres commerciaux de la formule" icon="mdi-cash-multiple">
            <p class="text-sm leading-6 text-[#747985]">{{ offer.description }}</p>
            <dl class="mt-7 grid gap-6 sm:grid-cols-2">
              <div><dt class="text-xs text-[#848484]">Code de l’offre</dt><dd class="mt-1 text-xl font-bold text-[#252830]">{{ offer.code }}</dd></div>
              <div><dt class="text-xs text-[#848484]">Agents actifs maximum</dt><dd class="mt-1 text-xl font-bold text-[#252830]">{{ offer.maxActiveAgents }}</dd></div>
              <div><dt class="text-xs text-[#848484]">Statut</dt><dd class="mt-2"><AppStatusChip :status="offer.status" /></dd></div>
              <div><dt class="text-xs text-[#848484]">Entreprises abonnées</dt><dd class="mt-1 text-xl font-bold text-[#252830]">{{ assignedCompanies.length }}</dd></div>
            </dl>
          </AppSectionCard>
        </v-col>
        <v-col cols="12" md="5">
          <AppSectionCard title="Entreprises abonnées" description="Comptes utilisant actuellement cette formule" icon="mdi-domain">
            <v-list v-if="assignedCompanies.length" lines="two" class="pa-0">
              <v-list-item v-for="company in assignedCompanies" :key="company.id" :title="company.legalName" :subtitle="`${company.activeAgents} agents actifs`" :to="{ name: 'company-details', params: { companyId: company.id } }">
                <template #prepend><v-avatar color="red-lighten-5"><v-icon icon="mdi-domain" color="primary" /></v-avatar></template>
              </v-list-item>
            </v-list>
            <p v-else class="py-8 text-center text-sm text-[#747985]">Aucune entreprise n’utilise encore cette offre.</p>
          </AppSectionCard>
        </v-col>
      </v-row>
    </template>
    <v-alert v-else type="error" variant="tonal" title="Offre introuvable" text="Cette offre n’existe pas ou n’est plus disponible." />
    <AppSnackbar v-model="showSuccess" :message="successMessage" />
  </div>
</template>
