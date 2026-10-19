const TAU = Math.PI * 2

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0

  return function random(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041) + seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Smooth 3D value noise in the -1..1 range. */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = fade(xf)
  const v = fade(yf)
  const w = fade(zf)

  const n000 = hash3(xi, yi, zi, seed)
  const n100 = hash3(xi + 1, yi, zi, seed)
  const n010 = hash3(xi, yi + 1, zi, seed)
  const n110 = hash3(xi + 1, yi + 1, zi, seed)
  const n001 = hash3(xi, yi, zi + 1, seed)
  const n101 = hash3(xi + 1, yi, zi + 1, seed)
  const n011 = hash3(xi, yi + 1, zi + 1, seed)
  const n111 = hash3(xi + 1, yi + 1, zi + 1, seed)

  const x00 = lerp(n000, n100, u)
  const x10 = lerp(n010, n110, u)
  const x01 = lerp(n001, n101, u)
  const x11 = lerp(n011, n111, u)
  const y0 = lerp(x00, x10, v)
  const y1 = lerp(x01, x11, v)

  return lerp(y0, y1, w) * 2 - 1
}

export function fbm3(
  x: number,
  y: number,
  z: number,
  octaves = 4,
  lacunarity = 2.03,
  gain = 0.5,
  seed = 0,
): number {
  let frequency = 1
  let amplitude = 0.5
  let sum = 0
  let norm = 0

  for (let octave = 0; octave < octaves; octave++) {
    sum += noise3(x * frequency, y * frequency, z, seed + octave * 131) * amplitude
    norm += amplitude
    frequency *= lacunarity
    amplitude *= gain
  }

  return sum / norm
}

export { TAU }
