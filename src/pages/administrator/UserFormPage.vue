<script setup lang="ts">
import { getApiErrorMessage } from '@/utils/api-error'
import { computed, onMounted, ref } from 'vue'; import { storeToRefs } from 'pinia'; import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'; import PageHeader from '@/Components/layout/PageHeader.vue'; import UserForm from '@/Components/users/UserForm.vue'; import { useAdministratorStore } from '@/stores/administrator.store'; import { useUiFeedbackStore } from '@/stores/ui-feedback.store'; import type { EnterpriseUserInput } from '@/types/administrator'
const route = useRoute(); const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { knownTeams } = storeToRefs(store); const id = computed(() => route.params.userId as string | undefined); const user = computed(() => id.value ? store.findUser(id.value) : undefined); const dirty = ref(false)
// Compte à modifier et liste complète des équipes, même hors de la page déjà chargée.
const loadingUser = ref(Boolean(id.value) && !user.value)
onMounted(async () => { store.loadTeamOptions().catch(() => undefined); if (!id.value) return; try { await store.ensureUsers([id.value]) } finally { loadingUser.value = false } })
onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation({ title: 'Quitter sans enregistrer ?', message: 'Les modifications de cet utilisateur seront perdues.', confirmText: 'Quitter' }))
// Bouton occupé pendant l'appel : un double clic créerait deux comptes.
const saving = ref(false)
async function submit(payload: EnterpriseUserInput) {
  if (saving.value) return
  saving.value = true; dirty.value = false; let userId: string
  // Seul l'appel à l'API peut échouer ici : une fois le compte créé, la suite ne doit jamais annoncer un échec.
  try { userId = id.value ? (await store.updateUser(id.value, payload), id.value) : await store.createUser(payload) }
  catch (error) { dirty.value = true; feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer cet utilisateur.')); return }
  finally { saving.value = false }
  feedback.success(id.value ? 'Utilisateur mis à jour.' : 'Utilisateur créé.')
  await router.push({ name: 'admin-user-details', params: { userId } }) }
</script>
<template><div class="mx-auto w-full max-w-[1050px]"><PageHeader><template #title>{{ id ? 'Modifier l’utilisateur' : 'Nouvel utilisateur' }}</template><template #description>{{ id ? 'Mettez à jour ses informations et ses droits.' : 'Créez le profil puis envoyez une invitation sécurisée.' }}</template><template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-users' }">Retour</v-btn></template></PageHeader><v-progress-linear v-if="loadingUser" indeterminate color="primary" /><v-alert v-else-if="id && !user" type="error" variant="tonal" title="Utilisateur introuvable" /><UserForm v-else :user="user" :teams="knownTeams" :loading="saving" @submit="submit" @cancel="router.back()" @dirty-change="dirty = $event" /></div></template>
