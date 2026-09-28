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

// Seigaiha: overlapping "scales", each a stack of concentric half-rings. Every
// ring is a chain, and each row of scales sits in front of the row above it.
const RADIUS = 96; // outer ring of a scale
const RING_SPACING = 10; // distance between the rings of a scale
const MIN_RING = 16; // smallest ring radius
// With PER_SCALE, each scale is one flat color picked from this gradient by
// where it sits on screen (first color at the bottom, last at the top).
// Otherwise every scale runs through it ring by ring: the last color on its
// outer edge, the first at its centre.
const PER_SCALE = false;
const GRADIENT = [
  "#0a122f", "#0f163c", "#1e2b7e", "#2939b5", "#3149db", "#315ae9",
  "#2b68e5", "#2874e0", "#2582d9", "#208fda", "#139fdb", "#00add8",
  "#10b7d2", "#16c1ba", "#1bcaa2", "#20d38a", "#25dc72", "#2ae55a",
  "#2fee42", "#34f72a", "#3dff19", "#6eff53", "#9eff8c", "#cfffc6",
  "#ffffff",
];
// Rows of scales behind text marked data-chain-text use this gradient
// instead, ring by ring the same way, stopping at FIRE_TOP so the outer
// rings stay orange rather than white and the (white) text reads over them
const FIRE_GRADIENT = [
  "#040404", "#0c0808", "#1a0f0f", "#251515", "#2f1c1c", "#3b2223",
  "#5d2a29", "#b02923", "#fe0006", "#ff3b00", "#ff5d00", "#ff7602",
  "#ff8b00", "#ff9f00", "#ffb738", "#ffddad", "#fffefd",
];
const FIRE_TOP = 0.8;
const DRIFT = 24; // px per second the pattern travels sideways

// A scale hides everything behind it out to just past its outer ring
const COVER = RADIUS + LINK_WIDTH / 2 + STROKE;

const RINGS: number[] = [];
for (let r = RADIUS; r >= MIN_RING; r -= RING_SPACING) RINGS.push(r);

// Angle (from the horizontal, 0..90°) where a ring first peeks out from under
// the scale in front of it and to the right. Links below that are never seen,
// so they are skipped; the depth test trims the ones that are partly hidden.
function visibleFrom(r: number) {
  const reach = COVER - LINK_LENGTH;
  for (let a = 0; a < Math.PI / 2; a += 0.002) {
    const dx = r * Math.cos(a) - RADIUS;
    const dy = r * Math.sin(a) + RADIUS / 2;
    if (dx * dx + dy * dy >= reach * reach) return a;
  }
  return Math.PI / 2;
}
const RING_FROM = RINGS.map(visibleFrom);

const mod = (a: number, n: number) => ((a % n) + n) % n;

// Tens of thousands of links are on screen, so they are drawn on the GPU: one
// small quad per link, and the shader carves the link's rounded outline out of it
const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec4 link; // centre x, y, direction cos, sin
// edge-on (0 or 1), gradient position (0..1, or 2..3 for the fire gradient), depth
layout(location = 2) in vec3 style;
uniform vec2 resolution;
uniform vec3 gradient[${GRADIENT.length}];
uniform vec3 fire[${FIRE_GRADIENT.length}];
uniform vec2 halfSize;
out vec2 local;
out float vEdgeOn;
out vec3 vColor;
void main() {
  local = corner * halfSize;
  vec2 p = link.xy + vec2(local.x * link.z - local.y * link.w, local.x * link.w + local.y * link.z);
  vEdgeOn = style.x;
  if (style.y > 1.5) {
    float g = clamp(style.y - 2.0, 0.0, 1.0) * ${FIRE_GRADIENT.length - 1}.0;
    int i = int(min(floor(g), ${FIRE_GRADIENT.length - 2}.0));
    vColor = mix(fire[i], fire[i + 1], g - float(i));
  } else {
    float g = clamp(style.y, 0.0, 1.0) * ${GRADIENT.length - 1}.0;
    int i = int(min(floor(g), ${GRADIENT.length - 2}.0));
    vColor = mix(gradient[i], gradient[i + 1], g - float(i));
  }
  gl_Position = vec4(p / resolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), style.z, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 local;
in float vEdgeOn;
in vec3 vColor;
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
  outColor = vec4(vColor * a, a);
}`;

// Each scale's solid disc, drawn into the depth buffer only, so it hides the
// scales behind it without painting anything
const DISC_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec3 disc; // centre x, y, depth
uniform vec2 resolution;
uniform float radius;
out vec2 local;
void main() {
  local = corner * radius;
  vec2 p = disc.xy + local;
  gl_Position = vec4(p / resolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), disc.z, 1.0);
}`;

