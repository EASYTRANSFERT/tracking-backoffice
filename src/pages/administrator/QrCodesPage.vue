<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'; import { storeToRefs } from 'pinia'; import { useRouter } from 'vue-router'; import AppEmptyState from '@/Components/common/AppEmptyState.vue'; import PageHeader from '@/Components/layout/PageHeader.vue'; import QrCodeCard from '@/Components/sites/QrCodeCard.vue'; import { useSiteQrCode } from '@/composables/useSiteQrCode'; import { useAdministratorStore } from '@/stores/administrator.store'; import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
const router = useRouter(); const store = useAdministratorStore(); const feedback = useUiFeedbackStore(); const { sites, isSitesLoading } = storeToRefs(store); const { generatingId, generate } = useSiteQrCode()
const search = ref('')
// Recherche sur le nom, l'adresse et la ville, sans tenir compte des accents ni de la casse.
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr')
const filteredSites = computed(() => { const q = normalize(search.value?.trim() ?? ''); return q ? sites.value.filter((site) => normalize(`${site.name} ${site.address ?? ''} ${site.city ?? ''}`).includes(q)) : sites.value })
onMounted(async () => { try { await store.loadSites() } catch { feedback.error('Impossible de charger les sites.') } })
</script>
<template><div class="mx-auto w-full max-w-[1440px]"><PageHeader><template #title>QR codes des sites</template><template #description>Consultez et renouvelez les identifiants de pointage de chaque site.</template><template #actions><v-btn color="primary" prepend-icon="mdi-map-marker-plus-outline" :to="{ name: 'admin-site-create' }">Nouveau site</v-btn></template></PageHeader><v-alert class="mb-6" type="info" variant="tonal" text="La régénération invalide l’ancien QR code. L’image n’est affichée qu’au moment de sa génération : pensez à l’imprimer." />
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center"><v-text-field v-model="search" class="w-full sm:max-w-[420px]" prepend-inner-icon="mdi-magnify" placeholder="Rechercher un site par son nom" density="compact" hide-details clearable autofocus /><p v-if="search && !isSitesLoading" class="text-sm text-[#747985]">{{ filteredSites.length }} site{{ filteredSites.length > 1 ? 's' : '' }} sur {{ sites.length }}</p></div>
  <v-progress-linear v-if="isSitesLoading" indeterminate color="primary" class="mb-4" />
  <div v-if="filteredSites.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><QrCodeCard v-for="site in filteredSites" :key="site.id" :site="site" :loading="generatingId === site.id" @details="router.push({ name: 'admin-site-details', params: { siteId: $event.id } })" @regenerate="generate" /></div>
  <v-card v-else-if="!isSitesLoading"><AppEmptyState icon="mdi-qrcode-remove" :title="search ? 'Aucun site trouvé' : 'Aucun site'" :description="search ? `Aucun site ne correspond à « ${search} ».` : 'Créez un site pour obtenir son QR code.'" /></v-card>
</div></template>
