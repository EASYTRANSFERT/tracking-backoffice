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
    const missionId = id.value ? (await store.updateMission(id.value, payload)).id : await store.createMission(payload)
    dirty.value = false
    feedback.success(id.value ? 'Mission mise à jour.' : 'Mission planifiée.')
    await router.push({ name: 'admin-mission-details', params: { missionId } })
  } catch (error) { dirty.value = true; feedback.error(getApiErrorMessage(error, "Impossible d’enregistrer la mission.")) }
  finally { loading.value = false }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader><template #title>{{ id ? 'Modifier la mission' : 'Nouvelle mission' }}</template><template #description>Renseignez les informations de la mission.</template>
      <template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-missions' }">Retour</v-btn></template></PageHeader>
    <v-alert v-if="id && !mission && !loading" type="error" variant="tonal" title="Mission introuvable" />
    <MissionForm v-else :mission="mission" :supervisors="supervisors" :supervisors-loading="isDirectoryLoading" :loading="loading" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" />
  </div>
</template>
