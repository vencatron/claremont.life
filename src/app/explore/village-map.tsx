'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import villageData from './data/village-data.json';
import businessData from './data/business-enrichment.json';
import buildingMeta from './data/building-metadata.json';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PopupInfo {
  name: string;
  type: string;
  address: string;
  yearBuilt: number | null;
  description: string;
  use: string;
  color: string;
  height: number;
  hasPhoto: boolean;
}

interface HoverInfo {
  name: string;
  type: string;
  yearBuilt: number | null;
  use: string;
  x: number;
  y: number;
}

// ─── Coordinate conversion ─────────────────────────────────────────────────
const CENTER_LAT = 34.0965;
const CENTER_LNG = -117.7185;
const LAT_M = 110540;
const LNG_M = 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);

function localToLngLat(x: number, z: number): [number, number] {
  return [CENTER_LNG + x / LNG_M, CENTER_LAT + z / LAT_M];
}

// ─── Slug for texture lookup ────────────────────────────────────────────────
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Building metadata lookup ───────────────────────────────────────────────
const metaMap = buildingMeta.buildings as Record<string, { yearBuilt: number | null; description: string; use: string }>;

function getMeta(name: string) {
  return metaMap[name] || { yearBuilt: null, description: '', use: '' };
}

// ─── Building colour by type ───────────────────────────────────────────────
const TYPE_CATEGORIES: Record<string, { color: string; label: string; emoji: string }> = {
  restaurant: { color: '#F97316', label: 'Dining', emoji: '\uD83C\uDF7D\uFE0F' },
  cafe:       { color: '#F97316', label: 'Dining', emoji: '\u2615' },
  bar:        { color: '#F97316', label: 'Dining', emoji: '\uD83C\uDF7A' },
  bakery:     { color: '#F97316', label: 'Dining', emoji: '\uD83E\uDD50' },
  frozen_yogurt: { color: '#F97316', label: 'Dining', emoji: '\uD83C\uDF66' },
  brewery:    { color: '#F97316', label: 'Dining', emoji: '\uD83C\uDF7B' },
  shop:       { color: '#EAB308', label: 'Shopping', emoji: '\uD83D\uDECD\uFE0F' },
  grocery:    { color: '#EAB308', label: 'Shopping', emoji: '\uD83D\uDED2' },
  wine_shop:  { color: '#EAB308', label: 'Shopping', emoji: '\uD83C\uDF77' },
  music_store:{ color: '#EAB308', label: 'Shopping', emoji: '\uD83C\uDFB5' },
  real_estate:{ color: '#9CA3AF', label: 'Services', emoji: '\uD83C\uDFE0' },
  bookstore:  { color: '#EAB308', label: 'Shopping', emoji: '\uD83D\uDCDA' },
  retail:     { color: '#EAB308', label: 'Shopping', emoji: '\uD83D\uDECD\uFE0F' },
  pharmacy:   { color: '#EAB308', label: 'Shopping', emoji: '\uD83D\uDC8A' },
  theater:    { color: '#A855F7', label: 'Entertainment', emoji: '\uD83C\uDFAD' },
  cinema:     { color: '#A855F7', label: 'Entertainment', emoji: '\uD83C\uDFAC' },
  office:     { color: '#9CA3AF', label: 'Services', emoji: '\uD83C\uDFE2' },
  bank:       { color: '#9CA3AF', label: 'Finance', emoji: '\uD83C\uDFE6' },
  coworking:  { color: '#9CA3AF', label: 'Services', emoji: '\uD83D\uDCBB' },
  commercial: { color: '#6B7280', label: 'Commercial', emoji: '\uD83C\uDFE2' },
  hotel:      { color: '#60A5FA', label: 'Hospitality', emoji: '\uD83C\uDFE8' },
  museum:     { color: '#34D399', label: 'Culture', emoji: '\uD83C\uDFDB\uFE0F' },
  gallery:    { color: '#34D399', label: 'Culture', emoji: '\uD83C\uDFA8' },
  church:     { color: '#F472B6', label: 'Community', emoji: '\u26EA' },
  college:    { color: '#F472B6', label: 'Education', emoji: '\uD83C\uDF93' },
  fitness:    { color: '#10B981', label: 'Wellness', emoji: '\uD83E\uDDD8' },
  salon:      { color: '#9CA3AF', label: 'Services', emoji: '\u2702\uFE0F' },
  florist:    { color: '#34D399', label: 'Retail', emoji: '\uD83C\uDF3B' },
  dessert:    { color: '#F97316', label: 'Dining', emoji: '\uD83C\uDF68' },
  spa:        { color: '#10B981', label: 'Wellness', emoji: '\uD83D\uDC86' },
  service:    { color: '#9CA3AF', label: 'Services', emoji: '\uD83D\uDD27' },
  house:      { color: '#A78BFA', label: 'Residential', emoji: '\uD83C\uDFE0' },
  apartments: { color: '#A78BFA', label: 'Residential', emoji: '\uD83C\uDFE2' },
  residential:{ color: '#A78BFA', label: 'Residential', emoji: '\uD83C\uDFE0' },
};

