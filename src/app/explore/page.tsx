import VillageMap from './village-map';

export const revalidate = 3600;

export default async function ExplorePage() {
  return <VillageMap />;
}
