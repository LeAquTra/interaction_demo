<script setup lang="ts">
import { computed } from 'vue'
import { ALGORITHMS } from '../data/algorithms'
import type { AlgorithmId, FieldStats } from '../lib/types'
import AlgorithmIcon from './AlgorithmIcon.vue'

const props = defineProps<{
  mode: AlgorithmId
  stats: FieldStats
  paused: boolean
  reducedMotion: boolean
}>()

const meta = computed(() => ALGORITHMS[props.mode])

const countLabel = computed(() => {
  if (props.mode === 'flow') return 'STREAKS'
  if (props.mode === 'attractor') return 'SAMPLES'
  return 'AGENTS'
})

const countValue = computed(() => new Intl.NumberFormat('en-US').format(props.stats.count))

const sparkline = computed(() => {
  const width = 280
  const height = 40
  const values = props.stats.history.length > 1 ? props.stats.history : [60, 60]
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const normalized = Math.max(0, Math.min(1, (value - 45) / 25))
    const y = height - 4 - normalized * (height - 8)
    return [x, y] as const
  })

  return {
    path: points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),
    last: points[points.length - 1],
  }
})
</script>

<template>
  <aside class="readout" aria-label="Live simulation telemetry" data-field-ignore>
    <header class="readout__top">
      <span class="readout__label mono">FIELD TELEMETRY</span>
      <span class="readout__status" :class="{ 'is-paused': paused }">
        <span class="readout__status-dot" aria-hidden="true"></span>
        {{ paused ? 'HELD' : 'LIVE' }}
      </span>
    </header>

    <div class="readout__heading">
      <span class="readout__glyph" :style="{ color: meta.accent }">
        <AlgorithmIcon :id="mode" :size="19" />
      </span>
      <div class="readout__title-group">
        <h2 class="readout__title">{{ meta.title }}</h2>
        <p class="readout__model mono">{{ meta.model }}</p>
      </div>
      <span class="readout__index mono" aria-hidden="true">{{ meta.index }}</span>
    </div>

    <div class="readout__formula">
      <span class="readout__formula-label">TRACE</span>
      <code>{{ meta.formula }}</code>
    </div>

    <div class="readout__chart">
      <div class="readout__chart-head">
        <span class="mono">FRAME RATE</span>
        <span class="mono readout__fps">{{ paused ? 'HOLD' : `${stats.fps} FPS` }}</span>
      </div>
      <svg class="readout__spark" viewBox="0 0 280 40" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="20" x2="280" y2="20" class="readout__grid" />
        <line x1="0" y1="8" x2="280" y2="8" class="readout__grid readout__grid--faint" />
        <line x1="0" y1="32" x2="280" y2="32" class="readout__grid readout__grid--faint" />
        <path :d="sparkline.path" class="readout__spark-line" vector-effect="non-scaling-stroke" />
        <circle
          v-if="sparkline.last"
          :cx="sparkline.last[0]"
          :cy="sparkline.last[1]"
          r="1.6"
          class="readout__spark-dot"
        />
      </svg>
    </div>

    <dl class="readout__metrics">
      <div class="readout__metric">
        <dt class="mono">{{ countLabel }}</dt>
        <dd class="mono">{{ countValue }}</dd>
      </div>
      <div class="readout__metric">
        <dt class="mono">{{ stats.metric.label }}</dt>
        <dd class="mono">{{ stats.metric.value }}</dd>
      </div>
      <div class="readout__metric">
        <dt class="mono">{{ stats.secondary.label }}</dt>
        <dd class="mono">{{ stats.secondary.value }}</dd>
      </div>
      <div class="readout__metric">
        <dt class="mono">COMPUTE</dt>
        <dd class="mono">{{ stats.frameMs.toFixed(1) }} MS</dd>
      </div>
    </dl>

    <footer class="readout__footer">
      <span class="readout__pointer">
        <i class="readout__pointer-dot" :class="{ 'is-active': stats.pointerActive }" aria-hidden="true"></i>
        POINTER {{ stats.pointerActive ? 'TRACKING' : 'AT REST' }}
      </span>
      <span v-if="reducedMotion" class="readout__motion">MOTION REDUCED</span>
      <span v-else class="readout__motion">CANVAS 2D</span>
    </footer>
  </aside>
</template>

<style scoped>
.readout {
  position: relative;
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(35, 37, 42, 0.9);
  border-radius: var(--radius-xl);
  background: rgba(15, 16, 17, 0.72);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.018),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px) saturate(115%);
  -webkit-backdrop-filter: blur(24px) saturate(115%);
}

.readout__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-graphite);
}

.readout__label {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.readout__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-fog);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.09em;
}

.readout__status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-pulse-green);
  box-shadow: 0 0 0 3px rgba(39, 166, 68, 0.08);
}

.readout__status.is-paused {
  color: var(--color-ash);
}

.readout__status.is-paused .readout__status-dot {
  background: var(--color-ash);
  box-shadow: none;
}

.readout__heading {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 0 14px;
}

.readout__glyph {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-graphite);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.024);
}

.readout__title-group {
  min-width: 0;
  flex: 1;
}

.readout__title {
  overflow: hidden;
  color: var(--color-paper);
  font-size: 15px;
  font-weight: 510;
  letter-spacing: -0.012em;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readout__model {
  margin-top: 3px;
  overflow: hidden;
  color: var(--color-ash);
  font-size: 9px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readout__index {
  align-self: flex-start;
  color: var(--color-ash);
  font-size: 9px;
  line-height: 1;
}

.readout__formula {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 6px 9px;
  overflow: hidden;
  border: 1px solid rgba(35, 37, 42, 0.7);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.018);
}

.readout__formula-label {
  flex: none;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.readout__formula code {
  overflow: hidden;
  color: var(--color-fog);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: -0.01em;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readout__chart {
  margin-top: 15px;
}

.readout__chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.readout__fps {
  color: var(--color-fog);
  font-size: 9px;
  letter-spacing: 0;
}

.readout__spark {
  display: block;
  width: 100%;
  height: 43px;
  overflow: visible;
}

.readout__grid {
  stroke: var(--color-graphite);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.readout__grid--faint {
  opacity: 0.48;
  stroke-dasharray: 1 5;
}

.readout__spark-line {
  fill: none;
  stroke: var(--color-mist);
  stroke-width: 0.8;
  opacity: 0.45;
}

.readout__spark-dot {
  fill: var(--color-bone);
}

.readout__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 14px;
  border-top: 1px solid var(--color-graphite);
  border-left: 1px solid var(--color-graphite);
}

.readout__metric {
  min-width: 0;
  padding: 10px 9px 11px;
  border-right: 1px solid var(--color-graphite);
  border-bottom: 1px solid var(--color-graphite);
}

.readout__metric dt {
  overflow: hidden;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.055em;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readout__metric dd {
  margin-top: 5px;
  overflow: hidden;
  color: var(--color-mist);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.readout__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.035em;
}

.readout__pointer,
.readout__motion {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.readout__pointer-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-smoke);
  transition: background-color 200ms var(--ease-soft);
}

.readout__pointer-dot.is-active {
  background: var(--color-mist);
}

.readout__motion {
  color: var(--color-ash);
  opacity: 0.75;
}
</style>
