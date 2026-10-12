<script setup lang="ts">
import PageHeader from '@/Components/layout/PageHeader.vue'
</script>

<template>
  <div class="mx-auto w-full max-w-[900px]">
    <PageHeader>
      <template #title>Paramètres</template>
      <template #description>Préférences personnelles de votre espace de travail.</template>
      <template #actions><span /></template>
    </PageHeader>
    <v-alert type="info" variant="tonal" title="Configuration à venir" text="Cette page sera connectée aux préférences utilisateur lorsque les points d’accès correspondants seront disponibles." />
  </div>
</template>
