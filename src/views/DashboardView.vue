<template>
  <div class="content--table">
    <div class="period-bar">
      <button :class="['period-btn', { 'period-btn--active': period === 'today' }]" @click="period = 'today'">Today</button>
      <button :class="['period-btn', { 'period-btn--active': period === 'month' }]" @click="period = 'month'">This Month</button>
      <button :class="['period-btn', { 'period-btn--active': period === 'all' }]" @click="period = 'all'">All</button>
    </div>

    <div class="dash-section">
      <div class="dash-grid dash-grid--4">
        <div v-for="stat in stats" :key="stat.label" class="dash-stat">
          <span class="dash-stat__label">{{ stat.label }}</span>
          <span class="dash-stat__value">{{ stat.value }}</span>
          <span class="dash-stat__sub">{{ stat.sub }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 12px;">
      <h3>Quick actions</h3>
      <div class="placeholder-actions">
        <button class="btn btn-outline" type="button" :disabled="updating" @click="onDemoSuccess">Demo success toast</button>
        <button class="btn btn-outline" type="button" :disabled="updating" @click="onDemoError">Demo error toast</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from '../composables/useToast.js'
import { updateUserStatus } from '../api/client.js'

const toast = useToast()
const updating = ref(false)
const period = ref('today')

const stats = ref([
  { label: 'Total Users', value: '—', sub: 'Coming soon' },
  { label: 'Payins (Today)', value: '—', sub: 'Coming soon' },
  { label: 'Payouts (Today)', value: '—', sub: 'Coming soon' },
  { label: 'Transactions', value: '—', sub: 'Coming soon' },
])

function onDemoSuccess() {
  toast.success('Action completed successfully')
}
function onDemoError() {
  toast.error('Something went wrong. Please try again.')
}

async function onUpdateStatusDemo(userid, status) {
  updating.value = true
  try {
    const data = await updateUserStatus(userid, status)
    toast.success(data.message || `User status updated to ${status}`)
  } catch (err) {
    toast.error(err.message || 'Failed to update user status')
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.content--table {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  height: 100%;
  overflow-y: auto;
}

.period-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.period-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 5px 14px;
  font-size: var(--text-h4);
  cursor: pointer;
  color: var(--color-text);
  font-family: var(--font-body);
}

.period-btn--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.dash-section {
  margin-top: var(--space-7);
}

.dash-grid {
  display: grid;
  gap: var(--space-4);
}

.dash-grid--4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1024px) {
  .dash-grid--4 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dash-grid--4 { grid-template-columns: 1fr; }
}

.dash-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 14px 18px;
  box-shadow: var(--shadow-card);
}

.dash-stat__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.dash-stat__value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.dash-stat__sub {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.card h3 {
  font-size: var(--text-h3);
  font-weight: 600;
  margin: 0;
}

.placeholder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
</style>
