import Link from 'next/link'

import { getUpcomingEvents } from '@/lib/data'
import { EventsFeed } from '@/components/EventsFeed'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export const revalidate = 3600

export default async function EventsPage() {
  const events = await getUpcomingEvents()
  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <PageHeader title="Events" subtitle="What's happening across the 7Cs" />
        <div className="px-4 pb-2 md:px-6 md:pb-4">
          <Button asChild className="w-full rounded-full md:w-auto">
            <Link href="/events/submit">Submit an event</Link>
          </Button>
        </div>
      </div>
      <EventsFeed events={events} />
    </div>
  )
}
