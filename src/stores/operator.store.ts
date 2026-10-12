import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  mockCompanies,
  mockOffers,
  mockPlatformActivities,
  mockSupportInterventions,
} from '@/mocks/operator-data'
import type { CompanyInput, OfferInput } from '@/types/operator'
import type { SupportIntervention } from '@/types/operator'

export const useOperatorStore = defineStore('operator', () => {
  const companies = ref(structuredClone(mockCompanies))
  const offers = ref(structuredClone(mockOffers))
  const activities = ref(structuredClone(mockPlatformActivities))
  const supportInterventions = ref(structuredClone(mockSupportInterventions))

  const activeCompaniesCount = computed(
    () => companies.value.filter((company) => company.status === 'active').length,
  )
  const suspendedCompaniesCount = computed(
    () => companies.value.filter((company) => company.status === 'suspended').length,
  )
  const activeOffersCount = computed(
    () => offers.value.filter((offer) => offer.status === 'active').length,
  )
  const activeAgentsCount = computed(() =>
    companies.value.reduce((total, company) => total + company.activeAgents, 0),
  )

  function getCompanyById(id: string) {
    return companies.value.find((company) => company.id === id)
  }

  function getOfferById(id: string) {
    return offers.value.find((offer) => offer.id === id)
  }

  function createCompany(input: CompanyInput) {
    const id = `company-${Date.now()}`
    companies.value.unshift({
      ...input,
      id,
      activeAgents: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    return id
  }

  function updateCompany(id: string, input: CompanyInput) {
    const company = getCompanyById(id)
    if (company) Object.assign(company, input)
  }

  function suspendCompany(id: string, reason: string) {
    const company = getCompanyById(id)
    if (!company) return
    company.status = 'suspended'
    company.suspensionReason = reason
  }

  function reactivateCompany(id: string) {
    const company = getCompanyById(id)
    if (!company) return
    company.status = 'active'
    company.suspensionReason = undefined
  }

  function createOffer(input: OfferInput) {
    const id = `offer-${Date.now()}`
    offers.value.unshift({ ...input, id, companyCount: 0 })
    return id
  }

  function updateOffer(id: string, input: OfferInput) {
    const offer = getOfferById(id)
    if (offer) Object.assign(offer, input)
  }

  function createSupportIntervention(input: Omit<SupportIntervention, 'id' | 'createdAt' | 'status'>) {
    supportInterventions.value.unshift({
      ...input,
      id: `support-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    })
  }

  return {
    companies,
    offers,
    activities,
    supportInterventions,
    activeCompaniesCount,
    suspendedCompaniesCount,
    activeOffersCount,
    activeAgentsCount,
    getCompanyById,
    getOfferById,
    createCompany,
    updateCompany,
    suspendCompany,
    reactivateCompany,
    createOffer,
    updateOffer,
    createSupportIntervention,
  }
})
