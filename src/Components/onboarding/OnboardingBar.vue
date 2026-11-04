<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import AppStepTimeline from '@/Components/common/AppStepTimeline.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'

/** Frise du parcours guidé, au-dessus de chaque page tant que le parcours est en cours, jamais sur l'accueil. */
const store = useOnboardingStore()
const route = useRoute()
const router = useRouter()
const { steps, isActive, current, done } = storeToRefs(store)

const onDashboard = computed(() => route.name === 'admin-dashboard' || route.name === 'supervisor-dashboard')
// Formulaire déjà en étapes (site, mission) : une seule frise à l'écran, la sienne.
const asLine = computed(() => Boolean(route.meta.hasStepper))
const nextStep = computed(() => steps.value[current.value + 1])
const routeName = (to: RouteLocationRaw) => typeof to === 'object' && 'name' in to ? to.name : undefined

// La page affichée désigne l'étape en cours quand elle en est une (menu, lien, retour arrière).
watch(() => route.name, (name) => {
  const index = steps.value.findIndex((step) => routeName(step.to) === name)
  if (isActive.value && index >= 0) store.goTo(index)
}, { immediate: true })

function open(index: number) {
  store.goTo(index)
  void router.push(steps.value[index]!.to)
}
function next() {
  store.next()
  if (isActive.value) void router.push(steps.value[current.value]!.to)
}
</script>

<template>
  <section v-if="isActive && !onDashboard" class="space-y-4" :class="asLine ? 'mb-4' : 'mb-8'" aria-label="Mise en route">
    <div class="flex items-center gap-3">
      <p class="text-xs font-semibold tracking-wide text-[#747985] uppercase">
        Mise en route · <template v-if="asLine">Étape {{ current + 1 }} sur {{ steps.length }} : <span class="text-[#292d38]">{{ steps[current]?.title }}</span></template><template v-else>{{ done.length }} / {{ steps.length }}</template>
      </p>
      <v-spacer />
      <v-btn variant="text" size="small" color="secondary" @click="store.stop()">Quitter</v-btn>
      <v-btn size="small" color="primary" variant="flat" :prepend-icon="nextStep ? undefined : 'mdi-check'" :append-icon="nextStep ? 'mdi-arrow-right' : undefined" @click="next">{{ nextStep?.title ?? 'Terminer' }}</v-btn>
    </div>
    <AppStepTimeline v-if="!asLine" compact :steps="steps" :current="current" :completed="done" :can-reach="() => true" @select="open" />
  </section>
</template>
