'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import villageData from './data/village-data.json';
import businessData from './data/business-enrichment.json';

// ─── Coordinate conversion ─────────────────────────────────────────────────
const CENTER_LAT = 34.0965;
const CENTER_LNG = -117.7185;
const LAT_M = 110540;
const LNG_M = 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);

function localToLngLat(x: number, z: number): [number, number] {
  return [CENTER_LNG + x / LNG_M, CENTER_LAT + z / LAT_M];
}

// ─── Building colour by type ───────────────────────────────────────────────
function buildingColor(type: string): string {
  if (['restaurant', 'cafe', 'bar', 'bakery', 'frozen_yogurt', 'brewery'].includes(type))
    return '#F97316';
  if (['shop', 'grocery', 'wine_shop', 'music_store', 'real_estate', 'bookstore', 'retail', 'pharmacy'].includes(type))
    return '#EAB308';
  if (['theater', 'cinema'].includes(type)) return '#A855F7';
  if (['office', 'bank', 'coworking'].includes(type)) return '#9CA3AF';
  if (['commercial'].includes(type)) return '#6B7280';
  if (['hotel'].includes(type)) return '#60A5FA';
  if (['museum', 'gallery'].includes(type)) return '#34D399';
  if (['church', 'college'].includes(type)) return '#F472B6';
  return '#6B7280';
}

