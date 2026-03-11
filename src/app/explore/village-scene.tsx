'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import villageData from './data/village-data.json';
import enrichmentData from './data/business-enrichment.json';

// ─── Enrich building data with business names + corrected heights ────
type BuildingEntry = typeof villageData.buildings[0] & { enrichedName?: string };

function applyEnrichment(buildings: typeof villageData.buildings): BuildingEntry[] {
  // Build name → height map from overrides
  const heightByName = new Map<string, number>();
  for (const o of enrichmentData.heightOverrides) {
    heightByName.set(o.name, o.height);
  }

  // Type → height defaults
  const typeHeights = enrichmentData.typeHeightDefaults as Record<string, number>;

  // Compute centroids once
  const centroids = buildings.map((b) => {
    const fp = b.footprint;
    const cx = fp.reduce((s: number, p: number[]) => s + p[0], 0) / fp.length;
    const cz = fp.reduce((s: number, p: number[]) => s + p[1], 0) / fp.length;
    return { cx, cz };
  });

  // Clone buildings so we can mutate
  const result: BuildingEntry[] = buildings.map((b) => ({ ...b }));

  // Apply height overrides for already-named buildings
  for (let i = 0; i < result.length; i++) {
    const b = result[i];
    if (b.name && heightByName.has(b.name)) {
      result[i] = { ...b, height: heightByName.get(b.name)! };
    } else if (!b.name) {
      // Apply type-based height defaults for unnamed buildings
      const typeH = typeHeights[b.type];
      if (typeH && b.height === 4) {
        result[i] = { ...b, height: typeH };
      }
    }
  }

  // Match each enrichment business to nearest building centroid
  const MATCH_RADIUS = 60; // meters
  for (const biz of enrichmentData.businesses) {
    let bestIdx = -1;
    let bestDist = MATCH_RADIUS;
    for (let i = 0; i < centroids.length; i++) {
      const dx = centroids[i].cx - biz.x;
      const dz = centroids[i].cz - biz.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      const existing = result[bestIdx];
      // Only overwrite if building has no name, or if it's a known empty name
      if (!existing.name) {
        const updated: BuildingEntry = {
          ...existing,
          name: biz.name,
          type: biz.type || existing.type,
        };
        if ((biz as { height?: number }).height) {
          updated.height = (biz as { height?: number }).height!;
        } else if (heightByName.has(biz.name)) {
          updated.height = heightByName.get(biz.name)!;
        } else if (typeHeights[biz.type]) {
          updated.height = typeHeights[biz.type];
        }
        result[bestIdx] = updated;
      }
    }
  }

  return result;
}

const enrichedBuildings = applyEnrichment(villageData.buildings);

// ─── Color palette ───────────────────────────────────────────
const COLORS = {
  sky: 0x87CEEB,
  ground: 0x4a7c4f,       // grass green
  road: 0x3a3a3a,          // dark asphalt
  sidewalk: 0xb0a89a,      // warm concrete
  buildingBase: 0xe8ddd0,  // warm beige
  buildingAlt: 0xd4c5b2,   // slightly darker
  buildingCommercial: 0xf0e6d6,
  buildingRetail: 0xf5efe5,
  roof: 0x8b6f5c,          // terracotta-ish
  roofFlat: 0x9a9a9a,
  tree: 0x2d5a27,
  treeTrunk: 0x5c3a1e,
  mountain: 0x6b7c5a,
  mountainSnow: 0xf0f0f0,
  windowDay: 0xa8d4e6,
  awning: 0xc0392b,
  awningAlt: 0x27ae60,
  signBg: 0x2c2c2c,
  signText: 0xffffff,
};

// ─── Building color by type ──────────────────────────────────
function getBuildingColor(type: string): number {
  const map: Record<string, number> = {
    commercial: COLORS.buildingCommercial,
    retail: COLORS.buildingRetail,
    hotel: 0xd4a76a,
    church: 0xf0e0c0,
    college: 0xc8b8a0,
    apartments: 0xd0c0b0,
    residential: 0xddd0c0,
    house: 0xe0d5c5,
  };
  return map[type] || COLORS.buildingBase;
}

