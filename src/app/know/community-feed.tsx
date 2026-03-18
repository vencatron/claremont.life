'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, MessageCircle, ExternalLink, Clock } from 'lucide-react'
import type { RedditPost } from '@/types'

interface CommunityFeedProps {
  posts: RedditPost[]
}

const SUBREDDIT_META: Record<string, { label: string; color: string }> = {
  claremontcolleges: { label: '7Cs', color: 'bg-blue-100 text-blue-700' },
  ClaremontMcKenna: { label: 'CMC', color: 'bg-red-100 text-red-700' },
  pomonacollege: { label: 'Pomona', color: 'bg-blue-100 text-blue-800' },
  harveymudd: { label: 'Mudd', color: 'bg-yellow-100 text-yellow-800' },
  scrippscollege: { label: 'Scripps', color: 'bg-green-100 text-green-700' },
  pitzercollege: { label: 'Pitzer', color: 'bg-orange-100 text-orange-700' },
  Claremont: { label: 'Claremont', color: 'bg-purple-100 text-purple-700' },
  InlandEmpire: { label: 'IE', color: 'bg-gray-100 text-gray-700' },
  MovingToLosAngeles: { label: 'Moving to LA', color: 'bg-pink-100 text-pink-700' },
}

const FILTERS: { label: string; subs: string[] | null }[] = [
  { label: 'All', subs: null },
  { label: 'Colleges', subs: ['claremontcolleges', 'ClaremontMcKenna', 'pomonacollege', 'harveymudd', 'scrippscollege', 'pitzercollege'] },
  { label: 'City', subs: ['Claremont'] },
  { label: 'Regional', subs: ['InlandEmpire', 'MovingToLosAngeles'] },
]

const SORT_OPTIONS = [
  { label: 'New', fn: (a: RedditPost, b: RedditPost) => new Date(b.created_utc).getTime() - new Date(a.created_utc).getTime() },
  { label: 'Top', fn: (a: RedditPost, b: RedditPost) => b.score - a.score },
  { label: 'Hot', fn: (a: RedditPost, b: RedditPost) => {
    // Simple hot score: score / age^0.8
    const ageA = Math.max(1, (Date.now() - new Date(a.created_utc).getTime()) / 3600000)
    const ageB = Math.max(1, (Date.now() - new Date(b.created_utc).getTime()) / 3600000)
    return (b.score / Math.pow(ageB, 0.8)) - (a.score / Math.pow(ageA, 0.8))
  }},
] as const

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`
  return `${Math.floor(seconds / 2592000)}mo`
}

function truncateBody(text: string | null, maxLen: number = 200): string | null {
  if (!text) return null
  const clean = text.replace(/\n{2,}/g, '\n').trim()
  if (clean.length <= maxLen) return clean
  return clean.slice(0, maxLen).trim() + '…'
}

export function CommunityFeed({ posts }: CommunityFeedProps) {
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('New')
  const [search, setSearch] = useState('')
  const [showCount, setShowCount] = useState(30)

  const filtered = useMemo(() => {
    const filterConfig = FILTERS.find(f => f.label === filter) ?? FILTERS[0]
    const sortConfig = SORT_OPTIONS.find(s => s.label === sort) ?? SORT_OPTIONS[0]

    return posts
      .filter(p => {
        if (filterConfig.subs && !filterConfig.subs.includes(p.subreddit)) return false
        if (search) {
          const q = search.toLowerCase()
          return p.title.toLowerCase().includes(q) ||
            (p.body?.toLowerCase().includes(q) ?? false) ||
            p.subreddit.toLowerCase().includes(q)
        }
        return true
      })
      .sort(sortConfig.fn)
  }, [posts, filter, sort, search])

  const visible = filtered.slice(0, showCount)

  return (
    <div>
      {/* Search */}
      <div className="px-4 md:px-6 pt-3">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowCount(30) }}
          className="w-full md:max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto py-3 px-4 md:px-6 md:flex-wrap [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => { setFilter(f.label); setShowCount(30) }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.label
                ? 'bg-primary text-white'
                : 'border border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between px-4 md:px-6 pb-2">
        <p className="text-sm text-gray-500">{filtered.length} posts</p>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => setSort(s.label)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                sort === s.label
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 md:px-6 pb-4 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
        {visible.map((post) => {
          const meta = SUBREDDIT_META[post.subreddit] || { label: post.subreddit, color: 'bg-gray-100 text-gray-700' }
          const preview = truncateBody(post.body)

          return (
            <Card key={post.post_id} className="p-4 shadow-sm rounded-xl">
              {/* Header: sub badge + time */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Badge className={`text-[10px] font-semibold px-2 py-0.5 ${meta.color} border-0`}>
                  r/{post.subreddit}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {timeAgo(post.created_utc)}
                </span>
              </div>

              {/* Title */}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3
                  className="font-semibold text-[15px] leading-snug hover:underline"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {post.title}
                </h3>
              </a>

              {/* Flair */}
              {post.flair && (
                <Badge variant="outline" className="mt-1 text-[10px]">{post.flair}</Badge>
              )}

              {/* Body preview */}
              {preview && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{preview}</p>
              )}

              {/* External link for non-self posts */}
              {!post.is_self && post.link_url && post.link_url.startsWith('http') && (
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline truncate"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {(() => { try { return new URL(post.link_url).hostname } catch { return 'link' } })()}
                </a>
              )}

              {/* Footer: score + comments */}
              <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3.5 w-3.5" />
                  {post.score}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.num_comments}
                </span>
                <span className="text-gray-300">u/{post.author}</span>
              </div>
            </Card>
          )
        })}

        {visible.length < filtered.length && (
          <button
            onClick={() => setShowCount(s => s + 30)}
            className="w-full py-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors md:col-span-2 lg:col-span-3"
          >
            Load more ({filtered.length - visible.length} remaining)
          </button>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 md:col-span-2 lg:col-span-3">No posts found</p>
        )}
      </div>
    </div>
  )
}
