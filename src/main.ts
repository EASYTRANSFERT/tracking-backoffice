import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@mdi/font/css/materialdesignicons.css'
import 'leaflet/dist/leaflet.css'
import './main.css'

import App from './App.vue'
import router from './router'

import { configureApiAuth } from '@/Services/api-client'
import { authSessionStorage } from '@/Services/auth-session.storage'
import { useAuthStore } from '@/stores/auth.store'
import vuetify from '@/plugins/vuetify'


const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuetify)

const authStore = useAuthStore(pinia)

configureApiAuth({
  getAccessToken: () => authStore.accessToken,

  refreshSession: () => authStore.refreshSession(),

  onSessionExpired: () => {
    authStore.expireSession()

    if (router.currentRoute.value.name !== 'login') {
      void router.replace({ name: 'login' })
    }
  },
})


authSessionStorage.subscribe(() => {
  if (authStore.syncFromStorage()) return

  authStore.resetAuthentication()

  if (router.currentRoute.value.name !== 'login') {
    void router.replace({ name: 'login' })
  }
})

async function enableMocking(){
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
})
}
async function bootstrap() {
  await enableMocking()
  await authStore.restoreSession()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
