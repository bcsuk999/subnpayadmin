<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="isDark ? 'Light theme' : 'Dark theme'"
    @click="toggle"
  >
    <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  applyDocumentTheme,
  getStoredTheme,
  onSystemThemeChange,
  resolveTheme,
  setStoredTheme,
} from '../theme'

const current = ref(resolveTheme())
const isDark = computed(() => current.value === 'dark')

function toggle() {
  const next = isDark.value ? 'light' : 'dark'
  setStoredTheme(next)
  current.value = next
  applyDocumentTheme(next)
}

let unsubscribe
onMounted(() => {
  unsubscribe = onSystemThemeChange(() => {
    if (!getStoredTheme()) {
      current.value = resolveTheme()
      applyDocumentTheme(current.value)
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.theme-toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-instant) ease,
    color var(--duration-instant) ease,
    border-color var(--duration-instant) ease;
}

.theme-toggle:hover {
  background: var(--color-surface-raised);
  color: var(--color-primary);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-secondary);
  outline-offset: 2px;
}
</style>
