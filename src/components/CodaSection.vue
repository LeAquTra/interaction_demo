<script setup lang="ts">
import UiIcon from './UiIcon.vue'

const emit = defineEmits<{
  (event: 'open'): void
}>()
</script>

<template>
  <section class="coda page-surface" aria-labelledby="coda-title">
    <div class="container coda__inner">
      <div class="coda__head">
        <div class="eyebrow">
          <span class="mono coda__index">02</span>
          <span class="coda__rule" aria-hidden="true"></span>
          Open system
        </div>
        <h2 id="coda-title" class="coda__title">
          Small rules.<br />
          Unreasonable range.
        </h2>
      </div>

      <div class="coda__aside">
        <p class="coda__description">
          The artist is a loop. The material is arithmetic. Change one parameter at a time and
          watch the system find a different equilibrium.
        </p>

        <dl class="coda__stats">
          <div class="coda__stat">
            <dt class="mono">Models</dt>
            <dd class="mono">03</dd>
          </div>
          <div class="coda__stat">
            <dt class="mono">States</dt>
            <dd class="mono">∞</dd>
          </div>
          <div class="coda__stat">
            <dt class="mono">Leaves device</dt>
            <dd class="mono">0</dd>
          </div>
        </dl>

        <button class="btn btn--ghost coda__button" type="button" @click="emit('open')">
          Step into the field
          <UiIcon name="arrow-up-right" :size="14" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.coda {
  padding: 0 0 112px;
}

.coda__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 84px;
  padding-top: 88px;
  border-top: 1px solid var(--color-graphite);
}

.coda__head {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.coda__index {
  color: var(--color-mist);
  font-size: 10px;
}

.coda__rule {
  width: 24px;
  height: 1px;
  background: var(--color-graphite);
}

.coda__title {
  max-width: 560px;
  font-size: clamp(40px, 4.5vw, 48px);
  line-height: 1;
}

.coda__aside {
  display: flex;
  max-width: 440px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding-bottom: 2px;
}

.coda__description {
  color: var(--color-fog);
  font-size: 15px;
  line-height: 1.65;
}

.coda__stats {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 32px;
  border-top: 1px solid var(--color-graphite);
  border-bottom: 1px solid var(--color-graphite);
}

.coda__stat {
  min-width: 0;
  padding: 14px 14px 15px 0;
}

.coda__stat + .coda__stat {
  padding-left: 18px;
  border-left: 1px solid var(--color-graphite);
}

.coda__stat dt {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.coda__stat dd {
  margin-top: 9px;
  color: var(--color-mist);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
}

.coda__button {
  margin-top: 24px;
}

@media (max-width: 900px) {
  .coda {
    padding-bottom: 88px;
  }

  .coda__inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
    padding-top: 72px;
  }

  .coda__aside {
    max-width: 540px;
  }
}

@media (max-width: 620px) {
  .coda {
    padding-bottom: 64px;
  }

  .coda__inner {
    gap: 28px;
    padding-top: 56px;
  }

  .coda__head {
    gap: 22px;
  }

  .coda__title {
    font-size: clamp(36px, 11vw, 44px);
  }

  .coda__stats {
    margin-top: 26px;
  }

  .coda__stat {
    padding-right: 8px;
  }

  .coda__stat + .coda__stat {
    padding-left: 12px;
  }

  .coda__stat dt {
    min-height: 22px;
  }

  .coda__stat dd {
    font-size: 16px;
  }
}
</style>
