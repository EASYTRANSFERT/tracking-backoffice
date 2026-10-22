import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET

  return {
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
      /*
       * Développement : avec VITE_API_PROXY_TARGET, le navigateur appelle /api sur le
       * serveur Vite, qui relaie vers l'API. Même origine, donc aucun CORS ; et l'en-tête
       * ngrok est ajouté côté serveur, sans requête préalable (preflight) du navigateur.
       */
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: true,
              headers: { 'ngrok-skip-browser-warning': 'true' },
            },
          }
        : undefined,
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
  }
})
