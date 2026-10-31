import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { readAccessTokenClaims } from '@/Services/access-token'
import { tenantService } from '@/Services/tenant.service'
import { useAuthStore } from '@/stores/auth.store'

import type { TenantResponse, TenantSettings } from '@/types/platform'

/** Valeurs proposées quand l'entreprise n'a pas encore de paramètres (CDCT / DAT). */
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  radiusM: 100,
  lateToleranceMin: 10,
  maxAccuracyM: 50,
  missingExitAfterMin: 240,
  checksPerSession: 0,
  retention: { selfieDays: 90, dataYears: 5, anonymizeAfterYears: 5, exportDays: 7 },
}

/**
 * Paramètres de l'entreprise de l'administrateur connecté. L'entreprise est celle
 * du jeton (claim tid) : l'administrateur ne modifie que ses paramètres, jamais
 * le nom, le pays, le fuseau ou le contrat.
 */
export const useCompanySettingsStore = defineStore('company-settings', () => {
  const authStore = useAuthStore()

  const company = shallowRef<TenantResponse | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  /** Faux pour une entreprise créée sans paramètres : le formulaire part alors des valeurs par défaut. */
  const hasSettings = computed(() => Boolean(company.value?.settings))
  const settings = computed<TenantSettings>(() => company.value?.settings ?? DEFAULT_TENANT_SETTINGS)

  function currentTenantId(): string {
    const tenantId = readAccessTokenClaims(authStore.accessToken)?.tid
    if (!tenantId) throw new Error('Votre session ne précise pas votre entreprise.')
    return tenantId
  }

  async function load() {
    isLoading.value = true
    try {
      company.value = await tenantService.findOne(currentTenantId())
      authStore.tenant = company.value
      return company.value
    } finally {
      isLoading.value = false
    }
  }

  // Le bloc settings est toujours envoyé complet, que l'entreprise en ait déjà ou non.
  async function save(next: TenantSettings) {
    isSaving.value = true
    try {
      const saved = await tenantService.updateSettings(currentTenantId(), next)
      if (company.value) company.value = { ...company.value, settings: saved }
      authStore.tenant = company.value
      return company.value
    } finally {
      isSaving.value = false
    }
  }

  return { company, isLoading, isSaving, hasSettings, settings, load, save }
})
