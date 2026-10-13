import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { offerService } from '@/Services/offer.service'
import { tenantService } from '@/Services/tenant.service'
import { mockCompanies, mockOffers, mockPlatformActivities, mockSupportInterventions } from '@/mocks/operator-data'
import type { OfferResponse, TenantResponse } from '@/types/platform'
import type { Company, CompanyInput, Offer, OfferInput, SupportIntervention } from '@/types/operator'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'

function mapTenant(tenant: TenantResponse): Company {
  const status = tenant.status === 'ACTIVE' ? 'active' : tenant.status === 'SUSPENDED' ? 'suspended' : 'pending'
  return {
    id: tenant.id,
    legalName: tenant.name,
    country: tenant.country,
    timezone: tenant.timezone,
    offerId: tenant.plan?.offerId ?? '',
    activeAgents: 0,
    status,
    createdAt: tenant.createdAt,
    suspensionReason: tenant.suspensionReason ?? undefined,
    contractFrom: tenant.contractFrom,
    contractTo: tenant.contractTo ?? undefined,
  }
}

function mapOffer(offer: OfferResponse): Offer {
  return {
    id: offer.id,
    code: offer.code,
    name: offer.name,
    description: offer.description,
    price: 0,
    maxActiveAgents: offer.maxAgents,
    companyCount: 0,
    status: offer.status === 'ACTIVE' ? 'active' : 'inactive',
  }
}

export const useOperatorStore = defineStore('operator', () => {
  const companies = ref<Company[]>(mockMode ? structuredClone(mockCompanies) : [])
  const offers = ref<Offer[]>(mockMode ? structuredClone(mockOffers) : [])
  const activities = ref(structuredClone(mockPlatformActivities))
  const supportInterventions = ref(structuredClone(mockSupportInterventions))
  const isLoading = ref(false)
  const hasLoaded = ref(mockMode)
  const canUpdateOffers = computed(() => mockMode)

  const activeCompaniesCount = computed(() => companies.value.filter((company) => company.status === 'active').length)
  const suspendedCompaniesCount = computed(() => companies.value.filter((company) => company.status === 'suspended').length)
  const activeOffersCount = computed(() => offers.value.filter((offer) => offer.status === 'active').length)
  const activeAgentsCount = computed(() => companies.value.reduce((total, company) => total + company.activeAgents, 0))
  const getCompanyById = (id: string) => companies.value.find((company) => company.id === id)
  const getOfferById = (id: string) => offers.value.find((offer) => offer.id === id)

  async function loadCatalog(force = false) {
    if (mockMode || (hasLoaded.value && !force)) return
    isLoading.value = true
    try {
      const [tenantPage, offerPage] = await Promise.all([
        tenantService.list({ limit: 200 }),
        offerService.list({ limit: 200 }),
      ])
      companies.value = tenantPage.items.map(mapTenant)
      offers.value = offerPage.items.map(mapOffer)
      hasLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function loadCompany(id: string) {
    if (mockMode || getCompanyById(id)) return getCompanyById(id)
    const company = mapTenant(await tenantService.findOne(id))
    companies.value.push(company)
    return company
  }

  async function createCompany(input: CompanyInput) {
    if (mockMode) {
      const id = `company-${Date.now()}`
      companies.value.unshift({ ...input, id, activeAgents: 0, status: 'pending', createdAt: new Date().toISOString() })
      return id
    }
    const tenant = await tenantService.create({
      name: input.legalName,
      country: input.country,
      timezone: input.timezone,
      contractFrom: new Date(input.contractFrom).toISOString(),
      contractTo: input.contractTo ? new Date(input.contractTo).toISOString() : undefined,
      offerId: input.offerId || undefined,
    })
    companies.value.unshift(mapTenant(tenant))
    return tenant.id
  }

  async function updateCompany(id: string, input: CompanyInput) {
    if (mockMode) {
      const company = getCompanyById(id)
      if (company) Object.assign(company, input)
      return
    }
    let tenant = await tenantService.update(id, {
      name: input.legalName,
      country: input.country,
      timezone: input.timezone,
      contractFrom: new Date(input.contractFrom).toISOString(),
      contractTo: input.contractTo ? new Date(input.contractTo).toISOString() : undefined,
    })
    if (input.offerId && input.offerId !== tenant.plan?.offerId) {
      tenant = await tenantService.assignPlan(id, { offerId: input.offerId })
    }
    replaceCompany(mapTenant(tenant))
  }

  async function suspendCompany(id: string, reason: string) {
    if (mockMode) {
      const company = getCompanyById(id)
      if (company) Object.assign(company, { status: 'suspended', suspensionReason: reason })
      return
    }
    replaceCompany(mapTenant(await tenantService.suspend(id, { reason })))
  }

  async function reactivateCompany(id: string) {
    if (mockMode) {
      const company = getCompanyById(id)
      if (company) Object.assign(company, { status: 'active', suspensionReason: undefined })
      return
    }
    replaceCompany(mapTenant(await tenantService.activate(id)))
  }

  async function createOffer(input: OfferInput) {
    if (mockMode) {
      const id = `offer-${Date.now()}`
      offers.value.unshift({ ...input, id, price: 0, companyCount: 0, status: 'active' })
      return id
    }
    const offer = await offerService.create({ code: input.code, name: input.name, description: input.description, maxAgents: input.maxActiveAgents })
    offers.value.unshift(mapOffer(offer))
    return offer.id
  }

  function updateOffer(id: string, input: OfferInput) {
    if (!mockMode) throw new Error("L’API ne fournit pas d’endpoint de modification d’offre.")
    const offer = getOfferById(id)
    if (offer) Object.assign(offer, input)
  }

  function replaceCompany(company: Company) {
    const index = companies.value.findIndex((item) => item.id === company.id)
    if (index >= 0) companies.value[index] = company
    else companies.value.unshift(company)
  }

  function createSupportIntervention(input: Omit<SupportIntervention, 'id' | 'createdAt' | 'status'>) {
    supportInterventions.value.unshift({ ...input, id: `support-${Date.now()}`, status: 'open', createdAt: new Date().toISOString() })
  }

  return {
    companies, offers, activities, supportInterventions, isLoading, hasLoaded, canUpdateOffers,
    activeCompaniesCount, suspendedCompaniesCount, activeOffersCount, activeAgentsCount,
    getCompanyById, getOfferById, loadCatalog, loadCompany,
    createCompany, updateCompany, suspendCompany, reactivateCompany,
    createOffer, updateOffer, createSupportIntervention,
  }
})
