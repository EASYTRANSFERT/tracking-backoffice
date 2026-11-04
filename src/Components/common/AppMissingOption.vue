<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/** Contenu d'une liste de choix vide : ce qui manque, et un lien pour le créer (slot #no-data d'un v-select). */
defineProps<{ text: string; label: string; to: RouteLocationRaw }>()
</script>

<template>
  <div class="px-4 py-3">
    <p class="text-sm text-[#747985]">{{ text }}</p>
    <v-btn class="mt-2" size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" :to="to">{{ label }}</v-btn>
  </div>
</template>
