<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <!-- Coin supérieur droit de la carte : le titre d'un v-card-title n'est pas un conteneur flex. -->
  <v-btn icon="mdi-close" variant="text" size="small" aria-label="Fermer" class="!absolute right-3 top-3" @click="emit('close')" />
</template>
