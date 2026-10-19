<script setup lang="ts">
import { computed } from 'vue'
import { ALGORITHMS, ALGORITHM_IDS } from '../data/algorithms'
import type { AlgorithmId, EngineParams, ParamKey } from '../lib/types'
import UiIcon from './UiIcon.vue'

const props = withDefaults(
  defineProps<{
    mode: AlgorithmId
    params: EngineParams
    paused: boolean
    variant?: 'hero' | 'field'
  }>(),
  {
    variant: 'hero',
  },
)

const emit = defineEmits<{
  (event: 'update:mode', mode: AlgorithmId): void
  (event: 'update:param', key: ParamKey, value: number): void
  (event: 'toggle-pause'): void
  (event: 'reset'): void
  (event: 'pulse'): void
}>()

const activeMeta = computed(() => ALGORITHMS[props.mode])

const controls = computed(() => [
  {
    key: 'density' as const,
    label: activeMeta.value.controls.density,
    value: props.params.density,
    min: 0.35,
    max: 1.6,
    step: 0.01,
    display: `${Math.round(props.params.density * 100)}%`,
  },
  {
    key: 'speed' as const,
    label: activeMeta.value.controls.speed,
    value: props.params.speed,
    min: 0.2,
    max: 1.6,
    step: 0.01,
    display: `${props.params.speed.toFixed(2)}×`,
  },
  {
    key: 'character' as const,
    label: activeMeta.value.controls.character,
    value: props.params.character,
    min: 0,
    max: 1,
    step: 0.01,
    display: `${Math.round(props.params.character * 100)}%`,
  },
])

function updateParam(key: ParamKey, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update:param', key, value)
}

function fillPercent(value: number, min: number, max: number): string {
  return `${((value - min) / (max - min)) * 100}%`
}
</script>

<template>
  <section
    class="control-deck"
    :class="`control-deck--${variant}`"
    aria-label="Field controls"
    data-field-ignore
  >
    <div class="control-deck__top">
      <div class="deck-heading" aria-hidden="true">
        <span class="deck-heading__label">Control surface</span>
        <span class="deck-heading__index mono">MODEL {{ activeMeta.index }} / 03</span>
      </div>

      <div class="model-tabs" role="group" aria-label="Choose a simulation model">
        <button
          v-for="id in ALGORITHM_IDS"
          :key="id"
          class="model-tab"
          :class="{ 'is-active': id === mode }"
          type="button"
          :aria-pressed="id === mode"
          :style="{ '--model-accent': ALGORITHMS[id].accent }"
          @click="emit('update:mode', id)"
        >
          <span class="model-tab__index mono">{{ ALGORITHMS[id].index }}</span>
          <span class="model-tab__copy">
            <span class="model-tab__name">{{ ALGORITHMS[id].tab }}</span>
            <span class="model-tab__short">{{ ALGORITHMS[id].shortTab }}</span>
            <span class="model-tab__role">{{ ALGORITHMS[id].model }}</span>
          </span>
          <span class="model-tab__dot" aria-hidden="true"></span>
        </button>
      </div>

      <div class="deck-actions" role="group" aria-label="Simulation actions">
        <button
          class="icon-button"
          type="button"
          title="Send an impulse (P)"
          aria-label="Send an impulse through the field"
          @click="emit('pulse')"
        >
          <UiIcon name="pulse" :size="15" />
        </button>
        <button
          class="icon-button"
          type="button"
          :title="paused ? 'Resume simulation (Space)' : 'Pause simulation (Space)'"
          :aria-label="paused ? 'Resume simulation' : 'Pause simulation'"
          :aria-pressed="paused"
          @click="emit('toggle-pause')"
        >
          <UiIcon :name="paused ? 'play' : 'pause'" :size="14" />
        </button>
        <button
          class="icon-button"
          type="button"
          title="Reset the model (R)"
          aria-label="Reset the current model"
          @click="emit('reset')"
        >
          <UiIcon name="reset" :size="15" />
        </button>
      </div>
    </div>

    <div class="control-deck__bottom">
      <div class="sliders">
        <label
          v-for="control in controls"
          :key="control.key"
          class="slider-control"
          :class="{ 'is-paused': paused }"
        >
          <span class="slider-control__head">
            <span class="slider-control__label">{{ control.label }}</span>
            <span class="slider-control__value mono">{{ control.display }}</span>
          </span>
          <input
            class="slider-control__input"
            type="range"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :value="control.value"
            :style="{
              '--fill': fillPercent(control.value, control.min, control.max),
            }"
            @input="updateParam(control.key, $event)"
          />
        </label>
      </div>

      <div class="deck-hint" aria-hidden="true">
        <span><i class="hint-key"></i> move to bend</span>
        <span class="deck-hint__sep">/</span>
        <span>click to pulse</span>
        <span class="deck-hint__sep">/</span>
        <kbd>P</kbd>
        <kbd>R</kbd>
        <kbd>space</kbd>
      </div>
    </div>
  </section>
</template>

<style scoped>
.control-deck {
  position: relative;
  z-index: 2;
  padding: 13px 14px 13px;
  border: 1px solid rgba(35, 37, 42, 0.92);
  border-radius: var(--radius-xl);
  background: rgba(15, 16, 17, 0.8);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.018),
    inset 0 1px 0 rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(22px) saturate(120%);
  -webkit-backdrop-filter: blur(22px) saturate(120%);
}

