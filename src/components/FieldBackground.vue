<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FIELD_IGNORE_SELECTOR } from '../data/algorithms'
import { FieldEngine } from '../lib/fieldEngine'
import type { AlgorithmId, EngineParams, FieldStats } from '../lib/types'

const props = withDefaults(
  defineProps<{
    mode: AlgorithmId
    params: EngineParams
    paused: boolean
    reducedMotion: boolean
    active: boolean
    elevated?: boolean
  }>(),
  {
    elevated: false,
  },
)

const emit = defineEmits<{
  (event: 'stats', stats: FieldStats): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: FieldEngine | null = null
let documentVisible = !document.hidden

function syncRunning(): void {
  if (!engine) return
  if (props.active && documentVisible) engine.start()
  else engine.stop()
}

function onPointerMove(event: PointerEvent): void {
  if (!props.active) return
  engine?.setPointer(event.clientX, event.clientY)
}

function onPointerDown(event: PointerEvent): void {
  if (!props.active) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const target = event.target
  if (target instanceof Element && target.closest(FIELD_IGNORE_SELECTOR)) return

  engine?.setPointer(event.clientX, event.clientY)
  engine?.pulse(event.clientX, event.clientY, 1.05)
}

function onVisibilityChange(): void {
  documentVisible = !document.hidden
  syncRunning()
}

function onWindowBlur(): void {
  engine?.clearPointer()
}

onMounted(() => {
  if (!canvasRef.value) return

  engine = new FieldEngine(
    canvasRef.value,
    props.mode,
    props.params,
    props.reducedMotion,
    (stats) => emit('stats', stats),
  )

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('visibilitychange', onVisibilityChange)

  syncRunning()
})

watch(
  () => props.mode,
  (mode) => engine?.setMode(mode),
)

watch(
  () => [props.params.density, props.params.speed, props.params.character] as const,
  () => engine?.setParams({ ...props.params }),
)

watch(
  () => props.paused,
  (paused) => engine?.setPaused(paused),
)

watch(
  () => props.reducedMotion,
  (reduced) => engine?.setReducedMotion(reduced),
)

watch(
  () => props.active,
  () => syncRunning(),
)

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  engine?.destroy()
  engine = null
})

function pulse(x?: number, y?: number): void {
  engine?.pulse(x, y, 1.15)
}

function reset(): void {
  engine?.reset()
}

defineExpose({ pulse, reset })
</script>

<template>
  <div class="field-layer" :class="{ 'is-elevated': elevated }">
    <canvas ref="canvasRef" class="field-canvas" aria-hidden="true"></canvas>
  </div>
</template>
