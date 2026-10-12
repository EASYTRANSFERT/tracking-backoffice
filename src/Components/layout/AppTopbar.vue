<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import UserMenu from '@/Components/layout/UserMenu.vue'
import type { UserRole } from '@/types/roles'

withDefaults(defineProps<{ role?: UserRole }>(), { role: 'operator' })

const emit = defineEmits<{
  toggleNavigation: []
}>()

const route = useRoute()
const pageTitle = computed(() => String(route.meta.title ?? 'Dashboard'))
</script>

<template>
  <v-app-bar
    app
    flat
    height="72"
    color="surface"
    class="border-b-sm"
  >
    <v-app-bar-nav-icon
      aria-label="Afficher ou masquer le menu"
      class="ml-1"
      @click="emit('toggleNavigation')"
    />

    <v-toolbar-title class="ml-2 text-[22px] font-bold text-[#252830] md:ml-7">
      {{ pageTitle }}
    </v-toolbar-title>

    <v-spacer />

    <v-text-field
      prepend-inner-icon="mdi-magnify"
      placeholder="Rechercher"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      class="mr-3 hidden max-w-[320px] md:block"
    />

    <v-btn
      icon="mdi-bell-outline"
      variant="text"
      color="secondary"
      aria-label="Notifications"
    />

    <UserMenu :role="role" />

    <div class="mr-3" />
  </v-app-bar>
</template>
