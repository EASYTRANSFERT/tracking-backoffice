<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useDisplay } from 'vuetify'

import AppSidebar from '@/Components/layout/AppSidebar.vue'
import AppTopbar from '@/Components/layout/AppTopbar.vue'

const { lgAndUp } = useDisplay()
const drawer = ref(lgAndUp.value)

watch(lgAndUp, (isDesktop) => {
  drawer.value = isDesktop
})
</script>

<template>
  <v-layout class="min-h-screen bg-background">
    <AppSidebar v-model="drawer" />
    <AppTopbar @toggle-navigation="drawer = !drawer" />

    <v-main class="bg-background">
      <v-container fluid class="pa-4 pa-md-8">
        <RouterView />
      </v-container>
    </v-main>
  </v-layout>
</template>
