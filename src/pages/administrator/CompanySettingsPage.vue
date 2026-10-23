<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import CompanySettingsForm from '@/Components/settings/CompanySettingsForm.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { useCompanySettingsStore } from '@/stores/company-settings.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'

import type { TenantSettings } from '@/types/platform'

const store = useCompanySettingsStore()
const feedback = useUiFeedbackStore()
const { company, settings, hasSettings, isLoading, isSaving } = storeToRefs(store)
const dirty = ref(false)
const loadFailed = ref(false)

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value)) : 'Sans date de fin'
const contract = computed(() => company.value ? `Du ${formatDate(company.value.contractFrom)} au ${formatDate(company.value.contractTo)}`.replace('au Sans date de fin', '(sans date de fin)') : '')

onMounted(async () => {
  try { await store.load() }
  catch (error) { loadFailed.value = true; feedback.error(getApiErrorMessage(error, 'Impossible de charger les paramètres de l’entreprise.')) }
})
onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications des paramètres seront perdues.', confirmText: 'Quitter' }))

const retentionChanged = (next: TenantSettings) => (Object.keys(next.retention) as (keyof TenantSettings['retention'])[])
  .some((key) => next.retention[key] !== settings.value.retention[key])

async function submit(next: TenantSettings) {
  // Une durée de conservation plus courte entraîne la suppression définitive des données plus anciennes.
  if (hasSettings.value && retentionChanged(next)) {
    const confirmed = await feedback.askConfirmation({
      title: 'Modifier la conservation des données ?',
      message: 'Les données plus anciennes que les nouvelles durées seront supprimées ou anonymisées automatiquement, sans retour possible.',
      confirmText: 'Enregistrer',
      color: 'error',
    })
    if (!confirmed) return
  }

  try {
    await store.save(next)
    dirty.value = false
    feedback.success('Paramètres de l’entreprise enregistrés.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer les paramètres de l’entreprise.'))
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[900px]">
    <PageHeader>
      <template #title>Paramètres de l’entreprise</template>
      <template #description>Règles de pointage, contrôles de présence et conservation des données.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-settings' }">Retour</v-btn></template>
    </PageHeader>

    <v-progress-linear v-if="isLoading && !company" indeterminate color="primary" />
    <v-alert v-else-if="loadFailed && !company" type="error" variant="tonal" title="Paramètres indisponibles" text="Les paramètres de l’entreprise n’ont pas pu être chargés." />

    <template v-else-if="company">
      <v-card class="mb-6">
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-domain" color="primary" /></v-avatar>
          <div><h2 class="text-base font-bold">{{ company.name }}</h2><p class="mt-1 text-xs font-normal text-[#747985]">Ces informations sont gérées par KAYBIC AFRICA.</p></div>
        </v-card-title>
        <v-divider />
        <v-card-text class="grid gap-5 px-6 py-6 sm:grid-cols-3">
          <div><p class="text-xs text-[#848484]">Pays</p><p class="mt-1 font-medium">{{ company.country }}</p></div>
          <div><p class="text-xs text-[#848484]">Fuseau horaire</p><p class="mt-1 font-medium">{{ company.timezone }}</p></div>
          <div><p class="text-xs text-[#848484]">Contrat</p><p class="mt-1 font-medium">{{ contract }}</p></div>
        </v-card-text>
      </v-card>

      <v-alert v-if="!hasSettings" class="mb-6" type="info" variant="tonal" text="Votre entreprise n’a pas encore de paramètres. Les valeurs recommandées sont proposées : vérifiez-les puis enregistrez." />

      <CompanySettingsForm :settings="settings" :loading="isSaving" @submit="submit" @dirty-change="dirty = $event" />
    </template>
  </div>
</template>
