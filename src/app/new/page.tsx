import type { Metadata } from 'next'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { NewGuide } from './new-guide'

export const metadata: Metadata = {
  title: 'New Here? Incoming Student Guide | claremont.life',
  description: 'A shareable orientation guide for first-year, transfer, and grad students getting started in Claremont.',
}

export default function NewPage() {
  return (
    <div>
      <NewGuide />
      <div className="px-4 pb-8 md:px-6">
        <NewsletterSignup heading="Keep the New Here guide current." />
      </div>
    </div>
  )
}
