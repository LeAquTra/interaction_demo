import { clamp, fbm3, mulberry32 } from '../noise'
import type {
  EngineParams,
  Metric,
  SimulationFrame,
  SimulationStrategy,
} from '../types'

interface Streak {
  x: number
  y: number
  px: number
  py: number
  life: number
  maxLife: number
  jitter: number
  tone: number
  tier: number
  fresh: boolean
}

const VOID = 'rgba(8, 9, 10,'
const MAX_STREAKS = 2400

function targetCount(width: number, height: number, density: number): number {
  return clamp(Math.round(((width * height) / 850) * density), 160, MAX_STREAKS)
}

/**
 * A divergence-free vector field: the curl of a fractal noise potential.
 * Particles advect through the field while the pointer adds a local vortex.
 */
export class FlowSimulation implements SimulationStrategy {
  private width = 0
  private height = 0
  private streaks: Streak[] = []
  private random = mulberry32(0x5f3759df)
  private seedOffset = 0
  private energy = 0.5
  private meanSpeed = 0
  private lastDensity = -1
  private fillVoid = true

  constructor(width: number, height: number, private params: EngineParams) {
    this.resize(width, height)
  }

  get count(): number {
    return this.streaks.length
  }

  get metric(): Metric {
    return { label: 'ENERGY', value: this.energy.toFixed(2) }
  }

  get secondary(): Metric {
    return { label: 'VELOCITY', value: `${Math.round(this.meanSpeed)} px/s` }
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.seedOffset = this.random() * 1200
    this.streaks = []
    this.lastDensity = -1
    this.seed(Math.floor(targetCount(width, height, this.params.density)))
    this.fillVoid = true
  }

  reseed(): void {
    this.random = mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
    this.seedOffset = this.random() * 1200
    this.seed(targetCount(this.width, this.height, this.params.density))
    this.fillVoid = true
  }

  private spawn(atRandom = false): Streak {
    const x = this.random() * this.width
    const y = this.random() * this.height
    const maxLife = 6.5 + this.random() * 8.5

    return {
      x,
      y,
      px: x,
      py: y,
      life: atRandom ? this.random() * maxLife : 0,
      maxLife,
      jitter: this.random(),
      tone: this.random(),
      tier: 0,
      fresh: true,
    }
  }

  private seed(count: number): void {
    for (let i = 0; i < count; i++) {
      this.streaks.push(this.spawn(true))
    }
  }

