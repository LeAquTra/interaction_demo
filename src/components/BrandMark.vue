<script setup lang="ts">
withDefaults(
  defineProps<{
    badge?: boolean
    compact?: boolean
  }>(),
  {
    badge: true,
    compact: false,
  },
)
</script>

<template>
  <span class="brand" :class="{ 'brand--compact': compact }">
    <svg class="brand__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.9 22.1 12 12 22.1 1.9 12 12 1.9Z" stroke="currentColor" stroke-width="1.15" />
      <path d="M12 7.1 16.9 12 12 16.9 7.1 12 12 7.1Z" fill="currentColor" />
    </svg>
    <span class="brand__word">axiom</span>
    <span v-if="badge" class="brand__badge">field lab</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-paper);
  white-space: nowrap;
}

.brand__glyph {
  width: 19px;
  height: 19px;
  color: var(--color-paper);
}

.brand__word {
  font-size: 16px;
  font-weight: 510;
  letter-spacing: -0.028em;
  line-height: 1;
}

.brand__badge {
  margin-left: 2px;
  padding: 2px 6px;
  border: 1px solid var(--color-graphite);
  border-radius: var(--radius-badges, 4px);
  color: var(--color-fog);
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.09em;
  line-height: 1.5;
  text-transform: uppercase;
}

.brand--compact .brand__badge {
  display: none;
}

@media (max-width: 520px) {
  .brand__badge {
    display: none;
  }
}
</style>
