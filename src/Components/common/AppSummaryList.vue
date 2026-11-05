<script setup lang="ts">
/** Libellés et valeurs en lecture seule, présentés comme sur les fiches (récapitulatif d'un formulaire en étapes). */
defineProps<{ items: { label: string; value: string; wide?: boolean }[] }>()
</script>

<template>
  <dl class="grid gap-5 sm:grid-cols-2">
    <div v-for="item in items" :key="item.label" :class="{ 'sm:col-span-2': item.wide }">
      <dt class="text-xs text-[#848484]">{{ item.label }}</dt>
      <dd class="mt-1 font-medium whitespace-pre-line">{{ item.value }}</dd>
    </div>
  </dl>
</template>
