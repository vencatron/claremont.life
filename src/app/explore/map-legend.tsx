"use client";
import { useEffect, useState } from "react";

const CATEGORY_META: Record<string, { color: string; emoji: string; label: string }> = {
  college:    { color: "#3B82F6", emoji: "🎓", label: "College" },
  restaurant: { color: "#F97316", emoji: "🍽️", label: "Restaurant" },
  park:       { color: "#22C55E", emoji: "🌳", label: "Park" },
  retail:     { color: "#EAB308", emoji: "🛍️", label: "Retail" },
  landmark:   { color: "#EF4444", emoji: "📍", label: "Landmark" },
  cultural:   { color: "#A855F7", emoji: "🎭", label: "Cultural" },
  other:      { color: "#9CA3AF", emoji: "🏢", label: "Other" },
};

interface LegendState {
  count: number;
  categories: Record<string, number>;
}

export default function MapLegend() {
  const [data, setData] = useState<LegendState | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function onLoaded(e: Event) {
      const detail = (e as CustomEvent<LegendState>).detail;
      setData(detail);
      const initial: Record<string, boolean> = {};
      for (const cat of Object.keys(detail.categories)) {
        initial[cat] = true;
      }
      setVisible(initial);
    }
    window.addEventListener("overlay-buildings-loaded", onLoaded);
    return () => window.removeEventListener("overlay-buildings-loaded", onLoaded);
  }, []);

  function toggle(cat: string) {
    const next = !visible[cat];
    setVisible((v) => ({ ...v, [cat]: next }));
    window.dispatchEvent(
      new CustomEvent("toggle-category", { detail: { category: cat, visible: next } })
    );
  }

  if (!data) return null;

  const sortedCats = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);

  return (
    <div
      style={{ position: "absolute", top: 16, right: 16, zIndex: 200, minWidth: 180 }}
      className="text-white select-none"
    >
      <div className="bg-black/70 backdrop-blur rounded-xl overflow-hidden shadow-xl">
        {/* Header */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 transition-colors"
        >
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            🗺️ Map Legend
          </span>
          <span className="text-[10px] sm:text-xs text-white/60 ml-2">
            {data.count} buildings {collapsed ? "▾" : "▴"}
          </span>
        </button>

        {/* Body */}
        {!collapsed && (
          <div className="px-3 pb-2 space-y-1 border-t border-white/10">
            {sortedCats.map(([cat, count]) => {
              const meta = CATEGORY_META[cat] ?? { color: "#9CA3AF", emoji: "🏢", label: cat };
              const on = visible[cat] ?? true;
              return (
                <div key={cat} className="flex items-center gap-2 py-0.5">
                  {/* Colored dot */}
                  <span
                    style={{ background: meta.color }}
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                  />
                  {/* Label */}
                  <span className={`flex-1 text-[11px] sm:text-xs ${on ? "text-white" : "text-white/40"}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  {/* Count */}
                  <span className="text-[10px] sm:text-xs text-white/50 mr-1">{count}</span>
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(cat)}
                    className="text-white/60 hover:text-white transition-colors text-xs"
                    title={on ? "Hide" : "Show"}
                  >
                    {on ? "👁" : "🚫"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
