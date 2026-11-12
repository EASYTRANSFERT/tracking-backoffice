import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AppDataTable from '@/Components/common/AppDataTable.vue'
import vuetify from '@/plugins/vuetify'

const items = Array.from({ length: 12 }, (_, index) => ({ id: `r${index + 1}`, name: `Ligne ${index + 1}` }))
const columns = [{ key: 'name', title: 'Nom' }, { key: 'extra', title: 'Extra', show: false }]
const mountTable = (props = {}) => mount(AppDataTable, {
  props: { items, columns, label: 'lignes', pageSize: 5, searchText: (item: object) => [(item as { name: string }).name], ...props },
  slots: { 'cell-name': '<template #cell-name="{ item }">« {{ item.name }} »</template>' },
  global: { plugins: [vuetify] },
  attachTo: document.body,
})

describe('AppDataTable', () => {
  it('shows one page of rows with the footer counts and the rows-per-page selector', () => {
    const wrapper = mountTable()
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.text()).toContain('Affichage de 1 à 5 sur 12 lignes')
    expect(wrapper.text()).toContain('Lignes par page')
  })

  it('hides columns flagged show: false', () => {
    const wrapper = mountTable()
    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Nom'])
  })

  it('filters with the search field and says when nothing matches', async () => {
    const wrapper = mountTable()
    await wrapper.find('input').setValue('ligne 12')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.find('input').setValue('zzz')
    expect(wrapper.find('tbody').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucun résultat')
  })

  it('shows every row and no footer when paging is left to the parent', () => {
    const wrapper = mountTable({ paginate: false, bare: true })
    expect(wrapper.findAll('tbody tr')).toHaveLength(12)
    expect(wrapper.text()).not.toContain('Lignes par page')
  })
})
