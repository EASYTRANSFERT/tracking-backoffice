<script setup lang="ts">
import { computed } from 'vue'

import { ASSIGNMENT_IMPORT_TEMPLATE, assignmentImportReasonLabel } from '@/utils/assignment-import'
import type { AssignmentImportReport } from '@/types/assignment'

/** Import des affectations : choix du fichier, vérification (simulation), puis application. */
const props = defineProps<{ file: File | null; report: AssignmentImportReport | null; checking?: boolean; applying?: boolean }>()
const emit = defineEmits<{ 'update:file': [file: File | null]; check: []; apply: [] }>()

const fileModel = computed({
  get: () => props.file,
  // Selon la version de Vuetify, le champ renvoie un fichier ou une liste.
  set: (value: File | File[] | null) => emit('update:file', Array.isArray(value) ? value[0] ?? null : value),
})
const stats = computed(() => props.report ? [
  { label: 'Lignes lues', value: props.report.read, color: 'text-[#252830]' },
  { label: props.report.applied ? 'Créneaux planifiés' : 'Créneaux à planifier', value: props.report.planned, color: 'text-[#1E7D4F]' },
  { label: 'Lignes refusées', value: props.report.rejected.length, color: props.report.rejected.length ? 'text-[#D80F16]' : 'text-[#535865]' },
] : [])
const period = computed(() => {
  const { from, to } = props.report ?? {}
  if (!from || !to) return null
  const format = (value: string) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  return `${format(from)} → ${format(to)}`
})

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([`﻿${ASSIGNMENT_IMPORT_TEMPLATE}`], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'modele-import-affectations.csv' })
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_340px]">
    <div class="space-y-6">
      <v-card>
        <v-card-title class="px-6 py-5">Fichier des affectations</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-7">
          <div class="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <v-icon icon="mdi-calendar-import-outline" color="primary" size="48" />
            <h3 class="mt-4 font-bold text-[#292d38]">Sélectionnez un fichier Excel ou CSV</h3>
            <p class="mx-auto mt-2 max-w-md text-sm text-[#747985]">Une ligne par créneau : matricule, site, date, heure de début et heure de fin. 2 000 lignes et 2 Mo au maximum.</p>
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
          <div class="grid grid-cols-3 gap-3">
            <div v-for="stat in stats" :key="stat.label" class="rounded-lg border border-[#eceef2] px-4 py-3">
              <p class="text-xs text-[#848484]">{{ stat.label }}</p>
              <p class="mt-1 text-2xl font-bold tabular-nums" :class="stat.color">{{ stat.value }}</p>
            </div>
          </div>
          <p v-if="period" class="text-sm text-[#535865]">Période couverte : {{ period }}</p>

          <v-alert v-if="report.rejected.length" type="error" variant="tonal" density="compact" text="Aucun créneau n’est créé tant qu’une ligne est refusée. Corrigez le fichier puis vérifiez-le à nouveau." />

          <div v-if="report.rejected.length" class="overflow-x-auto">
            <h3 class="mb-2 text-sm font-bold text-[#292d38]">Lignes refusées</h3>
            <v-table density="compact">
              <thead><tr><th>Ligne</th><th>Matricule</th><th>Site</th><th>Date</th><th>Début</th><th>Fin</th><th>Motif</th></tr></thead>
              <tbody>
                <tr v-for="row in report.rejected" :key="`${row.rowNumber}-${row.reason}`">
                  <td class="tabular-nums">{{ row.rowNumber }}</td>
                  <td>{{ row.matricule || '—' }}</td>
                  <td>{{ row.site || '—' }}</td>
                  <td class="tabular-nums">{{ row.date || '—' }}</td>
                  <td class="tabular-nums">{{ row.start || '—' }}</td>
                  <td class="tabular-nums">{{ row.end || '—' }}</td>
                  <td class="text-[#B00C12]">
                    {{ assignmentImportReasonLabel(row.reason) }}
                    <span v-if="row.conflictingRowNumber" class="text-[#747985]"> (ligne {{ row.conflictingRowNumber }})</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-card class="h-fit">
      <v-card-title class="px-5 py-5">Avant de commencer</v-card-title>
      <v-divider />
      <v-list lines="three" class="py-2">
        <v-list-item prepend-icon="mdi-download-outline" title="Télécharger le modèle" subtitle="Fichier CSV avec les colonnes matricule, site, date, début, fin." @click="downloadTemplate" />
        <v-list-item prepend-icon="mdi-weather-night" title="Postes de nuit" subtitle="Une fin avant le début passe au lendemain : 22:00 – 06:00 est rattaché au jour de la prise de poste." />
        <v-list-item prepend-icon="mdi-account-check-outline" title="Mêmes règles que le planning" subtitle="L’agent doit être dans l’équipe du site, le site actif avec une mission ouverte, sans chevauchement." />
        <v-list-item prepend-icon="mdi-bell-ring-outline" title="Notifications" subtitle="Les créneaux d’aujourd’hui et de demain préviennent l’agent et son chef d’équipe. Tout ou rien : la vérification est facultative, un fichier refusé ne crée aucun créneau." />
      </v-list>
    </v-card>
  </div>
</template>