// ─── Slugify a building name for texture lookup ───────────────
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Apply Street View texture to front facade ────────────────
function applyFacadeTexture(
  footprint: number[][],
  height: number,
  name: string,
  scene: THREE.Scene,
  textureLoader: THREE.TextureLoader
) {
  // Find the longest edge — treat it as the front facade
  let maxLen = 0;
  let bestI = 0;
  for (let i = 0; i < footprint.length - 1; i++) {
    const len = Math.sqrt(
      (footprint[i + 1][0] - footprint[i][0]) ** 2 +
      (footprint[i + 1][1] - footprint[i][1]) ** 2
    );
    if (len > maxLen) { maxLen = len; bestI = i; }
  }

  const [x1, z1] = footprint[bestI];
  const [x2, z2] = footprint[bestI + 1];
  const dx = x2 - x1;
  const dz = z2 - z1;
  const edgeLen = Math.sqrt(dx * dx + dz * dz);

  // Outward normal (perpendicular to edge, pointing away from building interior)
  const nx = -dz / edgeLen;
  const nz = dx / edgeLen;

  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  const slug = nameToSlug(name);
  const texturePath = `/explore/textures/buildings/${slug}.jpg`;

  // Create plane covering the full front face
  const planeGeo = new THREE.PlaneGeometry(edgeLen, height);

  textureLoader.load(
    texturePath,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: false,
      });
      const plane = new THREE.Mesh(planeGeo, mat);
      // Position at face centroid, offset slightly outward to avoid z-fighting
      plane.position.set(cx + nx * 0.05, height / 2, cz + nz * 0.05);
      // Point the plane's +Z normal outward
      plane.lookAt(new THREE.Vector3(cx + nx * 10, height / 2, cz + nz * 10));
      plane.userData = { facadeTexture: true };
      scene.add(plane);
    },
    undefined,
    () => {
      // Texture not found — fall back to flat color (nothing to do, building already rendered)
    }
  );
}

// ─── Create a building mesh from footprint ───────────────────
function createBuilding(
  building: BuildingEntry,
  scene: THREE.Scene,
  textureLoader?: THREE.TextureLoader
) {
  const { footprint, height, name, type } = building;
  if (footprint.length < 3) return;

  // Create shape from footprint
  const shape = new THREE.Shape();
  shape.moveTo(footprint[0][0], footprint[0][1]);
  for (let i = 1; i < footprint.length; i++) {
    shape.lineTo(footprint[i][0], footprint[i][1]);
  }
  shape.closePath();

  // Extrude
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });

  // Rotate so extrusion goes up (Y axis)
  geometry.rotateX(-Math.PI / 2);

  const color = getBuildingColor(type);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { name, type, building: true };
  scene.add(mesh);

  // Add windows for taller buildings
  if (height >= 4) {
    addWindows(footprint, height, scene);
  }

  // Add awning for named commercial buildings
  if (name && (type === 'commercial' || type === 'retail')) {
    addAwning(footprint, height, name, scene);
  }

  // Add Street View facade texture for named buildings
  if (name && textureLoader) {
    applyFacadeTexture(footprint, height, name, scene, textureLoader);
  }

  // Add name label
  if (name) {
    const cx = footprint.reduce((s, p) => s + p[0], 0) / footprint.length;
    const cz = footprint.reduce((s, p) => s + p[1], 0) / footprint.length;
    addLabel(name, cx, height + 2, cz, scene);
  }
}

// ─── Windows ─────────────────────────────────────────────────
function addWindows(
  footprint: number[][],
  height: number,
  scene: THREE.Scene
) {
  const windowGeo = new THREE.PlaneGeometry(0.8, 1.0);
  const windowMat = new THREE.MeshLambertMaterial({
    color: COLORS.windowDay,
    transparent: true,
    opacity: 0.7,
  });

  // Place windows on longest edges
  for (let i = 0; i < footprint.length - 1; i++) {
    const [x1, z1] = footprint[i];
    const [x2, z2] = footprint[i + 1];
    const edgeLen = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
    if (edgeLen < 3) continue;

    const dx = x2 - x1;
    const dz = z2 - z1;
    const angle = Math.atan2(dx, dz);
    const nx = -dz / edgeLen;
    const nz = dx / edgeLen;

    const numWindows = Math.floor(edgeLen / 2.5);
    const floors = Math.floor(height / 4);

    for (let w = 0; w < numWindows; w++) {
      for (let f = 0; f < floors; f++) {
        const t = (w + 1) / (numWindows + 1);
        const wx = x1 + dx * t + nx * 0.05;
        const wz = z1 + dz * t + nz * 0.05;
        const wy = 2.5 + f * 4;

        const win = new THREE.Mesh(windowGeo, windowMat);
        win.position.set(wx, wy, wz);
        win.rotation.y = angle;
        scene.add(win);
      }
    }
  }
}

