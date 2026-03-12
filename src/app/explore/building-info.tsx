'use client';

import { useEffect, useRef, useState } from 'react';

interface BuildingInfo {
  name: string;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  commercial: 'Commercial',
  retail:     'Retail',
  hotel:      'Hotel',
  church:     'Church',
  college:    'College / University',
  apartments: 'Apartments',
  residential:'Residential',
  house:      'House',
};

export default function BuildingInfo() {
  const [info, setInfo]       = useState<BuildingInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { name, type } = (e as CustomEvent<BuildingInfo>).detail;
      if (!name) return; // ignore unnamed buildings

      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      setInfo({ name, type });
      setVisible(true);

      // Auto-dismiss after 3 s
      timerRef.current = setTimeout(() => setVisible(false), 3000);
    };

    window.addEventListener('building-click', handler);
    return () => {
      window.removeEventListener('building-click', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!info) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        zIndex: 300,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(-8px)',
      }}
    >
      <div
        style={{
          background: 'rgba(10, 12, 15, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '12px 20px',
          maxWidth: '300px',
          minWidth: '160px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            marginBottom: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {info.name}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'capitalize',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.04em',
          }}
        >
          {TYPE_LABELS[info.type] ?? info.type}
        </div>
      </div>
    </div>
  );
}
