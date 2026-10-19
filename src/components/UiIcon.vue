<script setup lang="ts">
withDefaults(
  defineProps<{
    name:
      | 'arrow-up-right'
      | 'arrow-down'
      | 'play'
      | 'pause'
      | 'reset'
      | 'pulse'
      | 'close'
      | 'copy'
      | 'check'
      | 'mouse'
      | 'focus'
    size?: number
    strokeWidth?: number
  }>(),
  {
    size: 16,
    strokeWidth: 1.5,
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
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'arrow-up-right'">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </template>
    <template v-else-if="name === 'arrow-down'">
      <path d="M12 4v16" />
      <path d="m6 14 6 6 6-6" />
    </template>
    <template v-else-if="name === 'play'">
      <path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'pause'">
      <path d="M9 5v14M15 5v14" stroke-width="2" />
    </template>
    <template v-else-if="name === 'reset'">
      <path d="M4.5 11.5a7.5 7.5 0 1 0 2.3-5.4" />
      <path d="M4 4.5v5h5" />
    </template>
    <template v-else-if="name === 'pulse'">
      <circle cx="12" cy="12" r="1.8" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 4.8a10.2 10.2 0 0 1 0 14.4" opacity=".45" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" />
    </template>
    <template v-else-if="name === 'copy'">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m4.5 12.5 5 5 10-11" />
    </template>
    <template v-else-if="name === 'mouse'">
      <rect x="7.5" y="3" width="9" height="14" rx="4.5" />
      <path d="M12 6.5v2.5" />
      <path d="M12 17v4" opacity=".45" />
    </template>
    <template v-else-if="name === 'focus'">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </template>
  </svg>
</template>
