"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const VillageScene = dynamic(() => import("./village-scene-3dtiles"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center space-y-4">
        <div className="text-4xl">🏘️</div>
        <h1 className="text-2xl font-bold">Loading Claremont Village...</h1>
        <p className="text-white/50 text-sm">Preparing 3D Map…</p>
      </div>
    </div>
  ),
});

const MapLegend = dynamic(() => import("./map-legend"), { ssr: false });
const BuildingPopup = dynamic(() => import("./building-popup"), { ssr: false });

export default function ExplorePage() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <VillageScene />
      <MapLegend />
      <BuildingPopup />
    </div>
  );
}
