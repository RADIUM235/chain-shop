"use client";

import { useEffect, useRef } from "react";

// Links are tiny so the stacked chains read as a fine texture
const LINK_LENGTH = 12;
const LINK_WIDTH = 6;
const STROKE = 1.5;
// Thickness of an edge-on link
const BAR = STROKE * 1.4;
// Distance between link centers; less than LINK_LENGTH so neighbours interlock
const PITCH = LINK_LENGTH * 0.6;
const SPEED = 18; // px per second the links slide along their curve

// The centre chain rides a sine wave. Every other chain is that curve pushed
// out a fixed distance square to it (like contour lines), so neighbouring
// chains are the same distance apart all the way along.
const AMPLITUDE = 200; // vertical distance from a peak to a valley
const STEP = 320; // horizontal distance from a peak to the next valley
// Distance between neighbouring chains, measured square to the curve
const ROW_SPACING = 9;
// Far from the centre the chains would bend tighter than this at the peaks
// and valleys (or fold into sharp points), so those turns are rounded off
const MIN_TURN = 30;
const WAVE_SPEED = 24; // px per second the wave shape travels sideways
const SAMPLES = 200; // points per slope in the lookup table

type Wave = {
  xs: number[];
  ys: number[];
  nxs: number[];
  nys: number[];
};
type Row = {
  xs: number[];
  ys: number[];
  lens: number[];
  total: number;
};

// The rising slope of the centre curve (valley → peak) with downward unit
// normals. The falling slope is its mirror image. A sine bends tightest right
// at its peaks and valleys, so pushed-out rows only ever fold there.
function sampleWave(): Wave {
  const wave: Wave = { xs: [], ys: [], nxs: [], nys: [] };
  const half = AMPLITUDE / 2;
  const k = Math.PI / STEP;
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * STEP;
    const slope = -half * k * Math.sin(k * x);
    const len = Math.hypot(1, slope);
    wave.xs.push(x);
    wave.ys.push(half * Math.cos(k * x));
    wave.nxs.push(-slope / len);
    wave.nys.push(1 / len);
  }
  return wave;
}

