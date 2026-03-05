export const COLLEGES = [
  'All', 'Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI'
] as const
export type College = typeof COLLEGES[number]

export const COLLEGE_COLORS: Record<College, string> = {
  'All':         'bg-gray-100 text-gray-800',
  'Pomona':      'bg-blue-100 text-blue-800',
  'CMC':         'bg-red-100 text-red-800',
  'Harvey Mudd': 'bg-orange-100 text-orange-800',
  'Scripps':     'bg-green-100 text-green-800',
  'Pitzer':      'bg-purple-100 text-purple-800',
  'CGU':         'bg-yellow-100 text-yellow-800',
  'KGI':         'bg-pink-100 text-pink-800',
}

export const NAV_ITEMS = [
  { label: 'Events',  href: '/events',  icon: 'Calendar' },
  { label: 'Eat',     href: '/eat',     icon: 'UtensilsCrossed' },
  { label: 'Live',    href: '/housing', icon: 'Home' },
  { label: 'Deals',   href: '/deals',   icon: 'Tag' },
  { label: 'More',    href: '/more',    icon: 'Grid3x3' },
] as const
