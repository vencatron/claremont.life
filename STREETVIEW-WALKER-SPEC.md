# Street View Walker — Technical Spec
**Project:** claremont.life `/explore` page  
**Goal:** Smooth, continuous walking through Claremont Village + 7 Claremont Colleges using Google Street View panoramas  
**Replace:** `village-scene-3dtiles.tsx` → `village-scene-streetview.tsx`  
**Keep:** `page.tsx`, `minimap.tsx`, `building-info.tsx` (unchanged)

---

## Core Concept

Panoramas are discrete points ~10m apart. "Smooth walking" is an **illusion** created by:
1. Rendering panos as textures on Three.js spheres
2. Cross-fading between two spheres as the user walks
3. Subtle FOV breathe + camera bob during transition
4. Pre-caching the next pano ahead so transitions are instant

The user experience: hold W, camera glides forward down Indian Hill Blvd, cross-fading between photographic panoramas. No clicking, no teleporting.

---

## API Stack

**All via Maps Tiles API (same key as 3D tiles: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`)**

### 1. Create Session (once on mount)
```
POST https://tile.googleapis.com/v1/createSession?key={API_KEY}
Body: { "mapType": "streetview", "language": "en-US", "region": "US" }
Response: { "session": "...", "expiry": "..." }
```
Session lasts 2 weeks. Store in module-level var, refresh if expired.

### 2. Find Pano by Location
```
GET https://tile.googleapis.com/v1/streetview/panoIds
  ?locations=[{"lat":34.0975,"lng":-117.7180}]
  &radius=50
  &key={API_KEY}
  &session={SESSION}
Response: { "panoIds": ["PANO_ID_HERE"] }
```

### 3. Get Pano Metadata (neighbors + heading)
```
GET https://tile.googleapis.com/v1/streetview/metadata
  ?panoId={PANO_ID}
  &key={API_KEY}
  &session={SESSION}
Response: {
  "panoId": "...",
  "lat": 34.0975,
  "lng": -117.7180,
  "heading": 0,          // photographer heading
  "links": [             // neighboring panos
    { "panoId": "...", "heading": 45.2 },
    { "panoId": "...", "heading": 225.8 }
  ]
}
```

### 4. Fetch Pano Tiles (assemble full equirectangular)
```
GET https://tile.googleapis.com/v1/streetview/tiles/{zoom}/{x}/{y}
  ?session={SESSION}
  &key={API_KEY}
  &panoId={PANO_ID}
```

Use **zoom=2**: produces a 4×2 grid (8 tiles), each 512×512px  
Assembled = **2048×1024** equirectangular texture — perfect for a Three.js sphere

Assembly grid:
```
(0,0)(1,0)(2,0)(3,0)   ← y=0 (top half)
(0,1)(1,1)(2,1)(3,1)   ← y=1 (bottom half)
```

---

## Three.js Architecture

### Sphere Setup
```ts
// Two spheres, same position, both inside-out (BackSide)
const geometry = new THREE.SphereGeometry(500, 60, 40);

const sphereA = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
  side: THREE.BackSide,
  transparent: true,
  opacity: 1.0,
}));

const sphereB = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.0,
}));

scene.add(sphereA);
scene.add(sphereB);
```

### Camera
```ts
// Perspective camera — not orbit controls, we control it manually
const camera = new THREE.PerspectiveCamera(90, width/height, 0.1, 1000);
camera.position.set(0, 0, 0); // Always at origin — we rotate it, not move it
```

### State Machine
```ts
type WalkerState =
  | 'idle'           // standing still
  | 'transitioning'  // crossfading to next pano
  | 'loading'        // next pano image is fetching

let currentPanoId: string;
let nextPanoId: string | null;
let transitionProgress = 0; // 0 → 1
const TRANSITION_DURATION = 0.7; // seconds
```

---

## Pano Texture Loader

```ts
async function loadPanoTexture(panoId: string, session: string, apiKey: string): Promise<THREE.Texture> {
  const ZOOM = 2;
  const COLS = 4;
  const ROWS = 2;
  const TILE_SIZE = 512;

  // Create a canvas to assemble tiles
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TILE_SIZE;   // 2048
  canvas.height = ROWS * TILE_SIZE;  // 1024
  const ctx = canvas.getContext('2d')!;

  // Fetch all 8 tiles in parallel
  const tilePromises: Promise<void>[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      tilePromises.push(
        fetch(
          `https://tile.googleapis.com/v1/streetview/tiles/${ZOOM}/${x}/${y}` +
          `?session=${session}&key=${apiKey}&panoId=${panoId}`
        )
        .then(r => r.blob())
        .then(blob => {
          const img = new Image();
          const url = URL.createObjectURL(blob);
          return new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });
        })
      );
    }
  }

  await Promise.all(tilePromises);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
