import { PageHeader } from '@/components/PageHeader'
import { NewGuide } from './new-guide'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export default function NewPage() {
  return (
    <div>
      <PageHeader title="New to Claremont?" subtitle="Your cheat sheet for the first semester" />
      <NewGuide />
      <div className="px-4 pb-8"><NewsletterSignup heading="Stay in the loop." /></div>
    </div>
  )
}
