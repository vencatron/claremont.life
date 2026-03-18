import { PageHeader } from '@/components/PageHeader'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export default function MovePage() {
  return (
    <div>
      <PageHeader title="Getting Around" />
      <div className="px-4 md:px-6"><p className="text-gray-600 text-lg">Coming soon. We&apos;re building the definitive car-free guide to Claremont and beyond.</p></div>
      <div className="px-4 pb-8"><NewsletterSignup heading="Get notified when it's ready." /></div>
    </div>
  )
}
