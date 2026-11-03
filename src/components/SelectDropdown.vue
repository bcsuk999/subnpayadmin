<template>
  <div ref="rootRef" class="el-select el-select--small" :class="{ 'is-open': open }">
    <div
      ref="triggerRef"
      class="el-input el-input--small el-input--suffix"
      role="combobox"
      tabindex="0"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="el-input__inner el-select__value" :class="{ 'is-placeholder': !selectedOption }">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <span class="el-input__suffix" aria-hidden="true">
        <span class="el-input__suffix-inner">
          <svg class="el-select__caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </span>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panelRef"
      class="el-select-dropdown el-popper"
      :style="panelStyle"
      role="listbox"
      :id="listboxId"
      :aria-label="ariaLabel"
    >
      <div class="el-scrollbar">
        <div class="el-scrollbar__wrap">
          <ul class="el-scrollbar__view el-select-dropdown__list">
            <li
              v-for="(opt, i) in normalizedOptions"
              :id="optionId(i)"
              :key="opt.value"
              class="el-select-dropdown__item"
              :class="{ selected: opt.value === modelValue, hover: i === activeIndex, 'is-disabled': opt.disabled }"
              role="option"
              :aria-selected="opt.value === modelValue ? 'true' : 'false'"
              @click="choose(opt)"
              @mouseenter="activeIndex = i"
            >
              <span>{{ opt.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'All' },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])

let uid = 0
function makeId() {
  uid += 1
  return `select-dropdown-${Date.now().toString(36)}-${uid}`
}
const listboxId = makeId()

const open = ref(false)
const rootRef = ref(null)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({ top: '0px', left: '0px' })
const activeIndex = ref(-1)

const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    opt !== null && typeof opt === 'object'
      ? { value: opt.value, label: opt.label ?? String(opt.value), disabled: Boolean(opt.disabled) }
      : { value: opt, label: String(opt), disabled: false },
  ),
)

const selectedOption = computed(() =>
  normalizedOptions.value.find((opt) => opt.value === props.modelValue) || null,
)

function optionId(index) {
  return `${listboxId}-option-${index}`
}

function toggle() {
  if (open.value) close()
  else openPanel()
}

function openPanel() {
  const selectedIndex = normalizedOptions.value.findIndex((opt) => opt.value === props.modelValue)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  open.value = true
  nextTick(() => {
    positionPanel()
    document.addEventListener('mousedown', onDocMouseDown, true)
    document.addEventListener('keydown', onDocKeydown)
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
  })
}

function positionPanel() {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
  }
}

function close() {
  open.value = false
  activeIndex.value = -1
  document.removeEventListener('mousedown', onDocMouseDown, true)
  document.removeEventListener('keydown', onDocKeydown)
  window.removeEventListener('resize', positionPanel)
  window.removeEventListener('scroll', positionPanel, true)
}

function onDocMouseDown(event) {
  if (panelRef.value?.contains(event.target) || rootRef.value?.contains(event.target)) return
  close()
}

function onDocKeydown(event) {
  if (event.key === 'Escape') close()
}

function onKeydown(event) {
  const last = normalizedOptions.value.length - 1
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!open.value) openPanel()
      else choose(normalizedOptions.value[activeIndex.value])
      break
    case 'ArrowDown':
      event.preventDefault()
      if (!open.value) openPanel()
      else activeIndex.value = activeIndex.value >= last ? 0 : activeIndex.value + 1
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!open.value) openPanel()
      else activeIndex.value = activeIndex.value <= 0 ? last : activeIndex.value - 1
      break
    case 'Home':
      if (!open.value) break
      event.preventDefault()
      activeIndex.value = 0
      break
    case 'End':
      if (!open.value) break
      event.preventDefault()
      activeIndex.value = last
      break
    case 'Escape':
      if (open.value) {
        event.preventDefault()
        close()
      }
      break
    case 'Tab':
      close()
      break
  }
}

function choose(opt) {
  if (!opt || opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  close()
  triggerRef.value?.focus()
}

onBeforeUnmount(close)
</script>

<style scoped>
/* ---- Trigger: Element small select input ---- */
.el-select {
  position: relative;
  display: inline-block;
  width: 120px;
  max-width: 100%;
  font-family: var(--font-body);
  vertical-align: middle;
}

.el-input {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.el-input:hover {
  border-color: #c0c4cc;
}

.el-select.is-open .el-input,
.el-input:focus-visible {
  border-color: #ebaf5b;
  box-shadow: 0 0 0 2px #f0c078;
  outline: none;
}

.el-input__inner {
  display: block;
  width: 100%;
  height: 30px;
  line-height: 30px;
  padding: 0 26px 0 10px;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: inherit;
  font-size: 12px;
  color: #606266;
}

.el-select__value.is-placeholder {
  color: #c0c4cc;
}

.el-input__suffix {
  position: absolute;
  top: 0;
  right: 8px;
  display: flex;
  align-items: center;
  height: 100%;
  color: #c0c4cc;
  pointer-events: none;
}

.el-input__suffix-inner {
  display: inline-flex;
  align-items: center;
}

.el-select__caret {
  transition: transform 0.3s ease;
}

.el-select.is-open .el-select__caret {
  transform: rotate(180deg);
}

/* ---- Dropdown panel: captured .el-picker-panel shell metrics ---- */
.el-select-dropdown {
  position: fixed;
  z-index: 2052;
  box-sizing: border-box;
  width: max-content;
  max-width: calc(100vw - 16px);
  background-color: var(--theme-card-bg, #fff);
  border: 0.8px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 12px 0px;
  cursor: crosshair;
  transition: all;
  animation: selectFade 0.2s ease;
}

@keyframes selectFade {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.el-scrollbar {
  position: relative;
  overflow: hidden;
}

.el-scrollbar__wrap {
  max-height: 274px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 147, 153, 0.35) transparent;
}

/* ---- Captured list spec ---- */
.el-scrollbar__view {
  display: block;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  line-height: 16.1px;
  text-align: left;
  color: #666666;
  cursor: crosshair;
  transition: all;
}

/* Element item states (not measured in the capture) */
.el-select-dropdown__item {
  position: relative;
  height: 34px;
  padding: 0 20px;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 34px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all;
}

.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background-color: #f5f7fa;
}

.el-select-dropdown__item.selected {
  color: #ebaf5b;
  font-weight: 700;
}

.el-select-dropdown__item.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  background-color: transparent;
}
</style>
