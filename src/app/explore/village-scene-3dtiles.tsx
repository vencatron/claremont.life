'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fetchOSMBuildings } from './data/osm-buildings';
import type { OSMBuilding } from './data/osm-buildings';

// ─── Types ───────────────────────────────────────────────────
interface AttributionEntry {
  type: string;
  value: string;
}

// ─── Main Component ───────────────────────────────────────────
export default function VillageScene3DTiles() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [attributions, setAttributions] = useState<string>('');

  useEffect(() => {
    if (!mountRef.current) return;

    let cancelled = false;
    let animId = 0;
    let renderer: THREE.WebGLRenderer | null = null;

    (async () => {
      const { TilesRenderer } = await import('3d-tiles-renderer');
      const {
        GoogleCloudAuthPlugin,
        TileCompressionPlugin,
        TilesFadePlugin,
        GLTFExtensionsPlugin,
        ReorientationPlugin,
      } = await import('3d-tiles-renderer/plugins');
      const { DRACOLoader } = await import(
        'three/examples/jsm/loaders/DRACOLoader.js'
      );
      const { CSS2DRenderer, CSS2DObject } = await import(
        'three/examples/jsm/renderers/CSS2DRenderer.js'
      );

      if (cancelled) return;

      const mount = mountRef.current!;

      // ── Scene ─────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);

      // ── Camera ────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        4000,
      );

      // ── WebGL Renderer ────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      // ── CSS2D Renderer ────────────────────────────────
      const css2dRenderer = new CSS2DRenderer();
      css2dRenderer.setSize(window.innerWidth, window.innerHeight);
      css2dRenderer.domElement.style.position = 'absolute';
      css2dRenderer.domElement.style.top = '0';
      css2dRenderer.domElement.style.left = '0';
      css2dRenderer.domElement.style.pointerEvents = 'none';
      mount.appendChild(css2dRenderer.domElement);

      // ── Lighting ──────────────────────────────────────
      const ambient = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
      sun.position.set(100, 200, 50);
      scene.add(sun);
      const hemi = new THREE.HemisphereLight(0x87CEEB, 0x4a7c4f, 0.4);
      scene.add(hemi);

      // ── Google 3D Tiles ───────────────────────────────
      const apiToken = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
      const tiles = new TilesRenderer();

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
      );

      const LAT_RAD = 34.09650 * (Math.PI / 180);
      const LON_RAD = -117.71850 * (Math.PI / 180);

      tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken, autoRefreshToken: true }));
      tiles.registerPlugin(new TileCompressionPlugin());
      tiles.registerPlugin(new TilesFadePlugin());
      tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader }));
      tiles.registerPlugin(
        new ReorientationPlugin({ lat: LAT_RAD, lon: LON_RAD }),
      );

      tiles.errorTarget = 20;
      tiles.downloadQueue.maxJobs = 6;
      tiles.parseQueue.maxJobs = 3;
      tiles.lruCache.maxSize = 400;
      tiles.lruCache.minSize = 200;

      let loadingDismissed = false;
      const dismissLoading = () => {
        if (!loadingDismissed) {
          loadingDismissed = true;
          setLoading(false);
        }
      };
      tiles.addEventListener('load-model', dismissLoading);
      const loadingTimeout = setTimeout(dismissLoading, 8000);

      scene.add(tiles.group);

      // ── Orbit Camera State ────────────────────────────
      // Focus point — what the camera looks at (in scene space)
      // After ReorientationPlugin the ground is near Y=0 but tiles render at real-world scale
      const focusPoint = new THREE.Vector3(0, 0, 0);
      const focusPointTarget = new THREE.Vector3(0, 0, 0);

      // Spherical coords around focus point
      let orbitTheta = 0;          // horizontal angle (radians)
      let orbitPhi = 0.15;         // vertical angle from top (radians) — nearly straight down
      let orbitRadius = 250;       // distance from focus in scene units (~metres)

      const ALT_MIN = 100;
      const ALT_MAX = 500;
      const PAN_RADIUS = 800;

      // Camera actual position (smoothly lerped)
      const cameraPos = new THREE.Vector3();

      const getCameraTarget = () => {
        const x = focusPoint.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
        const y = focusPoint.y + orbitRadius * Math.cos(orbitPhi);
        const z = focusPoint.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
        return new THREE.Vector3(x, y, z);
      };

      // Initialise camera position immediately (no lerp on first frame)
      const initPos = getCameraTarget();
      camera.position.copy(initPos);
      cameraPos.copy(initPos);
      camera.lookAt(focusPoint);

      // ── Pointer / touch state ─────────────────────────
      type DragMode = 'none' | 'orbit' | 'pan';
      let dragMode: DragMode = 'none';
      let lastMouseX = 0, lastMouseY = 0;
      // For right-button drag — track start position
      let panLastX = 0, panLastY = 0;

      // Pinch zoom state
      let pinchActive = false;
      let pinchDist = 0;
      let pinchMidX = 0, pinchMidY = 0;
      // Pan state for two-finger
      let pinchPanLastX = 0, pinchPanLastY = 0;

      // ── Pan helper ────────────────────────────────────
      // Move focusPoint in the camera's XZ plane
      const panCamera = (screenDx: number, screenDy: number) => {
        // Right vector from camera heading
        const right = new THREE.Vector3(
          Math.cos(orbitTheta), 0, -Math.sin(orbitTheta),
        );
        // Forward vector (projected to horizontal plane)
        const forward = new THREE.Vector3(
          -Math.sin(orbitTheta), 0, -Math.cos(orbitTheta),
        );

        // Scale panning by altitude — further = faster pan feels natural
        const panScale = orbitRadius * 0.0015;
        focusPointTarget.addScaledVector(right, -screenDx * panScale);
        focusPointTarget.addScaledVector(forward, screenDy * panScale);

        // Clamp pan to radius
        const flat = new THREE.Vector2(focusPointTarget.x, focusPointTarget.z);
        if (flat.length() > PAN_RADIUS) {
          flat.setLength(PAN_RADIUS);
          focusPointTarget.x = flat.x;
          focusPointTarget.z = flat.y;
        }
      };

      // ── Mouse events ──────────────────────────────────
      const onMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
          dragMode = 'orbit';
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
        } else if (e.button === 2) {
          dragMode = 'pan';
          panLastX = e.clientX;
          panLastY = e.clientY;
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (dragMode === 'orbit') {
          const dx = e.clientX - lastMouseX;
          const dy = e.clientY - lastMouseY;
          orbitTheta -= dx * 0.005;
          orbitPhi = Math.max(0.05, Math.min(Math.PI / 4, orbitPhi + dy * 0.005));
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
        } else if (dragMode === 'pan') {
          const dx = e.clientX - panLastX;
          const dy = e.clientY - panLastY;
          panCamera(dx, dy);
          panLastX = e.clientX;
          panLastY = e.clientY;
        }
      };

      const onMouseUp = () => { dragMode = 'none'; };

      const onContextMenu = (e: MouseEvent) => { e.preventDefault(); };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        orbitRadius = Math.max(ALT_MIN, Math.min(ALT_MAX,
          orbitRadius + e.deltaY * 0.3));
      };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('contextmenu', onContextMenu);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

      // ── Touch events ──────────────────────────────────
      let touchOrbitActive = false;
      let touchOrbitId = -1;
      let lastTouchX = 0, lastTouchY = 0;

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
          touchOrbitActive = false;
          const t0 = e.touches[0], t1 = e.touches[1];
          pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          pinchMidX = (t0.clientX + t1.clientX) / 2;
          pinchMidY = (t0.clientY + t1.clientY) / 2;
          pinchPanLastX = pinchMidX;
          pinchPanLastY = pinchMidY;
          pinchActive = true;
          return;
        }
        pinchActive = false;
        if (e.touches.length === 1) {
          const t = e.touches[0];
          touchOrbitActive = true;
          touchOrbitId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2 && pinchActive) {
          const t0 = e.touches[0], t1 = e.touches[1];
          const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          orbitRadius = Math.max(ALT_MIN, Math.min(ALT_MAX,
            orbitRadius + (pinchDist - d) * 0.05));
          pinchDist = d;

          const midX = (t0.clientX + t1.clientX) / 2;
          const midY = (t0.clientY + t1.clientY) / 2;
          panCamera(midX - pinchPanLastX, midY - pinchPanLastY);
          pinchPanLastX = midX;
          pinchPanLastY = midY;
          return;
        }
        if (!touchOrbitActive) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier !== touchOrbitId) continue;
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          orbitTheta -= dx * 0.005;
          orbitPhi = Math.max(0.05, Math.min(Math.PI / 4, orbitPhi + dy * 0.005));
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) pinchActive = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchOrbitId) {
            touchOrbitActive = false;
          }
        }
      };

      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

      // ── Building overlays ─────────────────────────────
      const overlayGroup = new THREE.Group();
      scene.add(overlayGroup);

      // Per-category groups for toggling
      const categoryGroups = new Map<string, THREE.Group>();

      // Store outline meshes for raycasting
      const outlineMeshes: Array<{ line: THREE.LineLoop; building: OSMBuilding }> = [];

      // All CSS2DObjects for visibility control
      const allLabels: Array<{ obj: InstanceType<typeof CSS2DObject>; building: OSMBuilding }> = [];

      const buildingOverlayY = 15;
      const labelY = 20;

      try {
        const buildings = await fetchOSMBuildings();
        if (!cancelled) {
          // Count categories
          const categoryCounts: Record<string, number> = {};

          for (const building of buildings) {
            // Ensure per-category group exists
            if (!categoryGroups.has(building.category)) {
              const g = new THREE.Group();
              categoryGroups.set(building.category, g);
              overlayGroup.add(g);
            }
            const catGroup = categoryGroups.get(building.category)!;

            categoryCounts[building.category] = (categoryCounts[building.category] ?? 0) + 1;

            // ── Outline polygon ──────────────────────
            const points = building.footprint.map(
              (p) => new THREE.Vector3(p.x, buildingOverlayY, p.z),
            );
            if (points.length < 2) continue;

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: new THREE.Color(building.color),
              linewidth: 1,
            });
            const line = new THREE.LineLoop(geometry, material);
            catGroup.add(line);
            outlineMeshes.push({ line, building });

            // ── CSS2D label ───────────────────────────
            const div = document.createElement('div');
            div.textContent = building.name;
            div.style.color = building.color;
            div.style.background = 'rgba(0,0,0,0.7)';
            div.style.borderRadius = '4px';
            div.style.padding = '2px 6px';
            div.style.fontSize = '11px';
            div.style.fontFamily = 'system-ui, sans-serif';
            div.style.fontWeight = '500';
            div.style.whiteSpace = 'nowrap';
            div.style.pointerEvents = 'none';
            div.style.userSelect = 'none';

            const label = new CSS2DObject(div);
            label.position.set(building.centroid.x, labelY, building.centroid.z);
            catGroup.add(label);
            allLabels.push({ obj: label, building });
          }

          window.dispatchEvent(new CustomEvent('overlay-buildings-loaded', {
            detail: { count: buildings.length, categories: categoryCounts },
          }));
        }
      } catch (err) {
        console.warn('OSM buildings load failed:', err);
      }

      // ── Category toggle listener ───────────────────────
      const onToggleCategory = (e: Event) => {
        const { category, visible } = (e as CustomEvent).detail as { category: string; visible: boolean };
        const g = categoryGroups.get(category);
        if (g) g.visible = visible;
      };
      window.addEventListener('toggle-category', onToggleCategory);

      // ── Click: raycast against outlines ───────────────
      const clickRaycaster = new THREE.Raycaster();
      clickRaycaster.params.Line = { threshold: 3 };

      const onCanvasClick = (e: MouseEvent) => {
        // Only fire on actual clicks, not end-of-drag
        if (Math.abs(e.clientX - lastMouseX) > 5 || Math.abs(e.clientY - lastMouseY) > 5) return;

        const rect = renderer!.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        clickRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        const lineObjects = outlineMeshes.map((m) => m.line);
        const hits = clickRaycaster.intersectObjects(lineObjects, false);
        if (hits.length > 0) {
          const hitLine = hits[0].object as THREE.LineLoop;
          const match = outlineMeshes.find((m) => m.line === hitLine);
          if (match) {
            window.dispatchEvent(new CustomEvent('building-overlay-click', {
              detail: {
                name: match.building.name,
                category: match.building.category,
                color: match.building.color,
                tags: match.building.tags,
              },
            }));
          }
        }
      };

      renderer.domElement.addEventListener('click', onCanvasClick);

      // ── Resize ────────────────────────────────────────
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer!.setSize(window.innerWidth, window.innerHeight);
        css2dRenderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      // ── Animation loop ────────────────────────────────
      const LERP = 0.1;
      let frameCount = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        frameCount++;

        // Smooth focus point
        focusPoint.lerp(focusPointTarget, LERP);

        // Compute target camera position
        const targetPos = getCameraTarget();

        // Smooth camera position (lerp towards target)
        cameraPos.lerp(targetPos, LERP);
        camera.position.copy(cameraPos);
        camera.lookAt(focusPoint);

        // ── Label visibility by altitude ─────────────
        const alt = orbitRadius;
        for (const { obj, building } of allLabels) {
          if (alt > 400) {
            obj.visible = false;
          } else if (alt > 300) {
            obj.visible = building.category === 'college';
          } else {
            obj.visible = true;
          }
        }

        // ── Tiles update ─────────────────────────────
        camera.updateMatrixWorld();
        tiles.setResolutionFromRenderer(camera, renderer!);
        tiles.setCamera(camera);
        tiles.update();

        // ── Attribution (every 120 frames) ────────────
        if (frameCount % 120 === 0) {
          const attrs: AttributionEntry[] = tiles.getAttributions();
          const attrText = attrs
            .map((a) => (typeof a.value === 'string' ? a.value : ''))
            .filter(Boolean)
            .join(' · ');
          setAttributions(attrText || '© Google');
        }

        renderer!.render(scene, camera);
        css2dRenderer.render(scene, camera);
      };

      animate();

      // First attribution fetch
      setTimeout(() => {
        const attrs: AttributionEntry[] = tiles.getAttributions();
        const attrText = attrs
          .map((a) => (typeof a.value === 'string' ? a.value : ''))
          .filter(Boolean)
          .join(' · ');
        setAttributions(attrText || '© Google');
      }, 3000);

      // ── Cleanup ───────────────────────────────────────
      return () => {
        cancelled = true;
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('toggle-category', onToggleCategory);
        renderer!.domElement.removeEventListener('mousedown', onMouseDown);
        renderer!.domElement.removeEventListener('mousemove', onMouseMove);
        renderer!.domElement.removeEventListener('mouseup', onMouseUp);
        renderer!.domElement.removeEventListener('contextmenu', onContextMenu);
        renderer!.domElement.removeEventListener('wheel', onWheel);
        renderer!.domElement.removeEventListener('touchstart', onTouchStart);
        renderer!.domElement.removeEventListener('touchmove', onTouchMove);
        renderer!.domElement.removeEventListener('touchend', onTouchEnd);
        renderer!.domElement.removeEventListener('click', onCanvasClick);
        clearTimeout(loadingTimeout);
        tiles.removeEventListener('load-model', dismissLoading);
        tiles.dispose();
        try { mount.removeChild(renderer!.domElement); } catch {}
        try { mount.removeChild(css2dRenderer.domElement); } catch {}
        renderer!.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        try { mountRef.current.removeChild(renderer.domElement); } catch {}
      }
      if (renderer) renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">🌍</div>
            <p className="text-white font-semibold">Loading Google 3D Tiles…</p>
            <p className="text-white/50 text-sm">Claremont Village, CA</p>
          </div>
        </div>
      )}

      {/* HUD — top-left */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <h1 className="text-lg font-bold tracking-wide">Claremont Village</h1>
          <p className="text-xs text-white/60 mt-1">Google Photorealistic 3D Tiles</p>
        </div>
      </div>

      {/* Controls help — top-right */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 text-white/80 text-xs space-y-1">
          <p><span className="opacity-70">Left drag</span> — Rotate</p>
          <p><span className="opacity-70">Right drag</span> — Pan</p>
          <p><span className="opacity-70">Scroll</span> — Zoom</p>
          <p><span className="opacity-70">Click outline</span> — Building info</p>
        </div>
      </div>

      {/* Google Attribution — REQUIRED by ToS */}
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-1 text-white/70 text-[11px] flex items-center gap-2">
          <span>🗺️</span>
          <span>{attributions || '© Google'}</span>
        </div>
      </div>
    </div>
  );
}
