import { fullName } from '@/utils/people'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { offerService } from '@/Services/offer.service'
import { tenantService } from '@/Services/tenant.service'
import { mockCompanies, mockOffers, mockPlatformActivities, mockSupportInterventions } from '@/mocks/operator-data'
import type { OfferResponse, TenantResponse } from '@/types/platform'
import type { Company, CompanyInput, Offer, OfferInput, SupportIntervention } from '@/types/operator'
import type { EnterpriseUserInput } from '@/types/administrator'
import type { UserResponse } from '@/types/user'

const mockMode = import.meta.env.VITE_ENABLE_MOCKS === 'true'
const PAGE_SIZE = 10

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

function toIsoDate(value: string) {
  return new Date(value).toISOString()
}

function sameCalendarDate(left?: string, right?: string) {
  if (!left && !right) return true
  if (!left || !right) return false
  return left.slice(0, 10) === right.slice(0, 10)
}

export const useOperatorStore = defineStore('operator', () => {
  const companies = ref<Company[]>(mockMode ? structuredClone(mockCompanies) : [])
  const offers = ref<Offer[]>(mockMode ? structuredClone(mockOffers) : [])
  const activities = ref(mockMode ? structuredClone(mockPlatformActivities) : [])
  const supportInterventions = ref(mockMode ? structuredClone(mockSupportInterventions) : [])
  const isLoading = ref(false)
  const hasLoaded = ref(false)
  /** Administrateurs créés pendant la session, par entreprise : l'API ne permet pas encore de les relister. */
  const invitedAdministrators = ref<Record<string, UserResponse[]>>({})
  const canUpdateOffers = computed(() => mockMode)
  const companyNextCursor = ref<string | null>(null)
  const companyCursorHistory = ref<(string | undefined)[]>([])
  const companyPage = ref(1)
  const offerNextCursor = ref<string | null>(null)
  const offerCursorHistory = ref<(string | undefined)[]>([])
  const offerPage = ref(1)

  const activeCompaniesCount = computed(() => companies.value.filter((company) => company.status === 'active').length)
  const suspendedCompaniesCount = computed(() => companies.value.filter((company) => company.status === 'suspended').length)
  const activeOffersCount = computed(() => offers.value.filter((offer) => offer.status === 'active').length)
  const activeAgentsCount = computed(() => companies.value.reduce((total, company) => total + company.activeAgents, 0))
  const getCompanyById = (id: string) => companies.value.find((company) => company.id === id)
  const getOfferById = (id: string) => offers.value.find((offer) => offer.id === id)

  async function loadCatalog(force = false) {
    if (hasLoaded.value && !force) return
    isLoading.value = true
    try {
      const [tenantResult, offerResult] = await Promise.all([
        tenantService.list({ limit: PAGE_SIZE }),
        offerService.list({ limit: PAGE_SIZE }),
      ])
      companies.value = tenantResult.items.map(mapTenant)
      offers.value = offerResult.items.map(mapOffer)
      companyNextCursor.value = tenantResult.nextCursor ?? null
      offerNextCursor.value = offerResult.nextCursor ?? null
      companyCursorHistory.value = []
      offerCursorHistory.value = []
      companyPage.value = 1
      offerPage.value = 1
      hasLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function loadCompanyPage(cursor?: string, direction: 'next' | 'previous' | 'reset' = 'reset') {
    isLoading.value = true
    try {
      const result = await tenantService.list({ cursor, limit: PAGE_SIZE })
      companies.value = result.items.map(mapTenant)
      companyNextCursor.value = result.nextCursor ?? null
      if (direction === 'next') {
        companyCursorHistory.value.push(cursor)
        companyPage.value += 1
      } else if (direction === 'previous') {
        companyPage.value = Math.max(1, companyPage.value - 1)
      } else {
        companyCursorHistory.value = []
        companyPage.value = 1
      }
    } finally {
      isLoading.value = false
    }
  }

  async function nextCompanyPage() {
    if (companyNextCursor.value) await loadCompanyPage(companyNextCursor.value, 'next')
  }

  async function previousCompanyPage() {
    if (!companyCursorHistory.value.length) return
    companyCursorHistory.value.pop()
    await loadCompanyPage(companyCursorHistory.value.at(-1), 'previous')
  }

  async function loadOfferPage(cursor?: string, direction: 'next' | 'previous' | 'reset' = 'reset') {
    isLoading.value = true
    try {
      const result = await offerService.list({ cursor, limit: PAGE_SIZE })
      offers.value = result.items.map(mapOffer)
      offerNextCursor.value = result.nextCursor ?? null
      if (direction === 'next') {
        offerCursorHistory.value.push(cursor)
        offerPage.value += 1
      } else if (direction === 'previous') {
        offerPage.value = Math.max(1, offerPage.value - 1)
      } else {
        offerCursorHistory.value = []
        offerPage.value = 1
      }
    } finally {
      isLoading.value = false
    }
  }

  async function nextOfferPage() {
    if (offerNextCursor.value) await loadOfferPage(offerNextCursor.value, 'next')
  }

  async function previousOfferPage() {
    if (!offerCursorHistory.value.length) return
    offerCursorHistory.value.pop()
    await loadOfferPage(offerCursorHistory.value.at(-1), 'previous')
  }

  async function loadCompany(id: string) {
    if (getCompanyById(id)) return getCompanyById(id)
    const company = mapTenant(await tenantService.findOne(id))
    companies.value.push(company)
    return company
  }

  async function createCompany(input: CompanyInput) {
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
    const current = getCompanyById(id)
    if (!current) throw new Error("L’entreprise demandée n’est pas disponible.")

    const changes: Parameters<typeof tenantService.update>[1] = {}
    if (input.legalName !== current.legalName) changes.name = input.legalName
    if (input.country !== current.country) changes.country = input.country
    if (input.timezone !== current.timezone) changes.timezone = input.timezone
    if (!sameCalendarDate(input.contractFrom, current.contractFrom)) {
      changes.contractFrom = toIsoDate(input.contractFrom)
    }
    if (input.contractTo && !sameCalendarDate(input.contractTo, current.contractTo)) {
      changes.contractTo = toIsoDate(input.contractTo)
    }

    let tenant: TenantResponse | undefined
    if (Object.keys(changes).length > 0) {
      tenant = await tenantService.update(id, changes)
    }
    if (input.offerId && input.offerId !== current.offerId) {
      tenant = await tenantService.assignPlan(id, { offerId: input.offerId })
    }
    if (tenant) replaceCompany(mapTenant(tenant))
  }

  async function suspendCompany(id: string, reason: string) {
    const company = getCompanyById(id)
    if (!company || company.status !== 'active') {
      throw new Error("Seule une entreprise active peut être suspendue.")
    }
    replaceCompany(mapTenant(await tenantService.suspend(id, { reason })))
  }

  async function reactivateCompany(id: string) {
    replaceCompany(mapTenant(await tenantService.activate(id)))
  }

  /**
   * Premier administrateur d'une entreprise. Il choisit lui-même son mot de passe depuis le lien
   * reçu par courriel : aucun mot de passe n'est envoyé.
   */
  async function createCompanyAdministrator(id: string, input: EnterpriseUserInput) {
    const phone = input.phone.replace(/[\s().-]/g, '')

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new Error('Le téléphone doit inclure un indicatif pays, par exemple +225.')
    }

    const created = await tenantService.createUser(id, { names: fullName(input), email: input.email, phone, role: 'ADMIN' })
    invitedAdministrators.value = { ...invitedAdministrators.value, [id]: [created, ...(invitedAdministrators.value[id] ?? [])] }
    return created
  }

  async function resendAdministratorInvitation(id: string, userId: string) {
    await tenantService.resendInvitation(id, userId)
    invitedAdministrators.value = {
      ...invitedAdministrators.value,
      [id]: (invitedAdministrators.value[id] ?? []).map((user) => user.id === userId ? { ...user, invitationSent: true } : user),
    }
  }

  async function createOffer(input: OfferInput) {
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

  function resetData() {
    companies.value = mockMode ? structuredClone(mockCompanies) : []
    offers.value = mockMode ? structuredClone(mockOffers) : []
    activities.value = mockMode ? structuredClone(mockPlatformActivities) : []
    supportInterventions.value = mockMode ? structuredClone(mockSupportInterventions) : []
    invitedAdministrators.value = {}
    companyNextCursor.value = null
    offerNextCursor.value = null
    companyCursorHistory.value = []
    offerCursorHistory.value = []
    companyPage.value = 1
    offerPage.value = 1
    hasLoaded.value = false
  }

  return {
    companies, offers, activities, supportInterventions, isLoading, hasLoaded, canUpdateOffers,
    companyNextCursor, companyCursorHistory, companyPage, offerNextCursor, offerCursorHistory, offerPage,
    activeCompaniesCount, suspendedCompaniesCount, activeOffersCount, activeAgentsCount,
    getCompanyById, getOfferById, loadCatalog, loadCompany,
    nextCompanyPage, previousCompanyPage, nextOfferPage, previousOfferPage,
    createCompany, updateCompany, suspendCompany, reactivateCompany,
    createCompanyAdministrator, resendAdministratorInvitation, invitedAdministrators,
    createOffer, updateOffer, createSupportIntervention,
    resetData,
  }
})
