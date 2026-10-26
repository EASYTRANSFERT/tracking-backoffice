<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamForm from '@/Components/teams/TeamForm.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { TeamInput } from '@/types/administrator'

const route = useRoute();
const router = useRouter();
const store = useAdministratorStore();
const feedback = useUiFeedbackStore();
const { teamLeadOptions } = storeToRefs(store);
const id = computed(() => route.params.teamId as string | undefined);
const team = computed(() => store.findTeam(id.value));
const dirty = ref(false)
const saving = ref(false)
const leadersLoading = ref(true)

// Liste complète des chefs d'équipe actifs, et non la seule page d'utilisateurs déjà chargée.
onMounted(async () => {
  leadersLoading.value = true
  // L'équipe à modifier vient de la liste complète si elle n'est pas dans la page affichée.
  try { await Promise.all([store.loadTeamLeadOptions(), store.loadTeamOptions()]) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les chefs d’équipe.')) }
  finally { leadersLoading.value = false }
})

onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette équipe seront perdues.', confirmText: 'Quitter' }))

async function submit(payload: TeamInput){
  saving.value = true
  try { dirty.value = false;
  if (id.value) {
    await store.updateTeam(id.value, payload);
    feedback.success('Équipe mise à jour.') }
  else {
    await store.createTeam(payload); feedback.success('Équipe créée.')
  }
  await router.push({ name: 'admin-teams' }) }
  catch (error) { dirty.value = true; feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cette équipe.')) }
  finally { saving.value = false } }
</script>
<template>
<div class="mx-auto w-full max-w-[1050px]">
  <PageHeader>
    <template #title>{{ id ? 'Modifier l’équipe' : 'Nouvelle équipe' }}</template>
    <template #description>Définissez l’équipe et son chef.</template>
    <template #actions>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-teams' }">Retour</v-btn>
    </template>
    </PageHeader>
    <v-progress-linear v-if="id && !team && leadersLoading" indeterminate color="primary" />
    <v-alert v-else-if="id && !team" type="error" variant="tonal" title="Équipe introuvable" />
    <TeamForm v-else :team="team" :leaders="teamLeadOptions" :leaders-loading="leadersLoading" :loading="saving" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" />
    </div>
  </template>
