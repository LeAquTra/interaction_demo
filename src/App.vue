<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ALGORITHMS, DEFAULT_PARAMS } from './data/algorithms'
import type { AlgorithmId, EngineParams, FieldStats, ParamKey } from './lib/types'
import CodaSection from './components/CodaSection.vue'
import ControlDeck from './components/ControlDeck.vue'
import EngineReadout from './components/EngineReadout.vue'
import FieldBackground from './components/FieldBackground.vue'
import FocusOverlay from './components/FocusOverlay.vue'
import MethodSection from './components/MethodSection.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import UiIcon from './components/UiIcon.vue'

const mode = ref<AlgorithmId>('flow')
const paused = ref(false)
const reducedMotion = ref(false)
const focusMode = ref(false)
const deepScroll = ref(false)
const previousFocus = ref<HTMLElement | null>(null)
const fieldRef = ref<{
  pulse: (x?: number, y?: number) => void
  reset: () => void
} | null>(null)

const params = reactive<Record<AlgorithmId, EngineParams>>({
  flow: { ...DEFAULT_PARAMS.flow },
  attractor: { ...DEFAULT_PARAMS.attractor },
  swarm: { ...DEFAULT_PARAMS.swarm },
})

const stats = ref<FieldStats>({
  fps: 60,
  frameMs: 1.2,
  count: 0,
  metric: { label: 'ENERGY', value: '0.50' },
  secondary: { label: 'VELOCITY', value: '0 px/s' },
  history: Array.from({ length: 28 }, () => 60),
  pointerActive: false,
  paused: false,
  mode: 'flow',
})

const meta = computed(() => ALGORITHMS[mode.value])
const activeParams = computed(() => params[mode.value])
const fieldActive = computed(() => focusMode.value || !deepScroll.value)
const countLabel = computed(() => {
  if (mode.value === 'flow') return 'STREAKS'
  if (mode.value === 'attractor') return 'SAMPLES'
  return 'AGENTS'
})

let scrollQueued = false
let reducedMotionQuery: MediaQueryList | null = null

function handleScroll(): void {
  if (scrollQueued) return
  scrollQueued = true

  requestAnimationFrame(() => {
    deepScroll.value = window.scrollY > window.innerHeight * 0.88
    scrollQueued = false
  })
}

function setMode(next: AlgorithmId): void {
  if (mode.value === next) return
  mode.value = next
  paused.value = false
}

function updateParam(key: ParamKey, value: number): void {
  params[mode.value][key] = value
}

function togglePause(): void {
  paused.value = !paused.value
}

function resetField(): void {
  paused.value = false
  fieldRef.value?.reset()
}

function sendPulse(): void {
  paused.value = false
  fieldRef.value?.pulse()
}

function focusCenterPulse(): void {
  const x = window.innerWidth > 960 ? window.innerWidth * 0.68 : window.innerWidth * 0.5
  const y = window.innerHeight * 0.43
  fieldRef.value?.pulse(x, y)
}

async function enterFocus(nextMode?: AlgorithmId): Promise<void> {
  previousFocus.value =
    document.activeElement instanceof HTMLElement ? document.activeElement : null

  if (nextMode) mode.value = nextMode
  paused.value = false
  focusMode.value = true
  document.body.classList.add('is-field-open')

  await nextTick()
  window.requestAnimationFrame(() => focusCenterPulse())
}

function closeFocus(): void {
  if (!focusMode.value) return
  focusMode.value = false
  document.body.classList.remove('is-field-open')

  nextTick(() => {
    previousFocus.value?.focus({ preventScroll: true })
    previousFocus.value = null
  })
}

function handleKeyboard(event: KeyboardEvent): void {
  if (event.key === 'Escape' && focusMode.value) {
    event.preventDefault()
    closeFocus()
    return
  }

  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }

  if (!focusMode.value && deepScroll.value) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const interactive =
    target instanceof HTMLElement && target.closest('button, a, [role="button"]')

  if (event.code === 'Space' && !interactive) {
    event.preventDefault()
    togglePause()
    return
  }

  if (event.key === '1' || event.key === '2' || event.key === '3') {
    event.preventDefault()
    const next = ['flow', 'attractor', 'swarm'][Number(event.key) - 1] as AlgorithmId
    setMode(next)
    return
  }

  if (event.key.toLowerCase() === 'p') {
    event.preventDefault()
    sendPulse()
    return
  }

  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    resetField()
  }
}

