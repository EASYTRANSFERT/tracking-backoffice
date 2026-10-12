import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    css: true,
    include: ['src/**/__tests__/**/*.spec.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
