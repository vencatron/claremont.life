import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Bus, Heart, Newspaper, ChevronRight } from 'lucide-react'

const MORE_LINKS = [
  { href: '/move', title: 'Getting Around', description: 'Buses, trains, biking, and day trips — the car-free guide', icon: Bus },
  { href: '/thrive', title: 'Living Well', description: 'Healthcare, grocery, fitness, and services with student rates', icon: Heart },
  { href: '/know', title: 'Know Claremont', description: 'City news, local history, and the Claremont most students never find', icon: Newspaper },
]

export default function MorePage() {
  return (
    <div>
      <PageHeader title="More" />
      <div className="px-4 pb-4 space-y-3">
        {MORE_LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="p-4 shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