// The centre curve pushed `offset` px along its normals (positive = down).
// Pushed far enough, a row would loop back on itself at a peak or valley, so
// it is cut where it crosses the peak/valley line and the turn is rounded to
// at least MIN_TURN.
function buildRow(wave: Wave, offset: number): Row {
  const px = wave.xs.map((x, i) => x + wave.nxs[i] * offset);
  const py = wave.ys.map((y, i) => y + wave.nys[i] * offset);
  // Last point still left of the valley line, first point past the peak line
  let a = 0;
  for (let i = 0; i <= SAMPLES; i++) if (px[i] <= 0) a = i;
  let b = SAMPLES;
  for (let i = a + 1; i <= SAMPLES; i++) {
    if (px[i] >= STEP) {
      b = i;
      break;
    }
  }
  const cross = (i: number, x: number) => {
    const f = (x - px[i]) / (px[i + 1] - px[i] || 1);
    return py[i] + (py[i + 1] - py[i]) * f;
  };

  // The rising slope, with the normals kept alongside
  let hx = [0, ...px.slice(a + 1, b), STEP];
  let hy = [a < SAMPLES ? cross(a, 0) : py[a], ...py.slice(a + 1, b), cross(b - 1, STEP)];
  let hnx = [wave.nxs[a], ...wave.nxs.slice(a + 1, b), wave.nxs[b]];
  let hny = [wave.nys[a], ...wave.nys.slice(a + 1, b), wave.nys[b]];

  // Peak: walk back from the top until a circle centred on the peak line and
  // touching the row is at least MIN_TURN wide, then follow that circle over
  const lastIndex = hx.length - 1;
  let k = -1;
  for (let i = lastIndex - 1; i > 0; i--) {
    if (hnx[i] > 1e-9 && (STEP - hx[i]) / hnx[i] >= MIN_TURN) {
      k = i;
      break;
    }
  }
  if (k > 0 && k < lastIndex - 1) {
    const r = (STEP - hx[k]) / hnx[k];
    const cy = hy[k] + hny[k] * r;
    const from = Math.atan2(hy[k] - cy, hx[k] - STEP);
    const to = -Math.PI / 2;
    const n = Math.max(1, Math.ceil(((to - from) * r) / 2));
    hx = hx.slice(0, k + 1);
    hy = hy.slice(0, k + 1);
    hnx = hnx.slice(0, k + 1);
    hny = hny.slice(0, k + 1);
    for (let j = 1; j <= n; j++) {
      const angle = from + ((to - from) * j) / n;
      hx.push(j === n ? STEP : STEP + r * Math.cos(angle));
      hy.push(cy + r * Math.sin(angle));
      hnx.push(-Math.cos(angle));
      hny.push(-Math.sin(angle));
    }
  }

  // Valley: the same, mirrored, with the circle above the row
  k = -1;
  for (let i = 1; i < hx.length - 1; i++) {
    if (hnx[i] > 1e-9 && hx[i] / hnx[i] >= MIN_TURN) {
      k = i;
      break;
    }
  }
  if (k > 1) {
    const r = hx[k] / hnx[k];
    const cy = hy[k] - hny[k] * r;
    const from = Math.PI / 2;
    const to = Math.atan2(hy[k] - cy, hx[k]);
    const n = Math.max(1, Math.ceil(((from - to) * r) / 2));
    const arcX: number[] = [];
    const arcY: number[] = [];
    for (let j = 0; j < n; j++) {
      const angle = from + ((to - from) * j) / n;
      arcX.push(j === 0 ? 0 : r * Math.cos(angle));
      arcY.push(cy + r * Math.sin(angle));
    }
    hx = [...arcX, ...hx.slice(k)];
    hy = [...arcY, ...hy.slice(k)];
  }

  // Rising slope, then the falling slope as its mirror image
  const xs = [...hx];
  const ys = [...hy];
  for (let i = hx.length - 2; i >= 0; i--) {
    xs.push(2 * STEP - hx[i]);
    ys.push(hy[i]);
  }

  const lens = [0];
  for (let i = 1; i < xs.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  }
  return { xs, ys, lens, total: lens[lens.length - 1] };
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

// Tens of thousands of links are on screen, so they are drawn on the GPU: one
// small quad per link, and the shader carves the link's rounded outline out of it
const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec4 link; // centre x, y, direction cos, sin
layout(location = 2) in float edgeOn; // 0 or 1
uniform vec2 resolution;
uniform vec2 halfSize;
out vec2 local;
out float vEdgeOn;
void main() {
  local = corner * halfSize;
  vec2 p = link.xy + vec2(local.x * link.z - local.y * link.w, local.x * link.w + local.y * link.z);
  vEdgeOn = edgeOn;
  gl_Position = vec4(p / resolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 local;
in float vEdgeOn;
uniform vec3 color;
uniform float dpr;
uniform vec3 loop; // straight half-length, end radius, half stroke
uniform vec2 bar; // straight half-length, end radius
out vec4 outColor;
void main() {
  float d;
  if (vEdgeOn < 0.5) {
    // Flat link, seen face-on: the outline of a rounded loop
    vec2 q = local - vec2(clamp(local.x, -loop.x, loop.x), 0.0);
    d = abs(length(q) - loop.y) - loop.z;
  } else {
    // Edge-on link: just the thickness of the metal
    vec2 q = local - vec2(clamp(local.x, -bar.x, bar.x), 0.0);
    d = length(q) - bar.y;
  }
  float a = clamp(0.5 - d * dpr, 0.0, 1.0);
  outColor = vec4(color * a, a);
}`;

const FLOATS_PER_LINK = 5;

function compile(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  return program;
}

function parseColor(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h, 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Arc length along a row at horizontal position x (rows never double back)
function arcAtX({ xs, lens, total }: Row, period: number, x: number) {
  const wrap = Math.floor(x / period);
  const local = x - wrap * period;
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= local) lo = mid;
    else hi = mid;
  }
  const f = (local - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return wrap * total + lens[lo] + (lens[hi] - lens[lo]) * f;
}

export function ChainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false });
    // Purely decorative, so without WebGL2 the hero simply has no background
    if (!canvas || !gl) return;

    const program = compile(gl);
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const resolutionLoc = uniform("resolution");
    const dprLoc = uniform("dpr");
    const colorLoc = uniform("color");
    const pad = STROKE / 2 + 1;
    gl.uniform2f(uniform("halfSize"), LINK_LENGTH / 2 + pad, LINK_WIDTH / 2 + pad);
    gl.uniform3f(uniform("loop"), (LINK_LENGTH - LINK_WIDTH) / 2, LINK_WIDTH / 2, STROKE / 2);
    gl.uniform2f(uniform("bar"), (LINK_LENGTH - BAR) / 2, BAR / 2);

    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const linkBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
    const stride = FLOATS_PER_LINK * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(2, 1);

    // Colors are premultiplied by coverage in the shader
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let time = 0;
    let last = performance.now();
    let period = 0;
    let rows: Row[] = [];
    let links = new Float32Array(FLOATS_PER_LINK * 50000);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLoc, width, height);
      gl.uniform1f(dprLoc, dpr);

      // Enough rows either side of the centre that the outermost ones sit
      // fully off screen, even at their peaks and valleys
      const n = Math.ceil((height / 2 + AMPLITUDE / 2 + LINK_WIDTH) / ROW_SPACING);
      const wave = sampleWave();
      period = STEP * 2;
      rows = [];
      for (let r = -n; r <= n; r++) rows.push(buildRow(wave, r * ROW_SPACING));
      draw();
    };

    const draw = () => {
      // Read the color every frame so a system theme switch is picked up live
      const color = getComputedStyle(canvas).getPropertyValue("--chain").trim();
      gl.uniform3f(colorLoc, ...parseColor(color));

      // Shift by whole pairs so flat/edge-on alternation never flips
      const slide = mod(time * SPEED, PITCH * 2);
      const cy = height / 2;
      // Every row shares the same wave, so the whole stack moves as one
      const shift = time * WAVE_SPEED;
      const margin = LINK_LENGTH;
      let count = 0;

      for (const row of rows) {
        const { xs, ys, lens, total } = row;
        const lastIndex = lens.length - 1;
        // Visible stretch of this row, in arc length along it
        const uFrom = arcAtX(row, period, -margin - shift);
        const uTo = arcAtX(row, period, width + margin - shift);

        let wrap = NaN;
        let j = 0;
        for (let k = Math.ceil((uFrom - slide) / PITCH); ; k++) {
          const u = k * PITCH + slide;
          if (u > uTo) break;
          // Links only move forward along the row, so walk the table
          // instead of searching it
          const w = Math.floor(u / total);
          if (w !== wrap) {
            wrap = w;
            j = 0;
          }
          const s = u - w * total;
          while (j < lastIndex - 1 && lens[j + 1] <= s) j++;
          const seg = lens[j + 1] - lens[j] || 1;
          const f = (s - lens[j]) / seg;
          const dx = xs[j + 1] - xs[j];
          const dy = ys[j + 1] - ys[j];
          const y = cy + ys[j] + dy * f;
          if (y < -margin || y > height + margin) continue;

          if ((count + 1) * FLOATS_PER_LINK > links.length) {
            const grown = new Float32Array(links.length * 2);
            grown.set(links);
            links = grown;
          }
          const o = count++ * FLOATS_PER_LINK;
          links[o] = w * period + xs[j] + dx * f + shift;
          links[o + 1] = y;
          links[o + 2] = dx / seg;
          links[o + 3] = dy / seg;
          links[o + 4] = k & 1;
        }
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, links.subarray(0, count * FLOATS_PER_LINK), gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
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