```

---

## Walking + Transition Logic

### Heading State
```ts
// The camera heading in degrees (0 = north, 90 = east, etc.)
let cameraHeadingDeg = 0;
const CAMERA_PITCH_REF = { value: 0 }; // -90 to +90

// Mouse drag changes heading
let isDragging = false;
canvas.addEventListener('mousedown', () => isDragging = true);
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  cameraHeadingDeg -= e.movementX * 0.15;
  CAMERA_PITCH_REF.value = clamp(CAMERA_PITCH_REF.value + e.movementY * 0.1, -80, 80);
});
```

### Apply Camera Rotation
```ts
// In animation loop — rotate camera based on heading + pitch
function applyCameraRotation() {
  const headingRad = THREE.MathUtils.degToRad(cameraHeadingDeg);
  const pitchRad = THREE.MathUtils.degToRad(CAMERA_PITCH_REF.value);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = -headingRad;
  camera.rotation.x = -pitchRad;
}
```

### Walk Trigger
```ts
// Called from animation loop when W/up is held
async function triggerWalk() {
  if (state !== 'idle') return;
  
  // Find nearest link in direction of camera heading
  const links = panoMetadataCache[currentPanoId]?.links ?? [];
  const bestLink = links.reduce((best, link) => {
    const diff = Math.abs(angleDiff(link.heading, cameraHeadingDeg));
    const bestDiff = Math.abs(angleDiff(best.heading, cameraHeadingDeg));
    return diff < bestDiff ? link : best;
  }, links[0]);

  // Only walk if we're roughly facing that direction (within 60°)
  if (!bestLink || Math.abs(angleDiff(bestLink.heading, cameraHeadingDeg)) > 60) return;

  state = 'loading';
  nextPanoId = bestLink.panoId;

  // Load next pano texture (may already be cached)
  if (!textureCache[nextPanoId]) {
    textureCache[nextPanoId] = await loadPanoTexture(nextPanoId, session, apiKey);
    // Also preload its metadata for the step after
    fetchPanoMetadata(nextPanoId);
  }

  // Begin transition
  state = 'transitioning';
  transitionProgress = 0;

  // Apply loaded texture to sphere B
  (sphereB.material as THREE.MeshBasicMaterial).map = textureCache[nextPanoId];
  (sphereB.material as THREE.MeshBasicMaterial).needsUpdate = true;
}

