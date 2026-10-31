<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { nameOr } from '@/utils/people'
import PageHeader from '@/Components/layout/PageHeader.vue'
import SiteTable from '@/Components/sites/SiteTable.vue'
import { getApiErrorMessage } from '@/utils/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { sites, isSitesLoading, canImportSites } = storeToRefs(store)
const view = (site: Site) => router.push({ name: 'admin-site-details', params: { siteId: site.id } }); const edit = (site: Site) => router.push({ name: 'admin-site-edit', params: { siteId: site.id } })
onMounted(async () => { try { await Promise.all([store.loadSites(), store.loadDirectory(), store.loadMissions()]); await store.ensureUsers(sites.value.map(store.siteSupervisorId)) } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible de charger les sites.')) } })
const supervisorName = (site: Site) => nameOr(store.findSiteSupervisor(site), site.missionId ? 'Non renseigné' : 'Aucune mission')
async function changeStatus(site: Site) { const confirmed = await feedback.askConfirmation({ title: 'Archiver ce site ?', message: `Le site « ${site.name} » ne pourra plus être modifié ni recevoir de pointage.`, confirmText: 'Archiver', color: 'error' }); if (!confirmed) return; try { await store.archiveSite(site.id); feedback.success('Site archivé.') } catch (error) { feedback.error(getApiErrorMessage(error, 'Impossible d’archiver le site.')) } }
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Sites</template><template #description>Configurez les lieux de mission et leurs périmètres de pointage.</template><template #actions><v-btn v-if="canImportSites" variant="outlined" color="secondary" prepend-icon="mdi-database-import-outline" :to="{ name: 'admin-site-import' }">Importer</v-btn><v-btn color="primary" prepend-icon="mdi-map-marker-plus-outline" :to="{ name: 'admin-site-create' }">Nouveau site</v-btn></template></PageHeader><v-progress-linear v-if="isSitesLoading" indeterminate color="primary" class="mb-4" /><SiteTable :sites="sites" :supervisor-name="supervisorName" @view="view" @edit="edit" @change-status="changeStatus" /></div></template>
