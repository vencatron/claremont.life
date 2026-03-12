'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────
interface AttributionEntry {
  type: string;
  value: string;
}

// ─── Character builder ────────────────────────────────────────
function createCharacter(): THREE.Group {
  const group = new THREE.Group();

  // Body (blue shirt)
  const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.3;
  body
  group.add(body);

  // Head (skin)
  const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const headMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.1;
  head
  group.add(head);

  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  for (const side of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side, 2.15, 0.26);
    group.add(eye);
  }

  // Legs (dark pants)
  const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.3);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  for (const side of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(side, 0.35, 0);
    leg
    group.add(leg);
  }

  // Arms (blue shirt)
  const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.25);
  const armMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
  for (const side of [-0.4, 0.4]) {
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(side, 1.2, 0);
    arm
    group.add(arm);
  }

  return group;
}

// ─── Main Component ───────────────────────────────────────────
export default function VillageScene3DTiles() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [attributions, setAttributions] = useState<string>('');
  const [posInfo, setPosInfo] = useState('');

  const keysRef = useRef<Set<string>>(new Set());
  const characterRef = useRef<THREE.Group | null>(null);
  const cameraAngleRef = useRef(0);
  const cameraDistRef = useRef(25);
  const cameraPitchRef = useRef(0.6);
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, startX: 0, startY: 0 });
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── Lazy-load 3d-tiles-renderer (client-only, ESM) ─────────
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

      if (cancelled) return;

      // ── Scene ─────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);
      // Light fog to help with depth perception
      // No fog — tiles handle their own LoD fading

      // ── Camera ────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        4000,
      );
      camera.position.set(0, 300, 200);
      camera.lookAt(0, 0, 0);

      // ── Renderer ──────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      // Shadows disabled — photorealistic tiles have baked lighting
      mountRef.current!.appendChild(renderer.domElement);

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

      // DRACO decoder for compressed meshes
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

      // Google's recommended default — good balance of detail vs speed
      tiles.errorTarget = 20;
      
      // Limit concurrent downloads to prevent network saturation
      tiles.downloadQueue.maxJobs = 6;
      tiles.parseQueue.maxJobs = 3;
      
      // Cap cached tiles
      tiles.lruCache.maxSize = 400;
      tiles.lruCache.minSize = 200;

      // Dismiss loading overlay when first tile model loads
      let loadingDismissed = false;
      const dismissLoading = () => {
        if (!loadingDismissed) {
          loadingDismissed = true;
          setLoading(false);
        }
      };
      tiles.addEventListener('load-model', dismissLoading);
      
      // Safety timeout — dismiss loading after 8 seconds no matter what
      const loadingTimeout = setTimeout(dismissLoading, 8000);

      scene.add(tiles.group);

      // ── Character ─────────────────────────────────────
      const character = createCharacter();
      // Start high — will snap to ground once tiles load via raycast
      character.position.set(0, 500, 0);
      character.visible = false; // hidden until we find ground
      scene.add(character);
      characterRef.current = character;

      // ── State refs ────────────────────────────────────
      let lastGroundY = 0;
      let groundFound = false;
      const groundRaycaster = new THREE.Raycaster();
      // firstHitOnly is not in Three.js types but speeds up raycasting when available
      (groundRaycaster as unknown as { firstHitOnly: boolean }).firstHitOnly = true;
      const DOWN = new THREE.Vector3(0, -1, 0);

      // ── Input ─────────────────────────────────────────
      const resetHudTimer = () => {
        setHudVisible(true);
        if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
        hudTimerRef.current = setTimeout(() => setHudVisible(false), 5000);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        keysRef.current.add(e.key.toLowerCase());
        resetHudTimer();
        // Prevent scrolling page
        if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        keysRef.current.delete(e.key.toLowerCase());
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      // Mobile detection
      if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) {
        setIsMobile(true);
      }

      // ── Mouse camera orbit ─────────────────────────────
      let isDragging = false;
      let lastMouseX = 0, lastMouseY = 0;

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        cameraAngleRef.current -= dx * 0.005;
        cameraPitchRef.current = Math.max(0.1, Math.min(1.3,
          cameraPitchRef.current + dy * 0.005));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };
      const onMouseUp = () => { isDragging = false; };
      const onWheel = (e: WheelEvent) => {
        cameraDistRef.current = Math.max(5, Math.min(80,
          cameraDistRef.current + e.deltaY * 0.05));
      };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      renderer.domElement.addEventListener('wheel', onWheel);

      // ── Touch: camera orbit + pinch zoom ──────────────
      const JOYSTICK_ZONE = 160;
      let touchCamActive = false;
      let touchCamId = -1;
      let lastTouchX = 0, lastTouchY = 0;
      let pinchDist = 0;

      const isInJoystickZone = (x: number, y: number) =>
        x < JOYSTICK_ZONE && y > window.innerHeight - JOYSTICK_ZONE;

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
          const t0 = e.touches[0], t1 = e.touches[1];
          pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          touchCamActive = false;
          return;
        }
        const t = e.touches[0];
        if (isInJoystickZone(t.clientX, t.clientY)) return;
        touchCamActive = true;
        touchCamId = t.identifier;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
          const t0 = e.touches[0], t1 = e.touches[1];
          const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          cameraDistRef.current = Math.max(5, Math.min(80,
            cameraDistRef.current + (pinchDist - d) * 0.05));
          pinchDist = d;
          return;
        }
        if (!touchCamActive) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier !== touchCamId) continue;
          cameraAngleRef.current -= (t.clientX - lastTouchX) * 0.005;
          cameraPitchRef.current = Math.max(0.1, Math.min(1.3,
            cameraPitchRef.current - (t.clientY - lastTouchY) * 0.005));
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      };

      const onTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchCamId) {
            touchCamActive = false;
          }
        }
      };

      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

      // ── Click / tap raycasting for building info ───────
      const clickRaycaster = new THREE.Raycaster();

      const onCanvasClick = (e: MouseEvent | TouchEvent) => {
        let clientX: number, clientY: number;
        if (e instanceof MouseEvent) {
          clientX = e.clientX; clientY = e.clientY;
        } else {
          const t = (e as TouchEvent).changedTouches[0];
          clientX = t.clientX; clientY = t.clientY;
        }
        const rect = renderer!.domElement.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        clickRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const hits = clickRaycaster.intersectObject(tiles.group, true);
        if (hits.length > 0) {
          // Try to find building name from tile metadata traversal
          let name = '';
          let type = '';
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj) {
            if (obj.userData?.name) { name = obj.userData.name; }
            if (obj.userData?.type) { type = obj.userData.type; }
            obj = obj.parent;
          }
          window.dispatchEvent(new CustomEvent('building-click', {
            detail: { name: name || 'Google 3D Tile', type: type || 'building' },
          }));
        }
      };

      renderer.domElement.addEventListener('click', onCanvasClick as EventListener);
      renderer.domElement.addEventListener('touchend', onCanvasClick as EventListener, { passive: false });

      // ── Resize ────────────────────────────────────────
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer!.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      // ── Animation loop ────────────────────────────────
      const velocity = new THREE.Vector3();
      const SPEED = 15;
      const FRICTION = 0.85;
      let walkCycle = 0;
      let frameCount = 0;

      const animate = () => {
        animId = requestAnimationFrame(animate);
        frameCount++;

        // ── Tiles update ─────────────────────────────
        camera.updateMatrixWorld();
        tiles.setResolutionFromRenderer(camera, renderer!);
        tiles.setCamera(camera);
        tiles.update();

        // ── Character movement ────────────────────────
        const keys = keysRef.current;
        const moveDir = new THREE.Vector3();

        const camForward = new THREE.Vector3(
          -Math.sin(cameraAngleRef.current), 0,
          -Math.cos(cameraAngleRef.current),
        ).normalize();
        const camRight = new THREE.Vector3(camForward.z, 0, -camForward.x);

        if (keys.has('w') || keys.has('arrowup'))    moveDir.add(camForward);
        if (keys.has('s') || keys.has('arrowdown'))  moveDir.sub(camForward);
        if (keys.has('a') || keys.has('arrowleft'))  moveDir.add(camRight);
        if (keys.has('d') || keys.has('arrowright')) moveDir.sub(camRight);

        // Virtual joystick
        const joy = joystickRef.current;
        if (joy.active && (Math.abs(joy.dx) > 0.05 || Math.abs(joy.dy) > 0.05)) {
          moveDir.add(camForward.clone().multiplyScalar(-joy.dy));
          moveDir.add(camRight.clone().multiplyScalar(joy.dx));
        }

        if (moveDir.length() > 0) {
          moveDir.normalize();
          velocity.add(moveDir.multiplyScalar(SPEED * 0.016));
          character.rotation.y = Math.atan2(velocity.x, velocity.z);
          // Walk animation
          walkCycle += 0.15;
          const legs = [character.children[4], character.children[5]]; // leg indices
          if (legs[0]) legs[0].rotation.x =  Math.sin(walkCycle) * 0.5;
          if (legs[1]) legs[1].rotation.x = -Math.sin(walkCycle) * 0.5;
          const arms = [character.children[6], character.children[7]]; // arm indices
          if (arms[0]) arms[0].rotation.x = -Math.sin(walkCycle) * 0.4;
          if (arms[1]) arms[1].rotation.x =  Math.sin(walkCycle) * 0.4;
        } else {
          walkCycle = 0;
          for (let i = 4; i <= 7; i++) {
            if (character.children[i]) character.children[i].rotation.x = 0;
          }
        }

        velocity.multiplyScalar(FRICTION);
        character.position.x += velocity.x;
        character.position.z += velocity.z;

        // Clamp to village area (~300m radius from center) to avoid loading distant tiles
        const VILLAGE_RADIUS = 300;
        const distFromCenter = Math.hypot(character.position.x, character.position.z);
        if (distFromCenter > VILLAGE_RADIUS) {
          const scale = VILLAGE_RADIUS / distFromCenter;
          character.position.x *= scale;
          character.position.z *= scale;
          velocity.set(0, 0, 0);
        }

        // ── Ground detection (every 3rd frame for perf) ─
        if (frameCount % 3 === 0) {
          // Raycast from high above straight down to find ground
          const origin = new THREE.Vector3(character.position.x, 2000, character.position.z);
          groundRaycaster.set(origin, DOWN);
          groundRaycaster.near = 0;
          groundRaycaster.far = 5000;
          const hits = groundRaycaster.intersectObject(tiles.group, true);
          if (hits.length > 0) {
            const groundY = hits[0].point.y;
            if (!groundFound) {
              // First ground hit — teleport character and camera
              groundFound = true;
              character.position.y = groundY + 1.0;
              lastGroundY = groundY;
              character.visible = true;
              // Position camera relative to character
              camera.position.set(
                character.position.x,
                character.position.y + 20,
                character.position.z + 40,
              );
              camera.lookAt(character.position);
            } else {
              lastGroundY = groundY;
            }
          }
        }

        // Smooth character to ground (only after first ground found)
        if (groundFound) {
          const targetY = lastGroundY + 0.05;
          character.position.y += (targetY - character.position.y) * 0.2;
        }

        // ── Camera follow (only after ground found) ────
        if (groundFound) {
          const dist  = cameraDistRef.current;
          const pitch = cameraPitchRef.current;
          const angle = cameraAngleRef.current;
          camera.position.set(
            character.position.x + Math.sin(angle) * dist * Math.cos(pitch),
            character.position.y + dist * Math.sin(pitch),
            character.position.z + Math.cos(angle) * dist * Math.cos(pitch),
          );
          camera.lookAt(character.position.x, character.position.y + 1.5, character.position.z);
        }

        // Sun follows character (directional light)
        sun.position.set(character.position.x + 100, 200, character.position.z + 50);

        // ── Minimap broadcast ─────────────────────────
        window.dispatchEvent(new CustomEvent('character-move', {
          detail: {
            x: character.position.x,
            z: character.position.z,
            heading: cameraAngleRef.current,
          },
        }));

        // ── Attribution (every 120 frames) ────────────
        if (frameCount % 120 === 0) {
          const attrs: AttributionEntry[] = tiles.getAttributions();
          const attrText = attrs
            .map((a) => (typeof a.value === 'string' ? a.value : ''))
            .filter(Boolean)
            .join(' · ');
          setAttributions(attrText || '© Google');

          // Position info
          setPosInfo(`${character.position.x.toFixed(0)}, ${character.position.z.toFixed(0)}`);
        }

        renderer!.render(scene, camera);
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
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', onResize);
        renderer!.domElement.removeEventListener('mousedown', onMouseDown);
        renderer!.domElement.removeEventListener('mousemove', onMouseMove);
        renderer!.domElement.removeEventListener('mouseup', onMouseUp);
        renderer!.domElement.removeEventListener('wheel', onWheel);
        renderer!.domElement.removeEventListener('touchstart', onTouchStart);
        renderer!.domElement.removeEventListener('touchmove', onTouchMove);
        renderer!.domElement.removeEventListener('touchend', onTouchEnd);
        renderer!.domElement.removeEventListener('click', onCanvasClick as EventListener);
        if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
        clearTimeout(loadingTimeout);
        tiles.removeEventListener('load-model', dismissLoading);
        tiles.dispose();
        try { mountRef.current?.removeChild(renderer!.domElement); } catch {}
        renderer!.dispose();
      };
    })().then((cleanup) => {
      // Store cleanup for when effect runs again
      if (cleanup && typeof cleanup === 'function') {
        // React will call the returned cleanup when unmounting
      }
    });

    // Return cleanup from useEffect
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

      {/* HUD — top-left, fades after inactivity */}
      <div
        className="absolute top-4 left-4 pointer-events-none"
        style={{ transition: 'opacity 0.6s ease', opacity: hudVisible ? 1 : 0 }}
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <h1 className="text-lg font-bold tracking-wide">🏘️ Claremont Village</h1>
          <p className="text-xs text-white/60 mt-1">
            {posInfo ? `📍 ${posInfo}` : 'Google Photorealistic 3D Tiles'}
          </p>
        </div>
      </div>

      {/* Controls help */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 64,
          left: 16,
          transition: 'opacity 0.6s ease',
          opacity: hudVisible ? 1 : 0,
        }}
      >
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 text-white/80 text-xs space-y-1">
          {isMobile ? (
            <>
              <p>🕹️ <span className="opacity-70">Joystick</span> Move</p>
              <p>👆 <span className="opacity-70">Drag</span> Look around</p>
              <p>🤏 <span className="opacity-70">Pinch</span> Zoom</p>
              <p>👆 <span className="opacity-70">Tap</span> Building info</p>
            </>
          ) : (
            <>
              <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">W A S D</kbd> Move</p>
              <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">Mouse Drag</kbd> Look around</p>
              <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">Scroll</kbd> Zoom</p>
              <p><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">Click</kbd> Building info</p>
            </>
          )}
        </div>
      </div>

      {/* Google Attribution — REQUIRED by ToS */}
      <div
        className="absolute bottom-2 left-0 right-0 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-1 text-white/70 text-[11px] flex items-center gap-2">
          <span>🗺️</span>
          <span>{attributions || '© Google'}</span>
        </div>
      </div>

      {/* Virtual joystick — mobile only */}
      {isMobile && (
        <div
          className="absolute"
          style={{ bottom: 24, left: 24, width: 120, height: 120, touchAction: 'none' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            joystickRef.current = {
              active: true, dx: 0, dy: 0,
              startX: rect.left + rect.width / 2,
              startY: rect.top + rect.height / 2,
            };
          }}
          onPointerMove={(e) => {
            if (!joystickRef.current.active) return;
            const { startX, startY } = joystickRef.current;
            const MAX = 40;
            const rawDx = e.clientX - startX;
            const rawDy = e.clientY - startY;
            const dist = Math.hypot(rawDx, rawDy);
            const scale = dist > MAX ? MAX / dist : 1;
            joystickRef.current.dx = (rawDx * scale) / MAX;
            joystickRef.current.dy = (rawDy * scale) / MAX;
            const nub = e.currentTarget.querySelector<HTMLElement>('.joy-nub');
            if (nub) nub.style.transform = `translate(${rawDx * scale}px, ${rawDy * scale}px)`;
          }}
          onPointerUp={(e) => {
            joystickRef.current.active = false;
            joystickRef.current.dx = 0;
            joystickRef.current.dy = 0;
            const nub = e.currentTarget.querySelector<HTMLElement>('.joy-nub');
            if (nub) nub.style.transform = 'translate(0px, 0px)';
          }}
        >
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div className="joy-nub" style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              position: 'absolute', transition: 'transform 0.05s',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
