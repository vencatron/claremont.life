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