function buildingColor(type: string): string {
  return TYPE_CATEGORIES[type]?.color || '#6B7280';
}

function typeInfo(type: string) {
  return TYPE_CATEGORIES[type] || { color: '#6B7280', label: 'Building', emoji: '\uD83C\uDFE2' };
}

// ─── Legend categories ──────────────────────────────────────────────────────
const LEGEND_ITEMS = [
  { color: '#F97316', label: 'Dining' },
  { color: '#EAB308', label: 'Shopping' },
  { color: '#A855F7', label: 'Entertainment' },
  { color: '#34D399', label: 'Culture' },
  { color: '#60A5FA', label: 'Hospitality' },
  { color: '#F472B6', label: 'Community' },
  { color: '#9CA3AF', label: 'Services' },
  { color: '#A78BFA', label: 'Residential' },
];

// ─── GeoJSON builders ──────────────────────────────────────────────────────
function buildBuildingGeoJSON() {
  const features = villageData.buildings
    .filter((b) => b.footprint && b.footprint.length >= 3)
    .map((b) => {
      const coords = b.footprint.map(([x, z]) => localToLngLat(x, z));
      const ring = coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
        ? coords
        : [...coords, coords[0]];

      const meta = getMeta(b.name);

      return {
        type: 'Feature' as const,
        id: b.id,
        properties: {
          id: b.id,
          name: b.name || 'Building',
          type: b.type || 'commercial',
          address: (b as { address?: string }).address || '',
          height: b.height || 6,
          color: buildingColor(b.type || 'commercial'),
          yearBuilt: meta.yearBuilt,
          description: meta.description,
          use: meta.use,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [ring],
        },
      };
    });

  return { type: 'FeatureCollection' as const, features };
}

