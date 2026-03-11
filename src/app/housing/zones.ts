export interface Zone {
  id: string
  name: string
  color: string
  colorHex: string
  center: { lat: number; lng: number }
  polygon: Array<{ lat: number; lng: number }>
  vibe: string
  insight: string
  rent: {
    studio: string
    oneBR: string
    twoBR?: string
  }
  streetViews: Array<{
    lat: number
    lng: number
    heading: number
    label: string
  }>
  tips: string[]
}

export const zones: Zone[] = [
  {
    id: 'college-ave',
    name: 'College Ave Corridor',
    color: 'green',
    colorHex: '#22c55e',
    center: { lat: 34.104, lng: -117.710 },
    polygon: [
      { lat: 34.112, lng: -117.716 },
      { lat: 34.112, lng: -117.705 },
      { lat: 34.097, lng: -117.705 },
      { lat: 34.097, lng: -117.716 },
    ],
    vibe: 'Walking distance to all 5Cs. Most popular. Goes fast in spring.',
    insight: "The gold standard — you'll pay more but never need a car. Most 5C students live here.",
    rent: {
      studio: '$1,400–$1,800/mo',
      oneBR: '$1,700–$2,200/mo',
      twoBR: '$1,100–$1,400/person',
    },
    streetViews: [
      { lat: 34.105, lng: -117.710, heading: 180, label: 'College Ave heading south' },
      { lat: 34.103, lng: -117.712, heading: 90, label: 'Side streets near campus' },
    ],
    tips: [
      'These units go fast — start looking in January for a fall move-in.',
      'Walk the actual distance to your classes before signing. Some blocks feel much farther.',
      'Street parking near the colleges is a nightmare — make sure your unit has a spot.',
    ],
  },
  {
    id: 'village',
    name: 'The Village & Claremont Heights',
    color: 'blue',
    colorHex: '#3b82f6',
    center: { lat: 34.096, lng: -117.720 },
    polygon: [
      { lat: 34.102, lng: -117.728 },
      { lat: 34.102, lng: -117.715 },
      { lat: 34.088, lng: -117.715 },
      { lat: 34.088, lng: -117.728 },
    ],
    vibe: 'Near shops, restaurants, Metrolink. Slightly older buildings. Walkable.',
    insight: 'Best of both worlds — village dining and nightlife at your door, campus a 10-min walk.',
    rent: {
      studio: '$1,300–$1,700/mo',
      oneBR: '$1,600–$2,100/mo',
    },
    streetViews: [
      { lat: 34.096, lng: -117.720, heading: 270, label: '1st St near The Village' },
      { lat: 34.098, lng: -117.719, heading: 0, label: 'Yale Ave residential stretch' },
    ],
    tips: [
      'Weekend parking near The Village gets tricky — visit before signing.',
      'Metrolink station is walkable — great for LA day trips on weekends.',
      'Older buildings have more character but always ask about central AC.',
    ],
  },
  {
    id: 'indian-hill',
    name: 'Indian Hill Blvd Corridor',
    color: 'orange',
    colorHex: '#f97316',
    center: { lat: 34.088, lng: -117.718 },
    polygon: [
      { lat: 34.096, lng: -117.727 },
      { lat: 34.096, lng: -117.710 },
      { lat: 34.080, lng: -117.710 },
      { lat: 34.080, lng: -117.727 },
    ],
    vibe: 'Quieter, more space, 10-min bike ride to campus. Better value.',
    insight: 'Bigger units, quieter streets, and your wallet will thank you. Bike path to campus is flat and easy.',
    rent: {
      studio: '$1,200–$1,500/mo',
      oneBR: '$1,500–$1,900/mo',
    },
    streetViews: [
      { lat: 34.088, lng: -117.718, heading: 0, label: 'Indian Hill residential stretch' },
      { lat: 34.085, lng: -117.715, heading: 90, label: 'Quiet side streets south of Foothill' },
    ],
    tips: [
      'Bike path to campus is flat — a decent e-bike covers it in under 10 minutes.',
      'Bigger units are common here. Check the laundry situation before signing.',
      'If the unit faces Indian Hill Blvd itself, visit during rush hour — it gets busy.',
    ],
  },
  {
    id: 'padua-hills',
    name: 'North Claremont / Padua Hills',
    color: 'purple',
    colorHex: '#8b5cf6',
    center: { lat: 34.115, lng: -117.710 },
    polygon: [
      { lat: 34.130, lng: -117.723 },
      { lat: 34.130, lng: -117.700 },
      { lat: 34.110, lng: -117.700 },
      { lat: 34.110, lng: -117.723 },
    ],
    vibe: 'Up the hill. You need a car or a very good bike. Cheapest rents.',
    insight: "Mountain views and the cheapest rent in Claremont. Trade: you're driving everywhere.",
    rent: {
      studio: '$1,000–$1,400/mo',
      oneBR: '$1,300–$1,700/mo',
    },
    streetViews: [
      { lat: 34.118, lng: -117.708, heading: 45, label: 'North Claremont with mountain views' },
      { lat: 34.115, lng: -117.712, heading: 180, label: 'Padua Hills neighborhood' },
    ],
    tips: [
      'A car is not optional here — factor in gas, insurance, and campus parking costs.',
      'Views of Mt. Baldy can be stunning. Visit at golden hour before deciding.',
      'Quieter and more suburban. Great if you prefer calm over convenience.',
    ],
  },
]

export const beforeYouSignTips = [
  'Check if the unit has AC. The Inland Empire gets 100°F+ in summer. Non-negotiable.',
  'Ask for month-to-month after the initial lease. Many landlords agree if you ask.',
  'Street parking near the colleges is a nightmare. No dedicated spot? Factor that in.',
  'Laundry in-unit vs. shared matters more than you think. Ask before signing.',
  'If the unit faces Foothill Blvd, visit at night first. Traffic noise is real.',
  'Summer sublets are everywhere — check 5C Facebook housing groups starting in March.',
]

export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false
  const x = point.lng
  const y = point.lat
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
