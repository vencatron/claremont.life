import { supabase } from './supabase'
import type { ClaremontEvent, Business, Deal, EatPlace, HousingListing, RedditPost } from '@/types'

export async function getUpcomingEvents(limit = 50): Promise<ClaremontEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)
  if (error) { console.error('getUpcomingEvents:', error); return [] }
  return data ?? []
}

export async function getBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .order('category')
  if (error) { console.error('getBusinesses:', error); return [] }
  return data ?? []
}

export async function getEatPlaces(): Promise<EatPlace[]> {
  const { data, error } = await supabase
    .from('eat_places')
    .select('*')
    .eq('business_status', 'OPERATIONAL')
    .order('rating', { ascending: false, nullsFirst: false })
  if (error) { console.error('getEatPlaces:', error); return [] }
  return data ?? []
}

export async function getRedditPosts(limit = 200): Promise<RedditPost[]> {
  const { data, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .order('created_utc', { ascending: false })
    .limit(limit)
  if (error) { console.error('getRedditPosts:', error); return [] }
  return data ?? []
}

export async function getDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('is_active', true)
    .order('category')
  if (error) { console.error('getDeals:', error); return [] }
  return data ?? []
}

export async function getHousingListings(filters?: {
  walkability?: string[]
  maxPrice?: number
  minBedrooms?: number
}): Promise<HousingListing[]> {
  let query = supabase
    .from('housing')
    .select('*')
    .eq('available', true)
    .order('distance_to_campus_m', { ascending: true, nullsFirst: false })

  if (filters?.walkability?.length) {
    query = query.in('walkability', filters.walkability)
  }
  if (filters?.maxPrice) {
    query = query.lte('price_min', filters.maxPrice)
  }
  if (filters?.minBedrooms !== undefined) {
    query = query.gte('bedrooms', filters.minBedrooms)
  }

  const { data, error } = await query
  if (error) { console.error('getHousingListings:', error); return [] }
  return data ?? []
}

export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: email.toLowerCase().trim() })
  if (error) {
    if (error.code === '23505') return { success: false, message: 'Already subscribed.' }
    return { success: false, message: 'Something went wrong. Try again.' }
  }
  return { success: true, message: "You're in. See you Tuesday." }
}
