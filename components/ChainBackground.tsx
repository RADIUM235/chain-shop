"use client";

import { useEffect, useRef } from "react";

const LINK_LENGTH = 44;
const LINK_WIDTH = 22;
const STROKE = 5;
// Distance between link centers; less than LINK_LENGTH so neighbours interlock
const PITCH = LINK_LENGTH * 0.6;
const SPEED = 18; // px per second the links slide along their curve
// Empty stretch of curve between one arc of chain and the next
const ARC_GAP = 90;
// Links fade in/out over this distance at the ends of each arc
const FADE = 30;
// How many peaks/valleys each unbroken stretch of chain spans
const ARC_SPAN = 3;

// Every chain rides the same smooth zig-zag: peaks and valleys joined by
// cubic Béziers with horizontal tangents, so every turn is a soft arc.
const STEP = 320; // horizontal distance from a peak to the next valley
const AMPLITUDE = 200; // vertical distance from a peak to a valley
const PERIOD = STEP * 2;
// Vertical distance between stacked chains. Rows are exact parallel copies,
// so on the steepest slopes they sit closer (about 0.73×) than on the crests.
const ROW_SPACING = 48;
const WAVE_SPEED = 24; // px per second the wave shape travels sideways
const SAMPLES = 200; // points per Bézier segment in the lookup table

type Table = { xs: number[]; ys: number[]; lens: number[]; total: number };

// One period of the curve (valley → peak → valley), sampled by arc length
function buildTable(): Table {
  const xs: number[] = [];
  const ys: number[] = [];
  const lens: number[] = [];
  const half = AMPLITUDE / 2;
  const c = STEP / 2;
  let len = 0;
  for (let seg = 0; seg < 2; seg++) {
    const x0 = seg * STEP;
    const y0 = seg === 0 ? half : -half;
    const y1 = -y0;
    for (let i = seg === 0 ? 0 : 1; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const mt = 1 - t;
      const x =
        x0 + 3 * mt * mt * t * c + 3 * mt * t * t * (STEP - c) + t * t * t * STEP;
      const y = (mt * mt * mt + 3 * mt * mt * t) * y0 + (3 * mt * t * t + t * t * t) * y1;
      if (xs.length) len += Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]);
      xs.push(x);
      ys.push(y);
      lens.push(len);
    }
  }
  return { xs, ys, lens, total: len };
}

function lookup({ xs, ys, lens }: Table, s: number) {
  let lo = 0;
  let hi = lens.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lens[mid] <= s) lo = mid;
    else hi = mid;
  }
  const f = (s - lens[lo]) / (lens[hi] - lens[lo] || 1);
  const dx = xs[hi] - xs[lo];
  const dy = ys[hi] - ys[lo];
  return { x: xs[lo] + dx * f, y: ys[lo] + dy * f, angle: Math.atan2(dy, dx) };
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function ChainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const table = buildTable();
    const { total } = table;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let time = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Read the color every frame so a system theme switch is picked up live
      const color = getComputedStyle(canvas).getPropertyValue("--chain").trim();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = STROKE;

      // Shift by whole pairs so flat/edge-on alternation never flips
      const slide = mod(time * SPEED, PITCH * 2);
      const top = mod(height, ROW_SPACING) / 2;
      const rows = Math.ceil(height / ROW_SPACING) + 1;
      // Every row shares the same wave, so the whole stack moves as one
      const shift = time * WAVE_SPEED;
      // Visible stretch of each row, in arc length along its wave
      const uFrom = Math.floor((-LINK_LENGTH - shift) / PERIOD) * total;
      const uTo = Math.ceil((width + LINK_LENGTH - shift) / PERIOD) * total;

      for (let r = -1; r <= rows; r++) {
        const cy = top + r * ROW_SPACING;

        for (let k = Math.floor((uFrom - slide) / PITCH); ; k++) {
          const u = k * PITCH + slide;
          if (u > uTo) break;
          const m = mod(u, total);
          // The arc gaps sit at the steep midpoint of a Bézier segment (each is
          // half a period long), skipping ARC_SPAN - 1 segments between gaps
          const span = (ARC_SPAN * total) / 2;
          const g = mod(u - total / 4, span);
          const edge = Math.min(g, span - g) - ARC_GAP / 2 - LINK_LENGTH / 2;
          if (edge <= 0) continue;

          const p = lookup(table, m);
          const x = Math.floor(u / total) * PERIOD + p.x + shift;
          if (x < -LINK_LENGTH || x > width + LINK_LENGTH) continue;

          // Links at the ends of an arc fade out to nothing; the rest stay solid
          ctx.globalAlpha = Math.min(1, edge / FADE);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.translate(x, cy + p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          if ((k & 1) === 0) {
            // Flat link, seen face-on: an open rounded loop
            ctx.roundRect(-LINK_LENGTH / 2, -LINK_WIDTH / 2, LINK_LENGTH, LINK_WIDTH, LINK_WIDTH / 2);
            ctx.stroke();
          } else {
            // Edge-on link: just the thickness of the metal
            ctx.roundRect(-LINK_LENGTH / 2, -STROKE / 2 - 1, LINK_LENGTH, STROKE + 2, STROKE / 2 + 1);
            ctx.fill();
          }
        }
      }
    };

    const tick = (now: number) => {
      time += (now - last) / 1000;
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };

    resize();
    if (!reduceMotion) frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Without the animation loop, redraw when the theme class changes
    const themeObserver = new MutationObserver(() => reduceMotion && draw());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full [--chain:#d9d9d9] dark:[--chain:#3a3a3a]"
    />
  );
}
