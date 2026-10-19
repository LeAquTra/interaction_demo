<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ALGORITHMS } from '../data/algorithms'
import type { AlgorithmId, EngineParams, FieldStats, ParamKey } from '../lib/types'
import BrandMark from './BrandMark.vue'
import ControlDeck from './ControlDeck.vue'
import UiIcon from './UiIcon.vue'

const props = defineProps<{
  mode: AlgorithmId
  params: EngineParams
  paused: boolean
  reducedMotion: boolean
  stats: FieldStats
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'update:mode', mode: AlgorithmId): void
  (event: 'update:param', key: ParamKey, value: number): void
  (event: 'toggle-pause'): void
  (event: 'reset'): void
  (event: 'pulse'): void
}>()

const root = ref<HTMLElement | null>(null)
const meta = computed(() => ALGORITHMS[props.mode])

const countLabel = computed(() => {
  if (props.mode === 'flow') return 'STREAKS'
  if (props.mode === 'attractor') return 'SAMPLES'
  return 'AGENTS'
})

const countValue = computed(() => new Intl.NumberFormat('en-US').format(props.stats.count))

function trapFocus(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || !root.value) return

  const focusable = Array.from(
    root.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null)

  if (focusable.length === 0) {
    event.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === root.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(async () => {
  await nextTick()
  root.value?.focus()
  window.addEventListener('keydown', trapFocus)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', trapFocus)
})
</script>

<template>
  <section
    ref="root"
    class="focus-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="focus-title"
    aria-describedby="focus-description"
    tabindex="-1"
  >
    <header class="focus-bar" data-field-ignore>
      <BrandMark />
      <div class="focus-bar__mode">
        <span class="focus-bar__mode-dot" :style="{ background: meta.accent }" aria-hidden="true"></span>
        <span class="mono">Field mode</span>
        <span class="focus-bar__slash" aria-hidden="true">/</span>
        <span class="mono focus-bar__number">{{ meta.index }}</span>
      </div>
      <div class="focus-bar__actions">
        <span class="focus-bar__hint mono" :class="{ 'is-paused': paused }">
          <span class="status-dot" aria-hidden="true"></span>
          {{ paused ? 'Simulation held' : 'Simulation live' }}
        </span>
        <button class="btn btn--ghost focus-bar__close" type="button" @click="emit('close')">
          <span class="mono focus-bar__esc">ESC</span>
          Exit field
          <UiIcon name="close" :size="13" />
        </button>
      </div>
    </header>

    <div class="focus-main">
      <div class="focus-copy" data-field-ignore>
        <div class="focus-kicker eyebrow">
          <span class="focus-kicker__dot" :style="{ background: meta.accent }" aria-hidden="true"></span>
          <span>Live model</span>
          <span class="focus-kicker__divider" aria-hidden="true">/</span>
          <span class="mono">{{ meta.model }}</span>
        </div>

        <div class="focus-heading">
          <h2 id="focus-title" class="focus-title">{{ meta.title }}</h2>
        </div>

        <p id="focus-description" class="focus-description">{{ meta.description }}</p>

        <div class="focus-formula">
          <span class="mono">MODEL</span>
          <code class="mono">{{ meta.formula }}</code>
        </div>

        <dl class="focus-stats">
          <div class="focus-stat">
            <dt class="mono">{{ countLabel }}</dt>
            <dd class="mono">{{ countValue }}</dd>
          </div>
          <div class="focus-stat">
            <dt class="mono">{{ stats.metric.label }}</dt>
            <dd class="mono">{{ stats.metric.value }}</dd>
          </div>
          <div class="focus-stat">
            <dt class="mono">Frame rate</dt>
            <dd class="mono">{{ paused ? 'HELD' : `${stats.fps} FPS` }}</dd>
          </div>
        </dl>

        <div class="focus-hints">
          <span><UiIcon name="mouse" :size="13" /> Move to perturb</span>
          <span><UiIcon name="pulse" :size="13" /> Click to pulse</span>
          <span v-if="reducedMotion" class="focus-hints__motion">Reduced motion</span>
        </div>
      </div>

      <div class="focus-watermark" aria-hidden="true">
        <span class="focus-watermark__index mono">{{ meta.index }}</span>
        <span class="focus-watermark__label mono">FIELD / {{ meta.model }}</span>
      </div>
    </div>

    <div class="focus-deck">
      <ControlDeck
        :mode="mode"
        :params="params"
        :paused="paused"
        variant="field"
        @update:mode="emit('update:mode', $event)"
        @update:param="(key, value) => emit('update:param', key, value)"
        @toggle-pause="emit('toggle-pause')"
        @reset="emit('reset')"
        @pulse="emit('pulse')"
      />
      <div class="focus-deck__foot mono">
        <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> switch model</span>
        <span><kbd>space</kbd> hold</span>
        <span><kbd>R</kbd> reset</span>
        <span class="focus-deck__foot-right">All computation is local</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.focus-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  overflow-y: auto;
  flex-direction: column;
  background:
    linear-gradient(
      90deg,
      rgba(8, 9, 10, 0.78) 0%,
      rgba(8, 9, 10, 0.35) 34%,
      rgba(8, 9, 10, 0.04) 62%,
      rgba(8, 9, 10, 0.22) 100%
    ),
    linear-gradient(
      180deg,
      rgba(8, 9, 10, 0.52) 0%,
      rgba(8, 9, 10, 0.04) 26%,
      rgba(8, 9, 10, 0.32) 76%,
      rgba(8, 9, 10, 0.72) 100%
    );
  color: var(--color-mist);
  cursor: crosshair;
}