// ─── GeoJSON builders ──────────────────────────────────────────────────────
function buildBuildingGeoJSON() {
  const features = villageData.buildings
    .filter((b) => b.footprint && b.footprint.length >= 3)
    .map((b) => {
      const coords = b.footprint.map(([x, z]) => localToLngLat(x, z));
      // Ensure ring is closed
      const ring = coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1]
        ? coords
        : [...coords, coords[0]];

      return {
        type: 'Feature' as const,
        properties: {
          id: b.id,
          name: b.name || 'Building',
          type: b.type || 'commercial',
          address: (b as { address?: string }).address || '',
          height: b.height || 6,
          color: buildingColor(b.type || 'commercial'),
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
  const features = businessData.businesses.map((biz) => {
    const [lng, lat] = localToLngLat(biz.x, biz.z);
    return {
      type: 'Feature' as const,
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

// ─── Walking speed ─────────────────────────────────────────────────────────
// ~1.4 m/s at 60fps ≈ 0.023 m/frame → converted to degrees
const WALK_SPEED_LNG = 0.023 / LNG_M; // degrees lng per frame
const WALK_SPEED_LAT = 0.023 / LAT_M; // degrees lat per frame

// ─── Main component ────────────────────────────────────────────────────────
export default function VillageMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('mapbox-gl').Map | null>(null);
  const markerRef = useRef<import('mapbox-gl').Marker | null>(null);
  const charPosRef = useRef({ lng: CENTER_LNG, lat: CENTER_LAT });
  const keysRef = useRef<Set<string>>(new Set());
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, startX: 0, startY: 0 });
  const rafRef = useRef<number>(0);
  const interactedRef = useRef(false);
  const bobRef = useRef(0);

  const [hudVisible, setHudVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{ name: string; type: string; address: string } | null>(null);

  useEffect(() => {
    setIsMobile('ontouchstart' in window);
  }, []);

  // Fade HUD after 5s
  useEffect(() => {
    const t = setTimeout(() => setHudVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map: import('mapbox-gl').Map;
    let marker: import('mapbox-gl').Marker;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

      map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [CENTER_LNG, CENTER_LAT],
        zoom: 16.5,
        pitch: 60,
        bearing: -15,
        minZoom: 15,
        maxZoom: 19,
        scrollZoom: false,
        antialias: true,
      });

      mapRef.current = map;

      // Enable scroll zoom after first interaction
      const enableScroll = () => {
        if (!interactedRef.current) {
          interactedRef.current = true;
          map.scrollZoom.enable();
        }
      };
      map.on('click', enableScroll);
      map.on('drag', enableScroll);

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // ── Character marker ────────────────────────────────────────
      const markerEl = document.createElement('div');
      markerEl.style.cssText =
        'font-size:28px;line-height:1;cursor:pointer;user-select:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));transition:transform 0.1s;';
      markerEl.textContent = '🚶';

      marker = new mapboxgl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([CENTER_LNG, CENTER_LAT])
        .addTo(map);
      markerRef.current = marker;

      // ── Layers on style load ────────────────────────────────────
      map.on('style.load', () => {
        // Mapbox built-in 3D buildings (fills in what OSM data misses)
        if (!map.getLayer('3d-buildings')) {
          map.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.4,
            },
          });
        }

        // Custom village building overlays
        map.addSource('village-buildings', {
          type: 'geojson',
          data: buildBuildingGeoJSON(),
        });

        map.addLayer({
          id: 'village-extrusions',
          type: 'fill-extrusion',
          source: 'village-buildings',
          paint: {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.75,
          },
        });

        // Business labels
        map.addSource('businesses', {
          type: 'geojson',
          data: buildBusinessGeoJSON(),
        });

        map.addLayer({
          id: 'business-labels',
          type: 'symbol',
          source: 'businesses',
          minzoom: 17,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
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

        // Click on village buildings → popup
        map.on('click', 'village-extrusions', (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties as {
            name: string;
            type: string;
            address: string;
          };
          setPopupInfo({ name: props.name, type: props.type, address: props.address });
        });

        // Pointer cursor on hover
        map.on('mouseenter', 'village-extrusions', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'village-extrusions', () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Close popup when clicking map background
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['village-extrusions'],
        });
        if (!features.length) setPopupInfo(null);
      });

      // ── Walk loop ───────────────────────────────────────────────
      function walkLoop() {
        const keys = keysRef.current;
        const joy = joystickRef.current;
        let dlng = 0;
        let dlat = 0;

        // Keyboard
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dlat += WALK_SPEED_LAT;
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dlat -= WALK_SPEED_LAT;
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dlng += WALK_SPEED_LNG;
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dlng -= WALK_SPEED_LNG;

        // Joystick
        if (joy.active) {
          dlng += joy.dx * WALK_SPEED_LNG * 1.5;
          dlat -= joy.dy * WALK_SPEED_LAT * 1.5;
        }

        const moving = dlng !== 0 || dlat !== 0;
        if (moving) {
          charPosRef.current.lng += dlng;
          charPosRef.current.lat += dlat;
          markerRef.current?.setLngLat([charPosRef.current.lng, charPosRef.current.lat]);

          // Bob animation
          bobRef.current += 0.3;
          const bob = Math.sin(bobRef.current) * 3;
          const markerEl = markerRef.current?.getElement();
          if (markerEl) markerEl.style.transform = `translateY(${bob}px)`;

          // Camera follows character
          mapRef.current?.easeTo({
            center: [charPosRef.current.lng, charPosRef.current.lat],
            duration: 100,
            easing: (t) => t,
          });
        } else {
          const markerEl = markerRef.current?.getElement();
          if (markerEl) markerEl.style.transform = 'translateY(0px)';
        }

        rafRef.current = requestAnimationFrame(walkLoop);
      }

      rafRef.current = requestAnimationFrame(walkLoop);
    })();

    // Key listeners
    const onKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      map?.remove();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ── Joystick handlers ─────────────────────────────────────────
  const onJoyStart = (e: React.TouchEvent | React.MouseEvent) => {
    const pt = 'touches' in e ? e.touches[0] : e;
    joystickRef.current = { active: true, dx: 0, dy: 0, startX: pt.clientX, startY: pt.clientY };
  };

  const onJoyMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current.active) return;
    const pt = 'touches' in e ? e.touches[0] : e;
    const dx = (pt.clientX - joystickRef.current.startX) / 40;
    const dy = (pt.clientY - joystickRef.current.startY) / 40;
    joystickRef.current.dx = Math.max(-1, Math.min(1, dx));
    joystickRef.current.dy = Math.max(-1, Math.min(1, dy));
  };

  const onJoyEnd = () => {
    joystickRef.current = { active: false, dx: 0, dy: 0, startX: 0, startY: 0 };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* Map canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          filter: 'saturate(1.4) contrast(1.1)',
        }}
      />

      {/* Tilt-shift blur bands */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 22%, transparent 35%, transparent 65%, rgba(0,0,0,0) 78%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '22%',
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
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
          height: '22%',
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
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
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '10px 16px',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            🏘️ Claremont Village
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {isMobile ? 'Drag to explore · Joystick to walk' : 'WASD / ↑↓←→ to walk · Drag to look around'}
          </div>
        </div>
      </div>

      {/* Building popup */}
      {popupInfo && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            padding: '20px 24px',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            minWidth: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <button
            onClick={() => setPopupInfo(null)}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            {popupInfo.name || 'Building'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
            {popupInfo.type}
          </div>
          {popupInfo.address && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              📍 {popupInfo.address}
            </div>
          )}
        </div>
      )}

      {/* Mobile joystick */}
      {isMobile && (
        <div
          onTouchStart={onJoyStart}
          onTouchMove={onJoyMove}
          onTouchEnd={onJoyEnd}
          onMouseDown={onJoyStart}
          onMouseMove={onJoyMove}
          onMouseUp={onJoyEnd}
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            zIndex: 20,
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
            }}
          />
        </div>
      )}
    </div>
  );
}
