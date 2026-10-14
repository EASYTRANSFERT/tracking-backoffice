<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import TeamForm from '@/Components/teams/TeamForm.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { TeamInput } from '@/types/administrator'
const route = useRoute(); const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { supervisors } = storeToRefs(store); const id = computed(() => route.params.teamId as string | undefined); const team = computed(() => id.value ? store.getTeamById(id.value) : undefined); const dirty = ref(false); const loading = ref(false)
onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cette équipe seront perdues.', confirmText: 'Quitter' }))
async function submit(payload: TeamInput) { loading.value = true; try { if (id.value) { await store.updateTeam(id.value, payload); feedback.success('Équipe mise à jour.') } else { await store.createTeam(payload); feedback.success('Équipe créée.') } dirty.value = false; await router.push({ name: 'admin-teams' }) } catch (error) { feedback.error(error instanceof Error ? error.message : 'Impossible d’enregistrer cette équipe.') } finally { loading.value = false } }
</script>
<template><div class="mx-auto w-full max-w-[1050px]"><PageHeader><template #title>{{ id ? 'Modifier l’équipe' : 'Nouvelle équipe' }}</template><template #description>Définissez l’équipe et son responsable.</template><template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-teams' }">Retour</v-btn></template></PageHeader><v-alert v-if="id && !team" type="error" variant="tonal" title="Équipe introuvable" /><TeamForm v-else :team="team" :users="supervisors" :loading="loading" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" /></div></template>
