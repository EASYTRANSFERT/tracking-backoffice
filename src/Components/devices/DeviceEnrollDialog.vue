<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDeviceDate } from '@/Components/devices/device-format'
import { getApiErrorMessage } from '@/Services/api-error'
import { useAdministratorStore } from '@/stores/administrator.store'
import { useDeviceStore } from '@/stores/device.store'
import { useUiFeedbackStore } from '@/stores/ui-feedback.store'
import type { DeviceEnrollmentResponse } from '@/types/device'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ userId?: string }>()

const store = useDeviceStore()
const administratorStore = useAdministratorStore()
const feedback = useUiFeedbackStore()
const selectedUserId = ref<string | null>(null)
const enrollment = ref<DeviceEnrollmentResponse | null>(null)
const errorMessage = ref<string | null>(null)

// Un compte désactivé ne peut pas enrôler de téléphone.
const userOptions = computed(() => administratorStore.teamDirectoryUsers
  .filter((user) => user.status !== 'disabled')
  .map((user) => ({ title: `${user.firstName} ${user.lastName}`, subtitle: user.employeeNumber, value: user.id })))
const selectedName = computed(() => (enrollment.value ? store.agentName(enrollment.value.userId) : null))
const formattedCode = computed(() => enrollment.value?.code.replace(/(.{4})(?=.)/g, '$1-') ?? '')

watch(open, (isOpen) => {
  if (!isOpen) return
  selectedUserId.value = props.userId ?? null
  enrollment.value = null
  errorMessage.value = null
  administratorStore.loadDirectory().catch(() => undefined)
})

async function generate() {
  if (!selectedUserId.value) { errorMessage.value = 'Choisissez la personne qui va utiliser ce téléphone.'; return }
  errorMessage.value = null
  try {
    enrollment.value = await store.createEnrollment(selectedUserId.value)
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, 'Impossible de générer le code d’activation.')
  }
}

async function copyCode() {
  if (!enrollment.value) return
  try {
    await navigator.clipboard.writeText(enrollment.value.code)
    feedback.success('Code copié.')
  } catch {
    feedback.error('Copie impossible : recopiez le code à la main.')
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="520" :persistent="store.isEnrolling">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 text-h6">
        <v-avatar color="red-lighten-5" size="42"><v-icon color="primary" icon="mdi-cellphone-plus" /></v-avatar>
        Enrôler un appareil
      </v-card-title>

      <v-card-text v-if="!enrollment" class="space-y-4">
        <p class="text-sm text-[#535865]">
          Générez un code d’activation pour la personne qui va pointer avec ce téléphone. Elle le saisit ou le scanne dans l’application mobile.
        </p>
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact">{{ errorMessage }}</v-alert>
        <v-autocomplete v-model="selectedUserId" :items="userOptions" item-title="title" item-value="value" label="Agent" placeholder="Rechercher un agent" prepend-inner-icon="mdi-account-search-outline" :loading="administratorStore.isDirectoryLoading" :disabled="store.isEnrolling">
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle" />
          </template>
        </v-autocomplete>
      </v-card-text>

      <v-card-text v-else class="space-y-4 text-center">
        <p class="text-sm text-[#535865]">Code d’activation pour <strong>{{ selectedName ?? enrollment.userId }}</strong></p>
        <img :src="enrollment.qrCode" alt="QR code d’activation à scanner depuis l’application mobile" class="mx-auto h-44 w-44 rounded-xl border border-[#e3e5ea] bg-white p-2" />
        <div class="flex items-center justify-center gap-2">
          <span class="rounded-xl bg-[#F6F6F7] px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-[#252830]">{{ formattedCode }}</span>
          <v-btn icon="mdi-content-copy" variant="text" aria-label="Copier le code" @click="copyCode" />
        </div>
        <p class="text-xs text-[#848484]">Valable jusqu’au {{ formatDeviceDate(enrollment.expiresAt) }}, une seule fois.</p>
        <ol class="space-y-1 rounded-xl bg-[#F6F6F7] px-5 py-4 text-left text-sm text-[#535865]">
          <li>1. L’agent ouvre l’application mobile sur son téléphone.</li>
          <li>2. Il scanne le QR code ou saisit le code.</li>
          <li>3. Le téléphone apparaît « En activation », puis « Actif ».</li>
        </ol>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <template v-if="!enrollment">
          <v-btn variant="text" :disabled="store.isEnrolling" @click="open = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" :loading="store.isEnrolling" @click="generate">Générer le code</v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" :loading="store.isEnrolling" @click="generate">Nouveau code</v-btn>
          <v-btn color="primary" variant="flat" @click="open = false">Terminer</v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
