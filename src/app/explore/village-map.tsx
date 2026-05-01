'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import villageData from './data/village-data.json';
import businessData from './data/business-enrichment.json';
import buildingMeta from './data/building-metadata.json';
import type { Deal } from '@/types';

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

interface MatchedDeal extends Deal {
  lngLat: [number, number];
  businessName: string;
}

interface DealPopupInfo {
  deal: MatchedDeal;
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

// ─── Name normalization for fuzzy matching ──────────────────────────────────
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize address for comparison: lowercase, strip directional prefixes, etc.
function normalizeAddr(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+(n|s|e|w|north|south|east|west)\s+/g, ' ')
    .replace(/^(n|s|e|w|north|south|east|west)\s+/g, '')
    .replace(/(street|st|avenue|ave|boulevard|blvd|drive|dr|road|rd)/g, '')
    .replace(/suite\s*\S+/g, '')
    .replace(/#\s*\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract the street number(s) from an address string
function extractNumbers(addr: string): string[] {
  const m = addr.match(/\d+/g);
  return m || [];
}

function matchDealToBusiness(deal: Deal, businesses: typeof businessData.businesses): typeof businessData.businesses[0] | null {
  const dealNorm = normalize(deal.name);

  // 1. Exact normalized name match
  for (const biz of businesses) {
    if (normalize(biz.name) === dealNorm) return biz;
  }

  // 2. Substring name match (deal contains biz name or vice versa)
  for (const biz of businesses) {
    const bizNorm = normalize(biz.name);
    if (dealNorm.includes(bizNorm) || bizNorm.includes(dealNorm)) return biz;
  }

  // 3. Singularization match (e.g., "Collections" vs "Collection")
  const dealSingular = dealNorm.replace(/s\b/g, '');
  for (const biz of businesses) {
    const bizSingular = normalize(biz.name).replace(/s\b/g, '');
    if (dealSingular.includes(bizSingular) || bizSingular.includes(dealSingular)) return biz;
  }

  // 4. Word overlap match — require majority of significant words to match
  //    (avoids false positives like "Claremont Village Eatery" → "Claremont Village Salon")
  const dealWords = dealNorm.split(' ').filter(w => w.length > 2);
  if (dealWords.length > 0) {
    let bestBiz: typeof businesses[0] | null = null;
    let bestScore = 0;
    for (const biz of businesses) {
      const bizWords = normalize(biz.name).split(' ').filter(w => w.length > 2);
      const overlap = dealWords.filter(w => bizWords.includes(w));
      // Require at least 2 matching words AND > 50% of both name's words
      const dealRatio = overlap.length / dealWords.length;
      const bizRatio = bizWords.length > 0 ? overlap.length / bizWords.length : 0;
      if (overlap.length >= 2 && dealRatio > 0.7 && bizRatio > 0.7) {
        const score = overlap.length + dealRatio + bizRatio;
        if (score > bestScore) {
          bestScore = score;
          bestBiz = biz;
        }
      }
    }
    if (bestBiz) return bestBiz;
  }

  return null;
}

// ─── Address-based coordinate fallback ──────────────────────────────────────
// For deals with no business name match, find the closest building by address
function findCoordsByAddress(dealAddress: string | null): [number, number] | null {
  if (!dealAddress) return null;

  const dealNums = extractNumbers(dealAddress);
  const dealAddrNorm = normalizeAddr(dealAddress);
  if (!dealNums.length) return null;

  // Find building whose address contains the same street number(s)
  for (const bldg of villageData.buildings) {
    if (!bldg.address || bldg.address.length < 3) continue;
    const bldgAddrNorm = normalizeAddr(bldg.address);
    const bldgNums = extractNumbers(bldg.address);

    // Check if any deal street number appears in the building address numbers
    const numMatch = dealNums.some(n => bldgNums.includes(n));
    if (!numMatch) continue;

    // Check street name overlap (at least one key word in common)
    const dealStreetWords = dealAddrNorm.split(' ').filter(w => w.length > 2 && !/^\d+$/.test(w));
    const bldgStreetWords = bldgAddrNorm.split(' ').filter(w => w.length > 2 && !/^\d+$/.test(w));
    const streetMatch = dealStreetWords.some(w => bldgStreetWords.includes(w));

    if (streetMatch && bldg.footprint && bldg.footprint.length >= 3) {
      // Return centroid of the building footprint
      const cx = bldg.footprint.reduce((s, p) => s + p[0], 0) / bldg.footprint.length;
      const cz = bldg.footprint.reduce((s, p) => s + p[1], 0) / bldg.footprint.length;
      return localToLngLat(cx, cz);
    }
  }

  return null;
}

// ─── Known approximate placements for deals on known streets ────────────────
// Fallback for deals that match neither business names nor building addresses
const STREET_COORDS: Record<string, [number, number]> = {
  'indian hill': localToLngLat(-99, -51),
  'yale':        localToLngLat(30, -120),
  'harvard':     localToLngLat(170, -130),
  '1st':         localToLngLat(3, -183),
  'first':       localToLngLat(3, -183),
  '2nd':         localToLngLat(109, -108),
  'second':      localToLngLat(109, -108),
  'bonita':      localToLngLat(-10, 30),
  'village':     localToLngLat(30, -130),
};

function estimateCoordsFromStreet(address: string | null): [number, number] | null {
  if (!address) return null;
  const addrLower = address.toLowerCase();
  for (const [street, coords] of Object.entries(STREET_COORDS)) {
    if (addrLower.includes(street)) return coords;
  }
  return null;
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
  { color: '#F472B6', label: 'Education' },
  { color: '#9CA3AF', label: 'Services' },
  { color: '#A78BFA', label: 'Residential' },
];

// ─── Deal category colors ───────────────────────────────────────────────────
const DEAL_CATEGORY_META: Record<string, { color: string; icon: string }> = {
  'Shopping':          { color: '#EAB308', icon: '\uD83D\uDECD\uFE0F' },
  'Food & Drink':      { color: '#F97316', icon: '\uD83C\uDF7D\uFE0F' },
  'Beauty & Wellness': { color: '#10B981', icon: '\u2728' },
  'Arts & Culture':    { color: '#A855F7', icon: '\uD83C\uDFA8' },
};

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

function buildDealsGeoJSON(matchedDeals: MatchedDeal[]) {
  const features = matchedDeals.map((deal, i) => ({
    type: 'Feature' as const,
    id: i,
    properties: {
      name: deal.name,
      businessName: deal.businessName,
      category: deal.category,
      discount: deal.discount_pct || 0,
      description: deal.deal_description,
      requiresId: deal.requires_student_id,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: deal.lngLat,
    },
  }));
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
function BuildingPanel({
  info,
  deal,
  onClose,
}: {
  info: PopupInfo;
  deal: MatchedDeal | null;
  onClose: () => void;
}) {
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

        {/* Deal badge — shown when this building has a student deal */}
        {deal && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>
                Student Deal
              </span>
              {deal.discount_pct && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#22C55E',
                    color: '#000',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {deal.discount_pct}% OFF
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.5 }}>
              {deal.deal_description}
            </p>
            {deal.requires_student_id && (
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                Requires student ID
              </span>
            )}
          </div>
        )}

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

        {/* Yelp + Google Maps buttons — only for village businesses, not campus */}
        {!['college'].includes(info.type) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <a
              href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(info.name)}&find_loc=Claremont%2C+CA`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(210,40,40,0.15)',
                border: '1px solid rgba(210,40,40,0.35)',
                color: '#FF3B30',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              ⭐ Yelp Reviews
            </a>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(info.name + ' Claremont CA')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(66,133,244,0.12)',
                border: '1px solid rgba(66,133,244,0.3)',
                color: '#4285F4',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              📍 Google Maps
            </a>
          </div>
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

// ─── Deal Popup Tile ────────────────────────────────────────────────────────
function DealPopupTile({
  info,
  onClose,
}: {
  info: DealPopupInfo;
  onClose: () => void;
}) {
  const { deal, x, y } = info;
  const catMeta = DEAL_CATEGORY_META[deal.category] || { color: '#9CA3AF', icon: '\uD83C\uDFF7\uFE0F' };

  // Position tile above the dot, clamped to viewport
  const tileW = 300;
  const tileH = 220; // approximate
  const pad = 16;
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 800;
  const left = Math.max(pad, Math.min(x - tileW / 2, vpW - tileW - pad));
  const top = Math.max(pad, y - tileH - 24);
  // Arrow tracks the marker's x position relative to tile
  const arrowLeft = Math.max(20, Math.min(x - left, tileW - 20));

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        width: tileW,
        zIndex: 60,
        background: 'rgba(10, 12, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: '1px solid rgba(34,197,94,0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.15)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        animation: 'dealTileIn 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Green accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #22C55E, #10B981)' }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, margin: 0, letterSpacing: '-0.01em' }}>
              {deal.businessName}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 6,
                background: catMeta.color + '22',
                color: catMeta.color,
                fontWeight: 600,
              }}
            >
              {catMeta.icon} {deal.category}
            </span>
          </div>
          {/* Discount badge */}
          {deal.discount_pct ? (
            <div
              style={{
                flexShrink: 0,
                padding: '6px 10px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#000',
                fontSize: 15,
                fontWeight: 900,
                lineHeight: 1,
                textAlign: 'center',
              }}
            >
              {deal.discount_pct}%
              <div style={{ fontSize: 8, fontWeight: 700, marginTop: 1 }}>OFF</div>
            </div>
          ) : (
            <div
              style={{
                flexShrink: 0,
                padding: '6px 10px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: '#000',
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              DEAL
            </div>
          )}
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              marginTop: -2,
            }}
          >
            x
          </button>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.7)',
          margin: '10px 0 0',
        }}>
          {deal.deal_description}
        </p>

        {/* Footer: requirements + links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {deal.requires_student_id && (
              <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(234,179,8,0.15)',
                color: '#EAB308',
                fontWeight: 600,
              }}>
                ID Required
              </span>
            )}
            {deal.expiration && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                Exp: {deal.expiration}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {deal.website && (
              <a
                href={deal.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Website
              </a>
            )}
            {deal.instagram && (
              <a
                href={deal.instagram.startsWith('http') ? deal.instagram : `https://instagram.com/${deal.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Arrow pointer */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          left: arrowLeft,
          transform: 'translateX(-50%) rotate(45deg)',
          width: 14,
          height: 14,
          background: 'rgba(10, 12, 18, 0.95)',
          borderRight: '1px solid rgba(34,197,94,0.35)',
          borderBottom: '1px solid rgba(34,197,94,0.35)',
        }}
      />
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
          {/* Deals indicator in legend */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 6, paddingTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#22C55E', flexShrink: 0,
                boxShadow: '0 0 6px #22C55E88',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Student Deals</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deals Overlay Component ────────────────────────────────────────────────
function DealsOverlay({
  deals,
  dealsVisible,
  onToggleDeals,
  onFlyToDeal,
}: {
  deals: MatchedDeal[];
  dealsVisible: boolean;
  onToggleDeals: () => void;
  onFlyToDeal: (deal: MatchedDeal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('All');

  const categories = useMemo(() => {
    const cats = new Set(deals.map(d => d.category));
    return ['All', ...Array.from(cats).sort()];
  }, [deals]);

  const filtered = useMemo(() => {
    if (filter === 'All') return deals;
    return deals.filter(d => d.category === filter);
  }, [deals, filter]);

  if (deals.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: 16,
        zIndex: 30,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: 'min(360px, calc(100vw - 32px))',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(10,12,18,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: expanded ? '12px 12px 0 0' : 12,
          padding: '10px 16px',
          color: 'white',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dealsVisible ? '#22C55E' : '#6B7280',
            boxShadow: dealsVisible ? '0 0 8px #22C55E88' : 'none',
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, textAlign: 'left' }}>
          Student Deals
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>
          {deals.length} on map
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {expanded ? '\u25BC' : '\u25B2'}
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          style={{
            background: 'rgba(10,12,18,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            maxHeight: 'min(400px, 50vh)',
            overflowY: 'auto',
          }}
        >
          {/* Controls row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
          }}>
            {/* Visibility toggle */}
            <button
              onClick={onToggleDeals}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: dealsVisible ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                color: dealsVisible ? '#22C55E' : 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {dealsVisible ? 'Hide markers' : 'Show markers'}
            </button>
            {/* Category pills */}
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: filter === cat ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)',
                  color: filter === cat ? '#22C55E' : 'rgba(255,255,255,0.5)',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Deal cards */}
          <div style={{ padding: '6px 8px' }}>
            {filtered.map((deal) => {
              const catMeta = DEAL_CATEGORY_META[deal.category] || { color: '#9CA3AF', icon: '\uD83C\uDFF7\uFE0F' };
              return (
                <button
                  key={deal.id}
                  onClick={() => onFlyToDeal(deal)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 6,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    color: 'white',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                      {deal.name}
                    </span>
                    {deal.discount_pct && (
                      <span
                        style={{
                          flexShrink: 0,
                          padding: '2px 7px',
                          borderRadius: 8,
                          background: '#22C55E',
                          color: '#000',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {deal.discount_pct}%
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.4 }}>
                    {deal.deal_description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: catMeta.color + '22',
                        color: catMeta.color,
                        fontWeight: 600,
                      }}
                    >
                      {catMeta.icon} {deal.category}
                    </span>
                    {deal.requires_student_id && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                        ID required
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function VillageMap({ deals = [] }: { deals?: Deal[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const interactedRef = useRef(false);
  const highlightedIdRef = useRef<number | null>(null);

  const [hudVisible, setHudVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [dealsVisible, setDealsVisible] = useState(true);
  const [dealPopup, setDealPopup] = useState<DealPopupInfo | null>(null);
  const flyToDealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const userMarkerRef = useRef<import('maplibre-gl').Marker | null>(null);

  // Match deals to business locations (3-tier: name → address → street)
  const matchedDeals = useMemo(() => {
    const matched: MatchedDeal[] = [];
    for (const deal of deals) {
      // Tier 1: Match by business name
      const biz = matchDealToBusiness(deal, businessData.businesses);
      if (biz) {
        matched.push({
          ...deal,
          lngLat: localToLngLat(biz.x, biz.z),
          businessName: biz.name,
        });
        continue;
      }

      // Tier 2: Match by address to building footprint
      const addrCoords = findCoordsByAddress(deal.address);
      if (addrCoords) {
        matched.push({
          ...deal,
          lngLat: addrCoords,
          businessName: deal.name,
        });
        continue;
      }

      // Tier 3: Approximate placement by street name
      const streetCoords = estimateCoordsFromStreet(deal.address);
      if (streetCoords) {
        matched.push({
          ...deal,
          lngLat: streetCoords,
          businessName: deal.name,
        });
      }
    }
    return matched;
  }, [deals]);

  // Build a lookup: normalized business name → matched deal
  const dealsByBizName = useMemo(() => {
    const map = new Map<string, MatchedDeal>();
    for (const d of matchedDeals) {
      map.set(normalize(d.businessName), d);
    }
    return map;
  }, [matchedDeals]);

  // Find deal for current popup
  const activeDeal = useMemo(() => {
    if (!popupInfo) return null;
    return dealsByBizName.get(normalize(popupInfo.name)) || null;
  }, [popupInfo, dealsByBizName]);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  // Fade HUD after 6s
  useEffect(() => {
    const t = setTimeout(() => setHudVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Add animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @keyframes dealTileIn {
        from { transform: translateY(8px); opacity: 0; }
        to   { transform: translateY(0);   opacity: 1; }
      }
      @keyframes dealPulse {
        0%   { opacity: 0.7; transform: scale(1); }
        50%  { opacity: 0.3; transform: scale(2.2); }
        100% { opacity: 0;   transform: scale(3); }
      }
      @keyframes youAreHerePulse {
        0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
        70%  { box-shadow: 0 0 0 18px rgba(59,130,246,0); }
        100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
      }
      @keyframes youAreHereRing {
        0%   { transform: translateX(-50%) scale(1); opacity: 0.5; }
        50%  { transform: translateX(-50%) scale(2.5); opacity: 0; }
        100% { transform: translateX(-50%) scale(1); opacity: 0; }
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
    setDealPopup(null); // close deal popup when opening building panel

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

  const handleFlyToDeal = useCallback((deal: MatchedDeal) => {
    const map = mapRef.current;
    if (!map) return;
    if (flyToDealTimerRef.current) clearTimeout(flyToDealTimerRef.current);
    map.flyTo({
      center: deal.lngLat,
      zoom: 17.5,
      pitch: 55,
      duration: 1200,
    });
    // Show deal popup at center of viewport after fly animation
    flyToDealTimerRef.current = setTimeout(() => {
      const container = map.getContainer();
      setDealPopup({
        deal,
        x: container.clientWidth / 2,
        y: container.clientHeight / 2,
      });
    }, 1300);
  }, []);

  const handleToggleDeals = useCallback(() => {
    setDealsVisible(prev => {
      const next = !prev;
      const map = mapRef.current;
      if (map) {
        try {
          map.setLayoutProperty('deal-glow', 'visibility', next ? 'visible' : 'none');
          map.setLayoutProperty('deal-markers', 'visibility', next ? 'visible' : 'none');
          map.setLayoutProperty('deal-labels', 'visibility', next ? 'visible' : 'none');
        } catch {
          // layers may not exist yet
        }
      }
      return next;
    });
  }, []);

  const handleLocateUser = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    setLocatingUser(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lng: pos.coords.longitude, lat: pos.coords.latitude };
        setUserLocation(loc);
        setLocatingUser(false);
        const map = mapRef.current;
        if (!map) return;

        const maplibregl = await import('maplibre-gl');

        // Remove existing marker if re-locating
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Build giant pin HTML element
        const el = document.createElement('div');
        el.style.cssText = 'display:flex;flex-direction:column;align-items:center;pointer-events:none;';
        el.innerHTML = `
          <div style="
            background:#3B82F6;
            color:#fff;
            font-family:system-ui,sans-serif;
            font-weight:900;
            font-size:13px;
            letter-spacing:0.05em;
            padding:8px 14px;
            border-radius:10px;
            border:2px solid #fff;
            box-shadow:0 4px 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3);
            white-space:nowrap;
            text-align:center;
            line-height:1.2;
          ">YOU ARE HERE</div>
          <div style="
            width:4px;
            height:28px;
            background:linear-gradient(to bottom, #3B82F6, #2563EB);
            border-left:1px solid rgba(255,255,255,0.3);
            border-right:1px solid rgba(255,255,255,0.3);
          "></div>
          <div style="
            width:18px;
            height:18px;
            border-radius:50%;
            background:#3B82F6;
            border:3px solid #fff;
            box-shadow:0 0 0 4px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.5);
            animation:youAreHerePulse 2s infinite;
          "></div>
          <div style="
            position:absolute;
            bottom:-6px;
            left:50%;
            transform:translateX(-50%);
            width:60px;
            height:60px;
            border-radius:50%;
            background:radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
            animation:youAreHereRing 3s infinite;
            pointer-events:none;
          "></div>
        `;

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
          offset: [0, 0],
        })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);

        userMarkerRef.current = marker;
        map.flyTo({ center: [loc.lng, loc.lat], zoom: 16.5, pitch: 50, duration: 1500 });
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location access denied');
        } else {
          setLocationError('Could not get location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: import('maplibre-gl').Map;

    (async () => {
      const maplibregl = await import('maplibre-gl');

      map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: MAP_STYLE,
        center: [CENTER_LNG + 0.003, CENTER_LAT + 0.003],
        zoom: 15.5,
        pitch: 55,
        bearing: -15,
        minZoom: 13,
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

      // No zoom controls — users pinch/scroll to zoom

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
          minzoom: 15.5,
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

        // ── Deals overlay layers ──────────────────────────────────
        if (matchedDeals.length > 0) {
          const dealsGeo = buildDealsGeoJSON(matchedDeals) as GeoJSON.GeoJSON;

          map.addSource('deals', {
            type: 'geojson',
            data: dealsGeo,
          });

          // Green dollar sign markers (no glow)
          map.addLayer({
            id: 'deal-glow',
            type: 'symbol',
            source: 'deals',
            layout: {
              'text-field': '$',
              'text-font': ['Noto Sans Bold'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                14, 14,
                17, 22,
              ],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#22C55E',
              'text-halo-color': '#000000',
              'text-halo-width': 2,
              'text-opacity': 0.95,
            },
          });

          // Invisible circle for click target
          map.addLayer({
            id: 'deal-markers',
            type: 'circle',
            source: 'deals',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                14, 8,
                17, 14,
              ],
              'circle-color': 'transparent',
              'circle-opacity': 0,
            },
          });

          // Discount label
          map.addLayer({
            id: 'deal-labels',
            type: 'symbol',
            source: 'deals',
            minzoom: 15.8,
            layout: {
              'text-field': [
                'case',
                ['>', ['get', 'discount'], 0],
                ['concat', ['to-string', ['get', 'discount']], '% OFF'],
                'DEAL',
              ],
              'text-font': ['Noto Sans Bold'],
              'text-size': 10,
              'text-offset': [0, 1.8],
              'text-anchor': 'top',
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#22C55E',
              'text-halo-color': '#000000',
              'text-halo-width': 1.5,
            },
          });

          // Click on deal markers → show deal popup tile
          map.on('click', 'deal-markers', (e) => {
            if (!e.features?.length) return;
            const props = e.features[0].properties;
            if (!props) return;
            const bizName = props.businessName || props.name;
            const matched = matchedDeals.find(d => d.businessName === bizName || d.name === bizName);
            if (matched) {
              setDealPopup({
                deal: matched,
                x: e.originalEvent.clientX,
                y: e.originalEvent.clientY,
              });
            }
          });

          map.on('mouseenter', 'deal-markers', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'deal-markers', () => {
            map.getCanvas().style.cursor = '';
          });
        }

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
        const layers = ['village-extrusions'];
        if (matchedDeals.length > 0) layers.push('deal-markers');
        const features = map.queryRenderedFeatures(e.point, { layers });
        if (!features.length) {
          setPopupInfo(null);
          setDealPopup(null);
        }
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
  }, [handleBuildingClick, matchedDeals]);

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
        <BuildingPanel info={popupInfo} deal={activeDeal} onClose={() => setPopupInfo(null)} />
      )}

      {/* Deal popup tile */}
      {dealPopup && (
        <DealPopupTile info={dealPopup} onClose={() => setDealPopup(null)} />
      )}

      {/* Deals overlay */}
      <DealsOverlay
        deals={matchedDeals}
        dealsVisible={dealsVisible}
        onToggleDeals={handleToggleDeals}
        onFlyToDeal={handleFlyToDeal}
      />

      {/* You Are Here button */}
      <button
        onClick={handleLocateUser}
        disabled={locatingUser}
        style={{
          position: 'absolute',
          bottom: 52,
          right: 16,
          zIndex: 30,
          background: userLocation ? '#3B82F6' : 'rgba(10,12,18,0.85)',
          backdropFilter: 'blur(12px)',
          border: userLocation ? '2px solid #60A5FA' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12,
          padding: '10px 16px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.02em',
          cursor: locatingUser ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: userLocation ? 'youAreHerePulse 2s infinite' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: userLocation ? '#fff' : '#3B82F6',
          border: userLocation ? 'none' : '2px solid #3B82F6',
          animation: locatingUser ? 'dealPulse 1s infinite' : 'none',
        }} />
        {locatingUser ? 'Locating...' : userLocation ? 'YOU ARE HERE' : 'Find Me'}
      </button>
      {locationError && (
        <div style={{
          position: 'absolute',
          bottom: 92,
          right: 16,
          zIndex: 30,
          background: 'rgba(239,68,68,0.9)',
          borderRadius: 8,
          padding: '6px 12px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 11,
          fontWeight: 600,
        }}>
          {locationError}
        </div>
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
        {matchedDeals.length > 0 && (
          <>
            {' '}&middot;{' '}
            <span style={{ color: '#22C55E' }}>{matchedDeals.length} DEALS</span>
          </>
        )}
      </div>

    </div>
  );
}