.focus-overlay:focus,
.focus-overlay:focus-visible {
  outline: none;
}

.focus-bar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  width: 100%;
  min-height: 64px;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 var(--page-gutter);
  border-bottom: 1px solid rgba(35, 37, 42, 0.72);
  background: rgba(8, 9, 10, 0.38);
  backdrop-filter: blur(20px) saturate(125%);
  -webkit-backdrop-filter: blur(20px) saturate(125%);
  cursor: default;
}

.focus-bar__mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-fog);
  font-size: 9px;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.focus-bar__mode-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.focus-bar__slash {
  color: var(--color-graphite);
}

.focus-bar__number {
  color: var(--color-mist);
}

.focus-bar__actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.focus-bar__hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.focus-bar__hint .status-dot {
  width: 4px;
  height: 4px;
  box-shadow: none;
}

.focus-bar__hint.is-paused .status-dot {
  background: var(--color-ash);
}

.focus-bar__close {
  color: var(--color-mist);
}

.focus-bar__esc {
  color: var(--color-ash);
  font-size: 9px;
}

.focus-main {
  display: flex;
  width: min(var(--page-max-width), calc(100% - (var(--page-gutter) * 2)));
  flex: 1;
  align-items: center;
  margin-inline: auto;
  padding: 32px 0;
}

.focus-copy {
  width: min(470px, 100%);
  cursor: default;
}

.focus-kicker {
  gap: 8px;
  color: var(--color-fog);
  font-size: 9px;
}

.focus-kicker__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.focus-kicker__divider {
  color: var(--color-graphite);
}

.focus-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
}

.focus-title {
  font-size: clamp(44px, 5.6vw, 64px);
  letter-spacing: -0.028em;
  line-height: 0.98;
}

.focus-description {
  max-width: 440px;
  margin-top: 20px;
  color: var(--color-fog);
  font-size: 15px;
  line-height: 1.65;
}

.focus-formula {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
  padding-top: 14px;
  border-top: 1px solid rgba(56, 59, 63, 0.5);
}

.focus-formula span {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.focus-formula code {
  overflow: hidden;
  color: var(--color-mist);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-stats {
  display: grid;
  max-width: 440px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 22px;
  border-top: 1px solid var(--color-graphite);
  border-bottom: 1px solid var(--color-graphite);
}

.focus-stat {
  min-width: 0;
  padding: 12px 14px 13px 0;
}

.focus-stat + .focus-stat {
  padding-left: 16px;
  border-left: 1px solid var(--color-graphite);
}

.focus-stat dt {
  overflow: hidden;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.focus-stat dd {
  margin-top: 7px;
  overflow: hidden;
  color: var(--color-mist);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-hints {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
  margin-top: 18px;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.focus-hints span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.focus-hints__motion {
  color: var(--color-fog);
  opacity: 0.8;
}

.focus-watermark {
  display: flex;
  flex-direction: column;
  margin-left: auto;
  align-self: flex-end;
  align-items: flex-end;
  gap: 7px;
  padding-bottom: 8px;
  color: var(--color-ash);
  opacity: 0.7;
}

.focus-watermark__index {
  color: var(--color-fog);
  font-size: 26px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.06em;
  line-height: 1;
}

.focus-watermark__label {
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.focus-deck {
  position: relative;
  z-index: 3;
  width: min(var(--page-max-width), calc(100% - (var(--page-gutter) * 2)));
  flex: none;
  margin-inline: auto;
  padding-bottom: 20px;
}

.focus-deck__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 18px;
  padding: 12px 4px 0;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.focus-deck__foot span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.focus-deck__foot kbd {
  min-width: 16px;
  min-height: 16px;
  padding: 0 4px;
  border-color: rgba(35, 37, 42, 0.8);
  background: transparent;
  font-size: 9px;
}

.focus-deck__foot-right {
  margin-left: auto;
  opacity: 0.75;
}

@media (max-width: 900px) {
  .focus-title {
    font-size: clamp(40px, 9vw, 56px);
  }

  .focus-watermark {
    display: none;
  }

  .focus-main {
    align-items: flex-start;
    padding-top: 48px;
  }
}

@media (max-width: 700px) {
  .focus-overlay {
    background:
      linear-gradient(
        180deg,
        rgba(8, 9, 10, 0.84) 0%,
        rgba(8, 9, 10, 0.56) 38%,
        rgba(8, 9, 10, 0.26) 68%,
        rgba(8, 9, 10, 0.86) 100%
      ),
      linear-gradient(90deg, rgba(8, 9, 10, 0.36), rgba(8, 9, 10, 0.04));
  }

  .focus-bar {
    min-height: 58px;
    gap: 12px;
    padding-inline: 16px;
  }

  .focus-bar__mode {
    display: none;
  }

  .focus-bar__hint {
    display: none;
  }

  .focus-bar__esc {
    display: none;
  }

  .focus-bar__close {
    min-height: 32px;
    padding-inline: 10px;
    font-size: 12px;
  }

  .focus-main {
    width: calc(100% - 32px);
    padding: 34px 0 24px;
  }

  .focus-heading {
    margin-top: 18px;
  }

  .focus-title {
    font-size: clamp(38px, 12vw, 48px);
  }

  .focus-description {
    margin-top: 16px;
    font-size: 14px;
  }

  .focus-formula {
    margin-top: 20px;
  }

  .focus-watermark {
    display: none;
  }

  .focus-deck {
    width: calc(100% - 24px);
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }

  .focus-deck__foot {
    padding-top: 10px;
    gap: 8px 12px;
  }

  .focus-deck__foot-right {
    display: none;
  }
}
</style>
