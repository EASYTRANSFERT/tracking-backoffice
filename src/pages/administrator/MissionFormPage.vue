<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import PageHeader from '@/Components/layout/PageHeader.vue'
import MissionForm from '@/Components/missions/MissionForm.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { MissionInput } from '@/types/administrator'

const route = useRoute()
const router = useRouter()
const store = useAdministratorStore()
const feedback = useUiFeedbackStore()
const id = computed(() => route.params.missionId as string | undefined)
const mission = computed(() => id.value ? store.getMissionById(id.value) : undefined)
const missionSites = computed(() => id.value ? store.getMissionSites(id.value) : [])
const initialStep = typeof route.query.step === 'string' ? route.query.step : undefined
const { supervisors, isDirectoryLoading } = storeToRefs(store)
const dirty = ref(false)
const loading = ref(false)

onMounted(async () => {
  // Superviseurs actifs proposés dans le formulaire.
  store.loadDirectory().catch((error) => feedback.error(getApiErrorMessage(error, 'Impossible de charger les superviseurs.')))
  if (!id.value || mission.value) return
  try { await store.loadMission(id.value) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger cette mission.')) }
})
onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette mission seront perdues.', confirmText: 'Quitter' }))

async function submit(payload: MissionInput) {
  loading.value = true
  try {
    if (id.value) {
      await store.updateMission(id.value, payload)
      dirty.value = false
      feedback.success('Mission enregistrée.')
      await router.push({ name: 'admin-mission-details', params: { missionId: id.value } })
    } else {
      // La mission existe désormais : le formulaire continue sur l'étape « Sites » (adresse rechargeable).
      const missionId = await store.createMission(payload)
      dirty.value = false
      feedback.success('Mission planifiée. Rattachez-lui maintenant ses sites.')
      await router.replace({ name: 'admin-mission-edit', params: { missionId }, query: { step: 'sites' } })
    }
  } catch (error) { dirty.value = true; feedback.error(getApiErrorMessage(error, "Impossible d’enregistrer la mission.")) }
  finally { loading.value = false }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1100px]">
    <PageHeader><template #title>{{ id ? 'Modifier la mission' : 'Nouvelle mission' }}</template><template #description>Renseignez les informations de la mission.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-missions' }">Retour</v-btn></template></PageHeader>
    <v-alert v-if="id && !mission && !loading" type="error" variant="tonal" title="Mission introuvable" />
    <MissionForm v-else :mission="mission" :supervisors="supervisors" :sites="missionSites" :supervisors-loading="isDirectoryLoading" :initial-step="initialStep" :loading="loading" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" />
  </div>
</template>
