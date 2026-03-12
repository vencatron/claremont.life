"use client";
import { useEffect, useRef, useState } from "react";

interface BuildingDetail {
  name: string;
  category: string;
  color: string;
  categoryLabel: string;
  tags: Record<string, string>;
}

const CATEGORY_EMOJI: Record<string, string> = {
  college:    "🎓",
  restaurant: "🍽️",
  park:       "🌳",
  retail:     "🛍️",
  landmark:   "📍",
  cultural:   "🎭",
  other:      "🏢",
};

const USEFUL_TAGS = ["cuisine", "phone", "website", "opening_hours", "operator"] as const;

const TAG_LABEL: Record<string, string> = {
  cuisine:       "Cuisine",
  phone:         "Phone",
  website:       "Website",
  opening_hours: "Hours",
  operator:      "Operator",
};

export default function BuildingPopup() {
  const [building, setBuilding] = useState<BuildingDetail | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => setBuilding(null), 300);
  }

  useEffect(() => {
    function onClick(e: Event) {
      const detail = (e as CustomEvent<BuildingDetail>).detail;
      if (timerRef.current) clearTimeout(timerRef.current);
      setBuilding(detail);
      // Trigger fade-in on next tick
      requestAnimationFrame(() => setVisible(true));
      timerRef.current = setTimeout(dismiss, 5000);
    }
    window.addEventListener("building-overlay-click", onClick);
    return () => {
      window.removeEventListener("building-overlay-click", onClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Click-outside handler
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visible) return;
    function onOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        dismiss();
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [visible]);

  if (!building) return null;

  const emoji = CATEGORY_EMOJI[building.category] ?? "🏢";
  const usefulTags = USEFUL_TAGS.filter((t) => building.tags?.[t]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        zIndex: 300,
        width: "min(90vw, 400px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      } as React.CSSProperties}
    >
      <div
        ref={cardRef}
        className="bg-black/80 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/10"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-white font-bold text-base leading-snug flex-1">
            {building.name}
          </h2>
          <button
            onClick={dismiss}
            className="text-white/40 hover:text-white transition-colors text-lg leading-none mt-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Category badge */}
        <div className="mt-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: building.color + "33",
              borderColor: building.color + "66",
              color: building.color,
            }}
          >
            {emoji} {building.categoryLabel}
          </span>
        </div>

        {/* Tags */}
        {usefulTags.length > 0 && (
          <div className="mt-3 space-y-1">
            {usefulTags.map((tag) => {
              const val = building.tags[tag];
              const isUrl = tag === "website";
              return (
                <div key={tag} className="flex items-baseline gap-2 text-xs">
                  <span className="text-white/40 w-14 flex-shrink-0">{TAG_LABEL[tag]}</span>
                  {isUrl ? (
                    <a
                      href={val}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 truncate transition-colors"
                    >
                      {val.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  ) : (
                    <span className="text-white/80 truncate">{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
