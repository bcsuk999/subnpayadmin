<template>
  <div ref="triggerRef" class="date-range">
    <div
      class="el-date-editor el-range-editor el-range-editor--small"
      :class="{ 'is-active': open }"
      role="button"
      tabindex="0"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      @click="togglePanel"
      @keydown.enter.prevent="togglePanel"
      @keydown.space.prevent="togglePanel"
    >
      <i class="el-range__icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </i>
      <input class="el-range-input el-range-input--start" :value="fromDisplay" placeholder="Start date" readonly />
      <span class="el-range-separator">-</span>
      <input class="el-range-input el-range-input--end" :value="toDisplay" placeholder="End date" readonly />
      <i v-if="from || to" class="el-range__close-icon" aria-label="Clear dates" @click.stop="clearDates">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </i>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panelRef"
      class="el-picker-panel el-date-range-picker el-popper has-time"
      :style="panelStyle"
      role="dialog"
      aria-modal="false"
      aria-label="Choose a date range"
    >
      <div class="el-picker-panel__body-wrapper">
        <div class="el-picker-panel__body">
          <div class="el-date-range-picker__time-header">
            <span class="el-date-range-picker__editors-wrap">
              <span class="el-date-range-picker__time-picker-wrap is-date">
                <div class="el-date-range-picker__editor el-input el-input--small">
                  <input
                    v-model="startDateText"
                    type="text"
                    autocomplete="off"
                    placeholder="Start Date"
                    class="el-input__inner"
                    @change="onStartDateText"
                  />
                </div>
              </span>
              <span class="el-date-range-picker__time-picker-wrap is-time">
                <div class="el-date-range-picker__editor el-input el-input--small">
                  <input
                    v-model="startTime"
                    type="text"
                    autocomplete="off"
                    placeholder="Start Time"
                    class="el-input__inner"
                    @blur="normalizeTime('start')"
                  />
                </div>
              </span>
            </span>
            <span class="el-icon-arrow-right" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="el-date-range-picker__editors-wrap is-right">
              <span class="el-date-range-picker__time-picker-wrap is-date">
                <div class="el-date-range-picker__editor el-input el-input--small">
                  <input
                    v-model="endDateText"
                    type="text"
                    autocomplete="off"
                    placeholder="End Date"
                    class="el-input__inner"
                    @change="onEndDateText"
                  />
                </div>
              </span>
              <span class="el-date-range-picker__time-picker-wrap is-time">
                <div class="el-date-range-picker__editor el-input el-input--small">
                  <input
                    v-model="endTime"
                    type="text"
                    autocomplete="off"
                    placeholder="End Time"
                    class="el-input__inner"
                    @blur="normalizeTime('end')"
                  />
                </div>
              </span>
            </span>
          </div>

          <div class="el-picker-panel__content el-date-range-picker__content is-left">
            <div class="el-date-range-picker__header">
              <span class="hd-nav hd-nav--left">
                <button type="button" class="el-picker-panel__icon-btn" aria-label="Previous year" @click="shiftMonth(-12)">«</button>
                <button type="button" class="el-picker-panel__icon-btn" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
              </span>
              <span class="hd-title">{{ monthLabel(leftMonth) }}</span>
              <span class="hd-nav hd-nav--right"></span>
            </div>
            <table cellspacing="0" cellpadding="0" class="el-date-table">
              <tbody>
                <tr>
                  <th v-for="w in weekdays" :key="w">{{ w }}</th>
                </tr>
                <tr v-for="(row, ri) in leftWeeks" :key="ri" class="el-date-table__row">
                  <td
                    v-for="cell in row"
                    :key="cell.key"
                    :class="cellClass(cell)"
                    @click="pickDay(cell.date)"
                    @mouseenter="hoverDate = cell.date"
                  >
                    <div><span>{{ cell.day }}</span></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="el-picker-panel__content el-date-range-picker__content is-right">
            <div class="el-date-range-picker__header">
              <span class="hd-nav hd-nav--left"></span>
              <span class="hd-title">{{ monthLabel(rightMonth) }}</span>
              <span class="hd-nav hd-nav--right">
                <button type="button" class="el-picker-panel__icon-btn" aria-label="Next month" @click="shiftMonth(1)">›</button>
                <button type="button" class="el-picker-panel__icon-btn" aria-label="Next year" @click="shiftMonth(12)">»</button>
              </span>
            </div>
            <table cellspacing="0" cellpadding="0" class="el-date-table">
              <tbody>
                <tr>
                  <th v-for="w in weekdays" :key="w">{{ w }}</th>
                </tr>
                <tr v-for="(row, ri) in rightWeeks" :key="ri" class="el-date-table__row">
                  <td
                    v-for="cell in row"
                    :key="cell.key"
                    :class="cellClass(cell)"
                    @click="pickDay(cell.date)"
                    @mouseenter="hoverDate = cell.date"
                  >
                    <div><span>{{ cell.day }}</span></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="el-picker-panel__footer">
        <button type="button" class="el-button el-picker-panel__link-btn el-button--text el-button--mini" @click="clearDates">
          Clear
        </button>
        <button
          type="button"
          class="el-button el-picker-panel__link-btn el-button--default el-button--mini is-plain"
          :class="{ 'is-disabled': !canConfirm }"
          :disabled="!canConfirm"
          @click="confirm"
        >
          OK
        </button>
      </div>
      <div x-arrow class="popper__arrow" aria-hidden="true"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  from: { type: String, default: '' },
  to: { type: String, default: '' },
})
const emit = defineEmits(['update:from', 'update:to', 'change'])

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({ top: '0px', left: '0px' })

