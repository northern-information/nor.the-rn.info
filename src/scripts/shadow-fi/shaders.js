// GLSL ES 3.00 sources for SHADOW FI. Template literals instead of .glsl files —
// the site has no bundler and src/scripts is passthrough-copied verbatim.
//
// The medium is analog broadcast static, not ZOOT's oil film. The uniform
// contract is the same as ZOOT (so gl.js is near-identical), but three "mood"
// uniforms are reinterpreted for a radio:
//   uThickness -> signal-noise floor (how much snow between stations)
//   uPhase     -> chroma spread of detuned glyphs
//   uDrift     -> vertical-hold roll drift
// Stations (text fragments) tune in out of the snow via uFragReveal; a focused
// station locks clean; stir impulses tear the picture horizontally.

export const MAX_IMPULSES = 16
export const MAX_FRAGS = 8

export const VERT = `#version 300 es
void main() {
  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
`

// quality: 4 for the full look, 3 for the degraded mobile/slow-GPU variant
// (drops the chroma triple-tap and the rolling tear highlight). Compile-time.
export function fragmentSource(quality) {
  return `#version 300 es
precision highp float;

#define QUALITY ${quality}
#define MAX_IMPULSES ${MAX_IMPULSES}
#define MAX_FRAGS ${MAX_FRAGS}

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uImpulses[MAX_IMPULSES]; // xy: aspect-corrected UV, z: birth, w: strength
uniform sampler2D uTextTex;
uniform vec4 uFragRect[MAX_FRAGS];    // texture UV rect: x, y, w, h
uniform float uFragReveal[MAX_FRAGS];
uniform vec3 uFragTint[MAX_FRAGS];
uniform int uFocusIndex;
uniform float uFocusAmount;
uniform float uThickness;             // signal-noise floor
uniform float uPhase;                 // chroma spread
uniform vec2 uDrift;                  // roll drift
uniform vec3 uPalette[3];             // ember, yellow, red
uniform float uGrainSeed;

out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Soft interior mask for a UV rect, feathered by the soft parameter.
float rectMask(vec2 uv, vec4 rect, float soft) {
  vec2 lo = smoothstep(rect.xy - soft, rect.xy, uv);
  vec2 hi = 1.0 - smoothstep(rect.xy + rect.zw, rect.xy + rect.zw + soft, uv);
  return lo.x * lo.y * hi.x * hi.y;
}

// Impulses tear the picture: a horizontal desync band + a burst of snow,
// centred on the impulse's y, decaying in ~1 s (a knock on the dial).
void tuning(vec2 uv, out float desync, out float snowBoost) {
  desync = 0.0;
  snowBoost = 0.0;
  for (int i = 0; i < MAX_IMPULSES; i++) {
    vec4 imp = uImpulses[i];
    float age = uTime - imp.z;
    if (imp.w <= 0.0 || age < 0.0 || age > 1.3) continue;
    float dy = uv.y - imp.y;
    float band = exp(-dy * dy * 55.0);
    float decay = exp(-age * 3.2);
    desync += band * decay * imp.w * 0.18 * sin(uTime * 34.0 + imp.z * 11.0);
    snowBoost += band * decay * imp.w * 1.6;
  }
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  float desync;
  float snowBoost;
  tuning(uv, desync, snowBoost);

  // Filmic snow: per-pixel hash re-rolled ~24×/s.
  float grain = hash(gl_FragCoord.xy + uGrainSeed + floor(uTime * 24.0) * 7.13);
  float noiseFloor = clamp(0.55 + 0.45 * uThickness, 0.25, 1.0);

  // Dark field with cold snow, faint ember wash so it never reads pure gray.
  vec3 col = vec3(grain) * 0.16 * noiseFloor;
  col += uPalette[0] * 0.018 * (0.4 + 0.6 * grain);

#if QUALITY >= 4
  // Vertical-hold roll: a faint tear line scrolling upward.
  float roll = uTime * (0.05 + 0.06 * abs(uDrift.x));
  float tear = fract(uv.y + roll);
  float tearGlow = smoothstep(0.0, 0.015, tear) * smoothstep(0.05, 0.015, tear);
  col += tearGlow * 0.05 * (0.5 + 0.5 * grain);
#endif

  // Text stations tune in from the snow.
  for (int i = 0; i < MAX_FRAGS; i++) {
    float reveal = uFragReveal[i];
    if (reveal <= 0.001) continue;
    vec4 rect = uFragRect[i];
    float region = rectMask(uv, rect, 0.06);
    if (region <= 0.001) continue;

    float focus = (i == uFocusIndex) ? uFocusAmount : 0.0;
    float lock = max(reveal, focus);
    float submerged = 1.0 - lock;

    // Horizontal chroma spread while detuned, plus the desync tear.
    float spread = (0.003 + (0.006 + 0.02 * uPhase) * submerged);
    vec2 j = vec2(spread + desync, 0.0);

#if QUALITY >= 4
    float aR = texture(uTextTex, uv + j).r;
    float aG = texture(uTextTex, uv).r;
    float aB = texture(uTextTex, uv - j).r;
#else
    float aG = texture(uTextTex, uv + vec2(desync, 0.0)).r;
    float aR = aG;
    float aB = aG;
#endif

    float legible = smoothstep(0.04, 0.82, lock);
    // Static eats the glyph until it locks in.
    float broken = mix(grain, 1.0, legible);
    vec3 glyph = vec3(aR, aG, aB) * legible * region * broken;

    // A locked station clears the snow around it (clean signal).
    col *= 1.0 - 0.72 * legible * region;

    vec3 tint = mix(uFragTint[i], vec3(0.97, 0.96, 0.94), lock * lock);
    col = col * (1.0 - glyph.g * 0.6) + tint * glyph;
  }

  // Snow burst from a dial knock.
  col += grain * snowBoost * 0.22;

  // Vignette, scanline, final grain — kills banding on the black field.
  vec2 v = uv - 0.5;
  col *= 1.0 - 0.6 * dot(v, v);
  col *= 0.92 + 0.08 * sin(gl_FragCoord.y * 3.14159);
  col += (hash(gl_FragCoord.xy + uGrainSeed + fract(uTime) * 61.7) - 0.5) * 0.05;

  outColor = vec4(max(col, vec3(0.0)), 1.0);
}
`
}