function syncReducedMotion(): void {
  if (!reducedMotionQuery) return
  reducedMotion.value = reducedMotionQuery.matches
}

function setDocumentTitle(): void {
  if (focusMode.value) {
    document.title = `${meta.value.title} — Axiom field mode`
  } else {
    document.title = 'Axiom — Where noise becomes structure'
  }
}

watch([mode, focusMode], setDocumentTitle)

onMounted(() => {
  deepScroll.value = window.scrollY > window.innerHeight * 0.88
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeyboard)

  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = reducedMotionQuery.matches
  reducedMotionQuery.addEventListener('change', syncReducedMotion)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeyboard)
  reducedMotionQuery?.removeEventListener('change', syncReducedMotion)
  document.body.classList.remove('is-field-open')
})
</script>

<template>
  <FieldBackground
    ref="fieldRef"
    :mode="mode"
    :params="activeParams"
    :paused="paused"
    :reduced-motion="reducedMotion"
    :active="fieldActive"
    :elevated="focusMode"
    @stats="stats = $event"
  />

  <div v-show="!focusMode" class="field-atmosphere" aria-hidden="true"></div>

  <div class="site-shell" :class="{ 'is-obscured': focusMode }" :inert="focusMode">
    <a class="skip-link" href="#main">Skip to content</a>

    <SiteHeader @open-field="enterFocus()" />

    <main id="main">
      <section id="field" class="hero" aria-labelledby="hero-title">
        <div class="container hero__inner">
          <div class="hero__grid">
            <div class="hero__copy">
              <div class="hero__meta reveal reveal--1">
                <span class="pill">
                  <span class="status-dot" aria-hidden="true"></span>
                  Simulation online
                </span>
                <span class="hero__meta-rule" aria-hidden="true"></span>
                <span class="hero__meta-copy mono">Pointer-driven · Canvas 2D</span>
              </div>

              <h1 id="hero-title" class="hero__title reveal reveal--2">
                <span>Where noise</span>
                <span>becomes structure.</span>
              </h1>

              <p class="hero__lede reveal reveal--3">
                A live observatory for computational systems. Bend the field with your pointer,
                send a pulse through it, and watch order assemble from simple rules.
              </p>

              <div class="hero__actions reveal reveal--4">
                <button class="btn btn--primary hero__cta" type="button" @click="enterFocus()">
                  Enter the field
                  <UiIcon name="focus" :size="15" />
                </button>
                <a href="#method" class="text-link hero__secondary">
                  Read the method
                  <UiIcon name="arrow-down" :size="14" />
                </a>
              </div>

              <p class="hero__micro mono reveal reveal--4">
                <span>{{ meta.index }} — {{ meta.model }}</span>
                <span class="hero__micro-divider" aria-hidden="true">/</span>
                <span>{{ countLabel.toLowerCase() }}</span>
                <span class="hero__micro-divider" aria-hidden="true">/</span>
                <span>real-time synthesis</span>
              </p>
            </div>

            <div class="hero__readout reveal reveal--3">
              <EngineReadout
                :mode="mode"
                :stats="stats"
                :paused="paused"
                :reduced-motion="reducedMotion"
              />
            </div>
          </div>

          <div class="hero__lower reveal reveal--4">
            <ControlDeck
              :mode="mode"
              :params="activeParams"
              :paused="paused"
              @update:mode="setMode"
              @update:param="updateParam"
              @toggle-pause="togglePause"
              @reset="resetField"
              @pulse="sendPulse"
            />

            <div class="hero__foot">
              <span class="hero__foot-instruction">
                <UiIcon name="mouse" :size="13" />
                Move to perturb · click to pulse
              </span>
              <span class="hero__foot-note mono">No data leaves this page.</span>
              <span class="hero__foot-keys mono">
                <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> models
                <span class="hero__foot-sep" aria-hidden="true">·</span>
                <kbd>space</kbd> hold
              </span>
            </div>
          </div>
        </div>
      </section>

      <MethodSection :mode="mode" @select="setMode" @open="enterFocus" />
      <CodaSection @open="enterFocus()" />
    </main>

    <SiteFooter />
  </div>

  <Transition name="field-overlay">
    <FocusOverlay
      v-if="focusMode"
      :mode="mode"
      :params="activeParams"
      :paused="paused"
      :reduced-motion="reducedMotion"
      :stats="stats"
      @close="closeFocus"
      @update:mode="setMode"
      @update:param="updateParam"
      @toggle-pause="togglePause"
      @reset="resetField"
      @pulse="sendPulse"
    />
  </Transition>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  padding: 112px 0 26px;
  cursor: crosshair;
}

