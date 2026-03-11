'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import type { HousingListing } from '@/types'
import { zones, Zone, isPointInPolygon } from './zones'
import { ZonePanel } from './zone-panel'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!
const CENTER = { lat: 34.1015, lng: -117.7113 }

// ─── Zone polygon overlays ────────────────────────────────────────────────────

interface ZonePolygonsProps {
  selectedZoneId: string | null
  onZoneClick: (zone: Zone) => void
}

function ZonePolygons({ selectedZoneId, onZoneClick }: ZonePolygonsProps) {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')

  // Refs so event handlers always see latest values without triggering re-renders
  const polygonMapRef = useRef<{ [id: string]: google.maps.Polygon }>({})
  const selectedRef = useRef<string | null>(null)
  const onClickRef = useRef(onZoneClick)

  selectedRef.current = selectedZoneId
  onClickRef.current = onZoneClick

  // Create polygons once map + library are ready
  useEffect(() => {
    if (!map || !mapsLib) return

    const created: { [id: string]: google.maps.Polygon } = {}

    zones.forEach(zone => {
      const polygon = new mapsLib.Polygon({
        paths: zone.polygon,
        fillColor: zone.colorHex,
        fillOpacity: 0.2,
        strokeColor: zone.colorHex,
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        map,
        clickable: true,
        zIndex: 1,
      })

      polygon.addListener('click', () => onClickRef.current(zone))
      polygon.addListener('mouseover', () => {
        polygon.setOptions({ fillOpacity: 0.4 })
      })
      polygon.addListener('mouseout', () => {
        polygon.setOptions({
          fillOpacity: selectedRef.current === zone.id ? 0.42 : 0.2,
        })
      })

      created[zone.id] = polygon
    })

    polygonMapRef.current = created

    return () => {
      Object.values(created).forEach(p => p.setMap(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mapsLib])

  // Sync opacity whenever selection changes
  useEffect(() => {
    Object.entries(polygonMapRef.current).forEach(([id, polygon]) => {
      polygon.setOptions({ fillOpacity: id === selectedZoneId ? 0.42 : 0.2 })
    })
  }, [selectedZoneId])

  return null
}

// ─── Zone label markers ───────────────────────────────────────────────────────

function ZoneLabels({
  selectedZoneId,
  onZoneClick,
}: {
  selectedZoneId: string | null
  onZoneClick: (zone: Zone) => void
}) {
  return (
    <>
      {zones.map(zone => (
        <AdvancedMarker
          key={zone.id}
          position={zone.center}
          onClick={() => onZoneClick(zone)}
        >
          <div
            className="px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg cursor-pointer select-none whitespace-nowrap transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: zone.colorHex + (selectedZoneId === zone.id ? 'ff' : 'cc'),
              boxShadow: selectedZoneId === zone.id
                ? `0 0 0 3px ${zone.colorHex}55, 0 4px 12px rgba(0,0,0,0.3)`
                : '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {zone.name.split(/[/&]/)[0].trim()}
          </div>
        </AdvancedMarker>
      ))}
    </>
  )
}

// ─── Colleges marker ──────────────────────────────────────────────────────────

function CollegesMarker() {
  return (
    <AdvancedMarker position={CENTER}>
      <div className="bg-white border-2 border-gray-700 rounded-full px-2.5 py-1 text-xs font-bold text-gray-800 shadow-xl whitespace-nowrap">
        🎓 The Claremont Colleges
      </div>
    </AdvancedMarker>
  )
}

// ─── Zone legend (no selection state) ────────────────────────────────────────

function ZoneLegend({ onZoneClick }: { onZoneClick: (zone: Zone) => void }) {
  return (
    <div className="absolute bottom-6 left-4 z-30 bg-white/92 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/60">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Tap a zone to explore
      </p>
      {zones.map(zone => (
        <button
          key={zone.id}
          onClick={() => onZoneClick(zone)}
          className="flex items-center gap-2 py-1 w-full text-left hover:opacity-75 transition-opacity"
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: zone.colorHex }}
          />
          <span className="text-xs text-gray-700 font-medium leading-tight">{zone.name}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main HousingMap component ────────────────────────────────────────────────

interface HousingMapProps {
  listings: HousingListing[]
}

export function HousingMap({ listings }: HousingMapProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(prev => (prev?.id === zone.id ? null : zone))
  }, [])

  const handleClose = useCallback(() => setSelectedZone(null), [])

  const zoneListings = selectedZone
    ? listings.filter(
        l =>
          l.lat != null &&
          l.lng != null &&
          isPointInPolygon({ lat: l.lat, lng: l.lng }, selectedZone.polygon)
      )
    : []

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100svh - 4rem)' }}
    >
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={CENTER}
          defaultZoom={14}
          mapTypeId="hybrid"
          tilt={45}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <ZonePolygons selectedZoneId={selectedZone?.id ?? null} onZoneClick={handleZoneClick} />
          <ZoneLabels selectedZoneId={selectedZone?.id ?? null} onZoneClick={handleZoneClick} />
          <CollegesMarker />
        </Map>
      </APIProvider>

      {/* Legend — only show when no zone is selected */}
      {!selectedZone && <ZoneLegend onZoneClick={handleZoneClick} />}

      {/* Zone detail panel */}
      {selectedZone && (
        <ZonePanel
          zone={selectedZone}
          listings={zoneListings}
          apiKey={API_KEY}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
