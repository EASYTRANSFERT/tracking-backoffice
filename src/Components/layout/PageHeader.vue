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

    <div class="page-header-actions flex flex-wrap items-center gap-3">
      <slot name="actions">
        <v-btn color="primary" prepend-icon="mdi-plus" size="large" class="w-full sm:w-auto">
          Nouvelle entreprise
        </v-btn>
      </slot>
    </div>
  </header>
</template>

<style scoped>
.page-header-actions :deep(.v-btn.bg-primary) {
  min-height: 44px;
  padding-inline: 20px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  box-shadow: 0 8px 18px rgb(216 15 22 / 18%);
}
</style>
