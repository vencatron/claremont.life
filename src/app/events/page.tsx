import { getUpcomingEvents } from '@/lib/data'
import { EventsFeed } from '@/components/EventsFeed'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function EventsPage() {
  const events = await getUpcomingEvents()
  return (
    <div>
      <PageHeader title="Events" subtitle="What's happening across the 7Cs" />
      <EventsFeed events={events} />
    </div>
  )
}