.hero a,
.hero button,
.hero input,
.hero .pill,
.hero :deep(.readout),
.hero :deep(.control-deck) {
  cursor: default;
}

.hero a,
.hero button,
.hero input {
  cursor: pointer;
}

.hero__inner {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 356px;
  align-items: start;
  gap: clamp(40px, 5vw, 80px);
}

.hero__copy {
  padding-top: 3px;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  min-height: 25px;
}

.hero__meta-rule {
  width: 24px;
  height: 1px;
  background: var(--color-graphite);
}

.hero__meta-copy {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.hero__title {
  margin-top: 26px;
  color: var(--color-paper);
  font-size: clamp(48px, 5.2vw, 70px);
  font-weight: 510;
  letter-spacing: -0.022em;
  line-height: 0.99;
  text-wrap: initial;
}

.hero__title span {
  display: block;
}

.hero__lede {
  max-width: 515px;
  margin-top: 24px;
  color: var(--color-fog);
  font-size: 16px;
  line-height: 1.62;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  margin-top: 30px;
}

.hero__cta {
  min-height: 42px;
  padding-inline: 17px;
}

.hero__secondary {
  padding: 6px 0;
  color: var(--color-fog);
}

.hero__secondary:hover {
  color: var(--color-mist);
}

.hero__micro {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.hero__micro-divider {
  color: var(--color-graphite);
}

.hero__readout {
  padding-top: 6px;
}

.hero__lower {
  margin-top: auto;
  padding-top: clamp(48px, 8vh, 92px);
}

.hero__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  margin-top: 13px;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.hero__foot-instruction {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-fog);
}

.hero__foot-note {
  margin-left: auto;
  color: var(--color-ash);
}

.hero__foot-keys {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  color: var(--color-ash);
}

.hero__foot-keys kbd {
  min-width: 16px;
  min-height: 16px;
  padding: 0 4px;
  border-color: rgba(35, 37, 42, 0.9);
  background: transparent;
  font-size: 9px;
}

.hero__foot-sep {
  color: var(--color-graphite);
}

@media (max-width: 1120px) {
  .hero__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero__readout {
    display: none;
  }

  .hero__copy {
    max-width: 760px;
  }

  .hero__title {
    font-size: clamp(52px, 7.5vw, 72px);
  }

  .hero__lede {
    max-width: 560px;
  }
}

@media (max-width: 860px) {
  .hero {
    padding-top: 102px;
  }

  .hero__lower {
    padding-top: 48px;
  }

  .hero__foot-note {
    display: none;
  }

  .hero__foot-keys {
    margin-left: auto;
  }
}

@media (max-width: 620px) {
  .hero {
    padding-top: 90px;
    padding-bottom: 18px;
  }

  .hero__title {
    margin-top: 22px;
    font-size: clamp(44px, 12.4vw, 58px);
    letter-spacing: -0.028em;
    line-height: 1;
  }

  .hero__lede {
    margin-top: 20px;
    font-size: 15px;
    line-height: 1.6;
  }

  .hero__actions {
    margin-top: 26px;
    gap: 12px 20px;
  }

  .hero__micro {
    margin-top: 22px;
    font-size: 8px;
    letter-spacing: 0.015em;
  }

  .hero__meta-copy {
    font-size: 8px;
  }

  .hero__meta {
    gap: 10px;
  }

  .hero__lower {
    padding-top: 40px;
  }

  .hero__foot {
    margin-top: 11px;
    gap: 8px;
  }

  .hero__foot-keys {
    display: none;
  }
}
</style>
