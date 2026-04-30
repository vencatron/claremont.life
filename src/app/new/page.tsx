import type { Metadata } from 'next'
import { NewGuide } from './new-guide'

export const metadata: Metadata = {
  title: 'New Here? Incoming Student Guide | claremont.life',
  description: 'A shareable orientation guide for first-year, transfer, and grad students getting started in Claremont.',
}

export default function NewPage() {
  return (
    <div>
      <NewGuide />
    </div>
  )
}
