export type CompanyStatus = 'active' | 'pending' | 'suspended'
export type OfferStatus = 'active' | 'inactive'

export interface Company {
  id: string
  legalName: string
  country: string
  timezone: string
  contactName: string
  contactEmail: string
  contactPhone: string
  administratorName: string
  administratorEmail: string
  offerId: string
  activeAgents: number
  status: CompanyStatus
  createdAt: string
  suspensionReason?: string
}

export type CompanyInput = Omit<
  Company,
  'id' | 'activeAgents' | 'status' | 'createdAt' | 'suspensionReason'
>

export interface Offer {
  id: string
  name: string
  description: string
  price: number
  maxActiveAgents: number
  companyCount: number
  status: OfferStatus
}

export type OfferInput = Omit<Offer, 'id' | 'companyCount'>

export interface PlatformActivity {
  id: string
  title: string
  description: string
  category: 'company' | 'offer' | 'support' | 'system'
  createdAt: string
}

export interface SupportIntervention {
  id: string
  subject: string
  companyName: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
}