// ─── Awning ──────────────────────────────────────────────────
function addAwning(
  footprint: number[][],
  height: number,
  _name: string,
  scene: THREE.Scene
) {
  if (footprint.length < 2) return;

  // Find the longest edge (likely the front)
  let maxLen = 0;
  let bestI = 0;
  for (let i = 0; i < footprint.length - 1; i++) {
    const len = Math.sqrt(
      (footprint[i + 1][0] - footprint[i][0]) ** 2 +
      (footprint[i + 1][1] - footprint[i][1]) ** 2
    );
    if (len > maxLen) {
      maxLen = len;
      bestI = i;
    }
  }

  const [x1, z1] = footprint[bestI];
  const [x2, z2] = footprint[bestI + 1];
  const dx = x2 - x1;
  const dz = z2 - z1;
  const edgeLen = Math.sqrt(dx * dx + dz * dz);
  const nx = -dz / edgeLen;
  const nz = dx / edgeLen;
  const angle = Math.atan2(dx, dz);

  const awningGeo = new THREE.PlaneGeometry(Math.min(edgeLen, 8), 1.5);
  const colorChoice = Math.random() > 0.5 ? COLORS.awning : COLORS.awningAlt;
  const awningMat = new THREE.MeshLambertMaterial({
    color: colorChoice,
    side: THREE.DoubleSide,
  });

  const awning = new THREE.Mesh(awningGeo, awningMat);
  const cx = (x1 + x2) / 2 + nx * 0.8;
  const cz = (z1 + z2) / 2 + nz * 0.8;
  awning.position.set(cx, Math.min(height, 3.5), cz);
  awning.rotation.set(-0.3, angle, 0);
  scene.add(awning);
}

// ─── Text label (using sprite) ───────────────────────────────
function addLabel(
  text: string,
  x: number,
  y: number,
  z: number,
  scene: THREE.Scene
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 64;

  // Background
  ctx.fillStyle = 'rgba(30,30,30,0.85)';
  const radius = 8;
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 56, radius);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, y, z);
  sprite.scale.set(12, 1.5, 1);
  sprite.userData = { label: true, text };
  scene.add(sprite);
}

// ─── UV tiling helper ─────────────────────────────────────────
function setPlaneUVs(
  geo: THREE.PlaneGeometry,
  width: number,
  length: number,
  tileSize: number
) {
  const uvs = geo.attributes.uv as THREE.BufferAttribute;
  const scaleX = width / tileSize;
  const scaleY = length / tileSize;
  for (let i = 0; i < uvs.count; i++) {
    uvs.setX(i, uvs.getX(i) * scaleX);
    uvs.setY(i, uvs.getY(i) * scaleY);
  }
  uvs.needsUpdate = true;
}

