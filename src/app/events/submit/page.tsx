import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/PageHeader'
import { EventSubmitForm } from './event-submit-form'

export const metadata = {
  title: 'Submit an event | claremont.life',
  description: 'Send a 5C event, free food tip, or social listing for review on claremont.life.',
}

export default function SubmitEventPage() {
  return (
    <div className="pb-10">
      <div className="px-4 pt-4 md:px-6">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
      </div>
      <PageHeader
        title="Submit an event"
        subtitle="Tell claremont.life about free food, social events, club meetings, talks, and 5C happenings."
      />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-[0.8fr_1.2fr] md:px-6">
        <aside className="space-y-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 md:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold text-gray-900">Reviewed before posting</h2>
              <p className="mt-1">
                Submissions are saved as pending/unverified and are not instantly public. The editorial review queue checks details before anything appears on the events page.
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">What helps</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Clear date/time and location.</li>
              <li>Who can attend — all 5Cs, one campus, students only, etc.</li>
              <li>Whether there is free food, cost, or an RSVP link.</li>
              <li>A real email so the listing can be verified if something looks unclear.</li>
            </ul>
          </div>
        </aside>

        <EventSubmitForm />
      </main>
    </div>
  )
}
