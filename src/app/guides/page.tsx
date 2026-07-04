import type { Metadata } from 'next'
import Link from 'next/link'
import { Backpack, Bus, ChevronRight, UtensilsCrossed, Users } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Claremont Guides for Students, Parents & Visitors',
  description:
    'Practical, shareable guides to life in Claremont: cheap eats, what to bring to the Claremont Colleges, getting here without a car, and planning a family visit.',
}

const GUIDES = [
  {
    href: '/guides/cheap-eats',
    title: 'Cheap Eats',
    description: 'Budget meals, student deals, and the free-food radar — how to eat well in Claremont without delivery-app prices.',
    icon: UtensilsCrossed,
  },
  {
    href: '/guides/new-student-checklist',
    title: 'New Student Checklist',
    description: 'What to actually bring to the Claremont Colleges (and what to leave home), plus the first-week setup that matters.',
    icon: Backpack,
  },
  {
    href: '/guides/getting-around',
    title: 'Getting Around',
    description: 'Getting to Claremont from ONT or LAX, Metrolink, Foothill Transit, and living here comfortably without a car.',
    icon: Bus,
  },
  {
    href: '/guides/parents-weekend',
    title: 'Parents & Family Visits',
    description: 'Where to stay, how reservations work in the Village, and a simple day plan for visiting family.',
    icon: Users,
  },
]

export default function GuidesPage() {
  return (
    <div>
      <PageHeader
        title="Guides"
        subtitle="Shareable field guides to Claremont life — built to screenshot, text to the group chat, or hand to visiting family"
      />
      <div className="px-4 md:px-6 pb-8 space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {GUIDES.map((guide) => {
          const Icon = guide.icon
          return (
            <Link key={guide.href} href={guide.href} className="block">
              <Card className="p-4 shadow-sm rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow h-full">
                <div className="shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>{guide.title}</h3>
                  <p className="text-sm text-gray-500">{guide.description}</p>
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
