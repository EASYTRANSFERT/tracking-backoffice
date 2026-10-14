<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import AppSnackbar from '@/Components/common/AppSnackbar.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import CompanyStatusDialog from '@/Components/companies/CompanyStatusDialog.vue'
import CompanyStatusIcon from '@/Components/companies/CompanyStatusIcon.vue'
import CompanyAuditTimeline from '@/Components/companies/CompanyAuditTimeline.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const companyId = computed(() => route.params.companyId as string)
const company = computed(() => store.getCompanyById(companyId.value))
const offer = computed(() => company.value ? store.getOfferById(company.value.offerId) : undefined)
const statusDialog = ref(false)
const showSuccess = ref(route.query.created === '1' || route.query.updated === '1')
const successMessage = computed(() => route.query.created === '1' ? 'Entreprise créée avec succès.' : 'Entreprise mise à jour avec succès.')
const formattedDate = computed(() => company.value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(company.value.createdAt)) : '')

async function updateStatus(reason: string) {
  if (!company.value || company.value.status === 'pending') return
  if (company.value.status === 'suspended') await store.reactivateCompany(company.value.id)
  else await store.suspendCompany(company.value.id, reason)
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1200px]">
    <template v-if="company">
      <PageHeader>
        <template #title>{{ company.legalName }}</template>
        <template #description>Compte client créé le {{ formattedDate }}</template>
        <template #actions>
          <v-btn variant="outlined" color="secondary" prepend-icon="mdi-pencil-outline" :to="{ name: 'company-edit', params: { companyId } }">Modifier</v-btn>
          <v-btn :color="company.status === 'suspended' ? 'success' : 'error'" variant="flat" :prepend-icon="company.status === 'suspended' ? 'mdi-play-circle-outline' : 'mdi-pause-circle-outline'" :disabled="company.status === 'pending'" :title="company.status === 'pending' ? 'Une entreprise en attente doit être activée avant de pouvoir être suspendue.' : undefined" @click="statusDialog = true">
            {{ company.status === 'suspended' ? 'Réactiver' : 'Suspendre' }}
          </v-btn>
        </template>
      </PageHeader>

      <v-alert v-if="company.status === 'suspended'" type="error" variant="tonal" class="mb-6" title="Entreprise suspendue" :text="company.suspensionReason ?? 'Les accès de cette entreprise sont actuellement limités.'" />

      <v-row>
        <v-col cols="12" lg="8">
          <div class="space-y-6">
            <AppSectionCard title="Informations générales" description="Identité et coordonnées de l’entreprise" icon="mdi-domain">
              <dl class="grid gap-6 sm:grid-cols-2">
                <div><dt class="text-xs font-medium text-[#848484]">Raison sociale</dt><dd class="mt-1 font-semibold text-[#252830]">{{ company.legalName }}</dd></div>
                <div><dt class="text-xs font-medium text-[#848484]">Statut</dt><dd class="mt-2"><AppStatusChip :status="company.status" /></dd></div>
                <div><dt class="text-xs font-medium text-[#848484]">Pays</dt><dd class="mt-1 text-sm text-[#252830]">{{ company.country }}</dd></div>
                <div><dt class="text-xs font-medium text-[#848484]">Fuseau horaire</dt><dd class="mt-1 text-sm text-[#252830]">{{ company.timezone }}</dd></div>
                <div><dt class="text-xs font-medium text-[#848484]">Début du contrat</dt><dd class="mt-1 text-sm text-[#252830]">{{ company.contractFrom ? new Date(company.contractFrom).toLocaleDateString('fr-FR') : 'Non renseigné' }}</dd></div>
                <div><dt class="text-xs font-medium text-[#848484]">Agents actifs</dt><dd class="mt-1 text-sm font-semibold text-[#252830]">{{ company.activeAgents }}</dd></div>
              </dl>
            </AppSectionCard>

            <AppSectionCard title="Historique des interventions" description="Actions importantes conservées pour l’audit" icon="mdi-history">
              <CompanyAuditTimeline :company="company" />
            </AppSectionCard>
          </div>
        </v-col>

        <v-col cols="12" lg="4">
          <AppSectionCard title="Offre attribuée" description="Formule actuellement appliquée" icon="mdi-cash-multiple">
            <template v-if="offer"><p class="text-2xl font-bold text-[#252830]">{{ offer.name }}</p><p class="mt-2 text-sm leading-6 text-[#747985]">{{ offer.description }}</p><v-divider class="my-5" /><div class="flex justify-between text-sm"><span class="text-[#747985]">Limite d’agents</span><strong>{{ offer.maxActiveAgents }}</strong></div></template>
          </AppSectionCard>
          <v-card class="mt-6 pa-6 text-center"><CompanyStatusIcon :suspended="company.status === 'suspended'" :size="58" /><p class="mt-3 text-sm font-semibold text-[#252830]">{{ company.status === 'suspended' ? 'Accès limités' : 'Services opérationnels' }}</p><p class="mt-1 text-xs leading-5 text-[#747985]">État actuel des services de cette entreprise.</p></v-card>
        </v-col>
      </v-row>

      <CompanyStatusDialog v-model="statusDialog" :company-name="company.legalName" :suspended="company.status === 'suspended'" @confirm="updateStatus" />
      <AppSnackbar v-model="showSuccess" :message="successMessage" />
    </template>

    <v-alert v-else type="error" variant="tonal" title="Entreprise introuvable" text="Cette entreprise n’existe pas ou n’est plus disponible.">
      <template #append><v-btn variant="text" @click="router.push({ name: 'companies' })">Retour</v-btn></template>
    </v-alert>
  </div>
</template>
