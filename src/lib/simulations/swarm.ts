import { clamp, mulberry32, TAU } from '../noise'
import type {
  EngineParams,
  Metric,
  SimulationFrame,
  SimulationStrategy,
} from '../types'

interface Boid {
  x: number
  y: number
  px: number
  py: number
  vx: number
  vy: number
  tone: number
  tier: number
  id: number
  nearestX: number
  nearestY: number
  nearestDistance: number
  neighbors: number
}

const CELL_SIZE = 100
const PERCEPTION = 100
const PERCEPTION_SQ = PERCEPTION * PERCEPTION

function targetCount(width: number, height: number, density: number): number {
  const compactScale = width < 640 ? 1.8 : 1
  const base = ((width * height) / 7600) * density * compactScale
  return clamp(Math.round(base), 32, 260)
}

function boidKey(x: number, y: number): number {
  return (Math.floor(x / CELL_SIZE) + 128) * 100_000 + (Math.floor(y / CELL_SIZE) + 128)
}

/**
 * Reynolds-style boids accelerated by a spatial hash.
 * Neighbours are drawn from the 3×3 cells around each agent, keeping the
 * flock O(n) as the population grows.
 */
export class SwarmSimulation implements SimulationStrategy {
  private width = 0
  private height = 0
  private boids: Boid[] = []
  private random = mulberry32(0x1234abcd)
  private polarization = 0
  private averageNeighbors = 0
  private fillVoid = true
  private lastDensity = -1
  private idCounter = 0

  constructor(width: number, height: number, private params: EngineParams) {
    this.resize(width, height)
  }

  get count(): number {
    return this.boids.length
  }

  get metric(): Metric {
    return { label: 'POLARIZATION', value: this.polarization.toFixed(2) }
  }

  get secondary(): Metric {
    return { label: 'NEIGHBOURS', value: this.averageNeighbors.toFixed(1) }
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.boids = []
    this.lastDensity = -1
    this.populate(targetCount(width, height, this.params.density))
    this.fillVoid = true
  }

  reseed(): void {
    this.random = mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
    this.boids = []
    this.populate(targetCount(this.width, this.height, this.params.density))
    this.polarization = 0
    this.averageNeighbors = 0
    this.fillVoid = true
  }

  private spawn(): Boid {
    const rightBiased = this.width > 760
    const x = clamp(
      rightBiased
        ? this.width * (0.36 + this.random() * 0.56)
        : this.width * (0.12 + this.random() * 0.76),
      70,
      this.width - 70,
    )
    const y = clamp(
      this.height * (0.16 + this.random() * 0.64),
      70,
      this.height - 70,
    )
    const angle = -0.5 + (this.random() - 0.5) * 1.1
    const speed = 38 + this.random() * 28

    return {
      x,
      y,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tone: this.random(),
      tier: 0,
      id: this.idCounter++,
      nearestX: x,
      nearestY: y,
      nearestDistance: PERCEPTION,
      neighbors: 0,
    }
  }

  private populate(count: number): void {
    while (this.boids.length < count) {
      this.boids.push(this.spawn())
    }
  }

  update(frame: SimulationFrame): void {
    const { width, height, dt, params, pointer, pulses } = frame
    const desired = targetCount(width, height, params.density)

    if (params.density !== this.lastDensity) {
      if (this.boids.length < desired) {
        while (this.boids.length < desired) this.boids.push(this.spawn())
      } else if (this.boids.length > desired) {
        this.boids.length = desired
      }
      this.lastDensity = params.density
    }

    const maxSpeed = (38 + params.speed * 105) * (frame.reducedMotion ? 0.45 : 1)
    const maxForce = 155
    const alignWeight = 1.1
    const cohesionWeight = 0.25 + params.character * 0.35
    const separationWeight = 1.8
    const pointerRadius = 185
    const pointerRadiusSq = pointerRadius * pointerRadius
    const pointerMotion = clamp(Math.hypot(pointer.vx, pointer.vy) * 0.35, 0, 80)

    // Rebuild the spatial hash every frame. It is cheaper than pairwise checks.
    const grid = new Map<number, Boid[]>()
    for (const boid of this.boids) {
      const key = boidKey(boid.x, boid.y)
      const bucket = grid.get(key)
      if (bucket) bucket.push(boid)
      else grid.set(key, [boid])
    }

    let sumVX = 0
    let sumVY = 0
    let sumSpeed = 0
    let totalNeighbors = 0

    for (const boid of this.boids) {
      let count = 0
      let alignX = 0
      let alignY = 0
      let centerX = 0
      let centerY = 0
      let separateX = 0
      let separateY = 0
      let nearestDistance = PERCEPTION
      let nearestX = 0
      let nearestY = 0

      const cellX = Math.floor(boid.x / CELL_SIZE)
      const cellY = Math.floor(boid.y / CELL_SIZE)

      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const bucket = grid.get((cellX + ox + 128) * 100_000 + (cellY + oy + 128))
          if (!bucket) continue

          for (const other of bucket) {
            if (other === boid) continue
            const dx = other.x - boid.x
            const dy = other.y - boid.y
            const distSq = dx * dx + dy * dy

            if (distSq > PERCEPTION_SQ || distSq < 0.001) continue

            count++
            alignX += other.vx
            alignY += other.vy
            centerX += other.x
            centerY += other.y

            if (distSq < 46 * 46) {
              const strength = 1 - Math.sqrt(distSq) / 46
              separateX -= (dx / Math.sqrt(distSq)) * strength
              separateY -= (dy / Math.sqrt(distSq)) * strength
            }

            if (distSq < nearestDistance * nearestDistance) {
              nearestDistance = Math.sqrt(distSq)
              nearestX = other.x
              nearestY = other.y
            }
          }
        }
      }

