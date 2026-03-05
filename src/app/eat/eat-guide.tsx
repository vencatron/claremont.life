'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock } from 'lucide-react'

const EAT_DATA = [
  { name: 'Zing! Cafe', type: 'Coffee', hours: 'Mon-Fri 7am-6pm', tip: 'Best study spot on Yale Ave. Bring your own mug for a discount.', address: '118 Yale Ave' },
  { name: 'Basecamp Coffee', type: 'Coffee', hours: 'Daily 6am-7pm', tip: '20% off with any 5C ID. Mountain views from the patio.', address: '239 Yale Ave' },
  { name: 'Rhino Records', type: 'Coffee', hours: 'Mon-Sat 10am-8pm', tip: 'Buy a record, get a free drip coffee. Local institution since 1973.', address: '134 Yale Ave' },
  { name: 'The Press', type: 'Food', hours: 'Daily 11am-10pm', tip: 'Student happy hour 3-5pm. Best burger in the Village.', address: 'Claremont Village' },
  { name: 'KazuNori', type: 'Food', hours: 'Daily 11:30am-9pm', tip: 'Hand-roll sushi. Fast, affordable, outstanding. No substitutions.', address: 'Claremont Village' },
  { name: 'The Cheese Cave', type: 'Food', hours: 'Tue-Sun 11am-6pm', tip: 'Best charcuterie for study group treats. Ask about student pricing.', address: 'Claremont Village' },
  { name: 'The Back Abbey', type: 'Bar', hours: 'Daily 11am-12am', tip: '21+. Best beer selection in the 909. Good for post-finals.', address: '412 Yale Ave' },
  { name: 'Viva Madrid', type: 'Bar', hours: 'Wed-Sun 5pm-2am', tip: 'Tapas and sangria. Good for group dinners off campus.', address: 'Claremont Village' },
]

const CATEGORIES = ['All', 'Coffee', 'Food', 'Bar'] as const

export function EatGuide() {
  const [filter, setFilter] = useState<string>('All')
  const filtered = filter === 'All' ? EAT_DATA : EAT_DATA.filter((item) => item.type === filter)

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto py-3 px-4 [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === cat ? 'bg-primary text-white' : 'border border-gray-300 text-gray-600 hover:border-gray-400'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="px-4 pb-4 space-y-3">
        {filtered.map((place) => (
          <Card key={place.name} className="p-4 shadow-sm rounded-xl">
            <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-playfair)' }}>{place.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">{place.type}</Badge>
            <p className="text-sm text-gray-700 mt-2">{place.tip}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{place.hours}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{place.address}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
