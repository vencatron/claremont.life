import { getRedditPosts } from '@/lib/data'
import { CommunityFeed } from './community-feed'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 1800 // 30 min

export default async function KnowPage() {
  const posts = await getRedditPosts(300)
  return (
    <div>
      <PageHeader title="Community" subtitle="What Claremont is talking about" />
      <CommunityFeed posts={posts} />
    </div>
  )
}
