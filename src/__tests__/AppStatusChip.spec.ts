import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AppStatusChip from '@/Components/AppStatusChip.vue'
import vuetify from '@/plugins/vuetify'

describe('AppStatusChip', () => {
  it('shows the translated company status', () => {
    const wrapper = mount(AppStatusChip, {
      props: { status: 'suspended' },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.text()).toContain('Suspendue')
  })
})
