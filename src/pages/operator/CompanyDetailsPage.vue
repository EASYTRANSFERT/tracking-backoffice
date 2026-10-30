<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppSectionCard from '@/Components/common/AppSectionCard.vue'
import AppSnackbar from '@/Components/common/AppSnackbar.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import CompanyStatusDialog from '@/Components/companies/CompanyStatusDialog.vue'
import CompanyAuditTimeline from '@/Components/companies/CompanyAuditTimeline.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useOperatorStore } from '@/stores/operator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

const route = useRoute()
const router = useRouter()
const store = useOperatorStore()
const feedback = useUiFeedbackStore()
const companyId = computed(() => route.params.companyId as string)
const company = computed(() => store.getCompanyById(companyId.value))
const offer = computed(() => company.value ? store.getOfferById(company.value.offerId) : undefined)
const statusDialog = ref(false)
const showSuccess = ref(route.query.created === '1' || route.query.updated === '1')
const successMessage = computed(() => route.query.created === '1' ? 'Entreprise créée avec succès.' : 'Entreprise mise à jour avec succès.')
// Administrateurs créés pendant cette session : l'API ne permet pas encore de les relister.
const administrators = computed(() => store.invitedAdministrators[companyId.value] ?? [])
const resendingId = ref<string>()

async function resendInvitation(userId: string) {
  resendingId.value = userId
  try {
    await store.resendAdministratorInvitation(companyId.value, userId)
    feedback.success('Invitation renvoyée : le lien précédent ne fonctionne plus.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de renvoyer l’invitation.'))
  } finally {
    resendingId.value = undefined
  }
}
const formattedDate = computed(() => company.value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(company.value.createdAt)) : '')

async function updateStatus(reason: string) {
  if (!company.value) return
  const previousStatus = company.value.status
  try {
    if (previousStatus === 'active') await store.suspendCompany(company.value.id, reason)
    else await store.reactivateCompany(company.value.id)
    feedback.success(previousStatus === 'active' ? 'Entreprise suspendue.' : 'Entreprise activée.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de modifier le statut de cette entreprise.'))
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1200px]">
    <template v-if="company">
      <PageHeader>
        <template #title>{{ company.legalName }}</template>
        <template #description>Compte client créé le {{ formattedDate }}</template>
        <template #actions>
          <v-btn variant="outlined" color="secondary" prepend-icon="mdi-account-key-outline" :to="{ name: 'company-admin-create', params: { companyId } }">Créer un administrateur</v-btn>
          <v-btn variant="outlined" color="secondary" prepend-icon="mdi-pencil-outline" :to="{ name: 'company-edit', params: { companyId } }">Modifier</v-btn>
          <v-btn :color="company.status === 'active' ? 'error' : 'success'" variant="flat" :prepend-icon="company.status === 'active' ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'" :disabled="company.status === 'pending' && !company.offerId" :title="company.status === 'pending' && !company.offerId ? 'Attribuez une offre avant d’activer cette entreprise.' : undefined" @click="statusDialog = true">
            {{ company.status === 'pending' ? 'Activer' : company.status === 'suspended' ? 'Réactiver' : 'Suspendre' }}
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
          <AppSectionCard v-if="administrators.length" class="mt-6" title="Administrateurs" description="Comptes créés pendant cette session" icon="mdi-account-key-outline">
            <div class="space-y-4">
              <div v-for="admin in administrators" :key="admin.id" class="space-y-2">
                <div><p class="font-semibold text-[#252830]">{{ admin.names }}</p><p class="text-xs text-[#747985]">{{ admin.email }}</p></div>
                <div class="flex flex-wrap items-center gap-2">
                  <v-chip size="small" variant="tonal" :color="admin.invitationSent === false ? 'warning' : 'success'" :prepend-icon="admin.invitationSent === false ? 'mdi-email-alert-outline' : 'mdi-email-check-outline'">{{ admin.invitationSent === false ? 'Invitation non envoyée' : 'Invitation envoyée' }}</v-chip>
                  <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-email-sync-outline" :loading="resendingId === admin.id" @click="resendInvitation(admin.id)">Renvoyer l’invitation</v-btn>
                </div>
              </div>
            </div>
          </AppSectionCard>
        </v-col>
      </v-row>

      <CompanyStatusDialog v-model="statusDialog" :company-name="company.legalName" :status="company.status" @confirm="updateStatus" />
      <AppSnackbar v-model="showSuccess" :message="successMessage" />
    </template>

    <v-alert v-else type="error" variant="tonal" title="Entreprise introuvable" text="Cette entreprise n’existe pas ou n’est plus disponible.">
      <template #append><v-btn variant="text" @click="router.push({ name: 'companies' })">Retour</v-btn></template>
    </v-alert>
  </div>
</template>
