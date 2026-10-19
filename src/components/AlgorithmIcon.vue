<script setup lang="ts">
import type { AlgorithmId } from '../lib/types'

withDefaults(
  defineProps<{
    id: AlgorithmId
    size?: number
  }>(),
  {
    size: 18,
  },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="id === 'flow'">
      <path d="M2.8 9.2c3.3-4.5 5.3 5.2 8.7.8 3.3-4.3 5.3 3 9.7-2.1" />
      <path d="M2.8 14.4c3.3-4.5 5.3 5.2 8.7.8 3.3-4.3 5.3 3 9.7-2.1" opacity=".55" />
      <circle cx="12" cy="19.2" r="1" fill="currentColor" stroke="none" />
    </template>

    <template v-else-if="id === 'attractor'">
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-28 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(36 12 12)" opacity=".5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </template>

    <template v-else>
      <path d="m6 16 4.7-7.2 4.1 4.8 4.2-6.1" opacity=".6" />
      <circle cx="6" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10.7" cy="8.8" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="13.6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </template>
  </svg>
</template>
