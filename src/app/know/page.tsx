import { PageHeader } from '@/components/PageHeader'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export default function KnowPage() {
  return (
    <div>
      <PageHeader title="Know Claremont" />
      <div className="px-4"><p className="text-gray-600 text-lg">Coming soon. City news, local history, and the Claremont most students never find.</p></div>
      <div className="px-4 pb-8"><NewsletterSignup /></div>
    </div>
  )
}
