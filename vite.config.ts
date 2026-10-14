import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    // Auto-imported Vuetify components also live in lazy-loaded routes.
    // Pre-bundle them once so route navigation cannot trigger a dev-server
    // reload while Vue Router is loading the destination page.
    include: [
      'vuetify/components/VAlert',
      'vuetify/components/VApp',
      'vuetify/components/VAppBar',
      'vuetify/components/VAvatar',
      'vuetify/components/VBtn',
      'vuetify/components/VCard',
      'vuetify/components/VChip',
      'vuetify/components/VDialog',
      'vuetify/components/VDivider',
      'vuetify/components/VFileInput',
      'vuetify/components/VForm',
      'vuetify/components/VGrid',
      'vuetify/components/VIcon',
      'vuetify/components/VLayout',
      'vuetify/components/VList',
      'vuetify/components/VMain',
      'vuetify/components/VMenu',
      'vuetify/components/VNavigationDrawer',
      'vuetify/components/VPagination',
      'vuetify/components/VProgressCircular',
      'vuetify/components/VProgressLinear',
      'vuetify/components/VSelect',
      'vuetify/components/VSkeletonLoader',
      'vuetify/components/VSnackbar',
      'vuetify/components/VTable',
      'vuetify/components/VTextField',
      'vuetify/components/VTextarea',
      'vuetify/components/VTimeline',
      'vuetify/components/VToolbar',
    ],
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    vuetify({
      autoImport: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
