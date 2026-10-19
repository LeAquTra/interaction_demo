import { clamp } from './noise'
import { FlowSimulation } from './simulations/flow'
import { AttractorSimulation } from './simulations/attractor'
import { SwarmSimulation } from './simulations/swarm'
import type {
  AlgorithmId,
  EngineParams,
  FieldStats,
  PointerState,
  Pulse,
  SimulationFrame,
  SimulationStrategy,
} from './types'

const BACKGROUND = '#08090a'
const MAX_DPR = 1.5
const TARGET_FRAME_MS = 1000 / 60

type StatsHandler = (stats: FieldStats) => void

export class FieldEngine {
  private ctx: CanvasRenderingContext2D
  private width = 1
  private height = 1
  private dpr = 1
  private mode: AlgorithmId
  private params: EngineParams
  private strategy!: SimulationStrategy
  private pointer: PointerState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    active: false,
    lastMove: 0,
  }

  private pulses: Pulse[] = []
  private raf = 0
  private running = false
  private paused = false
  private reducedMotion = false
  private elapsed = 0
  private lastFrame = 0
  private lastRender = 0
  private frameAccumulator = 0
  private lastStats = 0
  private framesSinceStats = 0
  private smoothedFps = 60
  private computeMs = 1.2
  private history: number[] = Array.from({ length: 28 }, () => 60)
  private destroyed = false

  constructor(
    private canvas: HTMLCanvasElement,
    mode: AlgorithmId,
    params: EngineParams,
    reducedMotion: boolean,
    private onStats: StatsHandler,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D
    this.mode = mode
    this.params = { ...params }
    this.reducedMotion = reducedMotion

    this.resize()
    this.strategy = this.createStrategy()

    this.pointer.x = this.width * 0.72
    this.pointer.y = this.height * 0.44
    this.pointer.targetX = this.pointer.x
    this.pointer.targetY = this.pointer.y

    window.addEventListener('resize', this.resize, { passive: true })
    this.emitStats()
  }

  private createStrategy(): SimulationStrategy {
    if (this.mode === 'attractor') {
      return new AttractorSimulation(this.width, this.height, this.params)
    }
    if (this.mode === 'swarm') {
      return new SwarmSimulation(this.width, this.height, this.params)
    }
    return new FlowSimulation(this.width, this.height, this.params)
  }

  private resize = (): void => {
    if (this.destroyed) return

    const width = Math.max(1, this.canvas.clientWidth || window.innerWidth)
    const height = Math.max(1, this.canvas.clientHeight || window.innerHeight)
    const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_DPR)

    if (Math.abs(width - this.width) < 1 && Math.abs(height - this.height) < 1 && dpr === this.dpr) {
      return
    }

    this.width = width
    this.height = height
    this.dpr = dpr

    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.ctx.fillStyle = BACKGROUND
    this.ctx.fillRect(0, 0, width, height)

    if (this.strategy) this.strategy.resize(width, height)
    this.pulses = []
  }

  setMode(mode: AlgorithmId): void {
    if (mode === this.mode) return
    this.mode = mode
    this.strategy = this.createStrategy()
    this.pulses = []
    this.clear()
    this.emitStats()
  }

  setParams(params: EngineParams): void {
    this.params = { ...params }
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused
    this.lastFrame = 0
    this.lastRender = 0
    this.frameAccumulator = 0
    this.lastStats = 0
    this.framesSinceStats = 0
    this.emitStats()
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  setPointer(clientX: number, clientY: number): void {
    const now = performance.now()
    const wasActive = this.pointer.active

    if (!wasActive) {
      this.pointer.x = clientX
      this.pointer.y = clientY
      this.pointer.vx = 0
      this.pointer.vy = 0
    } else {
      this.pointer.vx = clientX - this.pointer.targetX
      this.pointer.vy = clientY - this.pointer.targetY
    }

    this.pointer.targetX = clientX
    this.pointer.targetY = clientY
    this.pointer.active = true
    this.pointer.lastMove = now
  }

  clearPointer(): void {
    this.pointer.active = false
  }

  pulse(clientX?: number, clientY?: number, power = 1): void {
    const x = clientX ?? this.width * (this.width > 960 ? 0.67 : 0.5)
    const y = clientY ?? this.height * 0.44

    if (this.pulses.length > 6) this.pulses.shift()
    this.pulses.push({ x, y, born: this.elapsed, power })
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.targetX = x
    this.pointer.targetY = y
    this.pointer.active = true
    this.pointer.lastMove = performance.now()
  }

  reset(): void {
    this.strategy.reseed()
    this.pulses = []
    this.clear()
    this.emitStats()
  }

  start(): void {
    if (this.running || this.destroyed) return
    this.running = true
    this.lastFrame = 0
    this.lastRender = 0
    this.frameAccumulator = 0
    this.lastStats = 0
    this.framesSinceStats = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    window.removeEventListener('resize', this.resize)
  }

  private clear(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.fillStyle = BACKGROUND
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  private tick = (now: number): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.tick)

    if (!this.lastFrame) {
      this.lastFrame = now
      this.lastRender = now
      this.lastStats = now
      return
    }

    const rafDelta = Math.min(now - this.lastFrame, 100)
    this.lastFrame = now

    if (this.paused) return

    // Cap the render loop at a stable 60 Hz while carrying the remainder.
    this.frameAccumulator += rafDelta
    if (this.frameAccumulator < TARGET_FRAME_MS - 1) return
    this.frameAccumulator = Math.max(0, this.frameAccumulator - TARGET_FRAME_MS)

    const rawDt = Math.min((now - this.lastRender) / 1000, 0.08)
    this.lastRender = now
    this.framesSinceStats++

    const dt = Math.min(rawDt, 1 / 30)
    this.elapsed += dt

    if (this.pointer.active && now - this.pointer.lastMove > 1800) {
      this.pointer.active = false
      this.pointer.vx = 0
      this.pointer.vy = 0
    }

    const follow = 1 - Math.exp(-dt * 18)
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * follow
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * follow

    this.pulses = this.pulses.filter((pulse) => this.elapsed - pulse.born < 2.6)

    const frame: SimulationFrame = {
      width: this.width,
      height: this.height,
      time: this.elapsed,
      dt,
      params: this.params,
      pointer: this.pointer,
      pulses: this.pulses,
      reducedMotion: this.reducedMotion,
    }

    const computeStart = performance.now()
    this.strategy.update(frame)
    this.strategy.render(this.ctx, frame)
    this.drawPulses()
    this.drawPointer(now)
    const cost = performance.now() - computeStart
    this.computeMs += (cost - this.computeMs) * 0.08

    if (now - this.lastStats > 420) {
      const elapsed = Math.max(1, now - this.lastStats)
      const fps = (this.framesSinceStats * 1000) / elapsed
      this.smoothedFps += (fps - this.smoothedFps) * 0.45
      this.history.push(Math.round(this.smoothedFps))
      if (this.history.length > 28) this.history.shift()
      this.framesSinceStats = 0
      this.lastStats = now
      this.emitStats()
    }
  }

  private drawPulses(): void {
    if (this.pulses.length === 0) return

    for (const pulse of this.pulses) {
      const age = this.elapsed - pulse.born
      if (age < 0 || age > 2.6) continue

      const progress = age / 2.6
      const radius = 18 + age * 292
      const alpha = (1 - progress) ** 2 * 0.2 * pulse.power

      this.ctx.strokeStyle = `rgba(208, 214, 224, ${alpha})`
      this.ctx.lineWidth = 0.7
      this.ctx.beginPath()
      this.ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2)
      this.ctx.stroke()

      this.ctx.strokeStyle = `rgba(208, 214, 224, ${alpha * 0.45})`
      this.ctx.beginPath()
      this.ctx.arc(pulse.x, pulse.y, radius * 0.92, 0, Math.PI * 2)
      this.ctx.stroke()

      const coreAlpha = (1 - progress) * 0.35
      this.ctx.fillStyle = `rgba(229, 229, 230, ${coreAlpha})`
      this.ctx.fillRect(pulse.x - 1, pulse.y - 1, 2, 2)
    }
  }

  private drawPointer(now: number): void {
    if (!this.pointer.active || this.reducedMotion) return

    const idle = clamp(1 - (now - this.pointer.lastMove) / 1800, 0, 1)
    if (idle <= 0) return

    const x = this.pointer.x
    const y = this.pointer.y
    const alpha = idle * 0.28

    this.ctx.strokeStyle = `rgba(208, 214, 224, ${alpha})`
    this.ctx.lineWidth = 0.6
    this.ctx.beginPath()
    this.ctx.arc(x, y, 17, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(x - 27, y)
    this.ctx.lineTo(x - 10, y)
    this.ctx.moveTo(x + 10, y)
    this.ctx.lineTo(x + 27, y)
    this.ctx.moveTo(x, y - 27)
    this.ctx.lineTo(x, y - 10)
    this.ctx.moveTo(x, y + 10)
    this.ctx.lineTo(x, y + 27)
    this.ctx.stroke()
  }

  private emitStats(): void {
    if (!this.strategy) return

    this.onStats({
      fps: Math.round(this.smoothedFps),
      frameMs: Math.max(0.1, this.computeMs),
      count: this.strategy.count,
      metric: this.strategy.metric,
      secondary: this.strategy.secondary,
      history: [...this.history],
      pointerActive: this.pointer.active,
      paused: this.paused,
      mode: this.mode,
    })
  }
}
