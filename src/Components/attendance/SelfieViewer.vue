<script setup lang="ts">
import { ref } from 'vue'

import { getApiErrorMessage } from '@/utils/api-error'

/**
 * Selfie chargé à la demande : chaque consultation est journalisée par l'API et le lien signé
 * ne vaut que 5 minutes. Partagé par le selfie du pointage et ceux des contrôles de présence ;
 * le parent change la :key pour repartir de zéro sur un autre pointage.
 */
const props = withDefaults(defineProps<{
  title: string
  load: () => Promise<string>
  /** Message affiché quand l'API ne rend aucune photo (404). */
  unavailableMessage?: string
  /** Note rappelant la journalisation, à n'afficher qu'une fois par écran. */
  showNotice?: boolean
}>(), { unavailableMessage: 'Aucun selfie disponible.', showNotice: true })

const url = ref<string>()
const error = ref<string>()
const isLoading = ref(false)

async function show() {
  isLoading.value = true
  error.value = undefined
  try { url.value = await props.load() }
  catch (failure) { error.value = getApiErrorMessage(failure, props.unavailableMessage) }
  finally { isLoading.value = false }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-[#848484]">{{ title }}</p>
      <v-btn v-if="!url" size="small" variant="tonal" color="primary" prepend-icon="mdi-camera-outline" :loading="isLoading" @click="show">Voir le selfie</v-btn>
    </div>
    <p v-if="showNotice" class="mt-1 text-xs text-[#747985]">Chaque consultation est enregistrée ; le lien reste valable 5 minutes.</p>
    <v-img v-if="url" :src="url" max-height="320" class="mt-3 rounded-lg bg-[#f4f4f5]" :alt="title" />
    <p v-else-if="error" class="mt-2 text-sm text-[#a76000]">{{ error }}</p>
  </div>
</template>
