import type { College } from '@/lib/constants'

export interface ClaremontEvent {
  id: string
  title: string
  description?: string
  college: College
  event_type?: string
  location?: string
  starts_at: string
  url?: string
}

export interface Business {
  id: string
  name: string
  category: string
  deal_description: string
  address?: string
  website?: string
}
