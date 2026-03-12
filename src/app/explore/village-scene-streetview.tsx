'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ─── Constants ────────────────────────────────────────────────
const START_LOCATION = { lat: 34.0975, lng: -117.7180 };

// Reference origin matching 3D tiles scene — minimap uses world x/z
const REF_LAT = 34.09650;
const REF_LNG = -117.71850;
const REF_LAT_RAD = REF_LAT * (Math.PI / 180);
const M_PER_DEG_LAT = 111_000;
const M_PER_DEG_LNG = 111_000 * Math.cos(REF_LAT_RAD);

function latLngToXZ(lat: number, lng: number) {
  return {
    x:  (lng - REF_LNG) * M_PER_DEG_LNG,
    z: -(lat - REF_LAT) * M_PER_DEG_LAT,
  };
}

// ─── Module-level session cache (survives hot reload) ─────────
let cachedSession: string | null = null;
let sessionExpiry = 0;

// ─── Types ────────────────────────────────────────────────────
interface PanoLink     { panoId: string; heading: number; }
interface PanoMetadata { panoId: string; lat: number; lng: number; heading: number; links: PanoLink[]; }

// ─── API helpers ──────────────────────────────────────────────
async function getSession(_apiKey: string): Promise<string> {
  if (cachedSession && Date.now() < sessionExpiry) return cachedSession;
  const res = await fetch('/api/streetview-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapType: 'streetview', language: 'en-US', region: 'US' }),
  });
  if (!res.ok) throw new Error(`Session creation failed: ${res.status}`);
  const data = await res.json();
  cachedSession = data.session as string;
  sessionExpiry = parseInt(data.expiry, 10) * 1000 - 60_000;
  return cachedSession;
}

