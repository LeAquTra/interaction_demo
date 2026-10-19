<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ALGORITHMS, ALGORITHM_IDS } from '../data/algorithms'
import type { AlgorithmId } from '../lib/types'
import AlgorithmIcon from './AlgorithmIcon.vue'
import UiIcon from './UiIcon.vue'

const props = defineProps<{
  mode: AlgorithmId
}>()

const emit = defineEmits<{
  (event: 'select', mode: AlgorithmId): void
  (event: 'open', mode: AlgorithmId): void
}>()

const meta = computed(() => ALGORITHMS[props.mode])
const copied = ref(false)
let copyTimer: number | undefined

const KEYWORDS = new Set([
  'const',
  'let',
  'for',
  'of',
  'if',
  'else',
  'new',
  'return',
  'function',
  'true',
  'false',
  'while',
])

interface CodeToken {
  text: string
  kind: 'plain' | 'keyword' | 'number' | 'comment'
}

function tokenizeLine(line: string): CodeToken[] {
  const commentIndex = line.indexOf('//')
  const code = commentIndex >= 0 ? line.slice(0, commentIndex) : line
  const comment = commentIndex >= 0 ? line.slice(commentIndex) : ''
  const tokens: CodeToken[] = []
  const pattern = /(\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|\s+|.)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(code)) !== null) {
    const text = match[0]
    if (KEYWORDS.has(text)) tokens.push({ text, kind: 'keyword' })
    else if (/^\d/.test(text)) tokens.push({ text, kind: 'number' })
    else tokens.push({ text, kind: 'plain' })
  }

  if (comment) tokens.push({ text: comment, kind: 'comment' })
  return tokens
}

const codeLines = computed(() => meta.value.code.split('\n').map(tokenizeLine))

async function copyCode(): Promise<void> {
  const text = meta.value.code

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopy(text)
    }

    copied.value = true
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    fallbackCopy(text)
    copied.value = true
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 1800)
  }
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

