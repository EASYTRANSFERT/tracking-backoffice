<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div
  class="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-transparent px-8 py-10 shadow-2xl shadow-black/10 backdrop-blur-xl sm:px-12"
  >
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold tracking-tight text-gray-700">
        {{ title }}
      </h1>

      <img
        src="@/assets/kaybiclogo.png"
        alt="Kaybic Africa"
        class="mx-auto mt-4 h-16 w-auto object-contain"
      />

      <p
        v-if="description"
        class="mt-5 text-sm leading-6 text-gray-600"
      >
        {{ description }}
      </p>
    </header>

    <slot />
  </div>
</template>