      let ax = 0
      let ay = 0

      if (count > 0) {
        const alignment = this.steer(
          boid,
          alignX / count,
          alignY / count,
          maxSpeed,
        )
        const center = this.steer(
          boid,
          (centerX / count - boid.x) / 24,
          (centerY / count - boid.y) / 24,
          maxSpeed,
        )

        const separationLength = Math.hypot(separateX, separateY)
        const separationScale =
          separationLength > 0.0001
            ? (maxSpeed * separationWeight) / separationLength
            : 0

        ax += alignment.x * alignWeight
        ay += alignment.y * alignWeight
        ax += center.x * cohesionWeight
        ay += center.y * cohesionWeight
        ax += separateX * separationScale
        ay += separateY * separationScale

        totalNeighbors += count
        boid.neighbors += (count - boid.neighbors) * 0.18
      }

      boid.nearestX = nearestX
      boid.nearestY = nearestY
      boid.nearestDistance = nearestDistance

      if (pointer.active) {
        const dx = boid.x - pointer.x
        const dy = boid.y - pointer.y
        const distSq = dx * dx + dy * dy

        if (distSq < pointerRadiusSq && distSq > 0.01) {
          const distance = Math.sqrt(distSq)
          const falloff = 1 - distance / pointerRadius
          const push = (180 + pointerMotion) * falloff * falloff
          ax += (dx / distance) * push
          ay += (dy / distance) * push
          ax += (-dy / distance) * push * 0.28
          ay += (dx / distance) * push * 0.28
        }
      }

      for (const pulse of pulses) {
        const age = frame.time - pulse.born
        if (age < 0 || age > 2.2) continue

        const dx = boid.x - pulse.x
        const dy = boid.y - pulse.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001
        const ring = 16 + age * 280
        const proximity = Math.abs(distance - ring)

        if (proximity < 76) {
          const push = (1 - age / 2.2) * (1 - proximity / 76) * 220 * pulse.power
          ax += (dx / distance) * push
          ay += (dy / distance) * push
        }
      }

      // A soft radial leash keeps the installation in frame without turning
      // the flock into a captive audience. The canvas edge remains a hard stop.
      const homeX = width * (width > 760 ? 0.7 : 0.5)
      const homeY = height * 0.44
      const homeDX = boid.x - homeX
      const homeDY = boid.y - homeY
      const homeDistance = Math.hypot(homeDX, homeDY) || 0.001
      const leash = Math.min(width, height) * (width > 760 ? 0.31 : 0.26)

      if (homeDistance > leash) {
        const pull = (homeDistance - leash) * 1.4
        ax -= (homeDX / homeDistance) * pull
        ay -= (homeDY / homeDistance) * pull
      }

      // Gentle boundary steering keeps the flock inside the visible field.
      const margin = 92
      if (boid.x < margin) ax += (1 - boid.x / margin) * 220
      if (boid.x > width - margin) ax -= (1 - (width - boid.x) / margin) * 220
      if (boid.y < margin) ay += (1 - boid.y / margin) * 220
      if (boid.y > height - margin) ay -= (1 - (height - boid.y) / margin) * 220

