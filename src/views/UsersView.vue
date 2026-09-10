<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Users</h1>
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
          <thead><tr><th>UID</th><th>Mobile</th><th>Register Date</th><th>Balance</th><th>Total Deposit</th><th>Status</th><th>Remark</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.uid">
              <td class="mono">{{ u.uid }}</td>
              <td class="mono">{{ u.mobile }}</td>
              <td class="muted">{{ fmt(u.registerDate) }}</td>
              <td class="mono">{{ formatNum(u.balance) }}</td>
              <td class="mono">{{ formatNum(u.totalDeposit) }}</td>
              <td><span :class="['badge', statusClass(u.status)]">{{ u.status }}</span></td>
              <td class="muted remark">{{ u.remark || '—' }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-sm action-btn" type="button" :disabled="dialog.open && dialog.uid===u.uid && dialog.saving" @click="openDialog(u)">Change Status</button>
                  <button class="btn btn-sm action-btn" type="button" :disabled="pwdDialog.open && pwdDialog.uid===u.uid && pwdDialog.saving" @click="openPwdDialog(u)">Reset Password</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination :page="page" :total-pages="totalPages" :disabled="loading" @change="fetchUsers" />
    </div>

    <div v-if="dialog.open" class="modal-overlay" @click.self="closeDialog">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Change Status — UID {{ dialog.uid }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closeDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">New Status</label>
            <select v-model="dialog.status" class="input">
              <option value="active">active</option>
              <option value="ban">ban</option>
              <option value="suspend">suspend</option>
            </select>
          </div>
          <div class="field" style="margin-top:10px">
            <label class="field-label">Reason (required)</label>
            <textarea v-model="dialog.remark" class="input" rows="3" placeholder="Reason for status change, e.g. 'Violated terms of service'"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="closeDialog">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="dialog.saving" @click="confirmDialog">{{ dialog.saving ? 'Saving…' : 'Confirm' }}</button>
        </div>
      </div>
    </div>

    <div v-if="pwdDialog.open" class="modal-overlay" @click.self="closePwdDialog">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Reset Password — UID {{ pwdDialog.uid }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closePwdDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">New Password</label>
            <input v-model="pwdDialog.newPassword" class="input" type="password" placeholder="new12345" @keyup.enter="confirmPwdDialog" />
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="closePwdDialog">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="pwdDialog.saving" @click="confirmPwdDialog">{{ pwdDialog.saving ? 'Resetting…' : 'Reset' }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminUsers, updateUserStatus, resetUserPassword } from '../api/client.js'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmt } from '../utils/format.js'
import Pagination from '../components/Pagination.vue'

const toast = useToast()
const filters = reactive({ uid:'', mobile:'', sortBalance:'', from:'', to:'' })
const showFilters = ref(true)
const users = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const dialog = reactive({ open:false, uid:'', status:'active', remark:'', saving:false })
const pwdDialog = reactive({ open:false, uid:'', newPassword:'', saving:false })

function statusClass(s){ return s === 'active' ? 'badge--success' : s === 'ban' ? 'badge--danger' : s === 'suspend' ? 'badge--warning' : 'badge--warning' }
function formatNum(n){ try { return Number(n || 0).toLocaleString() } catch { return n } }
function openDialog(u){ dialog.open=true; dialog.uid=u.uid; dialog.status='active'; dialog.remark=''; dialog.saving=false }
function closeDialog(){ dialog.open=false }
function openPwdDialog(u){ pwdDialog.open=true; pwdDialog.uid=u.uid; pwdDialog.newPassword=''; pwdDialog.saving=false }
function closePwdDialog(){ pwdDialog.open=false }
async function confirmPwdDialog(){
  if (!pwdDialog.newPassword.trim()) return toast.error('New password is required')
  pwdDialog.saving=true
  try {
    const data = await resetUserPassword(pwdDialog.uid, pwdDialog.newPassword.trim())
    toast.success(data.msg || `Password reset for user ${pwdDialog.uid}`)
    closePwdDialog()
  } catch (e) { toast.error(e.message || 'Failed to reset password') } finally { pwdDialog.saving=false }
}
async function confirmDialog(){
  if (!dialog.remark.trim()) return toast.error('A reason is required')
  dialog.saving=true
  try {
    const data = await updateUserStatus(dialog.uid, dialog.status, dialog.remark.trim())
    toast.success(data.message || `User ${dialog.uid} → ${dialog.status}`)
    const u = users.value.find(x => x.uid === dialog.uid)
    if (u) { u.status = dialog.status; u.remark = dialog.remark.trim() }
    closeDialog()
  } catch (e) { toast.error(e.message || 'Failed to update user status') } finally { dialog.saving=false }
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
.page{display:flex;flex-direction:column;gap:16px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:130px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--color-border);border-radius:var(--radius-md);scrollbar-width:thin;scrollbar-color:var(--color-border) transparent} .table-wrap::-webkit-scrollbar{height:8px} .table-wrap::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:4px} .table-wrap::-webkit-scrollbar-track{background:transparent} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:980px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600} .table tbody tr:nth-child(odd){background:var(--color-row-alt)} .table tbody tr:hover{background:var(--color-surface-raised)}
.mono{font-family:ui-monospace,monospace;font-size:12px} .muted{color:var(--color-text-secondary);font-size:11px} .remark{max-width:200px;word-break:break-word}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--warning{background:var(--color-warning);color:#fff} .badge--danger{background:var(--color-danger);color:#fff}
.row-actions{display:flex;gap:4px;flex-wrap:nowrap;white-space:nowrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
.modal-overlay{position:fixed;inset:0;background:rgba(15,18,24,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px} .modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-dropdown);width:100%;max-width:420px} .modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--color-border)} .modal-head h3{font-size:var(--text-h3)} .modal-body{padding:16px} .modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 16px;border-top:1px solid var(--color-border)} .modal .field-label{font-size:11px} .modal textarea{resize:vertical;font-family:inherit}
</style>
