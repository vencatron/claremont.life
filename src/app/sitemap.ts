import type { MetadataRoute } from 'next'
import { getUpcomingEvents } from '@/lib/data'

export const revalidate = 3600

const BASE_URL = 'https://claremont.life'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: 'hourly' },
    { url: `${BASE_URL}/events`, priority: 0.9, changeFrequency: 'hourly' },
    { url: `${BASE_URL}/eat`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/deals`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/housing`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/locals`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/guides`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/guides/cheap-eats`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/guides/free-food`, priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE_URL}/guides/new-student-checklist`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/guides/getting-around`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/guides/parents-weekend`, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/new`, priority: 0.7, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/explore`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/events/submit`, priority: 0.4, changeFrequency: 'monthly' },
  ]

  // Upcoming-only: expired event URLs fall out automatically on revalidation.
  const events = await getUpcomingEvents(500)
  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    priority: 0.6,
    changeFrequency: 'daily',
  }))

  return [...staticEntries, ...eventEntries]
}
