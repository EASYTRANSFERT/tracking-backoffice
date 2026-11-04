import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import CompanySettingsForm from '@/Components/settings/CompanySettingsForm.vue'
import vuetify from '@/plugins/vuetify'
import { DEFAULT_TENANT_SETTINGS } from '@/stores/company-settings.store'
import type { TenantSettings } from '@/types/platform'

const mountForm = (settings: TenantSettings) => mount(CompanySettingsForm, { props: { settings }, global: { plugins: [vuetify] }, attachTo: document.body })
const submitted = async (wrapper: ReturnType<typeof mountForm>) => {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
  return wrapper.emitted('submit')?.[0]?.[0] as TenantSettings
}

describe('CompanySettingsForm — code SMS à l’activation', () => {
  it('envoie le mode d’activation choisi avec les autres paramètres', async () => {
    const wrapper = mountForm(DEFAULT_TENANT_SETTINGS)
    expect(wrapper.text()).toContain('L’agent saisit son matricule puis le code reçu par SMS.')

    await wrapper.find('input[aria-label="Code SMS à l’activation d’un téléphone"]').setValue(false)
    expect(wrapper.text()).toContain('Le matricule suffit, aucun SMS n’est envoyé.')
    expect((await submitted(wrapper)).activationSmsRequired).toBe(false)
  })

  it('active le code SMS pour une entreprise enregistrée sans ce paramètre (défaut de l’API)', async () => {
    const { activationSmsRequired: _omitted, ...older } = DEFAULT_TENANT_SETTINGS
    const wrapper = mountForm(older as TenantSettings)
    expect((await submitted(wrapper)).activationSmsRequired).toBe(true)
  })
})