const DISC_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 local;
uniform float radius;
out vec4 outColor;
void main() {
  if (length(local) > radius) discard;
  outColor = vec4(0.0);
}`;

// Film look, applied to the finished frame: a slight softening and a glow
// that bleeds out of the bright chains (halation)
const SOFTEN = 0.8; // blur radius, px
const HALATION = 0.9; // glow strength
const HALATION_TINT = [1.0, 0.55, 0.45]; // film halation leans warm

const POST_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 corner;
out vec2 uv;
void main() {
  uv = corner * 0.5 + 0.5;
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

// Keeps only the bright parts of the frame, as the source of the glow
const BRIGHT_SHADER = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D source;
out vec4 outColor;
void main() {
  vec3 c = texture(source, uv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(c * smoothstep(0.3, 0.9, lum), 1.0);
}`;

// One direction of a Gaussian blur; run twice (across, then down)
const BLUR_SHADER = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D source;
uniform vec2 dir;
out vec4 outColor;
void main() {
  vec3 c = texture(source, uv).rgb * 0.2270;
  c += (texture(source, uv + dir * 1.3846).rgb + texture(source, uv - dir * 1.3846).rgb) * 0.3162;
  c += (texture(source, uv + dir * 3.2308).rgb + texture(source, uv - dir * 3.2308).rgb) * 0.0703;
  outColor = vec4(c, 1.0);
}`;

const COMPOSITE_SHADER = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D scene;
uniform sampler2D glow;
uniform vec2 soften; // blur radius in texture coordinates
out vec4 outColor;
void main() {
  // Slight blur: centre plus a ring of eight taps
  vec3 c = texture(scene, uv).rgb * 0.25;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    c += texture(scene, uv + vec2(cos(a), sin(a)) * soften).rgb * 0.09375;
  }
  c += texture(glow, uv).rgb * vec3(${HALATION_TINT.join(", ")}) * ${HALATION.toFixed(2)};
  outColor = vec4(c, 1.0);
}`;

const FLOATS_PER_LINK = 7;