onBeforeUnmount(() => {
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <section id="method" class="method page-surface" aria-labelledby="method-title">
    <div class="container">
      <header class="method-head">
        <div class="method-kicker">
          <span class="mono method-kicker__index">01</span>
          <span class="method-kicker__rule" aria-hidden="true"></span>
          <span class="eyebrow">The method</span>
        </div>

        <div class="method-head__grid">
          <h2 id="method-title" class="method-title">
            Every field<br />
            has a grammar.
          </h2>
          <div class="method-intro">
            <p>
              No textures. No footage. Three small systems, rendered live and exposed at the
              seams. Choose a model to read its mechanics — then step back into the field.
            </p>
            <a href="#runtime" class="text-link method-intro__link">
              Read the runtime
              <UiIcon name="arrow-down" :size="14" />
            </a>
          </div>
        </div>
      </header>

      <div class="register">
        <div class="register-head">
          <span class="eyebrow">Model register</span>
          <span class="mono register-head__hint">Select to inspect</span>
        </div>

        <div class="model-list">
          <button
            v-for="id in ALGORITHM_IDS"
            :key="id"
            class="model-row"
            :class="{ 'is-active': mode === id }"
            type="button"
            :aria-pressed="mode === id"
            :aria-label="`Inspect ${ALGORITHMS[id].title}`"
            :style="{ '--row-accent': ALGORITHMS[id].accent }"
            @click="emit('select', id)"
          >
            <span class="model-row__index mono">{{ ALGORITHMS[id].index }}</span>
            <span class="model-row__glyph">
              <AlgorithmIcon :id="id" :size="18" />
            </span>
            <span class="model-row__copy">
              <span class="model-row__name">{{ ALGORITHMS[id].title }}</span>
              <span class="model-row__tagline">{{ ALGORITHMS[id].tagline }}</span>
            </span>
            <span class="model-row__formula">
              <span class="model-row__formula-label mono">MODEL</span>
              <code class="mono">{{ ALGORITHMS[id].formula }}</code>
            </span>
            <span class="model-row__state">
              <span class="model-row__accent" aria-hidden="true"></span>
              <span class="mono">{{ mode === id ? 'Active' : 'Inspect' }}</span>
              <UiIcon name="arrow-up-right" :size="12" />
            </span>
          </button>
        </div>
      </div>

      <div id="runtime" class="runtime" aria-labelledby="runtime-title">
        <div class="runtime-copy">
          <div class="runtime-kicker">
            <span class="eyebrow">Runtime specimen</span>
            <span class="mono runtime-kicker__slash">/</span>
            <span class="mono runtime-kicker__index">{{ meta.index }}</span>
          </div>

          <h3 id="runtime-title" class="runtime-title">{{ meta.tagline }}</h3>
          <p class="runtime-description">{{ meta.description }}</p>

          <dl class="runtime-facts">
            <div v-for="fact in meta.facts" :key="fact.label" class="runtime-fact">
              <dt class="mono">{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>

          <button class="btn btn--ghost runtime-open" type="button" @click="emit('open', meta.id)">
            <span class="runtime-open__dot" :style="{ background: meta.accent }" aria-hidden="true"></span>
            Open in field
            <UiIcon name="focus" :size="14" />
          </button>
        </div>

        <figure class="code-frame">
          <figcaption class="code-frame__head">
            <span class="code-frame__file mono">
              <span class="code-frame__mark" aria-hidden="true"></span>
              {{ meta.file }}
            </span>
            <button class="code-frame__copy mono" type="button" aria-live="polite" @click="copyCode">
              <UiIcon :name="copied ? 'check' : 'copy'" :size="12" />
              {{ copied ? 'Copied' : 'Copy' }}
            </button>
          </figcaption>

          <div class="code-frame__body">
            <!-- Keep the preformatted content on one line so the whitespace is faithful. -->
            <pre class="code-frame__pre" tabindex="0" aria-label="Current model source excerpt"><code><span v-for="(line, lineIndex) in codeLines" :key="lineIndex" class="code-line"><span class="code-line__number">{{ String(lineIndex + 1).padStart(2, '0') }}</span><span class="code-line__content"><span v-for="(token, tokenIndex) in line" :key="tokenIndex" :class="`code-token--${token.kind}`">{{ token.text }}</span></span></span></code></pre>
          </div>

          <div class="code-frame__foot mono">
            <span>{{ meta.model }}</span>
            <span>Canvas 2D · local only</span>
          </div>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.method {
  padding: var(--section-gap) 0 112px;
  border-top: 1px solid var(--color-graphite);
}

.method-head {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.method-kicker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.method-kicker__index {
  color: var(--color-mist);
  font-size: 10px;
}

.method-kicker__rule {
  width: 28px;
  height: 1px;
  background: var(--color-graphite);
}

.method-head__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  align-items: end;
  gap: 64px;
}

.method-title {
  font-size: clamp(40px, 4.5vw, 48px);
  letter-spacing: -0.022em;
  line-height: 1;
}

.method-intro {
  display: flex;
  max-width: 430px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 3px;
}

.method-intro p {
  color: var(--color-fog);
  font-size: 15px;
  line-height: 1.65;
}

.method-intro__link {
  color: var(--color-mist);
  font-size: 13px;
}

.register {
  margin-top: 72px;
}

.register-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
}

.register-head__hint {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.model-list {
  border-top: 1px solid var(--color-graphite);
}

.model-row {
  position: relative;
  display: grid;
  width: 100%;
  grid-template-columns: 42px 32px minmax(220px, 1.15fr) minmax(260px, 1fr) 112px;
  align-items: center;
  gap: 20px;
  padding: 20px 14px;
  border-bottom: 1px solid var(--color-graphite);
  color: var(--color-fog);
  text-align: left;
  transition:
    background-color 180ms var(--ease-soft),
    color 180ms var(--ease-soft);
}

.model-row::before {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 1px;
  background: var(--color-paper);
  content: '';
  opacity: 0;
  transition: opacity 180ms var(--ease-soft);
}

.model-row:hover {
  background: rgba(255, 255, 255, 0.023);
}

.model-row.is-active {
  background: rgba(255, 255, 255, 0.035);
}

.model-row.is-active::before {
  opacity: 0.8;
}

.model-row__index {
  color: var(--color-ash);
  font-size: 10px;
}

.model-row__glyph {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-graphite);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.018);
  color: var(--color-fog);
}

.model-row.is-active .model-row__glyph {
  color: var(--color-mist);
}

.model-row.is-active .model-row__glyph {
  border-color: var(--color-smoke);
}

.model-row__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.model-row__name {
  color: var(--color-paper);
  font-size: 17px;
  font-weight: 510;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.model-row__tagline {
  overflow: hidden;
  color: var(--color-fog);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-row__formula {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.model-row__formula-label {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.model-row__formula code {
  overflow: hidden;
  color: var(--color-fog);
  font-size: 11px;
  letter-spacing: -0.015em;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-row__state {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 7px;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.model-row__accent {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--row-accent);
  opacity: 0.65;
}

.model-row__state svg {
  opacity: 0;
  transform: translate(-2px, 2px);
  transition:
    opacity 160ms var(--ease-soft),
    transform 160ms var(--ease-soft);
}

.model-row:hover .model-row__state svg,
.model-row.is-active .model-row__state svg {
  opacity: 0.8;
  transform: translate(0, 0);
}

.runtime {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  align-items: start;
  gap: 78px;
  margin-top: 96px;
  padding-top: 56px;
  border-top: 1px solid var(--color-graphite);
}

.runtime-copy {
  position: sticky;
  top: 104px;
}

.runtime-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.runtime-kicker__slash {
  color: var(--color-graphite);
  font-size: 10px;
}

.runtime-kicker__index {
  color: var(--color-ash);
  font-size: 10px;
}

.runtime-title {
  max-width: 440px;
  margin-top: 24px;
  font-size: clamp(32px, 3.4vw, 40px);
  letter-spacing: -0.025em;
  line-height: 1.08;
}

.runtime-description {
  max-width: 440px;
  margin-top: 18px;
  color: var(--color-fog);
  font-size: 15px;
  line-height: 1.65;
}

.runtime-facts {
  margin-top: 32px;
  border-top: 1px solid var(--color-graphite);
}

.runtime-fact {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-graphite);
}

.runtime-fact dt {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.runtime-fact dd {
  color: var(--color-mist);
  font-size: 12px;
  text-align: right;
}

.runtime-open {
  margin-top: 28px;
  color: var(--color-mist);
}

.runtime-open__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.code-frame {
  overflow: hidden;
  border: 1px solid var(--color-graphite);
  border-radius: var(--radius-xl);
  background: var(--color-carbon);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.018);
}

.code-frame__head {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-graphite);
  background: rgba(255, 255, 255, 0.018);
}

.code-frame__file {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: var(--color-fog);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-frame__mark {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 1px;
  background: var(--color-ash);
}

.code-frame__copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  border-radius: var(--radius-sm);
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  transition:
    background-color 160ms var(--ease-soft),
    color 160ms var(--ease-soft);
}

.code-frame__copy:hover {
  background: rgba(255, 255, 255, 0.045);
  color: var(--color-mist);
}

.code-frame__body {
  max-height: 458px;
  overflow: auto;
  padding: 22px 0 24px;
}

.code-frame__pre {
  min-width: max-content;
  margin: 0;
  padding: 0 20px;
  color: var(--color-fog);
  font-family: var(--font-mono);
  font-size: 12px;
  font-feature-settings: 'cv01' on, 'ss03' on;
  letter-spacing: -0.03em;
  line-height: 1.85;
  tab-size: 2;
}

.code-frame__pre:focus-visible {
  outline-offset: -2px;
}

.code-line {
  display: flex;
  gap: 18px;
}

.code-line__number {
  display: inline-block;
  width: 18px;
  flex: none;
  color: var(--color-smoke);
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
}

.code-line__content {
  white-space: pre;
}

.code-token--plain {
  color: var(--color-fog);
}

.code-token--keyword {
  color: var(--color-mist);
  font-weight: 510;
}

.code-token--number {
  color: var(--color-mist);
}

.code-token--comment {
  color: var(--color-ash);
  font-style: italic;
}

.code-frame__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 16px;
  border-top: 1px solid var(--color-graphite);
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.02em;
}

@media (max-width: 1080px) {
  .method-head__grid {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
    gap: 40px;
  }

  .model-row {
    grid-template-columns: 36px 32px minmax(200px, 1.1fr) minmax(190px, 1fr) 104px;
    gap: 16px;
  }

  .runtime {
    gap: 48px;
  }
}

@media (max-width: 900px) {
  .method {
    padding: 80px 0 88px;
  }

  .method-head__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }

  .method-intro {
    max-width: 500px;
  }

  .register {
    margin-top: 56px;
  }

  .model-row {
    grid-template-columns: 28px 32px minmax(0, 1fr) 90px;
  }

  .model-row__formula {
    display: none;
  }

  .runtime {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
    margin-top: 72px;
    padding-top: 48px;
  }

  .runtime-copy {
    position: static;
  }

  .runtime-facts {
    max-width: 560px;
  }
}

@media (max-width: 620px) {
  .method {
    padding: 64px 0;
  }

  .method-head {
    gap: 24px;
  }

  .method-head__grid {
    gap: 22px;
  }

  .method-title {
    font-size: clamp(36px, 11vw, 44px);
  }

  .register {
    margin-top: 44px;
  }

  .register-head__hint {
    display: none;
  }

  .model-row {
    grid-template-columns: 22px 28px minmax(0, 1fr) 18px;
    gap: 10px;
    padding: 16px 6px;
  }

  .model-row__glyph {
    width: 28px;
    height: 28px;
  }

  .model-row__name {
    font-size: 15px;
  }

  .model-row__state {
    gap: 0;
  }

  .model-row__state .mono,
  .model-row__accent {
    display: none;
  }

  .model-row__state svg {
    opacity: 0.6;
    transform: none;
  }

  .runtime {
    margin-top: 56px;
    padding-top: 40px;
  }

  .runtime-title {
    font-size: clamp(30px, 9vw, 36px);
  }

  .runtime-fact {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .runtime-fact dd {
    text-align: left;
  }

  .code-frame__body {
    max-height: 360px;
  }

  .code-frame__pre {
    padding: 0 14px;
    font-size: 11px;
  }

  .code-line {
    gap: 12px;
  }

  .code-frame__head {
    padding: 0 12px;
  }

  .code-frame__foot {
    padding-inline: 12px;
  }
}
</style>