  update(frame: SimulationFrame): void {
    const { width, height, dt, params, pointer, pulses } = frame
    const desired = targetCount(width, height, params.density)

    if (params.density !== this.lastDensity) {
      if (this.streaks.length < desired) {
        while (this.streaks.length < desired) this.streaks.push(this.spawn(true))
      } else if (this.streaks.length > desired) {
        this.streaks.length = desired
      }
      this.lastDensity = params.density
    }

    const scale = 0.0015 + params.character * 0.0011
    const time = frame.time * 0.04 + this.seedOffset
    const motionScale = frame.reducedMotion ? 0.38 : 1
    const speedBase = (34 + params.speed * 88) * motionScale
    const pointerRadius = 250
    const pointerRadiusSq = pointerRadius * pointerRadius
    const motion = clamp(Math.hypot(pointer.vx, pointer.vy) * 0.4, 0, 90)
    let totalSpeed = 0

    for (const streak of this.streaks) {
      streak.life += dt

      const expired =
        streak.life > streak.maxLife ||
        streak.x < -40 ||
        streak.x > width + 40 ||
        streak.y < -40 ||
        streak.y > height + 40

      if (expired) {
        const fresh = this.spawn()
        streak.x = fresh.x
        streak.y = fresh.y
        streak.px = fresh.x
        streak.py = fresh.y
        streak.life = 0
        streak.maxLife = fresh.maxLife
        streak.jitter = fresh.jitter
        streak.tone = fresh.tone
        streak.fresh = true
      }

      const x = streak.x * scale
      const y = streak.y * scale
      const epsilon = 0.7
      const top = fbm3(x, y + epsilon, time, 3, 2.03, 0.5, 11)
      const bottom = fbm3(x, y - epsilon, time, 3, 2.03, 0.5, 11)
      const right = fbm3(x + epsilon, y, time, 3, 2.03, 0.5, 11)
      const left = fbm3(x - epsilon, y, time, 3, 2.03, 0.5, 11)

      const dx = right - left
      const dy = top - bottom
      const angle = Math.atan2(-dx, dy)

      let vx = Math.cos(angle) * (speedBase + streak.jitter * 40)
      let vy = Math.sin(angle) * (speedBase + streak.jitter * 40)

      if (pointer.active) {
        const ox = streak.x - pointer.x
        const oy = streak.y - pointer.y
        const distSq = ox * ox + oy * oy

        if (distSq < pointerRadiusSq && distSq > 0.01) {
          const distance = Math.sqrt(distSq)
          const falloff = 1 - distance / pointerRadius
          const bend = falloff * falloff * (75 + motion) * (0.7 + params.character)
          const nx = ox / distance
          const ny = oy / distance

          // Tangent force creates a vortex around the pointer.
          vx += -ny * bend
          vy += nx * bend
          vx += nx * bend * 0.16
          vy += ny * bend * 0.16
        }
      }

      for (const pulse of pulses) {
        const age = frame.time - pulse.born
        if (age < 0 || age > 2.4) continue

        const ox = streak.x - pulse.x
        const oy = streak.y - pulse.y
        const distance = Math.sqrt(ox * ox + oy * oy) || 0.001
        const ring = 18 + age * 310
        const proximity = Math.abs(distance - ring)

        if (proximity < 78) {
          const push = (1 - age / 2.4) * (1 - proximity / 78) * 230 * pulse.power
          vx += (ox / distance) * push
          vy += (oy / distance) * push
        }
      }

      const speed = Math.hypot(vx, vy)
      totalSpeed += speed
      const nearPointer =
        pointer.active &&
        (streak.x - pointer.x) ** 2 + (streak.y - pointer.y) ** 2 < 265 ** 2

      streak.tier = nearPointer ? 2 : streak.tone > 0.82 ? 1 : 0
      streak.px = streak.x
      streak.py = streak.y
      streak.x += vx * dt
      streak.y += vy * dt

      if (streak.fresh) {
        streak.px = streak.x
        streak.py = streak.y
        streak.fresh = false
      }
    }

    const averageSpeed = totalSpeed / Math.max(1, this.streaks.length)
    this.meanSpeed += (averageSpeed - this.meanSpeed) * clamp(dt * 4, 0, 1)
    this.energy += (clamp(averageSpeed / 160, 0, 1) - this.energy) * clamp(dt * 2, 0, 1)
  }

  render(ctx: CanvasRenderingContext2D, frame: SimulationFrame): void {
    if (this.fillVoid) {
      ctx.fillStyle = '#08090a'
      ctx.fillRect(0, 0, this.width, this.height)
      this.fillVoid = false
    }

    // A slow dissolve leaves a record of the field's recent history.
    ctx.fillStyle = `${VOID} 0.04)`
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.lineCap = 'round'

    const alphas = [0.11, 0.22, 0.46]
    const widths = [0.55, 0.72, 1.0]

    for (let tier = 0; tier < 3; tier++) {
      ctx.beginPath()

      for (const streak of this.streaks) {
        if (streak.tier !== tier) continue
        if (Math.abs(streak.x - streak.px) + Math.abs(streak.y - streak.py) < 0.05) continue

        ctx.moveTo(streak.px, streak.py)
        ctx.lineTo(streak.x, streak.y)
      }

      ctx.strokeStyle = `rgba(208, 214, 224, ${alphas[tier]})`
      ctx.lineWidth = widths[tier]
      ctx.stroke()
    }

    // A restrained glint on a few heads gives the field a sense of depth.
    ctx.fillStyle = 'rgba(229, 229, 230, 0.36)'
    for (let i = 0; i < this.streaks.length; i += 9) {
      const streak = this.streaks[i]
      if (streak.tier > 0) {
        ctx.fillRect(streak.x - 0.55, streak.y - 0.55, 1.1, 1.1)
      }
    }
  }
}
