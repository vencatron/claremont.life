export const COLLEGES = [
  'All', 'Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI',
  'Community', 'Little League', 'Folk Music', 'Forum'
] as const
export type College = typeof COLLEGES[number]

export const COLLEGE_FILTERS = [
  'All', 'Pomona', 'CMC', 'Harvey Mudd',
  'Scripps', 'Pitzer', 'CGU', 'KGI',
] as const satisfies readonly College[]

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
  'claremont_edu_events': 'Community',
  'claremont_colleges_calendar': 'All',
  'claremont_colleges_all': 'All',
  'claremont_colleges_pomona': 'Pomona',
  'claremont_colleges_cmc': 'CMC',
  'claremont_colleges_harvey_mudd': 'Harvey Mudd',
  'claremont_colleges_scripps': 'Scripps',
  'claremont_colleges_pitzer': 'Pitzer',
  'claremont_colleges_cgu': 'CGU',
  'claremont_colleges_kgi': 'KGI',
  'pomona': 'Pomona',
  'pomona_calendar':  'Pomona',
  'cmc': 'CMC',
  'cmc-alumni': 'CMC',
  'cmc_calendar':     'CMC',
  'harvey-mudd': 'Harvey Mudd',
  'hmc_calendar':     'Harvey Mudd',
  'scripps': 'Scripps',
  'scripps_calendar': 'Scripps',
  'pitzer': 'Pitzer',
  'pitzer_calendar':  'Pitzer',
  'cgu': 'CGU',
  'cgu_calendar':     'CGU',
  'kgi': 'KGI',
  'city-of-claremont': 'Community',
  'claremont-chamber': 'Community',
  'claremont-forum': 'Forum',
  'claremont-little-league': 'Little League',
  'folk-music-center': 'Folk Music',
  'city_claremont':   'Community',
  'eventbrite':       'Community',
  'engage_claremont': 'Community',
}

export const NAV_ITEMS = [
  { label: 'Events',  href: '/events',  icon: 'Calendar' },
  { label: 'Eat',     href: '/eat',     icon: 'UtensilsCrossed' },
  { label: 'Live',    href: '/housing', icon: 'Home' },
  { label: 'Deals',   href: '/deals',   icon: 'Tag' },
  { label: 'More',    href: '/more',    icon: 'Grid3x3' },
] as const
