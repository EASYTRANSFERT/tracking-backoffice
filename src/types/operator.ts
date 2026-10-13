export type CompanyStatus = 'active' | 'pending' | 'suspended'
export type OfferStatus = 'active' | 'inactive'

export interface Company {
  id: string
  legalName: string
  country: string
  timezone: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  administratorName?: string
  administratorEmail?: string
  offerId: string
  activeAgents: number
  status: CompanyStatus
  createdAt: string
  suspensionReason?: string
  contractFrom?: string
  contractTo?: string
}

export interface CompanyInput {
  legalName: string
  country: string
  timezone: string
  contractFrom: string
  contractTo?: string
  offerId: string
}

export interface Offer {
  id: string
  code: string
  name: string
  description: string
  price: number
  maxActiveAgents: number
  companyCount: number
  status: OfferStatus
}

export interface OfferInput {
  code: string
  name: string
  description: string
  maxActiveAgents: number
}

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
