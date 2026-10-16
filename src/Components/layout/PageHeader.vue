<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)

const displayName = computed(() => {
  return currentUser.value?.names.trim() || 'Utilisateur'
})
</script>

<template>
  <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-[28px] font-bold leading-tight text-[#252830]">
        <slot name="title">Bonjour {{ displayName }}</slot>
      </h1>

      <p class="mt-2 text-sm text-[#747985]">
        <slot name="description">Voici l’état de la plateforme aujourd’hui.</slot>
      </p>
    </div>

    <div
      class="flex flex-wrap items-center gap-3 [&_.v-btn.bg-primary]:min-h-11 [&_.v-btn.bg-primary]:rounded-[10px] [&_.v-btn.bg-primary]:px-5 [&_.v-btn.bg-primary]:font-semibold [&_.v-btn.bg-primary]:normal-case [&_.v-btn.bg-primary]:tracking-normal [&_.v-btn.bg-primary]:shadow-[0_8px_18px_rgb(216_15_22_/_18%)]"
    >
      <slot name="actions">
        <v-btn color="primary" prepend-icon="mdi-plus" size="large" class="w-full sm:w-auto">
          Nouvelle entreprise
        </v-btn>
      </slot>
    </div>
  </header>
</template>
