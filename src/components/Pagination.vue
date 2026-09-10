<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
    <button class="btn btn-ghost btn-sm" type="button" aria-label="First page" :disabled="page <= 1 || disabled" @click="$emit('change', 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 6l-5 6 5 6M19 6l-5 6 5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Previous page" :disabled="page <= 1 || disabled" @click="$emit('change', page - 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <template v-for="(p, i) in pages" :key="`${p}-${i}`">
      <span v-if="p === '…'" class="page-dots">{{ p }}</span>
      <button v-else :class="['btn btn-sm page-btn', { active: p === page }]" type="button" :disabled="disabled" @click="$emit('change', p)">{{ p }}</button>
    </template>

    <button class="btn btn-ghost btn-sm" type="button" aria-label="Next page" :disabled="page >= totalPages || disabled" @click="$emit('change', page + 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Last page" :disabled="page >= totalPages || disabled" @click="$emit('change', totalPages)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 6l5 6-5 6M5 6l5 6-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})
defineEmits(['change'])

const pages = computed(() => {
  const total = props.totalPages || 1
  const current = props.page
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const delta = 2
  const out = [1]
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)
  if (left > 2) out.push('…')
  for (let i = left; i <= right; i++) out.push(i)
  if (right < total - 1) out.push('…')
  out.push(total)
  return out
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.page-dots {
  color: var(--color-text-secondary);
  padding: 0 4px;
  font-size: 13px;
}
.page-btn {
  min-width: 32px;
  min-height: 30px;
  padding: 0 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--motion-fast);
}
.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.page-dots,
.page-btn {
  margin: 0;
}
</style>