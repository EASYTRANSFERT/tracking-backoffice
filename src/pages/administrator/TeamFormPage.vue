<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamForm from '@/Components/teams/TeamForm.vue'
import TotpConfirmDialog from '@/Components/security/TotpConfirmDialog.vue'
import { nameOr } from '@/utils/people'
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

onMounted(async () => {
  try {
    await Promise.all([store.loadTeamLeadOptions(), store.loadTeamOptions()])
  } catch (error) {
    feedback.error(getApiErrorMessage(error, 'Impossible de charger les chefs d’équipe.'))
  } finally {
    leadersLoading.value = false
  }
})

onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette équipe seront perdues.', confirmText: 'Quitter' }))

// Changement de chef : opération sensible, confirmée par le code TOTP.
const leadDialog = ref(false)
const pendingLeadId = ref<string>()
const leadError = ref<string | null>(null)
const assigningLead = ref(false)
const pendingLeadName = computed(() => nameOr(store.findUser(pendingLeadId.value), 'Ce chef d’équipe'))

async function done(message: string) {
  dirty.value = false
  feedback.success(message)
  await router.push({ name: 'admin-teams' })
}

async function submit(payload: TeamInput) {
  saving.value = true
  try {
    if (!id.value) {
      await store.createTeam(payload)
      return await done('Équipe créée.')
    }
    await store.updateTeam(id.value, payload)
    if (payload.leadUserId && payload.leadUserId !== team.value?.leadUserId) {
      pendingLeadId.value = payload.leadUserId
      leadError.value = null
      leadDialog.value = true
      return
    }
    await done('Équipe mise à jour.')
  } catch (error) {
    dirty.value = true
    feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cette équipe.'))
  } finally {
    saving.value = false
  }
}

async function confirmLead(code: string) {
  if (!id.value || !pendingLeadId.value) return
  assigningLead.value = true
  leadError.value = null
  try {
    await store.assignTeamLead(id.value, pendingLeadId.value, code)
    leadDialog.value = false
    await done('Chef d’équipe désigné.')
  } catch (error) {
    leadError.value = getApiErrorMessage(error, 'Impossible de désigner ce chef d’équipe.')
  } finally {
    assigningLead.value = false
  }
}
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
    <TotpConfirmDialog
      v-model="leadDialog"
      title="Changer de chef d’équipe"
      :message="`${pendingLeadName} deviendra chef de l’équipe « ${team?.name ?? ''} ». Saisissez votre code de vérification pour confirmer.`"
      confirm-text="Désigner"
      :loading="assigningLead"
      :error-message="leadError"
      @confirm="confirmLead"
    />
    </div>
  </template>
