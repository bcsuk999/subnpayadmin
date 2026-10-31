<template>
  <nav v-if="directInput || totalPages > 1" class="pagination" aria-label="Pagination">
    <template v-if="directInput">
      <button class="btn btn-ghost btn-sm" type="button" aria-label="Previous page" :disabled="page <= 1 || disabled" @click="$emit('change', page - 1)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button v-if="page > 1" class="btn btn-sm page-btn page-btn--adjacent" type="button" :disabled="disabled" @click="$emit('change', page - 1)">{{ page - 1 }}</button>
      <label class="sr-only" :for="inputId">Current page (1 to {{ normalizedTotalPages }})</label>
      <input :id="inputId" v-model="inputPage" class="page-input" type="number" inputmode="numeric" min="1" :max="normalizedTotalPages" step="1" :disabled="disabled" :aria-valuemin="1" :aria-valuemax="normalizedTotalPages" :aria-valuenow="page" @input="limitPageInput" @change="commitPage" />
      <button v-if="page < normalizedTotalPages" class="btn btn-sm page-btn page-btn--adjacent" type="button" :disabled="disabled" @click="$emit('change', page + 1)">{{ page + 1 }}</button>
      <button class="btn btn-ghost btn-sm" type="button" aria-label="Next page" :disabled="page >= normalizedTotalPages || disabled" @click="$emit('change', page + 1)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </template>
    <template v-else>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="First page" :disabled="page <= 1 || disabled" @click="$emit('change', 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 6l-5 6 5 6M19 6l-5 6 5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Previous page" :disabled="page <= 1 || disabled" @click="$emit('change', page - 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <template v-for="(p, i) in pages" :key="`${p}-${i}`">
      <span v-if="p === '…'" class="page-dots">{{ p }}</span>
      <button v-else :class="['btn btn-sm page-btn', { active: p === page }]" type="button" :aria-current="p === page ? 'page' : undefined" :disabled="disabled" @click="$emit('change', p)">{{ p }}</button>
    </template>

    <button class="btn btn-ghost btn-sm" type="button" aria-label="Next page" :disabled="page >= totalPages || disabled" @click="$emit('change', page + 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Last page" :disabled="page >= totalPages || disabled" @click="$emit('change', totalPages)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M13 6l5 6-5 6M5 6l5 6-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    </template>
  </nav>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
  directInput: { type: Boolean, default: false },
})
const emit = defineEmits(['change'])
const inputId = `pagination-page-${Math.random().toString(36).slice(2)}`
const inputPage = ref(String(props.page))
const normalizedTotalPages = computed(() => Math.max(1, Number(props.totalPages) || 1))

watch(() => props.page, (page) => {
  inputPage.value = String(page)
})

function limitPageInput(event) {
  const value = Number(event.target.value)
  if (event.target.value && Number.isFinite(value) && value > normalizedTotalPages.value) {
    const maximumPage = String(normalizedTotalPages.value)
    inputPage.value = maximumPage
    event.target.value = maximumPage
  }
}

function commitPage() {
  const value = Number(inputPage.value)
  if (!inputPage.value || !Number.isFinite(value)) {
    inputPage.value = String(props.page)
    return
  }

  const page = Math.min(normalizedTotalPages.value, Math.max(1, Math.trunc(value)))
  inputPage.value = String(page)
  if (page !== props.page) emit('change', page)
}

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
  margin-top: 0;
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
.page-input {
  width: 52px;
  height: 36px;
  padding: 0 4px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-control-bg);
  color: var(--color-text);
  appearance: textfield;
  font: inherit;
  font-weight: 600;
  text-align: center;
}
.page-input::-webkit-inner-spin-button,
.page-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
.page-input:disabled {
  opacity: 0.6;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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