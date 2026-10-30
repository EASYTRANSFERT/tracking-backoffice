import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SitePicker from '@/Components/sites/SitePicker.vue'
import vuetify from '@/plugins/vuetify'
import type { Site } from '@/types/administrator'

const site = (id: string, name: string, extra: Partial<Site> = {}) => ({ id, name, status: 'active', ...extra }) as Site
const sites = [site('s1', 'Entrepôt Vridi', { city: 'Abidjan', teamId: 't1' }), site('s2', 'Dépôt Yopougon', { city: 'Abidjan' }), site('s3', 'Agence Bouaké', { city: 'Bouaké' })]
const mountPicker = (props = {}) => mount(SitePicker, { props: { sites, selectedId: 's2', teamName: (id: string) => (id === 't1' ? 'Équipe Nord' : 'Équipe'), ...props }, global: { plugins: [vuetify] }, attachTo: document.body })

describe('SitePicker', () => {
  it('lists every site with the count and marks only the selected one', () => {
    const wrapper = mountPicker()
    expect(wrapper.text()).toContain('Entrepôt Vridi')
    expect(wrapper.text()).toContain('Équipe Nord')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.findAll('.v-list-item--active')).toHaveLength(1)
    expect(wrapper.find('.v-list-item--active').text()).toContain('Dépôt Yopougon')
  })

  it('filters the list from the search field and says when nothing matches', async () => {
    const wrapper = mountPicker()
    const input = wrapper.find('input')

    await input.setValue('bouaké')
    expect(wrapper.findAll('.v-list-item')).toHaveLength(1)
    expect(wrapper.text()).toContain('Agence Bouaké')

    await input.setValue('zzz')
    expect(wrapper.findAll('.v-list-item')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucun site ne correspond')
  })

  it('emits the id of the clicked site', async () => {
    const wrapper = mountPicker()
    await wrapper.findAll('.v-list-item')[2]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['s3']])
  })
})