.control-deck--field {
  background: rgba(15, 16, 17, 0.88);
}

.control-deck__top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.deck-heading {
  display: flex;
  width: 140px;
  flex: none;
  flex-direction: column;
  gap: 5px;
  padding-left: 2px;
}

.deck-heading__label {
  color: var(--color-mist);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.deck-heading__index {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.model-tabs {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  min-width: 0;
}

.model-tab {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-fog);
  text-align: left;
  transition:
    background-color 160ms var(--ease-soft),
    border-color 160ms var(--ease-soft),
    color 160ms var(--ease-soft);
}

.model-tab:hover {
  background: rgba(255, 255, 255, 0.025);
  color: var(--color-mist);
}

.model-tab.is-active {
  border-color: rgba(255, 255, 255, 0.055);
  background: rgba(255, 255, 255, 0.045);
  color: var(--color-paper);
}

.model-tab__index {
  color: var(--color-ash);
  font-size: 9px;
  line-height: 1;
}

.model-tab.is-active .model-tab__index {
  color: var(--color-fog);
}

.model-tab__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.model-tab__name {
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 510;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-tab__short {
  display: none;
}

.model-tab__role {
  overflow: hidden;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.015em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-tab.is-active .model-tab__role {
  color: var(--color-fog);
}

.model-tab__dot {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: 50%;
  background: var(--model-accent);
  opacity: 0.45;
  transition: opacity 160ms var(--ease-soft);
}

.model-tab.is-active .model-tab__dot {
  opacity: 0.9;
}

.deck-actions {
  display: flex;
  flex: none;
  gap: 4px;
}

.deck-actions .icon-button {
  width: 33px;
  height: 33px;
  background: transparent;
}

.control-deck__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 32px;
  margin-top: 11px;
  padding-top: 12px;
  border-top: 1px solid var(--color-graphite);
}

.sliders {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 34px;
}

.slider-control {
  display: block;
  min-width: 0;
  cursor: pointer;
}

.slider-control__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.slider-control__label {
  overflow: hidden;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.07em;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.slider-control__value {
  color: var(--color-fog);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.slider-control__input {
  display: block;
  width: 100%;
  height: 12px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.slider-control__input::-webkit-slider-runnable-track {
  height: 1px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--color-fog) 0 var(--fill),
    var(--color-graphite) var(--fill) 100%
  );
}

.slider-control__input::-moz-range-track {
  height: 1px;
  border-radius: 2px;
  background: var(--color-graphite);
}

.slider-control__input::-moz-range-progress {
  height: 1px;
  background: var(--color-fog);
}

.slider-control__input::-webkit-slider-thumb {
  width: 9px;
  height: 9px;
  margin-top: -4px;
  border: 1px solid rgba(8, 9, 10, 0.6);
  border-radius: 50%;
  appearance: none;
  background: var(--color-mist);
  box-shadow: 0 0 0 1px rgba(208, 214, 224, 0.1);
  transition: transform 120ms var(--ease-soft);
}

.slider-control__input::-moz-range-thumb {
  width: 8px;
  height: 8px;
  border: 1px solid rgba(8, 9, 10, 0.6);
  border-radius: 50%;
  background: var(--color-mist);
}

.slider-control__input:hover::-webkit-slider-thumb {
  transform: scale(1.2);
}

.slider-control__input:active::-webkit-slider-thumb {
  transform: scale(1.1);
}

.deck-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 1px;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.015em;
  line-height: 1.4;
  white-space: nowrap;
}

.deck-hint span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hint-key {
  width: 9px;
  height: 12px;
  border: 1px solid var(--color-graphite);
  border-radius: 4px;
}

.deck-hint__sep {
  color: var(--color-graphite);
}

.deck-hint kbd {
  min-width: 16px;
  min-height: 16px;
  padding: 0 4px;
  border-color: rgba(35, 37, 42, 0.9);
  background: transparent;
  font-size: 9px;
}

@media (max-width: 1050px) {
  .deck-heading {
    display: none;
  }

  .deck-hint {
    display: none;
  }

  .control-deck__bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .control-deck {
    padding: 11px;
  }

  .control-deck__top {
    gap: 8px;
  }

  .model-tab {
    justify-content: center;
    gap: 0;
    padding: 9px 5px;
  }

  .model-tab__index,
  .model-tab__role,
  .model-tab__name {
    display: none;
  }

  .model-tab__short {
    display: block;
    overflow: hidden;
    color: var(--color-mist);
    font-size: 11.5px;
    font-weight: 510;
    letter-spacing: -0.01em;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .model-tab.is-active .model-tab__short {
    color: var(--color-paper);
  }

  .model-tab__dot {
    display: none;
  }

  .deck-actions {
    gap: 2px;
  }

  .deck-actions .icon-button {
    width: 30px;
    height: 30px;
  }

  .control-deck__bottom {
    margin-top: 9px;
    padding-top: 10px;
  }

  .sliders {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .slider-control__head {
    margin-bottom: 4px;
  }

  .slider-control__input {
    height: 18px;
  }
}
</style>