function compile(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
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
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function ChainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, depth: false });
    // Purely decorative, so without WebGL2 the hero simply has no background
    if (!canvas || !gl) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const discProgram = compile(gl, DISC_VERTEX_SHADER, DISC_FRAGMENT_SHADER);
    gl.useProgram(discProgram);
    const discResolutionLoc = gl.getUniformLocation(discProgram, "resolution");
    gl.uniform1f(gl.getUniformLocation(discProgram, "radius"), COVER);
    const discVao = gl.createVertexArray();
    gl.bindVertexArray(discVao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const discBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, discBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 12, 0);
    gl.vertexAttribDivisor(1, 1);

    const program = compile(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const resolutionLoc = uniform("resolution");
    const dprLoc = uniform("dpr");
    gl.uniform3fv(uniform("gradient"), GRADIENT.flatMap(parseColor));
    gl.uniform3fv(uniform("fire"), FIRE_GRADIENT.flatMap(parseColor));
    const pad = STROKE / 2 + 1;
    gl.uniform2f(uniform("halfSize"), LINK_LENGTH / 2 + pad, LINK_WIDTH / 2 + pad);
    gl.uniform3f(uniform("loop"), (LINK_LENGTH - LINK_WIDTH) / 2, LINK_WIDTH / 2, STROKE / 2);
    gl.uniform2f(uniform("bar"), (LINK_LENGTH - BAR) / 2, BAR / 2);
    const linkVao = gl.createVertexArray();
    gl.bindVertexArray(linkVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const linkBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
    const stride = FLOATS_PER_LINK * 4;
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(2, 1);

    // Colors are premultiplied by coverage in the shader
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LESS);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);

    // The chains are drawn into an offscreen frame, which the film pass then
    // softens and glows on its way to the screen
    const postVao = gl.createVertexArray();
    gl.bindVertexArray(postVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const brightProgram = compile(gl, POST_VERTEX_SHADER, BRIGHT_SHADER);
    const blurProgram = compile(gl, POST_VERTEX_SHADER, BLUR_SHADER);
    const blurStepLoc = gl.getUniformLocation(blurProgram, "dir");
    const compositeProgram = compile(gl, POST_VERTEX_SHADER, COMPOSITE_SHADER);
    gl.useProgram(compositeProgram);
    gl.uniform1i(gl.getUniformLocation(compositeProgram, "scene"), 0);
    gl.uniform1i(gl.getUniformLocation(compositeProgram, "glow"), 1);
    const softenLoc = gl.getUniformLocation(compositeProgram, "soften");
    // Vertical spans (canvas px) of the text whose rows of scales turn to fire
    const textElements = [...document.querySelectorAll<HTMLElement>("[data-chain-text]")];
    let fireBands: [number, number][] = [];
    const measureText = () => {
      const origin = canvas.getBoundingClientRect();
      fireBands = textElements.map((element) => {
        const box = element.getBoundingClientRect();
        return [box.top - origin.top, box.bottom - origin.top];
      });
    };

    const makeTarget = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      return { texture, fbo, width: 0, height: 0 };
    };
    type Target = ReturnType<typeof makeTarget>;
    const sizeTarget = (target: Target, w: number, h: number) => {
      target.width = w;
      target.height = h;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    };
    const scene = makeTarget();
    const sceneDepth = gl.createRenderbuffer();
    // The glow is worked out at quarter size: cheaper, and blurrier for free
    const glowA = makeTarget();
    const glowB = makeTarget();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let time = 0;
    let last = performance.now();
    let links = new Float32Array(FLOATS_PER_LINK * 50000);
    let discs = new Float32Array(3 * 1000);
    // One scale's links for the current frame, reused for every scale
    let template = new Float32Array(0);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      sizeTarget(scene, canvas.width, canvas.height);
      gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, canvas.width, canvas.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepth);
      const glowWidth = Math.max(1, Math.ceil(canvas.width / 4));
      const glowHeight = Math.max(1, Math.ceil(canvas.height / 4));
      sizeTarget(glowA, glowWidth, glowHeight);
      sizeTarget(glowB, glowWidth, glowHeight);
      gl.useProgram(compositeProgram);
      gl.uniform2f(softenLoc, (SOFTEN * dpr) / canvas.width, (SOFTEN * dpr) / canvas.height);
      measureText();
      gl.useProgram(discProgram);
      gl.uniform2f(discResolutionLoc, width, height);
      gl.useProgram(program);
      gl.uniform2f(resolutionLoc, width, height);
      gl.uniform1f(dprLoc, dpr);
      draw();
    };

    const draw = () => {
      // Shift by whole pairs so flat/edge-on alternation never flips
      const slide = mod(time * SPEED, PITCH * 2);

      // Links of one scale, relative to its centre: x, y, cos, sin, edge-on,
      // ring index. Each ring's arc length is counted from its hidden bottom point,
      // so links run up the right side, over the top and down the left.
      let t = 0;
      const needed = RINGS.reduce((sum, r) => sum + Math.ceil((Math.PI * r) / PITCH) + 2, 0) * 6;
      if (template.length < needed) template = new Float32Array(needed);
      RINGS.forEach((r, q) => {
        const from = (RING_FROM[q] + Math.PI / 2) * r;
        const to = (Math.PI * 1.5 - RING_FROM[q]) * r;
        for (let k = Math.ceil((from - slide) / PITCH); ; k++) {
          const u = k * PITCH + slide;
          if (u > to) break;
          const a = u / r - Math.PI / 2;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          template[t++] = r * cos;
          template[t++] = -r * sin;
          template[t++] = -sin;
          template[t++] = -cos;
          template[t++] = k & 1;
          template[t++] = q;
        }
      });

      const cellWidth = RADIUS * 2;
      const rowHeight = RADIUS / 2;
      const shift = mod(time * DRIFT, cellWidth);
      const firstRow = -2;
      const lastRow = Math.ceil(height / rowHeight) + 2;
      // Lower rows sit in front: nearer depth values
      const depthStep = 1.8 / (lastRow - firstRow + 2);
      const margin = LINK_LENGTH;
      let count = 0;
      let discCount = 0;

      for (let row = firstRow; row <= lastRow; row++) {
        const cy = row * rowHeight;
        const depth = 0.9 - (row - firstRow) * depthStep;
        const rowShade = 1 - (cy - RADIUS / 2) / height;
        // A row shows from the top of its outer ring down to its centre line
        const onFire = fireBands.some(([top, bottom]) => cy - RADIUS < bottom && cy > top);
        const offset = (row & 1) * RADIUS + shift;
        for (let cx = offset - cellWidth; cx < width + cellWidth; cx += cellWidth) {
          if ((discCount + 1) * 3 > discs.length) {
            const grown = new Float32Array(discs.length * 2);
            grown.set(discs);
            discs = grown;
          }
          const d = discCount++ * 3;
          discs[d] = cx;
          discs[d + 1] = cy;
          // Just behind this scale's own links, in front of the row above
          discs[d + 2] = depth + depthStep / 2;

          for (let i = 0; i < t; i += 6) {
            const x = cx + template[i];
            const y = cy + template[i + 1];
            if (x < -margin || x > width + margin || y < -margin || y > height + margin) continue;
            if ((count + 1) * FLOATS_PER_LINK > links.length) {
              const grown = new Float32Array(links.length * 2);
              grown.set(links);
              links = grown;
            }
            const o = count++ * FLOATS_PER_LINK;
            links[o] = x;
            links[o + 1] = y;
            links[o + 2] = template[i + 2];
            links[o + 3] = template[i + 3];
            links[o + 4] = template[i + 4];
            const ring = 1 - template[i + 5] / (RINGS.length - 1);
            links[o + 5] = onFire ? 2 + ring * FIRE_TOP : PER_SCALE ? rowShade : ring;
            links[o + 6] = depth;
          }
        }
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
      gl.viewport(0, 0, scene.width, scene.height);
      gl.enable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      // The link pass leaves depth writes off, and clearing obeys that mask
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(discProgram);
      gl.bindVertexArray(discVao);
      gl.colorMask(false, false, false, false);
      gl.depthMask(true);
      gl.bindBuffer(gl.ARRAY_BUFFER, discBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, discs.subarray(0, discCount * 3), gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, discCount);

      // Links test against the discs but don't write depth, so interlocking
      // links on the same ring still blend over each other
      gl.useProgram(program);
      gl.bindVertexArray(linkVao);
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, linkBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, links.subarray(0, count * FLOATS_PER_LINK), gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

      // Film pass
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(postVao);
      const pass = (target: Target | null, source: Target) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
        gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, source.texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(brightProgram);
      pass(glowA, scene);
      gl.useProgram(blurProgram);
      // Two rounds of blur, spreading wider the second time
      for (const spread of [1, 2.5]) {
        gl.uniform2f(blurStepLoc, spread / glowA.width, 0);
        pass(glowB, glowA);
        gl.uniform2f(blurStepLoc, 0, spread / glowA.height);
        pass(glowA, glowB);
      }
      gl.useProgram(compositeProgram);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, glowA.texture);
      gl.activeTexture(gl.TEXTURE0);
      pass(null, scene);
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
    for (const element of textElements) observer.observe(element);
    // The text may move once the web font has loaded
    document.fonts.ready.then(() => {
      measureText();
      if (reduceMotion) draw();
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
    />
  );
}
