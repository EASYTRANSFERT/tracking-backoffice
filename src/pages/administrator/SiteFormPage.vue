<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import PageHeader from '@/Components/layout/PageHeader.vue';
import SiteForm from '@/Components/sites/SiteForm.vue';
import { getApiErrorMessage } from '@/utils/api-error';
import { useAdministratorStore } from '@/stores/administrator.store';
import { useUiFeedbackStore } from '@/stores/ui-feedback.store';
import type { SiteInput } from '@/types/administrator'

const route = useRoute();
const router = useRouter();
const store = useAdministratorStore();
const feedback = useUiFeedbackStore();
const { supervisors, missions, teamOptions } = storeToRefs(store);

const id = computed(() => route.params.siteId as string | undefined);
const site = computed(() => id.value ? store.getSiteById(id.value) : undefined)

// Création depuis une mission : la mission est pré-remplie et « Retour » ramène à la mission.
const fromMissionId = computed(() => !id.value && typeof route.query.missionId === 'string' ? route.query.missionId : undefined);
const backRoute = computed(() => fromMissionId.value ? { name: 'admin-mission-details', params: { missionId: fromMissionId.value } } : { name: 'admin-sites' })

// Le site est confié à un superviseur actif (liste complète, pas seulement la page chargée).
// L'API accepte aussi un administrateur : celui déjà désigné reste proposé pour ne pas le perdre.
const managers = computed(() => {
  const current = store.findUser(site.value?.managerId)
  const list = supervisors.value.filter((user) => user.status === 'active')
  return current && !list.some((user) => user.id === current.id) ? [current, ...list] : list
});
const dirty = ref(false);
const loading = ref(false);
const initializing = ref(true)

onMounted(
  async () => {
    try {
      await Promise.all(
        [store.loadDirectory(),
        store.loadMissions(),
        store.loadTeamOptions(),
        id.value ? store.loadSite(id.value) : Promise.resolve()])
      // Superviseur déjà désigné, même s'il n'est pas dans la première page d'utilisateurs.
      await store.ensureUsers([site.value?.managerId])
    } catch (error) {
       feedback.error(getApiErrorMessage(error, 'Impossible de charger les données du site.')
      )
      } finally { initializing.value = false } })
onBeforeRouteLeave(async () => !dirty.value || await feedback.askConfirmation(
  { title: 'Quitter sans enregistrer ?',
  message: 'Les modifications de ce site seront perdues.',
  confirmText: 'Quitter'
}))
async function submit(payload: SiteInput) {
  loading.value = true;
  try {
    const siteId = id.value ? (await store.updateSite(id.value, payload)).id : await store.createSite(payload);
    dirty.value = false;
    feedback.success(id.value ? 'Site mis à jour.' : 'Site enregistré.');
    await router.push({ name: 'admin-site-details', params: { siteId } })
    } catch (error) {
      dirty.value = true;
      feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer le site.'))
      } finally { loading.value = false } }
</script>
<template>
  <div class="mx-auto w-full max-w-[1050px]">
    <PageHeader>
      <template #title>{{ id ? 'Modifier le site' : 'Nouveau site' }}</template>
      <template #description>Définissez le lieu et la zone de présence autorisée.</template>
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="backRoute">Retour</v-btn>
        </template>
        </PageHeader>
        <v-progress-linear v-if="initializing" indeterminate color="primary" />
        <v-alert v-else-if="id && !site" type="error" variant="tonal" title="Site introuvable" />
        <SiteForm v-else :site="site"
                         :managers="managers"
                         :missions="missions"
                         :teams="teamOptions"
                         :default-mission-id="fromMissionId"
                         :loading="loading" @submit="submit"
                         @cancel="router.back()" @dirty-change="dirty = $event" />
    </div>
</template>
