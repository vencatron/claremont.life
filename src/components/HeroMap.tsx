'use client'

import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

const CENTER_LNG = -117.7130
const CENTER_LAT = 34.0965
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('mapbox-gl').Map | null>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !MAPBOX_TOKEN) return

    let cancelled = false

    async function init() {
      const mapboxgl = (await import('mapbox-gl')).default ?? await import('mapbox-gl')
      if (cancelled) return

      ;(mapboxgl as any).accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: el!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [CENTER_LNG, CENTER_LAT],
        zoom: 15,
        pitch: 60,
        bearing: -30,
        interactive: false,
        attributionControl: false,
      })

      mapRef.current = map

      map.on('style.load', () => {
        // Enable 3D terrain
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        })
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })

        // Add 3D buildings
        const layers = map.getStyle().layers
        const labelLayer = layers?.find(
          (l) => l.type === 'symbol' && l.layout && 'text-field' in l.layout
        )

        map.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#ddd',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.8,
            },
          },
          labelLayer?.id
        )

        // Slow rotation
        let bearing = -30
        function rotate() {
          if (cancelled) return
          bearing += 0.02
          map.setBearing(bearing)
          animRef.current = requestAnimationFrame(rotate)
        }
        animRef.current = requestAnimationFrame(rotate)
      })
    }

    init()

    return () => {
      cancelled = true
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
}
