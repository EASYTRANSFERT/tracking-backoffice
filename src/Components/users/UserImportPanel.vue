<script setup lang="ts">
import { computed } from 'vue'

import { importReasonLabel, MATRICULE_IMPORT_TEMPLATE } from '@/utils/matricule-import'
import type { MatriculeImportReport } from '@/types/user'

/** Import des matricules : choix du fichier, vérification (simulation), puis application. */
const props = defineProps<{ file: File | null; report: MatriculeImportReport | null; checking?: boolean; applying?: boolean }>()
const emit = defineEmits<{ 'update:file': [file: File | null]; check: []; apply: [] }>()

const fileModel = computed({
  get: () => props.file,
  // Selon la version de Vuetify, le champ renvoie un fichier ou une liste.
  set: (value: File | File[] | null) => emit('update:file', Array.isArray(value) ? value[0] ?? null : value),
})
const stats = computed(() => props.report ? [
  { label: 'Lignes lues', value: props.report.read, color: 'text-[#252830]' },
  { label: props.report.applied ? 'Matricules modifiés' : 'Matricules à modifier', value: props.report.matched, color: 'text-[#1E7D4F]' },
  { label: 'Déjà à jour', value: props.report.unchanged, color: 'text-[#535865]' },
  { label: 'Lignes refusées', value: props.report.rejected.length, color: props.report.rejected.length ? 'text-[#D80F16]' : 'text-[#535865]' },
] : [])

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([`﻿${MATRICULE_IMPORT_TEMPLATE}`], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'modele-import-matricules.csv' })
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
    <div class="space-y-6">
      <v-card>
        <v-card-title class="px-6 py-5">Fichier des matricules</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-7">
          <div class="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <v-icon icon="mdi-file-table-outline" color="primary" size="48" />
            <h3 class="mt-4 font-bold text-[#292d38]">Sélectionnez un fichier Excel ou CSV</h3>
            <p class="mx-auto mt-2 max-w-md text-sm text-[#747985]">Trois colonnes : nom, numéro de téléphone, matricule. Chaque ligne est rattachée au compte qui porte ce numéro.</p>
            <v-file-input v-model="fileModel" class="mx-auto mt-6 max-w-lg" accept=".xlsx,.csv" label="Choisir un fichier" prepend-icon="" prepend-inner-icon="mdi-paperclip" :disabled="checking || applying" hide-details />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="flex-wrap justify-end gap-2 px-6 py-4">
          <v-btn variant="outlined" color="primary" prepend-icon="mdi-file-search-outline" :disabled="!file || applying" :loading="checking" @click="emit('check')">Vérifier le fichier</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-check-all" :loading="applying" @click="emit('apply')">Appliquer l’import</v-btn>
        </v-card-actions>
      </v-card>

      <v-card v-if="report">
        <v-card-title class="flex items-center justify-between gap-3 px-6 py-5">
          <span>{{ report.applied ? 'Import appliqué' : 'Résultat de la vérification' }}</span>
          <v-chip v-if="report.applied" color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">Enregistré</v-chip>
          <v-chip v-else-if="report.rejected.length" color="error" variant="tonal" prepend-icon="mdi-close-circle-outline">À corriger</v-chip>
          <v-chip v-else color="primary" variant="tonal" prepend-icon="mdi-file-check-outline">Prêt à appliquer</v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="space-y-6 px-6 py-6">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="stat in stats" :key="stat.label" class="rounded-lg border border-[#eceef2] px-4 py-3">
              <p class="text-xs text-[#848484]">{{ stat.label }}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums" :class="stat.color">{{ stat.value }}</p>
            </div>
          </div>

          <v-alert v-if="report.rejected.length" type="error" variant="tonal" density="compact" text="Aucune modification n’est faite tant qu’une ligne est refusée. Corrigez le fichier puis vérifiez-le à nouveau." />
          <v-alert v-else-if="!report.applied && report.read > 0 && report.unchanged === report.read" type="info" variant="tonal" density="compact" text="Tous les matricules du fichier sont déjà à jour." />

          <div v-if="report.rejected.length" class="overflow-x-auto">
            <h3 class="mb-2 text-sm font-bold text-[#292d38]">Lignes refusées</h3>
            <v-table density="compact">
              <thead><tr><th>Ligne</th><th>Nom</th><th>Téléphone</th><th>Matricule</th><th>Motif</th></tr></thead>
              <tbody>
                <tr v-for="row in report.rejected" :key="`${row.rowNumber}-${row.reason}`">
                  <td class="tabular-nums">{{ row.rowNumber }}</td>
                  <td>{{ row.name || '—' }}</td>
                  <td class="tabular-nums">{{ row.phone || '—' }}</td>
                  <td>{{ row.matricule || '—' }}</td>
                  <td class="text-[#B00C12]">{{ importReasonLabel(row.reason) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <div v-if="report.warnings.length">
            <h3 class="mb-2 text-sm font-bold text-[#292d38]">Avertissements</h3>
            <ul class="space-y-1 text-sm text-[#535865]">
              <li v-for="warning in report.warnings" :key="`${warning.rowNumber}-${warning.reason}`" class="flex gap-2">
                <v-icon icon="mdi-alert-outline" color="warning" size="16" class="mt-0.5" />
                <span>Ligne {{ warning.rowNumber }} ({{ warning.phone }}) : {{ importReasonLabel(warning.reason) }}</span>
              </li>
            </ul>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-card class="h-fit">
      <v-card-title class="px-5 py-5">Avant de commencer</v-card-title>
      <v-divider />
      <v-list lines="three" class="py-2">
        <v-list-item prepend-icon="mdi-download-outline" title="Télécharger le modèle" subtitle="Fichier CSV avec les colonnes nom, téléphone, matricule." @click="downloadTemplate" />
        <v-list-item prepend-icon="mdi-phone-check-outline" title="Le téléphone fait foi" subtitle="Chaque ligne est rattachée au compte qui porte ce numéro. Le nom sert seulement à repérer une incohérence." />
        <v-list-item prepend-icon="mdi-shield-check-outline" title="Tout ou rien" subtitle="Tant qu’une ligne est refusée, aucun matricule n’est modifié. La vérification est facultative." />
      </v-list>
    </v-card>
  </div>
</template>
