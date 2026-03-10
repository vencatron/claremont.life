export const COLLEGES = [
  'All', 'Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI',
  'Community', 'Little League', 'Folk Music', 'Forum'
] as const
export type College = typeof COLLEGES[number]

export const COLLEGE_COLORS: Record<College, string> = {
  'All':           'bg-gray-100 text-gray-800',
  'Pomona':        'bg-blue-100 text-blue-800',
  'CMC':           'bg-red-100 text-red-800',
  'Harvey Mudd':   'bg-orange-100 text-orange-800',
  'Scripps':       'bg-green-100 text-green-800',
  'Pitzer':        'bg-purple-100 text-purple-800',
  'CGU':           'bg-yellow-100 text-yellow-800',
  'KGI':           'bg-pink-100 text-pink-800',
  'Community':     'bg-teal-100 text-teal-800',
  'Little League': 'bg-lime-100 text-lime-800',
  'Folk Music':    'bg-amber-100 text-amber-800',
  'Forum':         'bg-cyan-100 text-cyan-800',
}

export const SOURCE_TO_COLLEGE: Record<string, College> = {
  'pomona': 'Pomona',
  'cmc': 'CMC',
  'harvey-mudd': 'Harvey Mudd',
  'scripps': 'Scripps',
  'pitzer': 'Pitzer',
  'cgu': 'CGU',
  'city-of-claremont': 'Community',
  'claremont-chamber': 'Community',
  'folk-music-center': 'Folk Music',
  'claremont-forum': 'Forum',
  'claremont-little-league': 'Little League',
  'eventbrite': 'Community',
}

export const NAV_ITEMS = [
  { label: 'Events',  href: '/events',  icon: 'Calendar' },
  { label: 'Eat',     href: '/eat',     icon: 'UtensilsCrossed' },
  { label: 'Live',    href: '/housing', icon: 'Home' },
  { label: 'Deals',   href: '/deals',   icon: 'Tag' },
  { label: 'More',    href: '/more',    icon: 'Grid3x3' },
] as const