async function findPanoByLocation(
  lat: number, lng: number, session: string, _apiKey: string
): Promise<string> {
  const params = new URLSearchParams({ session });
  const res = await fetch(`/api/streetview/panoIds?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations: [{ lat, lng }], radius: 50 }),
  });
  if (!res.ok) throw new Error(`panoIds failed: ${res.status}`);
  const data = await res.json();
  const ids = data.panoIds as string[] | undefined;
  if (!ids || ids.length === 0) throw new Error('No pano found near location');
  return ids[0];
}

async function fetchPanoMetadata(
  panoId: string, session: string, apiKey: string
): Promise<PanoMetadata> {
  const params = new URLSearchParams({ panoId, session });
  const res = await fetch(`/api/streetview/metadata?${params}`);
  if (!res.ok) throw new Error(`metadata failed: ${res.status}`);
  const data = await res.json();
  return {
    panoId:  data.panoId  as string,
    lat:     data.lat     as number,
    lng:     data.lng     as number,
    heading: (data.heading as number) ?? 0,
    links:   (data.links   as PanoLink[]) ?? [],
  };
}

async function loadPanoTexture(
  panoId: string, session: string, apiKey: string
): Promise<THREE.Texture> {
  const ZOOM      = 2;
  const COLS      = 4;
  const ROWS      = 2;
  const TILE_SIZE = 512;

  const canvas   = document.createElement('canvas');
  canvas.width   = COLS * TILE_SIZE; // 2048
  canvas.height  = ROWS * TILE_SIZE; // 1024
  const ctx      = canvas.getContext('2d')!;

  // Fetch all 8 tiles in parallel
  const tiles: Promise<void>[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cx = x, cy = y; // capture loop vars
      tiles.push(
        fetch(
          `/api/streetview/tiles/${ZOOM}/${cx}/${cy}` +
          `?session=${session}&panoId=${panoId}`
        )
        .then(r => {
          if (!r.ok) throw new Error(`tile ${cx},${cy} status ${r.status}`);
          return r.blob();
        })
        .then(blob => {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          return new Promise<void>((resolve, reject) => {
            img.onload = () => {
              ctx.drawImage(img, cx * TILE_SIZE, cy * TILE_SIZE);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`img ${cx},${cy}`)); };
            img.src = url;
          });
        })
      );
    }
  }
  await Promise.all(tiles);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── Math helpers ─────────────────────────────────────────────
function angleDiff(a: number, b: number): number {
  let d = ((a - b) + 180) % 360 - 180;
  if (d < -180) d += 360;
  return d;
}
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Main Component ───────────────────────────────────────────
export default function VillageSceneStreetview() {
  const mountRef         = useRef<HTMLDivElement>(null);
  const keysRef          = useRef<Set<string>>(new Set());
  const hudTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walkBtnRef       = useRef(false); // mobile walk button held

  const [loading,      setLoading]      = useState(true);
  const [loadingText,  setLoadingText]  = useState('Connecting to Street View…');
  const [stepping,     setStepping]     = useState(false); // loading ring between panos
  const [hudVisible,   setHudVisible]   = useState(true);
  const [isMobile,     setIsMobile]     = useState(false);
  const [error,        setError]        = useState('');

  // Reset HUD hide timer on input
  const resetHud = () => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 5000);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) setIsMobile(true);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

    // All cleanup tasks accumulate here
    const disposeList: (() => void)[] = [];
    let cancelled = false;
    let animId    = 0;

    // ── Scene ───────────────────────────────────────────
    const scene  = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.rotation.order = 'YXZ';

    // ── Two crossfade spheres ────────────────────────────
    const geo  = new THREE.SphereGeometry(500, 60, 40);
    const matA = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 1.0, depthWrite: false });
    const matB = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 0.0, depthWrite: false });
    const sphA = new THREE.Mesh(geo, matA);
    const sphB = new THREE.Mesh(geo, matB);
    scene.add(sphA, sphB);

    // ── Renderer ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Clear any stale canvases (React Strict Mode double-mount)
    while (mountRef.current.firstChild) mountRef.current.removeChild(mountRef.current.firstChild);
    mountRef.current.appendChild(renderer.domElement);
    disposeList.push(() => {
      try { mountRef.current?.removeChild(renderer.domElement); } catch { /**/ }
      renderer.dispose();
      geo.dispose();
      matA.dispose();
      matB.dispose();
    });

    // ── Caches ───────────────────────────────────────────
    const texCache:  Record<string, THREE.Texture>  = {};
    const metaCache: Record<string, PanoMetadata>   = {};

    // ── Walker state ─────────────────────────────────────
    type WState = 'idle' | 'loading' | 'transitioning';
    let wState:            WState = 'idle';
    let currentPanoId            = '';
    let nextPanoId: string | null = null;
    let transitionProgress        = 0;
    const TRANS_DUR               = 0.7; // seconds

    // ── Camera angles ────────────────────────────────────
    let headingDeg = 0; // 0=north, 90=east
    let pitchDeg   = 0; // -80 to +80

    // ── Fetch + cache metadata ───────────────────────────
    async function loadMeta(panoId: string): Promise<PanoMetadata> {
      if (metaCache[panoId]) return metaCache[panoId];
      const session = await getSession(apiKey);
      const meta    = await fetchPanoMetadata(panoId, session, apiKey);
      if (!cancelled) metaCache[panoId] = meta;
      return meta;
    }

    // ── Background preload of next likely panos ──────────
    function schedulePreload() {
      const meta = metaCache[currentPanoId];
      if (!meta) return;
      const candidates = meta.links
        .filter(l => Math.abs(angleDiff(l.heading, headingDeg)) < 90)
        .slice(0, 2);

      for (const link of candidates) {
        if (!texCache[link.panoId]) {
          getSession(apiKey)
            .then(s => loadPanoTexture(link.panoId, s, apiKey))
            .then(tex => { if (!cancelled) texCache[link.panoId] = tex; else tex.dispose(); })
            .catch(() => {});
        }
        if (!metaCache[link.panoId]) {
          loadMeta(link.panoId).catch(() => {});
        }
      }
    }

    // ── Broadcast position to minimap ────────────────────
    function broadcastPosition() {
      const meta = metaCache[currentPanoId];
      if (!meta) return;
      const { x, z } = latLngToXZ(meta.lat, meta.lng);
      window.dispatchEvent(new CustomEvent('character-move', {
        detail: { x, z, heading: THREE.MathUtils.degToRad(headingDeg) },
      }));
    }

    // ── Trigger a step toward directionDeg ───────────────
    async function triggerWalk(directionDeg: number) {
      if (wState !== 'idle') return;
      const links = metaCache[currentPanoId]?.links ?? [];
      if (links.length === 0) return;

      const best = links.reduce((b, l) =>
        Math.abs(angleDiff(l.heading, directionDeg)) <
        Math.abs(angleDiff(b.heading, directionDeg)) ? l : b
      , links[0]);

      if (Math.abs(angleDiff(best.heading, directionDeg)) > 60) return;

      wState     = 'loading';
      nextPanoId = best.panoId;
      setStepping(true);

      try {
        const session = await getSession(apiKey);
        if (!texCache[nextPanoId]) {
          texCache[nextPanoId] = await loadPanoTexture(nextPanoId, session, apiKey);
          loadMeta(nextPanoId).catch(() => {});
        }
      } catch (e) {
        console.error('Walk load failed:', e);
        wState     = 'idle';
        nextPanoId = null;
        setStepping(false);
        return;
      }

      if (cancelled) return;

      setStepping(false);
      wState            = 'transitioning';
      transitionProgress = 0;

      matB.map         = texCache[nextPanoId];
      matB.needsUpdate = true;
    }

    // ── Keyboard ─────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      resetHud();
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))
        e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    disposeList.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    });

    // ── Mouse look ───────────────────────────────────────
    let isDragging = false;
    const onMouseDown = ()           => { isDragging = true;  resetHud(); };
    const onMouseUp   = ()           => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      headingDeg -= e.movementX * 0.15;
      pitchDeg    = Math.max(-80, Math.min(80, pitchDeg + e.movementY * 0.1));
    };
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup',   onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    disposeList.push(() => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup',   onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
    });

    // ── Touch look ───────────────────────────────────────
    let touchId = -1, lastTX = 0, lastTY = 0;
    const isMobileWalkZone = (x: number, y: number) =>
      x < 160 && y > window.innerHeight - 160;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      resetHud();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (touchId === -1 && !isMobileWalkZone(t.clientX, t.clientY)) {
          touchId = t.identifier;
          lastTX  = t.clientX;
          lastTY  = t.clientY;
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchId) continue;
        headingDeg -= (t.clientX - lastTX) * 0.25;
        pitchDeg    = Math.max(-80, Math.min(80, pitchDeg + (t.clientY - lastTY) * 0.2));
        lastTX      = t.clientX;
        lastTY      = t.clientY;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === touchId) touchId = -1;
    };
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove',  onTouchMove,  { passive: false });
    renderer.domElement.addEventListener('touchend',   onTouchEnd,   { passive: false });
    disposeList.push(() => {
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove',  onTouchMove);
      renderer.domElement.removeEventListener('touchend',   onTouchEnd);
    });

    // ── Resize ───────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    disposeList.push(() => window.removeEventListener('resize', onResize));

    // ── Animation loop ───────────────────────────────────
    let lastTime   = performance.now() / 1000;
    let walkReady  = true; // gates repeated W-hold triggering until next step

    function animate() {
      animId = requestAnimationFrame(animate);
      const now = performance.now() / 1000;
      const dt  = Math.min(now - lastTime, 0.1);
      lastTime  = now;

      const keys = keysRef.current;

      // ── Turn camera (A/D or Arrow keys) ────────────
      const TURN = 60; // deg/sec
      if (keys.has('a') || keys.has('arrowleft'))  headingDeg -= TURN * dt;
      if (keys.has('d') || keys.has('arrowright')) headingDeg += TURN * dt;

      // ── Walk trigger ───────────────────────────────
      const wantForward  = keys.has('w') || keys.has('arrowup')   || walkBtnRef.current;
      const wantBackward = keys.has('s') || keys.has('arrowdown');

      if (wState === 'idle') {
        if (wantForward || wantBackward) {
          if (walkReady) {
            walkReady = false;
            const dir = wantForward ? headingDeg : headingDeg + 180;
            triggerWalk(dir);
          }
        } else {
          walkReady = true; // key released — allow next tap
        }
      }

      // ── Transition animation ───────────────────────
      if (wState === 'transitioning') {
        transitionProgress += dt / TRANS_DUR;
        const t = easeInOut(Math.min(transitionProgress, 1));

        // Crossfade
        matA.opacity = 1 - t;
        matB.opacity = t;

        // FOV breathe: 90° → 82° → 90°
        camera.fov = 90 - Math.sin(t * Math.PI) * 8;
        camera.updateProjectionMatrix();

        // Head bob
        camera.position.y = Math.sin(t * Math.PI) * 0.08;

        if (transitionProgress >= 1) {
          // ── Swap spheres: B → new A ──────────────
          const oldTex = matA.map;
          const newTex = matB.map;

          matA.map = newTex;
          matA.opacity = 1;
          matB.map = oldTex;
          matB.opacity = 0;
          matA.needsUpdate = true;
          matB.needsUpdate = true;

          // Dispose old texture + remove from cache
          if (oldTex) {
            delete texCache[currentPanoId];
            oldTex.dispose();
          }

          currentPanoId      = nextPanoId!;
          nextPanoId         = null;
          transitionProgress = 0;
          wState             = 'idle';
          walkReady          = false; // require key re-press for next step

          camera.position.y = 0;
          camera.fov        = 90;
          camera.updateProjectionMatrix();

          broadcastPosition();
          schedulePreload();
        }
      }

      // ── Apply camera rotation ──────────────────────
      camera.rotation.y = -THREE.MathUtils.degToRad(headingDeg);
      camera.rotation.x = -THREE.MathUtils.degToRad(pitchDeg);

      renderer.render(scene, camera);
    }

    // ── Initialise ───────────────────────────────────────
    (async () => {
      try {
        if (cancelled) return;
        setLoadingText('Creating Street View session…');
        const session = await getSession(apiKey);

        if (cancelled) return;
        setLoadingText('Finding panorama…');
        const startId = await findPanoByLocation(
          START_LOCATION.lat, START_LOCATION.lng, session, apiKey
        );

        if (cancelled) return;
        setLoadingText('Loading metadata…');
        const startMeta = await loadMeta(startId);
        currentPanoId   = startId;
        headingDeg      = startMeta.heading; // face the street

        if (cancelled) return;
        setLoadingText('Loading panorama tiles…');
        const startTex      = await loadPanoTexture(startId, session, apiKey);
        texCache[startId]   = startTex;

        if (cancelled) return;
        matA.map         = startTex;
        matA.needsUpdate = true;

        setLoading(false);
        broadcastPosition();
        schedulePreload();
        animate();
      } catch (err) {
        console.error('Street View init error:', err);
        setError(String(err));
        setLoading(false);
      }
    })();

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      for (const fn of disposeList) fn();
      // Dispose all cached textures
      Object.values(texCache).forEach(t => t.dispose());
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Three.js canvas mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Initial loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black pointer-events-none">
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">🌍</div>
            <p className="text-white font-semibold">{loadingText}</p>
            <p className="text-white/50 text-sm">Claremont Village, CA</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
          <div className="text-center space-y-3 max-w-sm px-4">
            <div className="text-3xl">⚠️</div>
            <p className="text-white font-semibold">Street View unavailable</p>
            <p className="text-white/50 text-xs font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Between-pano loading ring */}
      {!loading && stepping && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
        </div>
      )}

      {/* Top-left HUD */}
      <div
        className="absolute top-4 left-4 pointer-events-none"
        style={{ transition: 'opacity 0.6s ease', opacity: hudVisible ? 1 : 0 }}
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <h1 className="text-lg font-bold tracking-wide">🏘️ Claremont Village</h1>
          <p className="text-xs text-white/60 mt-1">Google Street View</p>
        </div>
      </div>

      {/* Controls help */}
      {!loading && !error && (
        <div
          className="absolute pointer-events-none"
          style={{ bottom: 48, left: 16, transition: 'opacity 0.6s ease', opacity: hudVisible ? 1 : 0 }}
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 text-white/80 text-xs space-y-1">
            {isMobile ? (
              <>
                <p>👆 <span className="opacity-70">Drag</span> — Look around</p>
                <p>🚶 <span className="opacity-70">Walk button</span> — Move forward</p>
              </>
            ) : (
              <>
                <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">W / ↑</kbd> Walk forward</p>
                <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">S / ↓</kbd> Walk backward</p>
                <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">A D / ← →</kbd> Turn</p>
                <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">Mouse drag</kbd> Look</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Google Street View attribution — REQUIRED by ToS */}
      <div className="absolute bottom-2 right-2 text-white/60 text-xs bg-black/40 px-2 py-1 rounded pointer-events-none">
        © Google Street View
      </div>

      {/* Mobile walk button */}
      {isMobile && !loading && !error && (
        <div
          className="absolute select-none"
          style={{ bottom: 24, left: 24, touchAction: 'none' }}
          onPointerDown={e => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            walkBtnRef.current = true;
            resetHud();
          }}
          onPointerUp={()    => { walkBtnRef.current = false; }}
          onPointerLeave={() => { walkBtnRef.current = false; }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: 'rgba(255,255,255,0.85)',
          }}>
            ↑
          </div>
        </div>
      )}
    </div>
  );
}
