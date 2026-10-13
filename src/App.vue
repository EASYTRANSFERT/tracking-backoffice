<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppFeedbackHost from '@/Components/common/AppFeedbackHost.vue'
</script>

<template>
  <v-app>
    <RouterView />
    <AppFeedbackHost />
  </v-app>
</template>
