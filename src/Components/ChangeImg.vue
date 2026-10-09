<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import image1 from '@/assets/roadCleaners.jpg'
import image2 from '@/assets/workers_bridge.jpg'
import image3 from '@/assets/workersStanding.jpg'
import image4 from '@/assets/cleaning.jpg'

const images = [image1, image2, image3, image4]
const activeIndex = ref(0)

let intervalId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  intervalId = setInterval(() => {
    activeIndex.value =
      (activeIndex.value + 1) % images.length
  }, 6000)
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <section class="relative hidden min-h-screen overflow-hidden md:block">
    <img
      v-for="(image, index) in images"
      :key="image"
      :src="image"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
      :class="
        index === activeIndex
          ? 'opacity-100'
          : 'opacity-0'
      "
    />

    <div
      class="absolute inset-0 bg-black/10"
      aria-hidden="true"
    />

    <div class="absolute inset-x-0 bottom-8 flex justify-center gap-2">
      <button
        v-for="(_, index) in images"
        :key="index"
        type="button"
        :aria-label="`Afficher l'image ${index + 1}`"
        class="h-2 rounded-full transition-all duration-300"
        :class="
          index === activeIndex
            ? 'w-8 bg-red-600'
            : 'w-2 bg-white/70 hover:bg-white'
        "
        @click="activeIndex = index"
      />
    </div>
  </section>
</template>
