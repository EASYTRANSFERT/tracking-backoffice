<script setup lang="ts">
import { getApiErrorMessage } from '@/Services/api-error'
import { computed, ref } from 'vue'
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
const { users } = storeToRefs(store);
const id = computed(() => route.params.teamId as string | undefined);
const team = computed(() => id.value ? store.getTeamById(id.value) : undefined);
const dirty = ref(false)

onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette équipe seront perdues.', confirmText: 'Quitter' }))

async function submit(payload: TeamInput){
  try { dirty.value = false;
  if (id.value) {
    await store.updateTeam(id.value, payload);
    feedback.success('Équipe mise à jour.') }
  else {
    await store.createTeam(payload); feedback.success('Équipe créée.')
  }
  await router.push({ name: 'admin-teams' }) }
  catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cette équipe.')) } }
</script>
<template>
<div class="mx-auto w-full max-w-[1050px]">
  <PageHeader>
    <template #title>{{ id ? 'Modifier l’équipe' : 'Nouvelle équipe' }}</template>
    <template #description>Définissez l’équipe et son responsable.</template>
    <template #actions>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-teams' }">Retour</v-btn>
    </template>
    </PageHeader>
    <v-alert v-if="id && !team" type="error" variant="tonal" title="Équipe introuvable" />
    <TeamForm v-else :team="team" :users="users" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" />
    </div>
  </template>
