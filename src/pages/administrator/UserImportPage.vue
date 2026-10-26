<script setup lang="ts">
import { ref, watch } from 'vue'

import PageHeader from '@/Components/layout/PageHeader.vue'
import UserImportPanel from '@/Components/users/UserImportPanel.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { MatriculeImportReport } from '@/types/user'

const store = useAdministratorStore()
const feedback = useUiFeedbackStore()

const file = ref<File | null>(null)
const report = ref<MatriculeImportReport | null>(null)
const isChecking = ref(false)
const isApplying = ref(false)

// Un autre fichier invalide le rapport précédent.
watch(file, () => { report.value = null })

async function check() {
  if (!file.value) return
  isChecking.value = true
  try { report.value = await store.importMatricules(file.value, true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de vérifier ce fichier.')) }
  finally { isChecking.value = false }
}

async function apply() {
  if (!file.value) {
    feedback.warning('Choisissez d’abord le fichier des matricules.')
    return
  }
  isApplying.value = true
  try {
    report.value = await store.importMatricules(file.value, false)
    if (report.value.applied) feedback.success(`${report.value.matched} matricule${report.value.matched > 1 ? 's' : ''} mis à jour.`)
    else feedback.error('Le fichier a été refusé : aucun matricule n’a été modifié.')
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible d’appliquer l’import.'))
  } finally {
    isApplying.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1250px]">
    <PageHeader>
      <template #title>Importer les matricules</template>
      <template #description>Remplacez les matricules générés par ceux de votre entreprise, à partir d’un fichier Excel ou CSV.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-users' }">Retour aux agents</v-btn></template>
    </PageHeader>
    <UserImportPanel v-model:file="file" :report="report" :checking="isChecking" :applying="isApplying" @check="check" @apply="apply" />
  </div>
</template>