function angleDiff(a: number, b: number): number {
  let diff = ((a - b) + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}
```

### Transition Animation (in animation loop)
```ts
function updateTransition(dt: number) {
  if (state !== 'transitioning') return;

  transitionProgress += dt / TRANSITION_DURATION;

  // Ease in-out curve
  const t = easeInOut(Math.min(transitionProgress, 1));

  // Crossfade: A fades out, B fades in
  (sphereA.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  (sphereB.material as THREE.MeshBasicMaterial).opacity = t;

  // FOV breathe: zoom in slightly mid-transition (feels like walking forward)
  const fovBreath = 90 - Math.sin(t * Math.PI) * 8;
  camera.fov = fovBreath;
  camera.updateProjectionMatrix();

  // Head bob: subtle vertical offset mid-transition
  camera.position.y = Math.sin(t * Math.PI) * 0.08;

  if (transitionProgress >= 1) {
    // Swap spheres: B becomes new A
    const textureA = (sphereA.material as THREE.MeshBasicMaterial).map;
    const textureB = (sphereB.material as THREE.MeshBasicMaterial).map;

    (sphereA.material as THREE.MeshBasicMaterial).map = textureB;
    (sphereA.material as THREE.MeshBasicMaterial).opacity = 1;
    (sphereB.material as THREE.MeshBasicMaterial).map = textureA;
    (sphereB.material as THREE.MeshBasicMaterial).opacity = 0;
    (sphereA.material as THREE.MeshBasicMaterial).needsUpdate = true;
    (sphereB.material as THREE.MeshBasicMaterial).needsUpdate = true;

    // Dispose old texture A (now on B, unused)
    if (textureA) {
      textureA.dispose();
      // remove from cache if it's the old pano
      delete textureCache[currentPanoId];
    }

    currentPanoId = nextPanoId!;
    nextPanoId = null;
    transitionProgress = 0;
    state = 'idle';

    // Reset camera
    camera.position.y = 0;
    camera.fov = 90;
    camera.updateProjectionMatrix();

    // Preload the NEXT pano in current heading direction immediately
    schedulePreload();
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
```

---

## Preloading Strategy

```ts
// After arriving at a new pano, immediately preload likely next panos
async function schedulePreload() {
  const metadata = panoMetadataCache[currentPanoId];
  if (!metadata) return;

  // Preload the 2 most likely forward panos (within 90° of current heading)
  const candidates = metadata.links
    .filter(l => Math.abs(angleDiff(l.heading, cameraHeadingDeg)) < 90)
    .slice(0, 2);

  for (const link of candidates) {
    if (!textureCache[link.panoId]) {
      // Non-blocking background load
      loadPanoTexture(link.panoId, session, apiKey)
        .then(tex => { textureCache[link.panoId] = tex; })
        .catch(() => {}); // silent fail — just won't be cached
    }
    if (!panoMetadataCache[link.panoId]) {
      fetchPanoMetadata(link.panoId).catch(() => {});
    }
  }
}
```

---

## Starting Location

**Claremont Village entrance, Indian Hill Blvd:**
```ts
const START_LOCATION = { lat: 34.0975, lng: -117.7180 };
```

**Claremont Colleges circuit (optional tour mode):**
```ts
const COLLEGE_WAYPOINTS = [
  { name: 'Pomona College',        lat: 34.0996, lng: -117.7111 },
  { name: 'Scripps College',       lat: 34.1002, lng: -117.7090 },
  { name: 'Claremont McKenna',     lat: 34.1020, lng: -117.7110 },
  { name: 'Harvey Mudd College',   lat: 34.1064, lng: -117.7117 },
  { name: 'Pitzer College',        lat: 34.1040, lng: -117.7147 },
];
```

---

## Minimap Integration

Keep broadcasting position for the existing minimap:
```ts
// After each pano transition, get real-world coords from metadata
const meta = panoMetadataCache[currentPanoId];
window.dispatchEvent(new CustomEvent('character-move', {
  detail: {
    lat: meta.lat,
    lng: meta.lng,
    heading: cameraHeadingDeg,
  },
}));
```

Update `minimap.tsx` to accept `lat/lng` instead of `x/z` if needed.

---

## Loading States

```
Initial load:
  1. Create session → 200ms
  2. Find starting pano by location → 200ms
  3. Fetch pano metadata → 200ms
  4. Load 8 tiles in parallel → ~1-2s on fast connection
  5. Apply texture → sphere renders → dismiss loading screen

Subsequent walks (cached): instant (<50ms)
Subsequent walks (not cached): ~300-500ms → show subtle "loading" ring HUD indicator
```

---

## File to Create

**`/src/app/explore/village-scene-streetview.tsx`**  
Replace the import in `page.tsx`:
```ts
// was:
const VillageScene = dynamic(() => import('./village-scene-3dtiles'), ...);
// becomes:
const VillageScene = dynamic(() => import('./village-scene-streetview'), ...);
```

**Keep `village-scene-3dtiles.tsx`** — don't delete it. Just swap the import.

---

## Attribution (REQUIRED by ToS)

Must display on screen at all times:
```tsx
<div className="absolute bottom-2 right-2 text-white/60 text-xs bg-black/40 px-2 py-1 rounded">
  © Google Street View
</div>
```

---

## What NOT to do

- ❌ Don't use StreetViewPanorama widget from Maps JS API — you lose crossfade control
- ❌ Don't fetch tiles sequentially — always parallel (Promise.all)
- ❌ Don't keep old pano textures in cache indefinitely — GPU memory leak
- ❌ Don't allow walk trigger while already transitioning
- ❌ Don't use zoom > 2 for initial version — more tiles, slower, diminishing returns
