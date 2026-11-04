<template>
  <nav v-if="directInput || totalPages > 1" class="pagination" aria-label="Pagination">
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Previous page" :disabled="page <= 1 || disabled" @click="$emit('change', page - 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button v-if="page > 1" class="btn btn-sm page-btn" type="button" :disabled="disabled" @click="$emit('change', page - 1)">{{ page - 1 }}</button>
    <button class="btn btn-sm page-btn active" type="button" aria-current="page" :disabled="disabled">{{ page }}</button>
    <button v-if="page < normalizedTotalPages" class="btn btn-sm page-btn" type="button" :disabled="disabled" @click="$emit('change', page + 1)">{{ page + 1 }}</button>
    <button class="btn btn-ghost btn-sm" type="button" aria-label="Next page" :disabled="page >= normalizedTotalPages || disabled" @click="$emit('change', page + 1)">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <label v-if="showPageSizes" class="page-size" :for="sizeInputId">
      <SelectDropdown
        :id="sizeInputId"
        v-model="selectedPageSize"
        class="page-size__select"
        :options="pageSizeOptions"
        placement="top"
        :disabled="disabled"
        aria-label="Rows per page"
        @change="changePageSize"
      />
    </label>
    <label v-if="directInput" class="page-jump" :for="inputId">Go to
      <input :id="inputId" v-model="inputPage" class="page-input" type="number" inputmode="numeric" min="1" :max="normalizedTotalPages" :disabled="disabled" @input="limitPageInput" @change="commitPage" />
    </label>
  </nav>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
  directInput: { type: Boolean, default: false },
  showPageSizes: { type: Boolean, default: false },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
})
const emit = defineEmits(['change', 'size-change'])
const toast = useToast()
const inputId = `pagination-page-${Math.random().toString(36).slice(2)}`
const sizeInputId = `pagination-size-${Math.random().toString(36).slice(2)}`
const inputPage = ref(String(props.page))
const selectedPageSize = ref(props.pageSize)
const normalizedTotalPages = computed(() => Math.max(1, Number(props.totalPages) || 1))
const pageSizeOptions = computed(() => props.pageSizes.map((size) => ({ value: size, label: `${size}/page` })))

watch(() => props.page, (page) => {
  inputPage.value = String(page)
})

watch(() => props.pageSize, (size) => {
  selectedPageSize.value = size
})

function changePageSize() {
  if (selectedPageSize.value !== props.pageSize) {
    emit('size-change', selectedPageSize.value)
  }
}

function limitPageInput(event) {
  const value = Number(event.target.value)
  if (event.target.value && Number.isFinite(value) && value > normalizedTotalPages.value) {
    const maximumPage = String(normalizedTotalPages.value)
    inputPage.value = maximumPage
    event.target.value = maximumPage
    toast.warning(`Page number cannot exceed ${maximumPage}.`)
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
.page-btn {
  min-width: 32px;
  min-height: 30px;
  padding: 0 var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-body-l);
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--motion-fast);
}
.page-input {
  width: 52px;
  height: 30px;
  padding: 0 4px;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-md);
  background: var(--color-control-bg);
  color: var(--color-text);
  appearance: textfield;
  font: inherit;
  font-weight: 600;
  text-align: center;
}
.page-input:focus,
.page-input:focus-visible {
  border-color: var(--color-control-border);
  outline: 2px solid var(--color-control-border);
  outline-offset: 1px;
}
.page-jump {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.page-size__select {
  height: 30px;
  padding: 0 20px 0 4px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-control-bg);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.page-size__select:focus,
.page-size__select:focus-visible {
  outline: 2px solid var(--color-control-border);
  outline-offset: 1px;
}
.page-size__select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.page-arrow {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
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
  background: var(--color-button-primary-bg);
  border-color: var(--color-button-primary-bg);
  color: var(--color-button-primary-text);
  box-shadow: var(--shadow-sm);
}
.page-btn {
  margin: 0;
}
</style>