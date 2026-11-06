<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  label: string
  value: string
}>()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
  } catch {
    return
  }

  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <button
    type="button"
    class="group flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    :title="`Copier : ${value}`"
    @click="copy"
  >
    <span class="shrink-0 whitespace-nowrap text-gray-500">{{ label }} :</span>
    <!-- Valeur longue tronquée : le clic copie quand même la valeur entière -->
    <span class="min-w-0 truncate font-medium text-gray-800">{{ value }}</span>
    <!-- opacity-[0] et non opacity-0 : Vuetify définit aussi .opacity-0 en !important, ce qui bloquerait le survol -->
    <span
      class="inline-flex shrink-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      :class="copied ? 'opacity-100' : 'opacity-[0]'"
    >
      <v-icon
        :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        size="14"
        :color="copied ? 'success' : undefined"
      />
    </span>
  </button>
</template>
