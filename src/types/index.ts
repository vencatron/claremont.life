export interface ClaremontEvent {
  id: string
  source: string
  source_id: string
  title: string
  description?: string
  url?: string
  start_date: string
  end_date?: string
  location?: string
  category?: string
  image_url?: string
  lat?: number
  lng?: number
}

export interface Business {
  id: string
  name: string
  category: string
  deal_description: string
  address?: string
  website?: string
}
