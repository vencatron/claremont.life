'use client';

import { useEffect, useRef } from 'react';
import villageData from './data/village-data.json';

// ─── Minimap renders a top-down view of the village ─────────
// Listens for CustomEvent 'character-move' with {x, z, heading}

const CANVAS_SIZE = 150;    // px
const VIEW_RANGE  = 200;    // world-units (metres) from centre to edge
const SCALE       = CANVAS_SIZE / (VIEW_RANGE * 2); // px per world unit

const TYPE_COLORS: Record<string, string> = {
  commercial: '#e8c87a',
  retail:     '#e8b87a',
  hotel:      '#c4936e',
  church:     '#d4b890',
  college:    '#b8a888',
  apartments: '#b0a898',
  residential:'#c8b8a8',
  house:      '#c4b8a0',
};

function getBuildingFill(type: string): string {
  return TYPE_COLORS[type] ?? '#c8bdb0';
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Character state (mutable, no re-render needed)
  const charRef = useRef({ x: 0, z: 0, heading: 0 });

  // ─── Draw on canvas ──────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: cx, z: cz, heading } = charRef.current;

    // World-to-canvas transform: translate so char is at centre
    const worldToCanvas = (wx: number, wz: number): [number, number] => {
      const dx = wx - cx;
      const dz = wz - cz;
      return [
        CANVAS_SIZE / 2 + dx * SCALE,
        CANVAS_SIZE / 2 + dz * SCALE,
      ];
    };

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = 'rgba(15, 20, 15, 0.85)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Clip to canvas bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.clip();

    // ─── Streets ─────────────────────────────────────────
    for (const street of villageData.streets) {
      if (street.points.length < 2) continue;
      const isFootway = street.type === 'footway' || street.type === 'cycleway';
      ctx.strokeStyle = isFootway ? '#5a5a5a' : '#3a3a3a';
      ctx.lineWidth = isFootway ? 0.5 : Math.max(0.8, street.width * SCALE * 0.5);
      ctx.beginPath();
      for (let i = 0; i < street.points.length; i++) {
        const [px, py] = worldToCanvas(street.points[i][0], street.points[i][1]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // ─── Buildings ───────────────────────────────────────
    for (const building of villageData.buildings) {
      const fp = building.footprint;
      if (fp.length < 3) continue;

      // Quick bounds check — skip if all points are off canvas
      const pts = fp.map((p: number[]) => worldToCanvas(p[0], p[1]));
      const inBounds = pts.some(
        ([px, py]: [number, number]) =>
          px >= -5 && px <= CANVAS_SIZE + 5 && py >= -5 && py <= CANVAS_SIZE + 5
      );
      if (!inBounds) continue;

      ctx.fillStyle = getBuildingFill(building.type);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // ─── Character dot + heading arrow ───────────────────
    const charX = CANVAS_SIZE / 2;
    const charY = CANVAS_SIZE / 2;
    const dotR = 4;

    // Heading indicator (triangle pointing in direction of travel)
    const headX = charX + Math.sin(heading) * (dotR + 5);
    const headY = charY - Math.cos(heading) * (dotR + 5);
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(
      charX + Math.sin(heading + 2.4) * dotR,
      charY - Math.cos(heading + 2.4) * dotR
    );
    ctx.lineTo(
      charX + Math.sin(heading - 2.4) * dotR,
      charY - Math.cos(heading - 2.4) * dotR
    );
    ctx.closePath();
    ctx.fillStyle = '#00e5ff';
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(charX, charY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1);
  }

  useEffect(() => {
    // Initial draw
    draw();

    // Listen for character position updates
    const handler = (e: Event) => {
      const { x, z, heading } = (e as CustomEvent).detail as {
        x: number; z: number; heading: number;
      };
      charRef.current = { x, z, heading };
      draw();
    };

    window.addEventListener('character-move', handler);
    return () => window.removeEventListener('character-move', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 200,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ display: 'block' }}
      />
      {/* Scale label */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 6,
          color: 'rgba(255,255,255,0.4)',
          fontSize: '9px',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.03em',
          pointerEvents: 'none',
        }}
      >
        400m
      </div>
    </div>
  );
}
