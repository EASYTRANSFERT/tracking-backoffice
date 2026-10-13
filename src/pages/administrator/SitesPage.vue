<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import SiteTable from '@/Components/sites/SiteTable.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { Site } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { sites, users } = storeToRefs(store)
const view = (site: Site) => router.push({ name: 'admin-site-details', params: { siteId: site.id } }); const edit = (site: Site) => router.push({ name: 'admin-site-edit', params: { siteId: site.id } })
async function changeStatus(site: Site) { const disabling = site.status === 'active'; const confirmed = await feedback.askConfirmation({ title: disabling ? 'Désactiver ce site ?' : 'Activer ce site ?', message: `Cette action concerne le site « ${site.name} ».`, confirmText: disabling ? 'Désactiver' : 'Activer', color: disabling ? 'error' : 'success' }); if (!confirmed) return; store.toggleSiteStatus(site.id); feedback.success(disabling ? 'Site désactivé.' : 'Site activé.') }
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Sites</template><template #description>Configurez les lieux de mission et leurs périmètres de pointage.</template><template #actions><v-btn variant="outlined" color="secondary" prepend-icon="mdi-database-import-outline" :to="{ name: 'admin-site-import' }">Importer</v-btn><v-btn color="primary" prepend-icon="mdi-map-marker-plus-outline" :to="{ name: 'admin-site-create' }">Nouveau site</v-btn></template></PageHeader><SiteTable :sites="sites" :users="users" @view="view" @edit="edit" @change-status="changeStatus" /></div></template>
