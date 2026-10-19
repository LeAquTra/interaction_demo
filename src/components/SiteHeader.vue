<script setup lang="ts">
import BrandMark from './BrandMark.vue'
import UiIcon from './UiIcon.vue'

const emit = defineEmits<{
  (event: 'open-field'): void
}>()
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a href="#field" class="site-header__brand" aria-label="Axiom field lab, back to top">
        <BrandMark />
      </a>

      <nav class="site-header__nav" aria-label="Primary navigation">
        <a href="#field" class="nav-link">Field</a>
        <a href="#method" class="nav-link">Method</a>
        <a href="#runtime" class="nav-link">Runtime</a>
      </nav>

      <div class="site-header__actions">
        <span class="site-header__version mono">v1.4.2</span>
        <span class="site-header__availability">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Local</span>
        </span>
        <button class="btn btn--ghost site-header__cta" type="button" @click="emit('open-field')">
          Open field
          <UiIcon name="arrow-up-right" :size="13" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(35, 37, 42, 0.72);
  background: rgba(8, 9, 10, 0.62);
  backdrop-filter: blur(18px) saturate(125%);
  -webkit-backdrop-filter: blur(18px) saturate(125%);
}

.site-header__inner {
  display: flex;
  width: min(var(--page-max-width), calc(100% - (var(--page-gutter) * 2)));
  height: 64px;
  margin-inline: auto;
  align-items: center;
  gap: 32px;
}

.site-header__brand {
  display: inline-flex;
  border-radius: var(--radius-sm);
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

.nav-link {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  color: var(--color-fog);
  font-size: 13px;
  line-height: 1;
  transition:
    color 160ms var(--ease-soft),
    background-color 160ms var(--ease-soft);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-mist);
}

.site-header__actions {
  display: flex;
  margin-left: auto;
  align-items: center;
  gap: 16px;
}

.site-header__version {
  color: var(--color-ash);
  font-size: 10px;
  letter-spacing: 0;
}

.site-header__availability {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ash);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.site-header__availability .status-dot {
  box-shadow: none;
}

.site-header__cta {
  color: var(--color-mist);
}

@media (max-width: 840px) {
  .site-header__version,
  .site-header__availability {
    display: none;
  }

  .site-header__inner {
    gap: 16px;
  }

  .site-header__nav {
    display: none;
  }
}

@media (max-width: 520px) {
  .site-header__inner {
    height: 58px;
  }

  .site-header__cta {
    min-height: 32px;
    padding-inline: 10px;
    font-size: 12px;
  }
}
</style>
