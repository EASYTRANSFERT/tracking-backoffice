<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/Components/layout/PageHeader.vue'
import SiteImportPanel from '@/Components/sites/SiteImportPanel.vue'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore()
function importSites(count: number) { store.importSites(count); feedback.success(`${count} sites ont été importés.`); void router.push({ name: 'admin-sites' }) }
</script>
<template><div class="mx-auto w-full max-w-[1250px]"><PageHeader><template #title>Importer des sites</template><template #description>Créez plusieurs sites à partir d’un fichier, puis complétez-les progressivement.</template><template #actions><v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'admin-sites' }">Retour aux sites</v-btn></template></PageHeader><SiteImportPanel @import="importSites" /></div></template>
