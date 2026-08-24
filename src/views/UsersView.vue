<template>
  <section class="page">
    <div class="page-head">
      <h1>Users</h1>
      <p>Manage registered users and account status</p>
    </div>
    <div class="card">
      <div class="card-head">
        <h3>All Users</h3>
        <button class="btn btn-primary" type="button" @click="toast.info('Fetch users API coming soon')">Refresh</button>
      </div>
      <p class="empty">User list will appear here. Connect to <code>GET /api/admin/users</code> when backend is ready.</p>
      <div class="demo-row">
        <button class="btn btn-ghost" type="button" :disabled="updating" @click="demoStatus('123', 'active')">Demo: set active</button>
        <button class="btn btn-ghost" type="button" :disabled="updating" @click="demoStatus('123', 'blocked')">Demo: set blocked</button>
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

async function demoStatus(userid, status) {
  updating.value = true
  try {
    const data = await updateUserStatus(userid, status)
    toast.success(data.message || `User ${userid} → ${status}`)
  } catch (err) {
    toast.error(err.message || 'Failed to update user status')
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.page { display:flex; flex-direction:column; gap:16px; }
.page-head h1 { font-size: var(--text-h1); }
.page-head p { color: var(--color-text-secondary); font-size: var(--text-h4); margin-top:4px;}
.card { background: var(--color-bg); border:1px solid var(--color-border); border-radius: var(--radius-md); padding:16px; box-shadow: var(--shadow-subtle); }
.card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px;}
.empty { color: var(--color-text-secondary); font-size: var(--text-h4); line-height:1.5; }
.demo-row { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
code { background: var(--color-surface-raised); padding:2px 6px; border-radius:4px; font-size:12px;}
</style>
