<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useOnboardingStore } from '@/stores/onboarding.store'

/** « Commencer ici » : lance le parcours guidé et ouvre directement sa première étape. */
const store = useOnboardingStore()
const router = useRouter()
const { steps } = storeToRefs(store)

function start() {
  store.start()
  void router.push(steps.value[0]!.to)
}
</script>

<template>
  <v-btn v-if="steps.length" data-tour="onboarding-start" color="primary" size="large" prepend-icon="mdi-map-marker-path" @click="start">Commencer ici</v-btn>
</template>
