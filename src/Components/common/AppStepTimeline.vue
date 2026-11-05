<script setup lang="ts">
import { computed } from 'vue'

import type { StepItem } from '@/composables/useStepper'

/** Frise d'étapes sans fond, sur toute la largeur : formulaires en étapes et parcours guidé. */
const props = withDefaults(defineProps<{
  steps: StepItem[]
  current: number
  completed: number[]
  invalid?: number[]
  canReach: (index: number) => boolean
  /** Version réduite (parcours guidé au-dessus des pages) : pastilles plus petites, sans sous-titres. */
  compact?: boolean
}>(), { invalid: () => [] })
const emit = defineEmits<{ select: [index: number] }>()

type StepState = 'done' | 'current' | 'error' | 'upcoming'
const circleClasses: Record<StepState, string> = {
  done: 'bg-[#d80f16] text-white',
  current: 'border-2 border-[#d80f16] bg-[#fdecec] text-[#d80f16]',
  error: 'bg-[#c62828] text-white',
  upcoming: 'border-2 border-[#d9dce2] text-[#747985]',
}
const stateIcons: Partial<Record<StepState, string>> = { done: 'mdi-check', error: 'mdi-exclamation' }
// L'étape affichée garde sa coche si elle est déjà franchie (retour sur une étape du parcours guidé).
const iconOf = (index: number) => stateIcons[stateOf(index)] ?? (props.completed.includes(index) ? stateIcons.done : undefined)
// L'étape affichée porte déjà ses messages d'erreur : la pastille d'erreur signale les autres.
function stateOf(index: number): StepState {
  if (index === props.current) return 'current'
  if (props.invalid.includes(index)) return 'error'
  return props.completed.includes(index) ? 'done' : 'upcoming'
}
const step = computed(() => props.steps[props.current])
const select = (index: number) => props.canReach(index) && emit('select', index)
</script>

<template>
  <nav aria-label="Étapes">
    <ol class="flex items-start">
      <li v-for="(item, index) in steps" :key="item.title" class="relative flex min-w-0 flex-1 flex-col items-center">
        <span
          v-if="index > 0"
          class="absolute h-0.5 rounded"
          :class="[compact ? 'top-[13px] right-[calc(50%+20px)] left-[calc(-50%+20px)]' : 'top-[17px] right-[calc(50%+26px)] left-[calc(-50%+26px)]', completed.includes(index - 1) ? 'bg-[#d80f16]' : 'bg-[#d9dce2]']"
          aria-hidden="true"
        />
        <button
          type="button"
          class="flex w-full flex-col items-center px-2 text-center disabled:cursor-default"
          :class="compact ? 'gap-1' : 'gap-2'"
          :disabled="!canReach(index)"
          :aria-label="`Étape ${index + 1} : ${item.title}`"
          :aria-current="index === current ? 'step' : undefined"
          @click="select(index)"
        >
          <span class="grid shrink-0 place-items-center rounded-full font-bold" :class="[compact ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm', circleClasses[stateOf(index)]]">
            <v-icon v-if="iconOf(index)" :icon="iconOf(index)" :size="compact ? 14 : 18" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="hidden min-w-0 sm:block">
            <span class="block font-semibold" :class="[compact ? 'text-xs' : 'text-sm', index === current ? 'text-[#292d38]' : 'text-[#535865]']">{{ item.title }}</span>
            <span v-if="item.subtitle && !compact" class="mt-0.5 hidden text-xs text-[#747985] md:block">{{ item.subtitle }}</span>
          </span>
        </button>
      </li>
    </ol>
    <p v-if="step" class="mt-3 text-center text-xs text-[#747985] sm:hidden">Étape {{ current + 1 }} sur {{ steps.length }} · <span class="font-semibold text-[#292d38]">{{ step.title }}</span></p>
  </nav>
</template>
