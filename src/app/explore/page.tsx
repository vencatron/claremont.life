'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const VillageScene = dynamic(() => import('./village-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center space-y-4">
        <div className="text-4xl">🏘️</div>
        <h1 className="text-2xl font-bold">Loading Claremont Village...</h1>
        <p className="text-white/50 text-sm">Preparing 3D environment</p>
      </div>
    </div>
  ),
});

// These components use browser APIs — load client-side only
const Minimap = dynamic(() => import('./minimap'), { ssr: false });
const BuildingInfo = dynamic(() => import('./building-info'), { ssr: false });

export default function ExplorePage() {
  useEffect(() => {
    // Lock body scroll for fullscreen 3D
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <VillageScene />
      <Minimap />
      <BuildingInfo />
    </div>
  );
}
