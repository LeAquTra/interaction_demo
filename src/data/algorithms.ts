import type { AlgorithmId, EngineParams } from '../lib/types'

export interface AlgorithmMeta {
  id: AlgorithmId
  index: string
  tab: string
  shortTab: string
  title: string
  model: string
  tagline: string
  description: string
  formula: string
  accent: string
  file: string
  code: string
  facts: Array<{ label: string; value: string }>
  controls: {
    density: string
    speed: string
    character: string
  }
}

export const ALGORITHM_IDS: AlgorithmId[] = ['flow', 'attractor', 'swarm']

export const ALGORITHMS: Record<AlgorithmId, AlgorithmMeta> = {
  flow: {
    id: 'flow',
    index: '01',
    tab: 'Flow field',
    shortTab: 'Flow',
    title: 'Flow field',
    model: 'Curl noise',
    tagline: 'A weather map for particles.',
    description:
      'A fractal noise field steers thousands of drifting streaks. Move the pointer to bend the current; press into the field to send a wave through it.',
    formula: 'θ = curl(fbm(p, t))',
    accent: 'var(--color-signal-teal)',
    file: 'src/lib/simulations/flow.ts',
    code: `// fractal noise → velocity angle
const angle = fbm3(x * 0.0018, y * 0.0018, clock)
  * TAU * 2.4;

const vx = Math.cos(angle) * speed;
const vy = Math.sin(angle) * speed;

// the pointer adds a local vortex
if (pointer.active && distance < 240) {
  const pull = 1 - distance / 240;
  vx += -dy * pull * gain;
  vy +=  dx * pull * gain;
}

particle.step(vx * dt, vy * dt);`,
    facts: [
      { label: 'Field', value: '3D value noise · 3 octaves' },
      { label: 'Integrator', value: 'Semi-implicit Euler' },
      { label: 'Interaction', value: 'Pointer vortex + impulse' },
      { label: 'Budget', value: '≤ 2,400 streaks' },
    ],
    controls: {
      density: 'DENSITY',
      speed: 'VELOCITY',
      character: 'TURBULENCE',
    },
  },

  attractor: {
    id: 'attractor',
    index: '02',
    tab: 'Attractor',
    shortTab: 'Orbit',
    title: 'Strange attractor',
    model: 'Clifford map',
    tagline: 'Chaos, drawn with a steady hand.',
    description:
      'A deterministic map folded through two dimensions. Tens of thousands of points resolve its orbit every frame. Your pointer shifts the parameters — the geometry does the rest.',
    formula: 'xₙ₊₁ = sin(a·yₙ) + c·cos(a·xₙ)',
    accent: 'var(--color-lavender)',
    file: 'src/lib/simulations/attractor.ts',
    code: `// Clifford map, sampled every frame
let x = 0.1;
let y = 0.1;

for (let i = 0; i < samples; i++) {
  const nx = Math.sin(a * y) + c * Math.cos(a * x);
  const ny = Math.sin(b * x) + d * Math.cos(b * y);

  project(nx, ny, rotation);
  x = nx;
  y = ny;
}`,
    facts: [
      { label: 'Map', value: 'Clifford strange attractor' },
      { label: 'Samples', value: 'Adaptive · up to 40,000 / frame' },
      { label: 'Projection', value: 'Rotated orthographic' },
      { label: 'Interaction', value: 'Pointer warps c / d' },
    ],
    controls: {
      density: 'DENSITY',
      speed: 'DRIFT',
      character: 'WARP',
    },
  },

  swarm: {
    id: 'swarm',
    index: '03',
    tab: 'Swarm',
    shortTab: 'Swarm',
    title: 'Collective motion',
    model: 'Boids · spatial hash',
    tagline: 'Order without a conductor.',
    description:
      'Hundreds of agents negotiate alignment, cohesion, and separation every frame. No leader, no script — just local rules, a spatial hash, and a passing disturbance.',
    formula: 'vᵢ ← α·align + β·cohere − γ·separate',
    accent: 'var(--color-pulse-green)',
    file: 'src/lib/simulations/swarm.ts',
    code: `// local rules, global order
for (const other of grid.near(boid, cellSize)) {
  alignment.add(other.velocity);
  cohesion.add(other.position);
  separation.add(awayFrom(other));
}

boid.steer(alignment, cohesion, separation)
  .avoid(pointer, radius)
  .limit(MAX_FORCE)
  .integrate(dt);`,
    facts: [
      { label: 'Lookup', value: 'Spatial hash · 100 px cells' },
      { label: 'Neighbours', value: '3 × 3 surrounding cells' },
      { label: 'Interaction', value: 'Soft pointer repulsor' },
      { label: 'Agents', value: 'Adaptive · max 260' },
    ],
    controls: {
      density: 'DENSITY',
      speed: 'TEMPO',
      character: 'COHESION',
    },
  },
}

export const DEFAULT_PARAMS: Record<AlgorithmId, EngineParams> = {
  flow: { density: 0.92, speed: 0.7, character: 0.54 },
  attractor: { density: 0.8, speed: 0.44, character: 0.48 },
  swarm: { density: 0.9, speed: 0.66, character: 0.5 },
}

export const FIELD_IGNORE_SELECTOR =
  'a, button, input, select, textarea, label, [role="button"], [data-field-ignore]'
