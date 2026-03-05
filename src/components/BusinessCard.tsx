import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@/types'
import { MapPin } from 'lucide-react'

interface BusinessCardProps {
  business: Business
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Card className="p-4 shadow-sm rounded-xl">
      <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-playfair)' }}>
        {business.name}
      </h3>
      <Badge variant="secondary" className="mt-1 text-xs">{business.category}</Badge>
      <p className="text-sm text-gray-700 mt-2">{business.deal_description}</p>
      {business.address && (
        <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="h-3.5 w-3.5" />{business.address}
        </p>
      )}
    </Card>
  )
}
