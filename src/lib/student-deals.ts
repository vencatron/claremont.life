import type { Deal } from '../types'

export const STUDENT_DEAL_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'student-id', label: 'Student ID' },
  { id: 'verified-this-month', label: 'Verified this month' },
  { id: 'exclusive', label: 'Exclusive' },
  { id: 'all-5c', label: 'All 5C' },
  { id: 'under-15', label: 'Under $15' },
  { id: 'finals', label: 'Good for finals' },
  { id: 'birthday', label: 'Birthday' },
] as const

export type StudentDealFilterId = (typeof STUDENT_DEAL_FILTERS)[number]['id']
export type StudentDealBadgeId = Exclude<StudentDealFilterId, 'all'>

export interface StudentDealBadge {
  id: StudentDealBadgeId
  label: string
}

export interface InstagramLink {
  url: string
  label: string
}

export interface InferStudentDealOptions {
  now?: Date
}

export interface StudentDealMetadata {
  badges: StudentDealBadge[]
  badgeIds: StudentDealBadgeId[]
  verifiedThisMonth: boolean
  verificationLabel: string | null
  safeWebsiteUrl: string | null
  safeInstagramLink: InstagramLink | null
}

export interface StudentDealCardModel extends StudentDealMetadata {
  metadata: StudentDealMetadata
}

export interface StudentDealFilterOptions extends InferStudentDealOptions {
  studentFilter?: StudentDealFilterId
  category?: string
  search?: string
}

const BADGE_LABELS: Record<StudentDealBadgeId, string> = {
  'student-id': 'Student ID',
  'verified-this-month': 'Verified this month',
  exclusive: 'Exclusive',
  'all-5c': 'All 5C',
  'under-15': 'Under $15',
  finals: 'Good for finals',
  birthday: 'Birthday',
}

const BADGE_ORDER: StudentDealBadgeId[] = STUDENT_DEAL_FILTERS
  .map((filter) => filter.id)
  .filter((id): id is StudentDealBadgeId => id !== 'all')

