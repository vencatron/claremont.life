import { getDeals } from '@/lib/data';
import VillageMap from './village-map';

export const revalidate = 3600;

export default async function ExplorePage() {
  const deals = await getDeals();
  return <VillageMap deals={deals} />;
}
