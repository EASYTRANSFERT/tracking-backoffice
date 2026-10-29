<script setup lang="ts">
import AuthCard from '@/Components/AuthCard.vue'
import ChangeImg from '@/Components/ChangeImg.vue'
import ColorModeToggle from '@/Components/common/ColorModeToggle.vue'

/** Écran public (connexion, choix du mot de passe) : la carte à gauche, l'illustration à droite. */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <main
    class="grid min-h-screen w-full grid-cols-1 bg-gray-100 md:grid-cols-2 dark:bg-black"
  >
    <section
      class="relative bg-gradient-to-br from-gray-100 via-white to-red-50 dark:from-black dark:via-black dark:to-[#2a0507] flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 md:min-h-0"
    >
      <img
        src="@/assets/background.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full object-cover dark:opacity-10"
      />

      <ColorModeToggle class="absolute right-4 top-4 z-20" />

      <AuthCard
        :title="title"
        :description="description"
      >
        <slot />
      </AuthCard>
    </section>

    <section
      class="relative hidden min-h-screen overflow-hidden md:block"
    >
      <ChangeImg />

      <div
        class="absolute inset-0 bg-black/5"
        aria-hidden="true"
      />
    </section>
  </main>
</template>