const start = ref(null)
const end = ref(null)
const startTime = ref('00:00:00')
const endTime = ref('00:00:00')
const startDateText = ref('')
const endDateText = ref('')
const hoverDate = ref(null)
const leftMonth = ref(startOfMonth(new Date()))

const fromDisplay = computed(() => datePart(props.from))
const toDisplay = computed(() => datePart(props.to))
const canConfirm = computed(() => Boolean(start.value && end.value))

const rightMonth = computed(() => addMonths(leftMonth.value, 1))
const leftWeeks = computed(() => chunk(buildCells(leftMonth.value)))
const rightWeeks = computed(() => chunk(buildCells(rightMonth.value)))

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function datePart(value) {
  const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}
function timePart(value) {
  const m = String(value || '').match(/\d{4}-\d{2}-\d{2}[ T](\d{2}:\d{2}(?::\d{2})?)/)
  return m ? (m[1].length === 5 ? `${m[1]}:00` : m[1]) : ''
}
function parseDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function formatDateText(d) {
  return d ? formatDate(d) : ''
}
function monthLabel(d) {
  return `${d.getFullYear()} ${MONTHS[d.getMonth()]}`
}
function isSameDay(a, b) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate())
}
function chunk(cells) {
  const rows = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

function buildCells(month) {
  const y = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(y, m, 1)
  const gridStart = new Date(y, m, 1 - first.getDay())
  const cells = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const offset = d.getFullYear() === y && d.getMonth() === m ? 0 : (d < first ? -1 : 1)
    cells.push({ date: d, day: d.getDate(), offset, key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` })
  }
  return cells
}

function within(d, a, b) {
  if (!a || !b) return false
  const t = startOfDay(d).getTime()
  return t > startOfDay(a).getTime() && t < startOfDay(b).getTime()
}

function cellClass(cell) {
  const d = cell.date
  const preview = start.value && !end.value && hoverDate.value
  return {
    'prev-month': cell.offset < 0,
    'next-month': cell.offset > 0,
    available: cell.offset === 0,
    today: isSameDay(d, new Date()),
    'start-date': isSameDay(d, start.value),
    'end-date': isSameDay(d, end.value),
    'in-range': within(d, start.value, end.value),
    'hover-range': Boolean(preview) && within(d, start.value, hoverDate.value) && !isSameDay(d, start.value),
  }
}

function syncFromProps() {
  start.value = parseDate(props.from)
  end.value = parseDate(props.to)
  startTime.value = timePart(props.from) || '00:00:00'
  endTime.value = timePart(props.to) || '00:00:00'
  startDateText.value = formatDateText(start.value)
  endDateText.value = formatDateText(end.value)
  leftMonth.value = startOfMonth(start.value || new Date())
}

function togglePanel() {
  if (open.value) {
    closePanel()
    return
  }
  syncFromProps()
  open.value = true
  nextTick(() => {
    positionPanel()
    document.addEventListener('mousedown', onDocMouseDown, true)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
  })
}

function positionPanel() {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const width = 646
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
  panelStyle.value = { top: `${rect.bottom}px`, left: `${left}px` }
}

function closePanel() {
  open.value = false
  hoverDate.value = null
  document.removeEventListener('mousedown', onDocMouseDown, true)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', positionPanel)
  window.removeEventListener('scroll', positionPanel, true)
}

function onDocMouseDown(event) {
  if (panelRef.value?.contains(event.target) || triggerRef.value?.contains(event.target)) return
  closePanel()
}

function onKeydown(event) {
  if (event.key === 'Escape') closePanel()
}

function shiftMonth(offset) {
  leftMonth.value = addMonths(leftMonth.value, offset)
}

function pickDay(date) {
  const rm = rightMonth.value
  const inLeft = date.getFullYear() === leftMonth.value.getFullYear() && date.getMonth() === leftMonth.value.getMonth()
  const inRight = date.getFullYear() === rm.getFullYear() && date.getMonth() === rm.getMonth()
  if (!inLeft && !inRight) leftMonth.value = startOfMonth(date)

  if (!start.value || (start.value && end.value)) {
    start.value = date
    end.value = null
  } else if (startOfDay(date).getTime() < startOfDay(start.value).getTime()) {
    start.value = date
  } else {
    end.value = date
  }
  startDateText.value = formatDateText(start.value)
  endDateText.value = formatDateText(end.value)
}

function onStartDateText() {
  const parsed = parseDate(startDateText.value)
  if (parsed) {
    start.value = parsed
    leftMonth.value = startOfMonth(parsed)
  } else {
    startDateText.value = formatDateText(start.value)
  }
}

function onEndDateText() {
  const parsed = parseDate(endDateText.value)
  if (parsed) {
    end.value = parsed
  } else {
    endDateText.value = formatDateText(end.value)
  }
}

function normalizeTime(which) {
  const re = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  const raw = which === 'start' ? startTime.value : endTime.value
  const m = String(raw).trim().match(re)
  const value = m
    ? `${String(Math.min(23, Number(m[1]))).padStart(2, '0')}:${String(Math.min(59, Number(m[2]))).padStart(2, '0')}:${String(Math.min(59, Number(m[3] || 0))).padStart(2, '0')}`
    : '00:00:00'
  if (which === 'start') startTime.value = value
  else endTime.value = value
}

function combine(date, time) {
  if (!date) return ''
  const iso = formatDate(date)
  return time && time !== '00:00:00' ? `${iso} ${time}` : iso
}

function confirm() {
  if (!canConfirm.value) return
  const fromValue = combine(start.value, startTime.value)
  const toValue = combine(end.value, endTime.value)
  emit('update:from', fromValue)
  emit('update:to', toValue)
  emit('change', { from: fromValue, to: toValue })
  closePanel()
}

function clearDates() {
  start.value = null
  end.value = null
  startTime.value = '00:00:00'
  endTime.value = '00:00:00'
  startDateText.value = ''
  endDateText.value = ''
  hoverDate.value = null
  emit('update:from', '')
  emit('update:to', '')
  emit('change', { from: '', to: '' })
}

onBeforeUnmount(closePanel)
</script>

<style scoped>
/* ---- Trigger: Element range editor (small) ---- */
.date-range {
  position: relative;
  display: inline-block;
  width: 320px;
  max-width: 100%;
}

.el-range-editor {
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  box-sizing: border-box;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.el-range-editor:hover {
  border-color: #c0c4cc;
}

.el-range-editor.is-active,
.el-range-editor:focus-within {
  border-color: #ebaf5b;
  box-shadow: 0 0 0 2px #f0c078;
  outline: none;
}

.el-range__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 8px;
  color: #c0c4cc;
}

.el-range-input {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 30px;
  color: #606266;
  text-align: center;
  padding: 0;
}

.el-range-input::placeholder {
  color: #c0c4cc;
}

.el-range-separator {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 12px;
  line-height: 30px;
  color: #303133;
}

.el-range__close-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 4px;
  color: #c0c4cc;
  cursor: pointer;
}

.el-range__close-icon:hover {
  color: #909399;
}

/* ---- Panel: captured .el-picker-panel spec ---- */
.el-picker-panel {
  position: fixed;
  z-index: 2052;
  width: 646px;
  max-width: calc(100vw - 16px);
  margin: 12px 0 5px;
  font-weight: 400;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  line-height: 30px;
  text-align: left;
  color: var(--theme-text-regular, #606266);
  background-color: var(--theme-card-bg, #fff);
  border: 0.8px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 12px 0px;
  cursor: crosshair;
  transition: all;
  animation: pickerFade 0.2s ease;
}

.popper__arrow {
  position: absolute;
  top: -6px;
  left: 35px;
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  background: var(--theme-card-bg, #fff);
  border-top: 0.8px solid #e4e7ed;
  border-left: 0.8px solid #e4e7ed;
  transform: rotate(45deg);
}

@keyframes pickerFade {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.el-picker-panel__body-wrapper {
  padding: 0;
}

.el-picker-panel__body {
  display: flex;
  flex-wrap: wrap;
}

/* ---- Time header ---- */
.el-date-range-picker__time-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 5px 5px;
  box-sizing: border-box;
  border-bottom: 1px solid #ebeef5;
}

.el-date-range-picker__editors-wrap {
  display: flex;
  flex: 1 1 0;
  gap: 8px;
  min-width: 0;
}

.el-date-range-picker__time-picker-wrap {
  display: block;
  min-width: 0;
}

.el-date-range-picker__time-picker-wrap.is-date {
  flex: 1.15 1 0;
}

.el-date-range-picker__time-picker-wrap.is-time {
  flex: 1 1 0;
}

.el-date-range-picker__editor,
.el-date-range-picker__editor .el-input__inner {
  width: 100%;
}

.el-date-range-picker__editor .el-input__inner {
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-family: inherit;
  font-size: 12px;
  color: #606266;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.el-date-range-picker__editor .el-input__inner::placeholder {
  color: #c0c4cc;
}

.el-date-range-picker__editor .el-input__inner:focus {
  border-color: #ebaf5b;
  box-shadow: 0 0 0 2px #f0c078;
}

.el-icon-arrow-right {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: #c0c4cc;
}

/* ---- Calendars ---- */
.el-picker-panel__content {
  width: 50%;
  padding: 0;
  box-sizing: border-box;
}

.el-date-range-picker__content.is-left {
  border-right: 1px solid #ebeef5;
}

.el-date-range-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  line-height: 40px;
  text-align: center;
}

.hd-nav {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 48px;
}

.hd-nav--right {
  justify-content: flex-end;
}

.hd-title {
  flex: 1 1 auto;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.el-picker-panel__icon-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: #303133;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}

.el-picker-panel__icon-btn:hover {
  color: #ebaf5b;
}

.el-date-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
  user-select: none;
}

.el-date-table th {
  padding: 5px 0;
  font-weight: 400;
  font-size: 12px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.el-date-table td {
  height: 30px;
  padding: 2px 0;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}

.el-date-table td div {
  height: 30px;
  padding: 3px 0;
  box-sizing: border-box;
}

.el-date-table td span {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  border-radius: 50%;
  color: #606266;
  transition: background-color 0.15s, color 0.15s;
}

.el-date-table td.available:hover span {
  background-color: #f5f7fa;
}

.el-date-table td.prev-month span,
.el-date-table td.next-month span {
  color: #c0c4cc;
}

.el-date-table td.next-month,
.el-date-table td.prev-month {
  cursor: default;
}

.el-date-table td.today span {
  color: #ebaf5b;
  font-weight: 700;
}

.el-date-table td.in-range div {
  background-color: #fdf7ef;
}

.el-date-table td.hover-range div {
  background-color: #fdf7ef;
}

.el-date-table td.start-date span,
.el-date-table td.end-date span {
  background-color: #ebaf5b;
  color: #fff;
}

.el-date-table td.start-date:hover span,
.el-date-table td.end-date:hover span {
  background-color: #ebaf5b;
}

/* ---- Footer ---- */
.el-picker-panel__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid #e4e4e4;
  background-color: #fff;
}

.el-button {
  font-family: inherit;
  cursor: pointer;
}

.el-picker-panel__link-btn {
  height: 28px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
}

.el-button--text {
  border: none;
  background: transparent;
  color: #ebaf5b;
}

.el-button--text:hover {
  color: #d49e52;
}

.el-button--default {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
}

.el-button--default:hover:not(:disabled) {
  border-color: #ebaf5b;
  color: #ebaf5b;
  background: #fdf7ef;
}

.el-button.is-disabled,
.el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
