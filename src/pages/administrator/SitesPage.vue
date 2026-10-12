<script setup lang="ts">
import { storeToRefs } from 'pinia'; import { useRouter } from 'vue-router'; import PageHeader from '@/Components/layout/PageHeader.vue'; import SiteTable from '@/Components/sites/SiteTable.vue'; import { useAdministratorStore } from '@/stores/administrator.store'; import type { Site } from '@/types/administrator'
const router = useRouter(); const store = useAdministratorStore(); const { sites, users } = storeToRefs(store); const view = (site: Site) => router.push({ name: 'admin-site-details', params: { siteId: site.id } }); const edit = (site: Site) => router.push({ name: 'admin-site-edit', params: { siteId: site.id } })
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>Sites</template><template #description>Configurez les lieux de mission et leurs périmètres de pointage.</template><template #actions><v-btn color="primary" prepend-icon="mdi-map-marker-plus-outline" :to="{ name: 'admin-site-create' }">Nouveau site</v-btn></template></PageHeader><SiteTable :sites="sites" :users="users" @view="view" @edit="edit" @change-status="store.toggleSiteStatus($event.id)" /></div></template>

