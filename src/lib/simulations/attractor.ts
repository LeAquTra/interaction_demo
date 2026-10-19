import { clamp, mulberry32 } from '../noise'
import type {
  EngineParams,
  Metric,
  SimulationFrame,
  SimulationStrategy,
} from '../types'

const MAX_SAMPLES = 40_000
const WARMUP = 24

function signedFixed(value: number, digits = 2): string {
  return value.toFixed(digits).replace('-', '−')
}

/**
 * The Clifford map:
 *   x' = sin(a·y) + c·cos(a·x)
 *   y' = sin(b·x) + d·cos(b·y)
 *
 * Every frame walks the recurrence and projects the orbit orthographically.
 */
export class AttractorSimulation implements SimulationStrategy {
  private width = 0
  private height = 0
  private xs = new Float32Array(0)
  private ys = new Float32Array(0)
  private sampleCount = 0
  private random = mulberry32(0x9e3779b9)

  private a = -1.4
  private b = 1.6
  private c = 1.0
  private d = 0.7
  private targetC = 1.0
  private targetD = 0.7
  private baseC = 1.0
  private baseD = 0.7
  private kick = 0
  private lastPulseBorn = -1
  private fillVoid = true
  private minX = 0
  private maxX = 0
  private minY = 0
  private maxY = 0

  constructor(width: number, height: number, private params: EngineParams) {
    this.resize(width, height)
  }

  get count(): number {
    return this.sampleCount
  }

  get metric(): Metric {
    return { label: 'WARP C / D', value: `${signedFixed(this.c)} / ${signedFixed(this.d)}` }
  }

  get secondary(): Metric {
    return { label: 'ORBIT A / B', value: `${signedFixed(this.a)} / ${signedFixed(this.b)}` }
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.fillVoid = true
  }

  reseed(): void {
    this.random = mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
    this.baseC = 0.9 + this.random() * 0.22
    this.baseD = 0.64 + this.random() * 0.14
    this.a = -1.4 + (this.random() - 0.5) * 0.12
    this.b = 1.6 + (this.random() - 0.5) * 0.12
    this.c = this.baseC
    this.d = this.baseD
    this.targetC = this.baseC
    this.targetD = this.baseD
    this.kick = 0
    this.fillVoid = true
  }

  update(frame: SimulationFrame): void {
    const { pointer, params, dt, width, height } = frame
    const time = frame.reducedMotion ? 0 : frame.time
    const slowTime = time * (0.15 + params.speed * 0.36)

    const pointerX = pointer.active ? clamp((pointer.x / width) * 2 - 1, -1, 1) : 0
    const pointerY = pointer.active ? clamp((pointer.y / height) * 2 - 1, -1, 1) : 0

    const newestPulse = frame.pulses[frame.pulses.length - 1]
    if (newestPulse && newestPulse.born !== this.lastPulseBorn) {
      this.lastPulseBorn = newestPulse.born
      this.kick = 1
    }
    this.kick *= Math.exp(-dt * 2.4)

    this.targetC =
      this.baseC +
      (params.character - 0.5) * 0.6 +
      pointerX * 0.24 +
      Math.sin(slowTime * 0.8) * 0.045
    this.targetD =
      this.baseD +
      (params.character - 0.5) * 0.38 +
      pointerY * 0.18 +
      Math.cos(slowTime * 0.65) * 0.035

    const pursuit = clamp(dt * (1.3 + params.speed * 1.1), 0, 1)
    this.c += (this.targetC - this.c) * pursuit
    this.d += (this.targetD - this.d) * pursuit

    const count = clamp(
      Math.round(((width * height) / 55) * params.density),
      3_500,
      MAX_SAMPLES,
    )
    this.ensureBuffers(count)
    this.sampleCount = count

    let x = 0.1
    let y = 0.1

    for (let warm = 0; warm < WARMUP; warm++) {
      const nx = Math.sin(this.a * y) + this.c * Math.cos(this.a * x)
      const ny = Math.sin(this.b * x) + this.d * Math.cos(this.b * y)
      x = nx
      y = ny
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < count; i++) {
      const nx = Math.sin(this.a * y) + this.c * Math.cos(this.a * x)
      const ny = Math.sin(this.b * x) + this.d * Math.cos(this.b * y)
      this.xs[i] = nx
      this.ys[i] = ny

      if (nx < minX) minX = nx
      if (nx > maxX) maxX = nx
      if (ny < minY) minY = ny
      if (ny > maxY) maxY = ny

      x = nx
      y = ny
    }

    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
  }