      // A small wandering force prevents stalled, perfectly symmetric flocks.
      ax += Math.sin(boid.id * 1.618 + frame.time * 0.7) * 9
      ay += Math.cos(boid.id * 2.414 + frame.time * 0.63) * 9

      const force = Math.hypot(ax, ay)
      if (force > maxForce) {
        ax = (ax / force) * maxForce
        ay = (ay / force) * maxForce
      }

      boid.px = boid.x
      boid.py = boid.y
      boid.vx += ax * dt
      boid.vy += ay * dt

      const speed = Math.hypot(boid.vx, boid.vy)
      if (speed > maxSpeed) {
        boid.vx = (boid.vx / speed) * maxSpeed
        boid.vy = (boid.vy / speed) * maxSpeed
      }

      boid.x += boid.vx * dt
      boid.y += boid.vy * dt

      const nearPointer =
        pointer.active &&
        (boid.x - pointer.x) ** 2 + (boid.y - pointer.y) ** 2 < 150 ** 2
      boid.tier = nearPointer ? 2 : boid.tone > 0.84 ? 1 : 0

      sumVX += boid.vx
      sumVY += boid.vy
      sumSpeed += speed
    }

    const total = Math.max(1, this.boids.length)
    this.polarization = clamp(
      Math.hypot(sumVX, sumVY) / Math.max(0.001, sumSpeed),
      0,
      1,
    )
    this.averageNeighbors = totalNeighbors / total
  }

  private steer(
    boid: Boid,
    targetVX: number,
    targetVY: number,
    maxSpeed: number,
  ): { x: number; y: number } {
    const length = Math.hypot(targetVX, targetVY)
    if (length < 0.0001) return { x: 0, y: 0 }

    const desiredX = (targetVX / length) * maxSpeed
    const desiredY = (targetVY / length) * maxSpeed

    return {
      x: desiredX - boid.vx,
      y: desiredY - boid.vy,
    }
  }

  render(ctx: CanvasRenderingContext2D, frame: SimulationFrame): void {
    if (this.fillVoid) {
      ctx.fillStyle = '#08090a'
      ctx.fillRect(0, 0, this.width, this.height)
      this.fillVoid = false
    }

    ctx.fillStyle = 'rgba(8, 9, 10, 0.045)'
    ctx.fillRect(0, 0, this.width, this.height)

    // Faint neighbour threads give the local topology somewhere to live.
    ctx.beginPath()
    for (const boid of this.boids) {
      if (boid.nearestDistance > 88) continue
      ctx.moveTo(boid.x, boid.y)
      ctx.lineTo(boid.nearestX, boid.nearestY)
    }
    ctx.strokeStyle = 'rgba(208, 214, 224, 0.045)'
    ctx.lineWidth = 0.55
    ctx.stroke()

    ctx.lineCap = 'round'
    const alphas = [0.085, 0.17, 0.36]
    const widths = [0.5, 0.65, 0.9]

    for (let tier = 0; tier < 3; tier++) {
      ctx.beginPath()
      for (const boid of this.boids) {
        if (boid.tier !== tier) continue
        if (Math.abs(boid.x - boid.px) + Math.abs(boid.y - boid.py) < 0.04) continue
        ctx.moveTo(boid.px, boid.py)
        ctx.lineTo(boid.x, boid.y)
      }
      ctx.strokeStyle = `rgba(208, 214, 224, ${alphas[tier]})`
      ctx.lineWidth = widths[tier]
      ctx.stroke()
    }

    // Heading ticks and heads make the direction of travel legible at small scale.
    ctx.beginPath()
    for (const boid of this.boids) {
      const length = Math.hypot(boid.vx, boid.vy) || 1
      const nx = boid.vx / length
      const ny = boid.vy / length
      ctx.moveTo(boid.x, boid.y)
      ctx.lineTo(boid.x + nx * 3.6, boid.y + ny * 3.6)
    }
    ctx.strokeStyle = 'rgba(229, 229, 230, 0.38)'
    ctx.lineWidth = 0.7
    ctx.stroke()

    ctx.fillStyle = 'rgba(229, 229, 230, 0.55)'
    for (const boid of this.boids) {
      ctx.fillRect(boid.x - 0.55, boid.y - 0.55, 1.1, 1.1)
    }

    if (!frame.reducedMotion && frame.pointer.active) {
      const cx = frame.pointer.x
      const cy = frame.pointer.y
      ctx.strokeStyle = 'rgba(208, 214, 224, 0.08)'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.arc(cx, cy, 185, 0, TAU)
      ctx.stroke()
    }
  }
}
