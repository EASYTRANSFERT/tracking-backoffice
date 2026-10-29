<script setup lang="ts">
import { ref, watch } from 'vue'

import AssignmentImportPanel from '@/Components/assignments/AssignmentImportPanel.vue'
import PageHeader from '@/Components/layout/PageHeader.vue'
import { useAssignmentStore } from '@/stores/assignment.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import { getApiErrorMessage } from '@/utils/api-error'
import type { AssignmentImportReport } from '@/types/assignment'

const store = useAssignmentStore()
const feedback = useUiFeedbackStore()

const file = ref<File | null>(null)
const report = ref<AssignmentImportReport | null>(null)
const isChecking = ref(false)
const isApplying = ref(false)

// Un autre fichier invalide le rapport précédent.
watch(file, () => { report.value = null })

async function check() {
  if (!file.value) return
  isChecking.value = true
  try { report.value = await store.importFile(file.value, true) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de vérifier ce fichier.')) }
  finally { isChecking.value = false }
}

async function apply() {
  if (!file.value) {
    feedback.warning('Choisissez d’abord le fichier des affectations.')
    return
  }
  isApplying.value = true
  try {
    report.value = await store.importFile(file.value, false)
    if (report.value.applied) feedback.success(`${report.value.planned} créneau${report.value.planned > 1 ? 'x' : ''} planifié${report.value.planned > 1 ? 's' : ''}.`)
    else feedback.error('Le fichier a été refusé : aucun créneau n’a été créé.')
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
      <template #title>Importer les affectations</template>
      <template #description>Planifiez d’un seul envoi les créneaux de travail de vos agents à partir d’un fichier Excel ou CSV.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-sites' }">Retour aux sites</v-btn></template>
    </PageHeader>
    <AssignmentImportPanel v-model:file="file" :report="report" :checking="isChecking" :applying="isApplying" @check="check" @apply="apply" />
  </div>
</template>
