'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
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

  const polygonMapRef = useRef<{ [id: string]: google.maps.Polygon }>({})
  const selectedRef = useRef<string | null>(null)
  const onClickRef = useRef(onZoneClick)

  selectedRef.current = selectedZoneId
  onClickRef.current = onZoneClick

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

  useEffect(() => {
    Object.entries(polygonMapRef.current).forEach(([id, polygon]) => {
      polygon.setOptions({ fillOpacity: id === selectedZoneId ? 0.42 : 0.2 })
    })
  }, [selectedZoneId])

  return null
}

// ─── Zone label overlays (custom OverlayView) ────────────────────────────────

function ZoneLabels({
  selectedZoneId,
  onZoneClick,
}: {
  selectedZoneId: string | null
  onZoneClick: (zone: Zone) => void
}) {
  const map = useMap()
  const overlaysRef = useRef<google.maps.OverlayView[]>([])
  const onClickRef = useRef(onZoneClick)
  const selectedRef = useRef<string | null>(null)

  onClickRef.current = onZoneClick
  selectedRef.current = selectedZoneId

  useEffect(() => {
    if (!map) return
    if (!google?.maps?.OverlayView) return

    // Clean up old
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    zones.forEach(zone => {
      class ZoneLabelOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null
        private pos: google.maps.LatLng

        constructor() {
          super()
          this.pos = new google.maps.LatLng(zone.center.lat, zone.center.lng)
        }

        onAdd() {
          this.div = document.createElement('div')
          this.div.style.position = 'absolute'
          this.div.style.cursor = 'pointer'
          this.div.style.zIndex = '20'
          this.div.style.transform = 'translate(-50%, -50%)'

          const label = document.createElement('div')
          const isSelected = selectedRef.current === zone.id
          label.style.padding = '4px 10px'
          label.style.borderRadius = '999px'
          label.style.color = '#fff'
          label.style.fontSize = '11px'
          label.style.fontWeight = '700'
          label.style.whiteSpace = 'nowrap'
          label.style.userSelect = 'none'
          label.style.backgroundColor = zone.colorHex + (isSelected ? 'ff' : 'cc')
          label.style.boxShadow = isSelected
            ? `0 0 0 3px ${zone.colorHex}55, 0 4px 12px rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.25)'
          label.style.transition = 'all 0.2s ease'
          label.textContent = zone.name.split(/[/&]/)[0].trim()

          label.addEventListener('mouseenter', () => {
            label.style.transform = 'scale(1.05)'
          })
          label.addEventListener('mouseleave', () => {
            label.style.transform = 'scale(1)'
          })

          this.div.appendChild(label)
          this.div.addEventListener('click', () => onClickRef.current(zone))

          const panes = this.getPanes()
          panes?.overlayMouseTarget.appendChild(this.div)
        }

        draw() {
          if (!this.div) return
          const projection = this.getProjection()
          if (!projection) return
          const point = projection.fromLatLngToDivPixel(this.pos)
          if (point) {
            this.div.style.left = point.x + 'px'
            this.div.style.top = point.y + 'px'
          }
        }

        onRemove() {
          this.div?.parentNode?.removeChild(this.div)
          this.div = null
        }

        updateSelected(isSelected: boolean) {
          if (!this.div) return
          const label = this.div.firstChild as HTMLDivElement
          if (!label) return
          label.style.backgroundColor = zone.colorHex + (isSelected ? 'ff' : 'cc')
          label.style.boxShadow = isSelected
            ? `0 0 0 3px ${zone.colorHex}55, 0 4px 12px rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.25)'
        }
      }

      const overlay = new ZoneLabelOverlay()
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })

    return () => {
      overlaysRef.current.forEach(o => o.setMap(null))
      overlaysRef.current = []
    }
  }, [map])

  // Update selection state
  useEffect(() => {
    overlaysRef.current.forEach((overlay, i) => {
      const zone = zones[i]
      if (zone && (overlay as any).updateSelected) {
        ;(overlay as any).updateSelected(selectedZoneId === zone.id)
      }
    })
  }, [selectedZoneId])

  return null
}

// ─── Colleges label overlay ───────────────────────────────────────────────────

function CollegesMarker() {
  const map = useMap()
  const overlayRef = useRef<google.maps.OverlayView | null>(null)

  useEffect(() => {
    if (!map) return
    if (!google?.maps?.OverlayView) return

    class CollegeOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null
      private pos: google.maps.LatLng

      constructor() {
        super()
        this.pos = new google.maps.LatLng(CENTER.lat, CENTER.lng)
      }

      onAdd() {
        this.div = document.createElement('div')
        this.div.style.position = 'absolute'
        this.div.style.transform = 'translate(-50%, -50%)'
        this.div.style.zIndex = '15'

        const label = document.createElement('div')
        label.style.background = '#fff'
        label.style.border = '2px solid #374151'
        label.style.borderRadius = '999px'
        label.style.padding = '4px 10px'
        label.style.fontSize = '11px'
        label.style.fontWeight = '700'
        label.style.color = '#1f2937'
        label.style.whiteSpace = 'nowrap'
        label.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'
        label.textContent = '🎓 The Claremont Colleges'

        this.div.appendChild(label)

        const panes = this.getPanes()
        panes?.overlayMouseTarget.appendChild(this.div)
      }

      draw() {
        if (!this.div) return
        const projection = this.getProjection()
        if (!projection) return
        const point = projection.fromLatLngToDivPixel(this.pos)
        if (point) {
          this.div.style.left = point.x + 'px'
          this.div.style.top = point.y + 'px'
        }
      }

      onRemove() {
        this.div?.parentNode?.removeChild(this.div)
        this.div = null
      }
    }

    const overlay = new CollegeOverlay()
    overlay.setMap(map)
    overlayRef.current = overlay

    return () => {
      overlay.setMap(null)
    }
  }, [map])

  return null
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

// ─── Listing markers (red dots) ───────────────────────────────────────────────

function ListingMarkers({
  listings,
  selectedZone,
}: {
  listings: HousingListing[]
  selectedZone: Zone | null
}) {
  const map = useMap()
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    if (!map) return

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const geoListings = listings.filter(l => l.lat != null && l.lng != null)

    geoListings.forEach(listing => {
      const inZone = selectedZone
        ? isPointInPolygon({ lat: listing.lat, lng: listing.lng }, selectedZone.polygon)
        : false

      const size = inZone ? 14 : 10
      const marker = new google.maps.Marker({
        position: { lat: listing.lat, lng: listing.lng },
        map,
        title: `${listing.name} — ${listing.price_min ? '$' + listing.price_min.toLocaleString() + '/mo' : 'Price TBD'}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: size / 2,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: inZone ? 10 : 5,
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
    }
  }, [map, listings, selectedZone])

  return null
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
          mapTypeId="roadmap"
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <ZonePolygons selectedZoneId={selectedZone?.id ?? null} onZoneClick={handleZoneClick} />
          <ZoneLabels selectedZoneId={selectedZone?.id ?? null} onZoneClick={handleZoneClick} />
          <CollegesMarker />
          <ListingMarkers listings={listings} selectedZone={selectedZone} />
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