function buildBusinessGeoJSON() {
  const features = businessData.businesses.map((biz, i) => {
    const [lng, lat] = localToLngLat(biz.x, biz.z);
    return {
      type: 'Feature' as const,
      id: i,
      properties: {
        name: biz.name,
        type: biz.type,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
    };
  });
  return { type: 'FeatureCollection' as const, features };
}


// ─── Free dark map style (no API key needed) ───────────────────────────────
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ─── Hover Tooltip Component ────────────────────────────────────────────────
function HoverTooltip({ info }: { info: HoverInfo | null }) {
  if (!info || info.name === 'Building') return null;
  const ti = typeInfo(info.type);

  return (
    <div
      style={{
        position: 'fixed',
        left: info.x + 16,
        top: info.y - 12,
        zIndex: 200,
        pointerEvents: 'none',
        transition: 'opacity 0.15s ease',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(10, 12, 18, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 10,
          padding: '8px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
          maxWidth: 260,
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
          {info.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ti.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
            {info.use || ti.label}
          </span>
          {info.yearBuilt && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                Est. {info.yearBuilt}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Building Detail Panel ──────────────────────────────────────────────────
function BuildingPanel({ info, onClose }: { info: PopupInfo; onClose: () => void }) {
  const ti = typeInfo(info.type);
  const slug = nameToSlug(info.name);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(380px, 85vw)',
        zIndex: 50,
        background: 'rgba(10, 12, 18, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease',
        overflowY: 'auto',
      }}
    >
      {/* Photo */}
      {info.hasPhoto && !imgError && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', flexShrink: 0 }}>
          <img
            src={`/explore/textures/buildings/${slug}.jpg`}
            alt={info.name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,12,18,0.95) 0%, transparent 50%)',
            }}
          />
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          zIndex: 10,
        }}
      >
        x
      </button>

      {/* Content */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        {/* Name */}
        <h2 style={{
          fontSize: 22,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginTop: info.hasPhoto && !imgError ? -40 : 20,
          position: 'relative',
          zIndex: 5,
        }}>
          {info.name}
        </h2>

        {/* Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: ti.color + '22',
              border: `1px solid ${ti.color}44`,
              color: ti.color,
            }}
          >
            {ti.emoji} {info.use || ti.label}
          </span>
          {info.yearBuilt && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Est. {info.yearBuilt}
            </span>
          )}
        </div>

        {/* Description */}
        {info.description && (
          <p style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 16,
          }}>
            {info.description}
          </p>
        )}

        {/* Details grid */}
        <div style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          {info.address && (
            <DetailItem label="Address" value={info.address} fullWidth />
          )}
          <DetailItem label="Building Type" value={info.type.replace(/_/g, ' ')} />
          <DetailItem label="Height" value={`~${Math.round(info.height * 3.28)}ft / ${info.height}m`} />
          {info.yearBuilt && (
            <DetailItem label="Age" value={`${new Date().getFullYear() - info.yearBuilt} years`} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' }}>
        {value}
      </div>
    </div>
  );
}

// ─── Legend Component ───────────────────────────────────────────────────────
function MapLegend({ visible }: { visible: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        right: 16,
        zIndex: 20,
        transition: 'opacity 0.5s',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(10,12,18,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: expanded ? '10px 10px 0 0' : 10,
          padding: '8px 14px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        <span style={{ fontSize: 14 }}>&#x25A0;</span> Legend {expanded ? '\u25B2' : '\u25BC'}
      </button>
      {expanded && (
        <div
          style={{
            background: 'rgba(10,12,18,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '8px 14px 12px',
          }}
        >
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: item.color, flexShrink: 0,
              }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function VillageMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const interactedRef = useRef(false);
  const highlightedIdRef = useRef<number | null>(null);

  const [hudVisible, setHudVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  // Fade HUD after 6s
  useEffect(() => {
    const t = setTimeout(() => setHudVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Add slide-in animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleBuildingClick = useCallback((props: {
    id: number; name: string; type: string; address: string;
    height: number; color: string; yearBuilt: number | null;
    description: string; use: string;
  }) => {
    if (!props.name || props.name === 'Building') return;

    const slug = nameToSlug(props.name);
    const hasPhoto = businessData.businesses.some(
      (b) => nameToSlug(b.name) === slug
    );

    setPopupInfo({
      name: props.name,
      type: props.type,
      address: props.address,
      yearBuilt: props.yearBuilt,
      description: props.description,
      use: props.use,
      color: props.color,
      height: props.height,
      hasPhoto,
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: import('maplibre-gl').Map;

    (async () => {
      const maplibregl = await import('maplibre-gl');

      map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: MAP_STYLE,
        center: [CENTER_LNG, CENTER_LAT],
        zoom: 16.8,
        pitch: 60,
        bearing: -15,
        minZoom: 15,
        maxZoom: 19,
      });

      mapRef.current = map;

      // Enable scroll zoom after first interaction
      map.scrollZoom.disable();
      const enableScroll = () => {
        if (!interactedRef.current) {
          interactedRef.current = true;
          map.scrollZoom.enable();
        }
      };
      map.on('click', enableScroll);
      map.on('drag', enableScroll);

      map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

      // ── Layers on load ──────────────────────────────────────────
      map.on('load', () => {
        // Custom village building overlays
        map.addSource('village-buildings', {
          type: 'geojson',
          data: buildBuildingGeoJSON() as GeoJSON.GeoJSON,
          promoteId: 'id',
        });

        // Main building layer
        map.addLayer({
          id: 'village-extrusions',
          type: 'fill-extrusion',
          source: 'village-buildings',
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#ffffff',
              ['get', 'color'],
            ],
            'fill-extrusion-height': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              ['*', ['get', 'height'], 1.08],
              ['get', 'height'],
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.82,
          },
        });

        // Business labels
        map.addSource('businesses', {
          type: 'geojson',
          data: buildBusinessGeoJSON() as GeoJSON.GeoJSON,
        });

        map.addLayer({
          id: 'business-labels',
          type: 'symbol',
          source: 'businesses',
          minzoom: 17,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 11,
            'text-offset': [0, -1.5],
            'text-anchor': 'bottom',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
          },
        });

        // ── Hover interaction (like OneMap 3D) ────────────────────
        map.on('mousemove', 'village-extrusions', (e) => {
          if (!e.features?.length) return;
          map.getCanvas().style.cursor = 'pointer';

          const feature = e.features[0];
          const featureId = feature.properties?.id;

          // Update feature state for highlighting
          if (highlightedIdRef.current !== null && highlightedIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'village-buildings', id: highlightedIdRef.current },
              { hover: false }
            );
          }
          if (featureId != null) {
            map.setFeatureState(
              { source: 'village-buildings', id: featureId as number },
              { hover: true }
            );
            highlightedIdRef.current = featureId as number;
          }

          const props = feature.properties as {
            name: string; type: string; yearBuilt: string; use: string;
          };

          setHoverInfo({
            name: props.name,
            type: props.type,
            yearBuilt: props.yearBuilt && props.yearBuilt !== 'null' ? Number(props.yearBuilt) : null,
            use: props.use,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        });

        map.on('mouseleave', 'village-extrusions', () => {
          map.getCanvas().style.cursor = '';
          if (highlightedIdRef.current !== null) {
            map.setFeatureState(
              { source: 'village-buildings', id: highlightedIdRef.current },
              { hover: false }
            );
            highlightedIdRef.current = null;
          }
          setHoverInfo(null);
        });

        // ── Click on buildings → detail panel ────────────────────
        map.on('click', 'village-extrusions', (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties as {
            id: number; name: string; type: string; address: string;
            height: string; color: string; yearBuilt: string;
            description: string; use: string;
          };
          handleBuildingClick({
            ...props,
            yearBuilt: props.yearBuilt && props.yearBuilt !== 'null' ? Number(props.yearBuilt) : null,
            height: Number(props.height),
            id: Number(props.id),
          });
        });
      });

      // Close popup when clicking map background
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['village-extrusions'],
        });
        if (!features.length) setPopupInfo(null);
      });

    })();

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      map?.remove();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [handleBuildingClick]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* Map canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Tilt-shift blur bands */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '15%',
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '15%',
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* HUD title */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 20,
          transition: 'opacity 1s',
          opacity: hudVisible ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'rgba(10,12,18,0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '12px 18px',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Claremont Village 3D
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {isMobile ? 'Tap buildings for details' : 'Hover for info \u00B7 Click for details'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <MapLegend visible={true} />

      {/* Hover tooltip */}
      <HoverTooltip info={hoverInfo} />

      {/* Building detail panel (slide-in from right, like OneMap) */}
      {popupInfo && (
        <BuildingPanel info={popupInfo} onClose={() => setPopupInfo(null)} />
      )}

      {/* Building count badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 20,
          background: 'rgba(10,12,18,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: 8,
          padding: '6px 12px',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.03em',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {villageData.buildings.length} BUILDINGS &middot; {businessData.businesses.length} BUSINESSES
      </div>

    </div>
  );
}
