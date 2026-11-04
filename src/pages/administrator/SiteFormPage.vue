<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import PageHeader from '@/Components/layout/PageHeader.vue';
import QrCodeCard from '@/Components/sites/QrCodeCard.vue';
import SiteForm from '@/Components/sites/SiteForm.vue';
import { useSiteQrCode } from '@/composables/useSiteQrCode';
import { getApiErrorMessage } from '@/utils/api-error';
import { useAdministratorStore } from '@/stores/administrator.store';
import { useUiFeedbackStore } from '@/stores/ui-feedback.store';
import type { SiteInput } from '@/types/administrator'

const route = useRoute();
const router = useRouter();
const store = useAdministratorStore();
const feedback = useUiFeedbackStore();
const { supervisors, missions, teamOptions } = storeToRefs(store);
const { generatingId, printingId, generate, print } = useSiteQrCode();

const id = computed(() => route.params.siteId as string | undefined);
const site = computed(() => id.value ? store.getSiteById(id.value) : undefined)
// Site tout juste créé : le parcours se termine sur son QR code.
const createdId = ref<string>()
const createdSite = computed(() => createdId.value ? store.getSiteById(createdId.value) : undefined)

// Création depuis une mission : la mission est pré-remplie et « Retour » ramène à la mission,
// ou à l'étape « Sites » du formulaire de mission quand on en vient.
const fromMissionId = computed(() => !id.value && typeof route.query.missionId === 'string' ? route.query.missionId : undefined);
const backRoute = computed(() => {
  if (!fromMissionId.value) return { name: 'admin-sites' }
  return route.query.from === 'mission-form'
    ? { name: 'admin-mission-edit', params: { missionId: fromMissionId.value }, query: { step: 'sites' } }
    : { name: 'admin-mission-details', params: { missionId: fromMissionId.value } }
})

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
    if (id.value) {
      const siteId = (await store.updateSite(id.value, payload)).id
      dirty.value = false;
      feedback.success('Site mis à jour.');
      await router.push({ name: 'admin-site-details', params: { siteId } })
    } else {
      createdId.value = await store.createSite(payload)
      dirty.value = false;
      feedback.success('Site enregistré.');
    }
    } catch (error) {
      dirty.value = true;
      feedback.error(getApiErrorMessage(error, 'Impossible d’enregistrer le site.'))
      } finally { loading.value = false } }
</script>
<template>
  <div class="mx-auto w-full max-w-[1100px]">
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
                         :loading="loading"
                         :created="Boolean(createdSite)" @submit="submit"
                         @cancel="router.back()" @dirty-change="dirty = $event">
          <template #created>
            <v-card-text v-if="createdSite" class="grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_300px]">
              <div class="space-y-5">
                <v-alert type="success" variant="tonal" :title="`Le site « ${createdSite.name} » est créé`">
                  Générez son QR code et affichez-le sur place : les agents le scannent pour pointer. Planifiez ensuite l’équipe depuis la fiche du site.
                </v-alert>
                <div class="flex flex-wrap gap-3">
                  <v-btn v-if="fromMissionId" color="primary" prepend-icon="mdi-arrow-left" :to="backRoute">Retour à la mission</v-btn>
                  <v-btn :variant="fromMissionId ? 'outlined' : 'flat'" color="primary" prepend-icon="mdi-eye-outline" :to="{ name: 'admin-site-details', params: { siteId: createdSite.id } }">Voir le site</v-btn>
                </div>
              </div>
              <QrCodeCard :site="createdSite" variant="outlined" :loading="generatingId === createdSite.id" :printing="printingId === createdSite.id" @print="print" @regenerate="generate" />
            </v-card-text>
          </template>
        </SiteForm>
    </div>
</template>
