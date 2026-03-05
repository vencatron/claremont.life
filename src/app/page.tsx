import Link from 'next/link'
import { Calendar, UtensilsCrossed, Home, Tag } from 'lucide-react'
import { getUpcomingEvents } from '@/lib/data'
import { EventCard } from '@/components/EventCard'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export default async function HomePage() {
  const events = await getUpcomingEvents(3)

  return (
    <div>
      <section className="px-4 pt-12 pb-8">
        <h1 className="text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
          Your guide to life in Claremont.
        </h1>
        <p className="text-gray-600 mt-2 text-lg italic">Because living here should be as good as learning here.</p>
      </section>

      <section className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Events', href: '/events', icon: Calendar, color: 'bg-blue-50' },
            { label: 'Eat', href: '/eat', icon: UtensilsCrossed, color: 'bg-orange-50' },
            { label: 'Deals', href: '/deals', icon: Tag, color: 'bg-green-50' },
            { label: 'Housing', href: '/housing', icon: Home, color: 'bg-purple-50' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={`${item.color} rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] hover:opacity-80 transition-opacity`}>
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {events.length > 0 && (
        <section className="px-4 pb-6">
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>This Week</h2>
          <div className="space-y-3">{events.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>
      )}

      <section className="mx-4 mb-6">
        <Link href="/new" className="block bg-primary text-white rounded-xl p-5 text-center hover:bg-primary/90 transition-colors">
          <p className="font-semibold text-lg">New to Claremont?</p>
          <p className="text-sm opacity-90 mt-1">Start here →</p>
        </Link>
      </section>

      <section className="px-4 pb-8">
        <NewsletterSignup heading="Weekly. Free. Worth it." />
      </section>
    </div>
  )
}
