<script setup lang="ts">
import { computed, ref } from 'vue'
const emit = defineEmits<{ import: [count: number] }>()
const file = ref<File | null>(null)
const simulatedRows = computed(() => file.value ? 5 : 0)
</script>
<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
    <v-card><v-card-title class="px-6 py-5">Importer le fichier</v-card-title><v-divider /><v-card-text class="px-6 py-7"><div class="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center"><v-icon icon="mdi-file-delimited-outline" color="primary" size="48" /><h3 class="mt-4 font-bold text-[#292d38]">Sélectionnez un fichier CSV ou Excel</h3><p class="mx-auto mt-2 max-w-md text-sm text-[#747985]">Colonnes attendues : matricule, prénom, nom, e-mail, téléphone, rôle et équipe.</p><v-file-input v-model="file" class="mx-auto mt-6 max-w-lg" accept=".csv,.xlsx,.xls" label="Choisir un fichier" prepend-icon="" prepend-inner-icon="mdi-paperclip" hide-details /></div><v-alert v-if="file" class="mt-5" type="success" variant="tonal" title="Fichier prêt" :text="`${simulatedRows} lignes valides détectées. Vous pourrez contrôler les données avant leur envoi réel à l’API.`" /></v-card-text><v-divider /><v-card-actions class="justify-end px-6 py-4"><v-btn color="primary" size="large" prepend-icon="mdi-account-multiple-plus-outline" :disabled="!file" @click="emit('import', simulatedRows)">Importer {{ simulatedRows || '' }} utilisateurs</v-btn></v-card-actions></v-card>
    <v-card><v-card-title class="px-5 py-5">Avant de commencer</v-card-title><v-divider /><v-list lines="two" class="py-2"><v-list-item prepend-icon="mdi-download-outline" title="Télécharger le modèle" subtitle="Utilisez les en-têtes attendus" /><v-list-item prepend-icon="mdi-check-decagram-outline" title="Vérifier les rôles" subtitle="Administrateur, superviseur, chef d’équipe ou agent" /><v-list-item prepend-icon="mdi-email-fast-outline" title="Invitations automatiques" subtitle="Les comptes importés seront créés comme invités" /></v-list></v-card>
  </div>
</template>
