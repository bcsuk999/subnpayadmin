<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>Users</h1><p>Search and manage registered users</p>
      </div>
      <button class="btn btn-ghost btn-sm filter-toggle" type="button" @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h10M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="showFilters" class="card filters">
      <div class="filter-row">
        <div class="field"><label class="field-label">User ID</label><input v-model="filters.uid" class="input" placeholder="3056579" @keyup.enter="fetchUsers(1)" /></div>
        <div class="field"><label class="field-label">Mobile</label><input v-model="filters.mobile" class="input" placeholder="9876543210" @keyup.enter="fetchUsers(1)" /></div>
        <div class="field"><label class="field-label">Balance sort</label><select v-model="filters.sortBalance" class="input"><option value="">None</option><option value="asc">Lowest first</option><option value="desc">Highest first</option></select></div>
      </div>
      <div class="filter-row" style="margin-top:6px">
        <div class="field"><label class="field-label">From (created)</label><input v-model="filters.from" class="input" type="date" /></div>
        <div class="field"><label class="field-label">To (created)</label><input v-model="filters.to" class="input" type="date" /></div>
        <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="loading" @click="fetchUsers(1)">{{ loading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="reset">Reset</button></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Users ({{ total }})</h3><span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && users.length===0 && !error" class="empty">No users found. Try different filters.</p>
      <div v-if="users.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>UID</th><th>Mobile</th><th>Balance</th><th>Total Deposit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.uid">
              <td class="mono">{{ u.uid }}</td>
              <td class="mono">{{ u.mobile }}</td>
              <td class="mono">{{ formatNum(u.balance) }}</td>
              <td class="mono">{{ formatNum(u.totalDeposit) }}</td>
              <td><span :class="['badge', statusClass(u.status)]">{{ u.status }}</span></td>
              <td>
                <div class="row-actions">
                  <button v-if="u.status !== 'active'" class="btn btn-sm action-btn action-btn--success" type="button" :disabled="acting===u.uid" @click="onSetStatus(u, 'active')">{{ acting===u.uid ? '…' : 'Activate' }}</button>
                  <button v-if="u.status !== 'blocked'" class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="acting===u.uid" @click="onSetStatus(u, 'blocked')">{{ acting===u.uid ? '…' : 'Block' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page<=1 || loading" @click="fetchUsers(page-1)">Prev</button>
        <span class="muted">Page {{ page }} of {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page>=totalPages || loading" @click="fetchUsers(page+1)">Next</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminUsers, updateUserStatus } from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const filters = reactive({ uid:'', mobile:'', sortBalance:'', from:'', to:'' })
const showFilters = ref(true)
const users = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const acting = ref('')

function statusClass(s){ return s === 'active' ? 'badge--success' : s === 'blocked' ? 'badge--danger' : 'badge--warning' }
function formatNum(n){ try { return Number(n || 0).toLocaleString() } catch { return n } }
async function onSetStatus(u, status){
  if (!confirm(`Set user ${u.uid} to "${status}"?`)) return
  acting.value = u.uid
  try {
    const data = await updateUserStatus(u.uid, status)
    toast.success(data.message || `User ${u.uid} → ${status}`)
    u.status = status
  } catch (e) { toast.error(e.message || 'Failed to update user status') } finally { acting.value = '' }
}
async function fetchUsers(p=1){
  loading.value=true; error.value=''; page.value=p
  try{
    const data = await getAdminUsers({
      uid: filters.uid.trim() || undefined,
      mobile: filters.mobile.trim() || undefined,
      sortBalance: filters.sortBalance || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      page: page.value,
      limit: 20,
    })
    users.value = data.users || []
    total.value = data.count || 0
    totalPages.value = data.totalPages || 1
  } catch(e){ error.value=e.message; toast.error(e.message) } finally{ loading.value=false }
}
function reset(){ filters.uid=''; filters.mobile=''; filters.sortBalance=''; filters.from=''; filters.to=''; fetchUsers(1) }
onMounted(()=>fetchUsers(1))
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px} .page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px} .page-head h1{font-size:var(--text-h1)} .page-head p{color:var(--color-text-secondary);font-size:var(--text-h4);margin-top:4px} .filter-toggle{white-space:nowrap;flex-shrink:0;margin-top:2px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:130px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--color-border);border-radius:var(--radius-md);scrollbar-width:thin;scrollbar-color:var(--color-border) transparent} .table-wrap::-webkit-scrollbar{height:8px} .table-wrap::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:4px} .table-wrap::-webkit-scrollbar-track{background:transparent} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:760px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:3px 8px;border-radius:var(--radius-round);font-size:11px;font-weight:600} .badge--success{border:1px solid var(--color-success);color:var(--color-success);background:var(--color-surface-raised)} .badge--warning{border:1px solid var(--color-warning);color:var(--color-warning);background:var(--color-surface-raised)} .badge--danger{border:1px solid var(--color-danger);color:var(--color-danger);background:#fef2f2} html[data-theme='dark'] .badge--danger{background:rgba(248,113,113,.12)}
.row-actions{display:flex;gap:4px;flex-wrap:nowrap;white-space:nowrap} .action-btn{background:var(--color-surface-raised);border:1px solid var(--color-border);color:var(--color-text)} .action-btn:hover:not(:disabled){background:var(--color-bg);border-color:var(--color-secondary);color:var(--color-primary)} .action-btn--success{background:var(--color-success);border-color:var(--color-success);color:#fff} .action-btn--danger{background:var(--color-danger);border-color:var(--color-danger);color:#fff} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px} .btn-sm{padding:6px 10px;font-size:var(--text-body-l);white-space:nowrap}
</style>
