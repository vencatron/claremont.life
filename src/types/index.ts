export interface ClaremontEvent {
  id: string
  source: string
  source_id: string
  title: string
  description?: string | null
  url?: string | null
  starts_at: string
  ends_at?: string | null
  college?: string | null       // 'Pomona' | 'CMC' | 'Harvey Mudd' | 'Scripps' | 'Pitzer' | 'CGU' | 'KGI' | null
  event_type?: string | null
  location?: string | null
  address?: string | null
  image_url?: string | null
  is_active?: boolean
}

export interface Business {
  id: string
  name: string
  category: string
  deal_description: string
  address?: string
  website?: string
}

export interface Deal {
  id: string
  name: string
  category: string
  deal_description: string
  discount_pct: number | null
  address: string | null
  website: string | null
  instagram: string | null
  phone: string | null
  requires_student_id: boolean
  expiration: string | null
  source: string
  is_active: boolean
  notes: string | null
  last_verified: string
}

export interface EatPlace {
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  types: string[]
  primary_type: string
  rating: number | null
  rating_count: number | null
  price_level: number | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  hours: string[] | null
  editorial_summary: string | null
  business_status: string
}

export interface HousingListing {
  id: string
  source: string
  source_id: string
  listing_type: 'complex' | 'listing'
  name: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  bedrooms: number | null
  bathrooms: number | null
  price_min: number | null
  price_max: number | null
  sqft: number | null
  has_parking: boolean | null
  has_laundry: boolean | null
  has_ac: boolean | null
  pet_friendly: boolean | null
  furnished: boolean | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  listing_url: string | null
  photos: string[]
  description: string | null
  rating: number | null
  rating_count: number | null
  distance_to_campus_m: number | null
  walkability: 'walkable' | 'bikeable' | 'one-bus' | 'car-needed'
  available: boolean
  available_date: string | null
  last_scraped: string
}

export interface RedditPost {
  post_id: string
  subreddit: string
  title: string
  body: string | null
  url: string
  permalink: string
  author: string
  score: number
  num_comments: number
  flair: string | null
  created_utc: string
  is_self: boolean
  thumbnail: string | null
  link_url: string | null
}
