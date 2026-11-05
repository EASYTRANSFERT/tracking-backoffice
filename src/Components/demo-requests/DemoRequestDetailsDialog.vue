<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppDialogClose from '@/Components/common/AppDialogClose.vue'
import { formatAuditDate } from '@/Components/audit/audit-format'
import {
  demoRequestChanges,
  demoRequestFieldLabel,
  demoRequestFormValues,
  demoRequestStatusConfig,
  demoRequestStatusOptions,
  formatDemoRequestValue,
  type DemoRequestFormValues,
} from '@/Components/demo-requests/demo-request-format'
import type { DemoRequestResponse, UpdateDemoRequestRequest } from '@/types/demo-request'

const props = defineProps<{
  request: DemoRequestResponse | null
  saving?: boolean
  actorName: (actorId?: string) => string
}>()

const emit = defineEmits<{
  close: []
  save: [payload: UpdateDemoRequestRequest]
}>()

const form = ref<DemoRequestFormValues | null>(null)
const editContact = ref(false)

// Le formulaire repart de la version reçue : à l'ouverture et après chaque enregistrement.
watch(() => props.request, (request) => {
  form.value = request ? demoRequestFormValues(request) : null
  if (!request) editContact.value = false
}, { immediate: true })

const payload = computed(() => props.request && form.value ? demoRequestChanges(props.request, form.value) : {})
const isDirty = computed(() => Object.keys(payload.value).length > 0)
const status = computed(() => props.request ? demoRequestStatusConfig(props.request.status) : null)
/** Les plus récentes d'abord. */
const history = computed(() => [...(props.request?.history ?? [])].sort((a, b) => b.at.localeCompare(a.at)))

const required = (value: string) => Boolean(value?.trim()) || 'Champ obligatoire.'
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Adresse invalide.'
const isValid = computed(() => Boolean(form.value?.fullName.trim() && form.value.company.trim() && validEmail(form.value.email) === true))
</script>

<template>
  <v-dialog :model-value="Boolean(request)" max-width="860" @update:model-value="!$event && emit('close')">
    <v-card v-if="request && form && status">
      <AppDialogClose @close="emit('close')" />
      <v-card-title class="flex items-start justify-between gap-3 px-6 pt-5 pr-14">
        <div>
          <p class="text-lg font-bold text-[#252830]">{{ request.fullName }}</p>
          <p class="text-sm text-[#747985]">{{ request.company }} · reçue le {{ formatAuditDate(request.createdAt) }}</p>
        </div>
        <v-chip :color="status.color" :prepend-icon="status.icon" size="small" variant="tonal">{{ status.label }}</v-chip>
      </v-card-title>

      <v-card-text class="px-6">
        <div class="grid gap-6 md:grid-cols-[1fr_280px]">
          <div class="flex flex-col gap-5">
            <section>
              <div class="mb-2 flex items-center justify-between">
                <h3 class="text-sm font-bold text-[#252830]">Coordonnées</h3>
                <v-btn variant="text" size="small" color="secondary" :prepend-icon="editContact ? 'mdi-eye-outline' : 'mdi-pencil-outline'" @click="editContact = !editContact">
                  {{ editContact ? 'Masquer la correction' : 'Corriger' }}
                </v-btn>
              </div>
              <div v-if="editContact" class="grid gap-3 sm:grid-cols-2">
                <v-text-field v-model="form.fullName" label="Nom" density="compact" maxlength="120" :rules="[required]" />
                <v-text-field v-model="form.company" label="Entreprise" density="compact" maxlength="160" :rules="[required]" />
                <v-text-field v-model="form.email" label="Courriel" type="email" density="compact" maxlength="254" :rules="[required, validEmail]" />
                <v-text-field v-model="form.phone" label="Téléphone" density="compact" clearable />
                <v-textarea v-model="form.message" label="Message du prospect" rows="2" auto-grow counter="2000" maxlength="2000" class="sm:col-span-2" />
              </div>
              <dl v-else class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[120px_1fr]">
                <dt class="text-[#747985]">Courriel</dt>
                <dd><a :href="`mailto:${request.email}`" class="font-medium text-primary">{{ request.email }}</a></dd>
                <dt class="text-[#747985]">Téléphone</dt>
                <dd>
                  <a v-if="request.phone" :href="`tel:${request.phone}`" class="font-medium text-primary">{{ request.phone }}</a>
                  <span v-else class="text-[#848484]">Non renseigné</span>
                </dd>
                <dt class="text-[#747985]">Message</dt>
                <dd class="whitespace-pre-line">{{ request.message || '—' }}</dd>
              </dl>
            </section>

            <v-divider />

            <section>
              <h3 class="mb-3 text-sm font-bold text-[#252830]">Suivi</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <v-select v-model="form.status" :items="demoRequestStatusOptions" label="Statut" density="compact" hide-details />
                <v-text-field v-model="form.demoAt" type="datetime-local" label="Date de la démo" density="compact" hide-details clearable />
                <v-textarea
                  v-model="form.notes"
                  label="Notes internes"
                  hint="Jamais montrées au prospect."
                  persistent-hint
                  rows="3"
                  auto-grow
                  counter="4000"
                  maxlength="4000"
                  class="sm:col-span-2"
                />
              </div>
            </section>
          </div>

          <aside>
            <h3 class="mb-2 text-sm font-bold text-[#252830]">Historique</h3>
            <v-timeline v-if="history.length" side="end" align="start" density="compact" truncate-line="both">
              <v-timeline-item v-for="entry in history" :key="entry.at" dot-color="primary" size="x-small">
                <p v-for="(change, field) in entry.changes" :key="field" class="text-xs leading-5 text-[#535865]">
                  <span class="font-semibold">{{ demoRequestFieldLabel(String(field)) }}</span> :
                  {{ formatDemoRequestValue(String(field), change.from) }} → {{ formatDemoRequestValue(String(field), change.to) }}
                </p>
                <p class="mt-1 text-[11px] text-[#9a9da5]">{{ formatAuditDate(entry.at) }} · {{ actorName(entry.actorId) }}</p>
              </v-timeline-item>
            </v-timeline>
            <p v-else class="text-xs text-[#848484]">Aucune modification depuis la réception.</p>
          </aside>
        </div>
      </v-card-text>

      <v-card-actions class="gap-2 px-6 pb-5">
        <v-spacer />
        <v-btn variant="outlined" color="secondary" @click="emit('close')">Fermer</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!isDirty || !isValid" :loading="saving" @click="emit('save', payload)">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
