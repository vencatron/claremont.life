import type { Metadata } from 'next';
import VillageMap from './village-map';

export const metadata: Metadata = {
  title: 'Explore the Claremont Village — Interactive Map',
  description:
    'An interactive map of the Claremont Village: shops, restaurants, landmarks, and the walkable blocks next to the Claremont Colleges.',
};

export const revalidate = 3600;

export default async function ExplorePage() {
  return <VillageMap />;
}
