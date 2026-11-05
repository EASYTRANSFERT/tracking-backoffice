<script setup lang="ts">
import { computed } from 'vue'

import AppStepTimeline from '@/Components/common/AppStepTimeline.vue'
import type { StepItem } from '@/composables/useStepper'

/** Parcours en étapes : frise des étapes en haut, sur toute la largeur, étape affichée en dessous. */
const props = withDefaults(defineProps<{
  steps: StepItem[]
  current: number
  completed: number[]
  invalid?: number[]
  canReach: (index: number) => boolean
}>(), { invalid: () => [] })
const emit = defineEmits<{ select: [index: number] }>()

const step = computed(() => props.steps[props.current])
</script>

<template>
  <div class="space-y-6">
    <AppStepTimeline :steps="steps" :current="current" :completed="completed" :invalid="invalid" :can-reach="canReach" @select="emit('select', $event)" />

    <div class="min-w-0">
      <v-card>
        <v-card-title class="flex items-center gap-3 px-6 py-5">
          <v-avatar color="red-lighten-5" rounded="lg"><v-icon :icon="step?.icon ?? 'mdi-format-list-numbered'" color="primary" /></v-avatar>
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-bold">{{ step?.title }}</h2>
            <p class="mt-1 text-xs font-normal whitespace-normal text-[#747985]">{{ step?.description ?? step?.subtitle }}</p>
          </div>
        </v-card-title>
        <v-divider />
        <slot />
      </v-card>
      <div v-if="$slots.actions" class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
