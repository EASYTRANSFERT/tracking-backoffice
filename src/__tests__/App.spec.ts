import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import vuetify from '@/plugins/vuetify'

describe('App', () => {
  it('renders the active router page inside Vuetify', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<p>Page de test</p>' } }],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), vuetify, router] },
    })

    expect(wrapper.text()).toContain('Page de test')
  })
})