// ─── Procedural texture generators ────────────────────────────
function makeAsphaltTexture(): THREE.CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#282828';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Pixel-level noise / grain
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = ((Math.random() * 28 - 14) | 0);
    const v = Math.max(18, Math.min(65, 40 + n));
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Aggregate specks (small stones visible in asphalt)
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = Math.random() * 2.2 + 0.4;
    const v = (Math.random() * 28 + 48) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeConcreteTexture(): THREE.CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b5ad9d';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Pixel-level variation
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = ((Math.random() * 18 - 9) | 0);
    d[i]     = Math.max(140, Math.min(210, 181 + n));
    d[i + 1] = Math.max(130, Math.min(200, 173 + n));
    d[i + 2] = Math.max(118, Math.min(188, 157 + n));
    d[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Expansion joint grid (every quarter of texture = every ~2 m at 8 m/tile)
  ctx.strokeStyle = 'rgba(100,94,80,0.65)';
  ctx.lineWidth = 2;
  const GRID = SIZE / 4;
  for (let x = GRID; x < SIZE; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SIZE); ctx.stroke();
  }
  for (let y = GRID; y < SIZE; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeGrassTexture(): THREE.CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3d6642';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Pixel variation for organic look
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = ((Math.random() * 32 - 16) | 0);
    d[i]     = Math.max(22, Math.min(90,  61 + n));
    d[i + 1] = Math.max(58, Math.min(160, 102 + (n * 1.5 | 0)));
    d[i + 2] = Math.max(18, Math.min(82,  66 + n));
    d[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Darker organic patches
  for (let i = 0; i < 130; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const rx = Math.random() * 22 + 5;
    const ry = Math.random() * 12 + 3;
    ctx.fillStyle = `rgba(18,68,22,${(Math.random() * 0.18 + 0.08).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── Crosswalk helper ─────────────────────────────────────────
// crossingEW=true → pedestrian crosses an E-W road (walks N-S)
// cx/cz = center of crosswalk; roadWidth = width of road being crossed
function addCrosswalk(
  cx: number, cz: number,
  crossingEW: boolean,
  roadWidth: number,
  scene: THREE.Scene,
  mat: THREE.MeshBasicMaterial
) {
  const STRIPE_W  = 0.40; // thickness in walking direction
  const STRIPE_GAP = 0.50;
  const STRIPE_LEN = 3.8; // length parallel to road edge
  const period = STRIPE_W + STRIPE_GAP;
  const numStripes = Math.max(4, Math.floor(roadWidth / period));
  const totalSpan = numStripes * period;

  for (let i = 0; i < numStripes; i++) {
    const offset = -totalSpan / 2 + i * period + STRIPE_W / 2;
    const geo = crossingEW
      ? new THREE.BoxGeometry(STRIPE_LEN, 0.004, STRIPE_W)  // stripes along X, stacked in Z
      : new THREE.BoxGeometry(STRIPE_W, 0.004, STRIPE_LEN); // stripes along Z, stacked in X
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      crossingEW ? cx : cx + offset,
      0.04,
      crossingEW ? cz + offset : cz,
    );
    scene.add(mesh);
  }
}

function addCrosswalks(scene: THREE.Scene, whiteMat: THREE.MeshBasicMaterial) {
  // ── Indian Hill Blvd (N-S, x≈-75, w=14) × Bonita Ave (E-W, z≈10, w=12) ──
  const IH_X = -75, IH_HW = 7;   // Indian Hill
  const BON_Z = 10, BON_HW = 6;  // Bonita Ave
  // Cross Indian Hill on N side of Bonita (pedestrian walks E-W)
  addCrosswalk(IH_X, BON_Z + BON_HW + 2.0, false, 14, scene, whiteMat);
  // Cross Indian Hill on S side of Bonita
  addCrosswalk(IH_X, BON_Z - BON_HW - 2.0, false, 14, scene, whiteMat);
  // Cross Bonita on W side of Indian Hill (pedestrian walks N-S)
  addCrosswalk(IH_X - IH_HW - 2.0, BON_Z, true, 12, scene, whiteMat);
  // Cross Bonita on E side of Indian Hill
  addCrosswalk(IH_X + IH_HW + 2.0, BON_Z, true, 12, scene, whiteMat);

  // ── Indian Hill Blvd × 2nd Street (E-W, z≈-95, w≈8) ──
  const ST2_Z = -95, ST2_HW = 4;
  addCrosswalk(IH_X, ST2_Z + ST2_HW + 2.0, false, 14, scene, whiteMat);
  addCrosswalk(IH_X, ST2_Z - ST2_HW - 2.0, false, 14, scene, whiteMat);
  addCrosswalk(IH_X - IH_HW - 2.0, ST2_Z, true, 8, scene, whiteMat);
  addCrosswalk(IH_X + IH_HW + 2.0, ST2_Z, true, 8, scene, whiteMat);

  // ── Yale Ave (N-S, x≈55, w≈8) × Bonita Ave ──
  const YALE_X = 55, YALE_HW = 4;
  addCrosswalk(YALE_X, BON_Z + BON_HW + 2.0, false, 8, scene, whiteMat);
  addCrosswalk(YALE_X, BON_Z - BON_HW - 2.0, false, 8, scene, whiteMat);
  addCrosswalk(YALE_X - YALE_HW - 2.0, BON_Z, true, 12, scene, whiteMat);
  addCrosswalk(YALE_X + YALE_HW + 2.0, BON_Z, true, 12, scene, whiteMat);
}

// ─── Streets ─────────────────────────────────────────────────
function createStreets(scene: THREE.Scene) {
  // ── Shared textures (one per call) ─────────────────────────
  const asphaltTex  = makeAsphaltTexture();
  const concreteTex = makeConcreteTexture();

  // ── Shared materials ────────────────────────────────────────
  const roadMat     = new THREE.MeshLambertMaterial({ map: asphaltTex });
  const footwayMat  = new THREE.MeshLambertMaterial({ map: concreteTex, color: 0xb8b2a5 });
  const sidewalkMat = new THREE.MeshLambertMaterial({ map: concreteTex, color: 0xc2bcb0 });
  const whiteMat    = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const yellowMat   = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });

  for (const street of villageData.streets) {
    if (street.points.length < 2) continue;

    const halfW = street.width / 2;
    const isFootway = street.type === 'footway'
      || street.type === 'cycleway'
      || street.type === 'pedestrian';

    for (let i = 0; i < street.points.length - 1; i++) {
      const [x1, z1] = street.points[i];
      const [x2, z2] = street.points[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.5) continue;

      const cx   = (x1 + x2) / 2;
      const cz   = (z1 + z2) / 2;
      const angle = Math.atan2(dx, dz);
      const nx   = -dz / len;  // lateral unit vector
      const nz   =  dx / len;
      const yPos = 0.02 + (isFootway ? 0.05 : 0);

      // ── Road / footway surface ────────────────────────────
      const roadW = halfW * 2;
      const geo   = new THREE.PlaneGeometry(roadW, len);
      setPlaneUVs(geo, roadW, len, 4); // 4 m per texture tile

      const mat   = isFootway ? footwayMat : roadMat;
      const mesh  = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -angle;
      mesh.position.set(cx, yPos, cz);
      mesh.receiveShadow = true;
      scene.add(mesh);

      // ── Concrete sidewalk strips alongside vehicle roads ──
      if (!isFootway && street.width >= 8) {
        const swW   = 1.5;
        const swGeo = new THREE.PlaneGeometry(swW, len);
        setPlaneUVs(swGeo, swW, len, 2); // 2 m tile for sidewalk concrete

        for (const side of [-1, 1]) {
          const sw = new THREE.Mesh(swGeo, sidewalkMat);
          sw.rotation.x = -Math.PI / 2;
          sw.rotation.z = -angle;
          sw.position.set(
            cx + nx * (halfW + swW / 2) * side,
            0.05,
            cz + nz * (halfW + swW / 2) * side,
          );
          sw.receiveShadow = true;
          scene.add(sw);
        }
      }

      // ── Road markings (major roads only for performance) ──
      if (!isFootway && street.width >= 8 && len > 3) {
        const dirX = dx / len;
        const dirZ = dz / len;

        // White solid edge lines
        const edgeOffset = halfW - 0.25;
        for (const side of [-1, 1]) {
          const edgeGeo  = new THREE.BoxGeometry(0.12, 0.004, Math.max(0.1, len - 0.4));
          const edgeMesh = new THREE.Mesh(edgeGeo, whiteMat);
          edgeMesh.rotation.y = angle;
          edgeMesh.position.set(
            cx + nx * edgeOffset * side,
            yPos + 0.002,
            cz + nz * edgeOffset * side,
          );
          scene.add(edgeMesh);
        }

        // Yellow dashed center line (2-lane roads, width ≥ 10 m)
        if (street.width >= 10) {
          const dashLen  = 2.5;
          const gapLen   = 2.5;
          const period   = dashLen + gapLen;
          const count    = Math.max(0, Math.floor((len - 1) / period));
          const startT   = -(count * period) / 2 + dashLen / 2;

          for (let d = 0; d < count; d++) {
            const t       = startT + d * period;
            const dashGeo = new THREE.BoxGeometry(0.14, 0.004, dashLen);
            const dashMesh = new THREE.Mesh(dashGeo, yellowMat);
            dashMesh.rotation.y = angle;
            dashMesh.position.set(
              cx + dirX * t,
              yPos + 0.003,
              cz + dirZ * t,
            );
            scene.add(dashMesh);
          }
        }
      }
    }

    // Street name labels for major roads
    if (street.name && street.width >= 10 && street.points.length >= 2) {
      const midIdx = Math.floor(street.points.length / 2);
      const [mx, mz] = street.points[midIdx];
      addStreetLabel(street.name, mx, mz, scene);
    }
  }

  // ── Crosswalk markings at key intersections ────────────────
  addCrosswalks(scene, whiteMat);
}

const addedStreetLabels = new Set<string>();
function addStreetLabel(name: string, x: number, z: number, scene: THREE.Scene) {
  const key = `${name}-${Math.round(x / 50)}-${Math.round(z / 50)}`;
  if (addedStreetLabels.has(key)) return;
  addedStreetLabels.add(key);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 512;
  canvas.height = 48;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(0, 0, 512, 48);
  ctx.fillStyle = '#333333';
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), 256, 24);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, 0.5, z);
  sprite.scale.set(16, 1.5, 1);
  scene.add(sprite);
}

// ─── Trees ───────────────────────────────────────────────────
function createTree(x: number, z: number, scene: THREE.Scene) {
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, 1.25, z);
  trunk.castShadow = true;
  scene.add(trunk);

  // Randomize tree shape
  const r = 1.2 + Math.random() * 0.8;
  const h = 2.5 + Math.random() * 1.5;
  const leafGeo = new THREE.SphereGeometry(r, 8, 6);
  // Vary green shade naturally
  const g = 0x30 + Math.floor(Math.random() * 0x30);
  const shade = (0x1a << 16) | (g << 8) | (0x14 + Math.floor(Math.random() * 0x15));
  const leafMat = new THREE.MeshLambertMaterial({ color: shade });
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  leaves.position.set(x, 2.5 + h / 2, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

function scatterTrees(scene: THREE.Scene) {
  // Trees along sidewalks of main streets
  const treeSpots: [number, number][] = [];

  for (const street of villageData.streets) {
    if (street.width < 8) continue;
    const halfW = street.width / 2;

    for (let i = 0; i < street.points.length - 1; i += 3) {
      const [x1, z1] = street.points[i];
      const [x2, z2] = street.points[Math.min(i + 1, street.points.length - 1)];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 1) continue;
      const nx = -dz / len;
      const nz = dx / len;

      for (const side of [-1, 1]) {
        if (Math.random() > 0.4) {
          treeSpots.push([
            x1 + nx * (halfW + 2) * side + (Math.random() - 0.5),
            z1 + nz * (halfW + 2) * side + (Math.random() - 0.5),
          ]);
        }
      }
    }
  }

  for (const [x, z] of treeSpots) {
    createTree(x, z, scene);
  }
}

// ─── Mountains (background) ─────────────────────────────────
function createMountains(scene: THREE.Scene) {
  // San Gabriel Mountains to the north
  const peaks = [
    { x: -200, z: 350, h: 120, w: 300 },
    { x: 0, z: 400, h: 180, w: 250 },
    { x: 150, z: 380, h: 150, w: 280 },
    { x: -100, z: 420, h: 200, w: 350 },
    { x: 200, z: 450, h: 160, w: 300 },
    { x: -250, z: 380, h: 100, w: 200 },
    { x: 300, z: 400, h: 130, w: 250 },
  ];

  for (const peak of peaks) {
    const geo = new THREE.ConeGeometry(peak.w / 2, peak.h, 8);
    const mat = new THREE.MeshLambertMaterial({ color: COLORS.mountain });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(peak.x, peak.h / 2 - 20, peak.z);
    scene.add(mesh);

    // Snow cap
    if (peak.h > 130) {
      const snowGeo = new THREE.ConeGeometry(peak.w / 6, peak.h / 5, 8);
      const snowMat = new THREE.MeshLambertMaterial({ color: COLORS.mountainSnow });
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(peak.x, peak.h - 20, peak.z);
      scene.add(snow);
    }
  }
}

// ─── Ground plane ────────────────────────────────────────────
function createGround(scene: THREE.Scene) {
  const GROUND_SIZE = 1200;
  const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  // 1 texture tile ≈ 8 m
  setPlaneUVs(geo, GROUND_SIZE, GROUND_SIZE, 8);
  const grassTex = makeGrassTexture();
  const mat = new THREE.MeshLambertMaterial({ map: grassTex });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.01;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// ─── Character ───────────────────────────────────────────────
function createCharacter(): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.3;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const headMat = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.1;
  head.castShadow = true;
  group.add(head);

  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  for (const side of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side, 2.15, 0.26);
    group.add(eye);
  }

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.3);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  for (const side of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(side, 0.35, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.25);
  const armMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
  for (const side of [-0.4, 0.4]) {
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(side, 1.2, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  return group;
}

// ─── AABB collision box type ─────────────────────────────────
interface AABB { minX: number; maxX: number; minZ: number; maxZ: number }

function isInsideAABB(x: number, z: number, boxes: AABB[]): boolean {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) return true;
  }
  return false;
}

// ─── Main Component ──────────────────────────────────────────
export default function VillageScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const keysRef = useRef<Set<string>>(new Set());
  const characterRef = useRef<THREE.Group | null>(null);
  const cameraAngleRef = useRef(0);
  const cameraDistRef = useRef(25);
  const cameraPitchRef = useRef(0.6);
  // Collision boxes for all buildings
  const buildingBoxesRef = useRef<AABB[]>([]);
  // Virtual joystick state (no re-renders)
  const joystickRef = useRef({ active: false, dx: 0, dy: 0, startX: 0, startY: 0 });
  // HUD fade timer
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputRef = useRef(Date.now());

  useEffect(() => {
    if (!mountRef.current) return;

    // ─── Scene setup ───────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.sky);
    scene.fog = new THREE.Fog(COLORS.sky, 200, 600);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // ─── Lighting ──────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(100, 150, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    scene.add(sun);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x4a7c4f, 0.4);
    scene.add(hemi);

    // ─── Build the world ───────────────────────────────
    createGround(scene);
    createStreets(scene);

    // Create a shared TextureLoader for Street View facades
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);

    for (const building of enrichedBuildings) {
      createBuilding(building, scene, textureLoader);
    }

    // ─── Build AABB collision boxes ────────────────────
    const PAD = 0.6;
    const boxes: AABB[] = [];
    for (const building of enrichedBuildings) {
      const fp = building.footprint;
      if (fp.length < 3) continue;
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, z] of fp) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      boxes.push({ minX: minX - PAD, maxX: maxX + PAD, minZ: minZ - PAD, maxZ: maxZ + PAD });
    }
    buildingBoxesRef.current = boxes;

    scatterTrees(scene);
    createMountains(scene);

    // ─── Character ─────────────────────────────────────
    const character = createCharacter();
    character.position.set(0, 0, 0); // Start at center (Yale & 2nd)
    scene.add(character);
    characterRef.current = character;

    // ─── Input handling ────────────────────────────────
    const resetHudTimer = () => {
      lastInputRef.current = Date.now();
      setHudVisible(true);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
      hudTimerRef.current = setTimeout(() => setHudVisible(false), 5000);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      resetHudTimer();
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Detect touch / mobile
    const hasTouched = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    if (hasTouched) setIsMobile(true);

    // Mouse for camera orbit
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

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
      cameraPitchRef.current = Math.max(0.1, Math.min(1.2,
        cameraPitchRef.current + dy * 0.005));
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      cameraDistRef.current = Math.max(8, Math.min(80,
        cameraDistRef.current + e.deltaY * 0.05));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // ─── Touch: camera orbit + pinch zoom ──────────────
    // Joystick area: bottom-left 160×160px — touch events there go to joystick
    const JOYSTICK_ZONE = 160;
    let touchCamActive = false;
    let touchCamId = -1;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let pinchDist = 0;

    const isInJoystickZone = (x: number, y: number) =>
      x < JOYSTICK_ZONE && y > window.innerHeight - JOYSTICK_ZONE;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        // Pinch start
        const t0 = e.touches[0], t1 = e.touches[1];
        pinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        touchCamActive = false;
        return;
      }
      const t = e.touches[0];
      if (isInJoystickZone(t.clientX, t.clientY)) return; // handled by joystick
      touchCamActive = true;
      touchCamId = t.identifier;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        // Pinch zoom
        const t0 = e.touches[0], t1 = e.touches[1];
        const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const delta = pinchDist - d;
        cameraDistRef.current = Math.max(8, Math.min(80,
          cameraDistRef.current + delta * 0.05));
        pinchDist = d;
        return;
      }
      if (!touchCamActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchCamId) continue;
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        cameraAngleRef.current -= dx * 0.005;
        cameraPitchRef.current = Math.max(0.1, Math.min(1.2,
          cameraPitchRef.current + dy * 0.005));
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

    // ─── Click / Tap raycasting ────────────────────────
    const raycaster = new THREE.Raycaster();
    const buildingMeshes: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && obj.userData.building) {
        buildingMeshes.push(obj);
      }
    });

    const onCanvasClick = (e: MouseEvent | TouchEvent) => {
      let clientX: number, clientY: number;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        const t = (e as TouchEvent).changedTouches[0];
        clientX = t.clientX;
        clientY = t.clientY;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hits = raycaster.intersectObjects(buildingMeshes, false);
      if (hits.length > 0) {
        const { name, type } = hits[0].object.userData;
        window.dispatchEvent(new CustomEvent('building-click', { detail: { name, type } }));
      }
    };

    renderer.domElement.addEventListener('click', onCanvasClick as EventListener);
    renderer.domElement.addEventListener('touchend', onCanvasClick as EventListener, { passive: false });

    // ─── Resize ────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ─── Animation loop ────────────────────────────────
    const velocity = new THREE.Vector3();
    const SPEED = 15;
    const FRICTION = 0.85;
    let walkCycle = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      const keys = keysRef.current;
      const moveDir = new THREE.Vector3();

      // Get camera-relative forward/right (forward = direction camera faces)
      const camForward = new THREE.Vector3(
        Math.sin(cameraAngleRef.current),
        0,
        Math.cos(cameraAngleRef.current)
      ).normalize();
      const camRight = new THREE.Vector3(
        camForward.z, 0, -camForward.x
      );

      if (keys.has('w') || keys.has('arrowup')) moveDir.add(camForward);
      if (keys.has('s') || keys.has('arrowdown')) moveDir.sub(camForward);
      if (keys.has('a') || keys.has('arrowleft')) moveDir.sub(camRight);
      if (keys.has('d') || keys.has('arrowright')) moveDir.add(camRight);

      // Virtual joystick input
      const joy = joystickRef.current;
      if (joy.active && (Math.abs(joy.dx) > 0.05 || Math.abs(joy.dy) > 0.05)) {
        moveDir.add(camForward.clone().multiplyScalar(joy.dy));
        moveDir.add(camRight.clone().multiplyScalar(-joy.dx));
      }

      if (moveDir.length() > 0) {
        moveDir.normalize();
        velocity.add(moveDir.multiplyScalar(SPEED * 0.016));

        // Face movement direction
        const targetAngle = Math.atan2(velocity.x, velocity.z);
        character.rotation.y = targetAngle;

        // Walk animation
        walkCycle += 0.15;
        const legs = character.children.filter((_, i) => i === 3 || i === 4);
        if (legs[0]) legs[0].rotation.x = Math.sin(walkCycle) * 0.5;
        if (legs[1]) legs[1].rotation.x = -Math.sin(walkCycle) * 0.5;
        const arms = character.children.filter((_, i) => i === 5 || i === 6);
        if (arms[0]) arms[0].rotation.x = -Math.sin(walkCycle) * 0.4;
        if (arms[1]) arms[1].rotation.x = Math.sin(walkCycle) * 0.4;
      } else {
        // Idle — reset limbs
        walkCycle = 0;
        for (let i = 3; i <= 6; i++) {
          if (character.children[i]) character.children[i].rotation.x = 0;
        }
      }

      velocity.multiplyScalar(FRICTION);

      // ─── Collision detection (AABB + wall sliding) ──
      const bboxes = buildingBoxesRef.current;
      const cx = character.position.x + velocity.x;
      const cz = character.position.z + velocity.z;
      if (!isInsideAABB(cx, cz, bboxes)) {
        character.position.x = cx;
        character.position.z = cz;
      } else {
        // Try X-axis only
        if (!isInsideAABB(character.position.x + velocity.x, character.position.z, bboxes)) {
          character.position.x += velocity.x;
        }
        // Try Z-axis only
        if (!isInsideAABB(character.position.x, character.position.z + velocity.z, bboxes)) {
          character.position.z += velocity.z;
        }
      }

      // ─── Camera follow ─────────────────────────────
      const dist = cameraDistRef.current;
      const pitch = cameraPitchRef.current;
      const angle = cameraAngleRef.current;

      camera.position.set(
        character.position.x + Math.sin(angle) * dist * Math.cos(pitch),
        character.position.y + dist * Math.sin(pitch),
        character.position.z + Math.cos(angle) * dist * Math.cos(pitch)
      );
      camera.lookAt(
        character.position.x,
        character.position.y + 2,
        character.position.z
      );

      // Update sun to follow character
      sun.position.set(
        character.position.x + 100,
        150,
        character.position.z + 50
      );
      sun.target.position.copy(character.position);
      sun.target.updateMatrixWorld();

      // ─── Info display ──────────────────────────────
      const pos = character.position;
      setInfo(
        `${Math.round(pos.x)}, ${Math.round(pos.z)} · ` +
        `${enrichedBuildings.filter(b => b.name).length} named · ${enrichedBuildings.length} buildings`
      );

      // ─── Minimap broadcast ─────────────────────────
      window.dispatchEvent(new CustomEvent('character-move', {
        detail: {
          x: character.position.x,
          z: character.position.z,
          heading: cameraAngleRef.current,
        },
      }));

      renderer.render(scene, camera);
    };

    animate();

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('click', onCanvasClick as EventListener);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="w-full h-full" />

      {/* HUD — fades after 5s of inactivity */}
      <div
        className="absolute top-4 left-4 pointer-events-none"
        style={{
          transition: 'opacity 0.6s ease',
          opacity: hudVisible ? 1 : 0,
        }}
      >
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <h1 className="text-lg font-bold tracking-wide">
            🏘️ Claremont Village
          </h1>
          <p className="text-xs text-white/60 mt-1">{info}</p>
        </div>
      </div>

      {/* Controls help — fades with HUD */}
      <div
        className="absolute bottom-4 left-4 pointer-events-none"
        style={{
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
              <p>👆 <span className="opacity-70">Tap</span> building info</p>
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

      {/* Virtual joystick — mobile only */}
      {isMobile && (
        <div
          className="absolute"
          style={{ bottom: 24, left: 24, width: 120, height: 120, touchAction: 'none' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            joystickRef.current = {
              active: true,
              dx: 0,
              dy: 0,
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
            // Move nub visually
            const nub = e.currentTarget.querySelector<HTMLElement>('.joy-nub');
            if (nub) {
              nub.style.transform = `translate(${rawDx * scale}px, ${rawDy * scale}px)`;
            }
          }}
          onPointerUp={(e) => {
            joystickRef.current.active = false;
            joystickRef.current.dx = 0;
            joystickRef.current.dy = 0;
            const nub = e.currentTarget.querySelector<HTMLElement>('.joy-nub');
            if (nub) nub.style.transform = 'translate(0px, 0px)';
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              width: '100%', height: '100%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Inner nub */}
            <div
              className="joy-nub"
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                position: 'absolute',
                transition: 'transform 0.05s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
