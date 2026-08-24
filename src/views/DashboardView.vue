<template>
  <section class="page">
    <div class="page-head">
      <h1>Dashboard</h1>
      <p>Overview of platform activity</p>
    </div>

    <div class="card-grid">
      <div class="stat-card">
        <p class="stat-label">Total Users</p>
        <p class="stat-value">—</p>
        <p class="stat-sub">Coming soon</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Deposits (Today)</p>
        <p class="stat-value">—</p>
        <p class="stat-sub">Coming soon</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Withdrawals (Today)</p>
        <p class="stat-value">—</p>
        <p class="stat-sub">Coming soon</p>
      </div>
    </div>

    <div class="card">
      <h3>Quick actions</h3>
      <div class="placeholder-actions">
        <button class="btn btn-ghost" type="button" :disabled="updating" @click="onDemoSuccess">Demo success toast</button>
        <button class="btn btn-ghost" type="button" :disabled="updating" @click="onDemoError">Demo error toast</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from '../composables/useToast.js'
import { updateUserStatus } from '../api/client.js'

const toast = useToast()
const updating = ref(false)

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
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-head h1 {
  font-size: var(--text-h1);
}
.page-head p {
  color: var(--color-text-secondary);
  font-size: var(--text-h4);
  margin-top: 4px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.stat-card,
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-subtle);
}
.stat-label {
  font-size: var(--text-body-l);
  color: var(--color-text-secondary);
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-top: 6px;
}
.stat-sub {
  font-size: var(--text-body-l);
  color: var(--color-text-secondary);
  margin-top: 4px;
}
.placeholder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
@media (max-width: 880px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
