import { getRedditPosts } from '@/lib/data'
import { CommunityFeed } from './community-feed'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 1800 // 30 min

export default async function KnowPage() {
  const posts = await getRedditPosts(300)
  return (
    <div>
      <PageHeader
        title="Campus Pulse"
        subtitle="A quick read on what feels trending, urgent, weird, useful, or relevant across the 5Cs and Claremont."
      />
      <div className="px-4 md:px-6 pb-3">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-gray-700 md:max-w-3xl">
          Pulse gathers community signals without making any one source the whole story: Reddit conversations today,
          with lanes for future Student Life headlines, local notices, weather and air alerts, transit disruptions,
          and other student-city updates as coverage grows.
        </div>
      </div>
      <CommunityFeed posts={posts} />
    </div>
  )
}