function normalized(value: string | null | undefined): string {
  return (value ?? '')
    .toLocaleLowerCase('en-US')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dealText(deal: Deal): string {
  return [
    deal.name,
    deal.category,
    deal.deal_description,
    deal.address,
    deal.notes,
    deal.source,
    deal.expiration,
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join(' ')
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function parseDealDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function formatVerifiedDate(value: string | null | undefined): string | null {
  const date = parseDealDate(value)
  if (!date) return null
  return `Verified ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

export function isSafeDealUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function safeDealUrl(value: string | null | undefined): string | null {
  return isSafeDealUrl(value) ? value : null
}

function instagramHandleFromUrl(value: string): string | null {
  if (!isSafeDealUrl(value)) return null

  try {
    const url = new URL(value)
    const host = url.hostname.toLocaleLowerCase('en-US')
    if (host !== 'instagram.com' && host !== 'www.instagram.com') return null
    const handle = url.pathname.split('/').filter(Boolean)[0]
    return handle ?? null
  } catch {
    return null
  }
}

function normalizeInstagramHandle(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim()
  if (!raw) return null

  const fromUrl = raw.includes('://') ? instagramHandleFromUrl(raw) : raw.replace(/^@/, '').trim()
  if (!fromUrl) return null

  const handle = fromUrl.replace(/^@/, '').trim()
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null
  return handle
}

export function buildInstagramLink(value: string | null | undefined): InstagramLink | null {
  const handle = normalizeInstagramHandle(value)
  if (!handle) return null

  return {
    url: `https://instagram.com/${handle}`,
    label: `@${handle}`,
  }
}

function inferBadgeIds(deal: Deal, verifiedThisMonth: boolean): StudentDealBadgeId[] {
  const text = dealText(deal)
  const badges = new Set<StudentDealBadgeId>()

  if (deal.requires_student_id || hasAny(text, [/\bstudent id\b/i, /\bcollege id\b/i, /\bschool id\b/i])) {
    badges.add('student-id')
  }
  if (verifiedThisMonth) badges.add('verified-this-month')
  if (hasAny(text, [/\bclaremont\.life\b/i, /\bclaremontlife\b/i, /\bexclusive\b/i, /\bpromo code\b/i, /\bcode\s+[a-z0-9]+\b/i])) {
    badges.add('exclusive')
  }
  if (
    deal.requires_student_id ||
    hasAny(text, [/\ball\s*5c\b/i, /\b5c students?\b/i, /\ball claremont colleges\b/i, /\bclaremont colleges\b/i, /\bcollege id\b/i, /\bstudent id\b/i])
  ) {
    badges.add('all-5c')
  }
  if (hasAny(text, [/\bunder\s*\$?15\b/i, /\$\s?(?:[1-9]|1[0-5])\b/i, /\b(?:combo|meal|lunch|snack|drink)\s+(?:deal|special)?\s*(?:for|at)?\s*\$\s?(?:[1-9]|1[0-5])\b/i])) {
    badges.add('under-15')
  }
  if (hasAny(text, [/\bfinals?\b/i, /\bstudy\b/i, /\bcaffeine\b/i, /\bcoffee\b/i, /\bsnacks?\b/i, /\blate[ -]?night\b/i, /\bprinting?\b/i, /\bblue book\b/i])) {
    badges.add('finals')
  }
  if (hasAny(text, [/\bbirthdays?\b/i, /\bb-day\b/i, /\bfree\s+[^.]{0,40}\s+birthday\b/i])) {
    badges.add('birthday')
  }

  return BADGE_ORDER.filter((id) => badges.has(id))
}

export function inferStudentDealMetadata(deal: Deal, options: InferStudentDealOptions = {}): StudentDealMetadata {
  const { now = new Date() } = options
  const verifiedDate = parseDealDate(deal.last_verified)
  const verifiedThisMonth = verifiedDate ? sameCalendarMonth(verifiedDate, now) : false
  const badgeIds = inferBadgeIds(deal, verifiedThisMonth)
  const badges = badgeIds.map((id) => ({ id, label: BADGE_LABELS[id] }))

  return {
    badges,
    badgeIds,
    verifiedThisMonth,
    verificationLabel: formatVerifiedDate(deal.last_verified),
    safeWebsiteUrl: safeDealUrl(deal.website),
    safeInstagramLink: buildInstagramLink(deal.instagram),
  }
}

export function buildStudentDealCardModel(deal: Deal, options: InferStudentDealOptions = {}): StudentDealCardModel {
  const metadata = inferStudentDealMetadata(deal, options)

  return {
    metadata,
    ...metadata,
  }
}

export function matchesStudentDealSearch(deal: Deal, query: string | null | undefined, metadata = inferStudentDealMetadata(deal)): boolean {
  const needle = normalized(query)
  if (!needle) return true

  const text = [
    dealText(deal),
    metadata.badges.map((badge) => badge.label).join(' '),
    metadata.verificationLabel,
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join(' ')

  return text.includes(needle)
}

export function appliesStudentDealFilter(deal: Deal, filter: StudentDealFilterId, metadata = inferStudentDealMetadata(deal)): boolean {
  if (filter === 'all') return true
  return metadata.badgeIds.includes(filter)
}

export function filterStudentDeals(deals: Deal[], options: StudentDealFilterOptions = {}): Deal[] {
  const {
    studentFilter = 'all',
    category = 'All',
    search = '',
    now = new Date(),
  } = options

  return deals.filter((deal) => {
    const metadata = inferStudentDealMetadata(deal, { now })
    const categoryMatches = category === 'All' || deal.category === category
    return categoryMatches && appliesStudentDealFilter(deal, studentFilter, metadata) && matchesStudentDealSearch(deal, search, metadata)
  })
}
