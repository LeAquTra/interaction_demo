export type AlgorithmId = 'flow' | 'attractor' | 'swarm'

export type ParamKey = 'density' | 'speed' | 'character'

export interface EngineParams {
  density: number
  speed: number
  character: number
}

export interface PointerState {
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  active: boolean
  lastMove: number
}

export interface Pulse {
  x: number
  y: number
  born: number
  power: number
}

export interface Metric {
  label: string
  value: string
}

export interface FieldStats {
  fps: number
  frameMs: number
  count: number
  metric: Metric
  secondary: Metric
  history: number[]
  pointerActive: boolean
  paused: boolean
  mode: AlgorithmId
}

export interface SimulationFrame {
  width: number
  height: number
  time: number
  dt: number
  params: EngineParams
  pointer: PointerState
  pulses: Pulse[]
  reducedMotion: boolean
}

export interface SimulationStrategy {
  readonly count: number
  readonly metric: Metric
  readonly secondary: Metric
  resize(width: number, height: number): void
  reseed(): void
  update(frame: SimulationFrame): void
  render(ctx: CanvasRenderingContext2D, frame: SimulationFrame): void
}
