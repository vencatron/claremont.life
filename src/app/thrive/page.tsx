import { PageHeader } from '@/components/PageHeader'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export default function ThrivePage() {
  return (
    <div>
      <PageHeader title="Living Well" />
      <div className="px-4 md:px-6"><p className="text-gray-600 text-lg">Coming soon. Healthcare, grocery, fitness, and services with verified student rates.</p></div>
      <div className="px-4 pb-8"><NewsletterSignup /></div>
    </div>
  )
}
