import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@mdi/font/css/materialdesignicons.css'
import './main.css'

import App from './App.vue'
import router from './router'

import { configureApiAuth } from '@/Services/api-client'
import { useAuthStore } from '@/stores/auth.store'
import vuetify from '@/plugins/vuetify'


const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

const authStore = useAuthStore(pinia)

configureApiAuth({
  getAccessToken: () => authStore.accessToken,

  refreshSession: () => {
    return authStore.refreshSession()
  },

  onSessionExpired: () => {
    authStore.resetAuthentication()

    if (router.currentRoute.value.name !== 'login') {
      void router.replace({ name: 'login' })
    }
  },
})

async function enableMocking(){
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_MOCKS !== 'true'
  ) {
    return
  }

  const { worker } = await import('./mocks/browser')
  return worker.start({
    onUnhandledRequest: 'bypass',
})
}
async function bootstrap() {
  await enableMocking()
  app.mount('#app')
}

void bootstrap()