  private ensureBuffers(count: number): void {
    if (this.xs.length >= count) return
    this.xs = new Float32Array(count)
    this.ys = new Float32Array(count)
  }

  render(ctx: CanvasRenderingContext2D, frame: SimulationFrame): void {
    const { width, height } = this
    const time = frame.reducedMotion ? 0 : frame.time
    const pointerX = frame.pointer.active
      ? clamp((frame.pointer.x / width - 0.5) * 2, -1, 1)
      : 0
    const pointerY = frame.pointer.active
      ? clamp((frame.pointer.y / height - 0.5) * 2, -1, 1)
      : 0

    const desktop = width > 960
    const cx = width * (desktop ? 0.7 : 0.5)
    const cy = height * (desktop ? 0.45 : 0.4)
    const rotation =
      Math.sin(time * 0.12) * 0.075 +
      pointerX * 0.1 * (frame.pointer.active ? 1 : 0)
    const rangeX = Math.max(0.001, this.maxX - this.minX)
    const rangeY = Math.max(0.001, this.maxY - this.minY)
    const availableWidth = desktop ? width * 0.45 : width * 0.86
    const availableHeight = desktop ? height * 0.68 : height * 0.52
    const scale =
      Math.min(availableWidth / rangeX, availableHeight / rangeY) *
      (desktop ? 0.92 : 0.86) *
      (1 + Math.sin(time * 0.23) * 0.008 + this.kick * 0.012)
    const mapCenterX = (this.minX + this.maxX) / 2
    const mapCenterY = (this.minY + this.maxY) / 2
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const skewX = pointerY * 14

    if (this.fillVoid) {
      ctx.fillStyle = '#08090a'
      ctx.fillRect(0, 0, width, height)
      this.fillVoid = false
    } else {
      // Long exposure: points accumulate over several frames, turning a sparse
      // point cloud into a smooth density map of the attractor.
      ctx.fillStyle = 'rgba(8, 9, 10, 0.15)'
      ctx.fillRect(0, 0, width, height)
    }

    const toScreen = (x: number, y: number): [number, number] => {
      const ox = (x - mapCenterX) * scale
      const oy = (y - mapCenterY) * scale
      return [cx + ox * cos - oy * sin + skewX, cy + ox * sin + oy * cos]
    }

    // Each frame samples tens of thousands of points from the map. Overlaps
    // expose the filaments; the slow projection keeps the exposure coherent.
    ctx.fillStyle = 'rgba(208, 214, 224, 0.17)'
    for (let i = 0; i < this.sampleCount; i++) {
      const [px, py] = toScreen(this.xs[i], this.ys[i])
      ctx.fillRect(px, py, 1.05, 1.05)
    }

    // A sparse layer of pin-pricks catches the light where the orbit folds.
    ctx.fillStyle = 'rgba(229, 229, 230, 0.3)'
    const stride = Math.max(197, Math.floor(this.sampleCount / 96))
    for (let i = 0; i < this.sampleCount; i += stride) {
      const [px, py] = toScreen(this.xs[i], this.ys[i])
      ctx.fillRect(px - 0.25, py - 0.25, 1.45, 1.45)
    }

    if (this.kick > 0.02) {
      const alpha = this.kick * 0.1
      ctx.strokeStyle = `rgba(208, 214, 224, ${alpha})`
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.arc(cx, cy, Math.min(width, height) * 0.36, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}
