<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>Payouts</h1>
      </div>
    </div>

    <div class="tabs">
      <button :class="['tab', { 'tab--active': activeTab === 'users' }]" type="button" @click="activeTab = 'users'">Payout Users</button>
      <button :class="['tab', { 'tab--active': activeTab === 'payouts' }]" type="button" @click="activeTab = 'payouts'">All Payouts</button>
    </div>

    <!-- Payout Users Tab -->
    <div v-show="activeTab === 'users'" class="card">
      <div class="card-head">
        <div>
          <h3>Payout Users ({{ payoutUsers.length }})</h3>
          <span class="card-sub">Users with payout enabled</span>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="usersLoading" @click="fetchPayoutUsers">Refresh</button>
      </div>
      <p v-if="usersError" class="error" role="alert">{{ usersError }}</p>
      <p v-if="!usersLoading && payoutUsers.length===0 && !usersError" class="empty">No payout users found.</p>
      <div v-if="payoutUsers.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>UID</th><th>Mobile</th><th>Balance</th><th>Payout Enabled</th><th>Banks</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="u in payoutUsers" :key="u.uid">
              <td class="mono">{{ u.uid }}</td>
              <td class="mono">{{ u.mobile }}</td>
              <td class="mono">{{ formatNum(u.balance) }}</td>
              <td><span :class="['badge', u.payoutEnabled ? 'badge--success' : 'badge--danger']">{{ u.payoutEnabled ? 'Yes' : 'No' }}</span></td>
              <td>
                <div v-for="b in (u.banks || [])" :key="b.accountNumber" class="bank-info">
                  <span class="badge">{{ b.bankName }}</span>
                  <span class="muted">{{ b.holderName }} • {{ b.accountNumber }}</span>
                </div>
                <span v-if="!u.banks || u.banks.length===0" class="muted">No banks</span>
              </td>
              <td>
                <button v-if="u.payoutEnabled && u.banks && u.banks.length" class="btn btn-sm action-btn action-btn--success" type="button" @click="openCreatePayout(u)">Create Payout</button>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- All Payouts Tab -->
    <div v-show="activeTab === 'payouts'">
      <div class="card filters">
        <div class="filter-row">
          <div class="field"><label class="field-label">User ID</label><input v-model="payoutFilters.userid" class="input" placeholder="3056579" @keyup.enter="fetchPayouts(1)" /></div>
          <div class="field"><label class="field-label">Status</label><select v-model="payoutFilters.status" class="input"><option value="">All</option><option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option></select></div>
          <div class="field"><label class="field-label">Payout ID</label><input v-model="payoutFilters.payoutId" class="input" placeholder="PAYOUT..." @keyup.enter="fetchPayouts(1)" /></div>
          <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="payoutsLoading" @click="fetchPayouts(1)">{{ payoutsLoading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="resetPayoutFilters">Reset</button></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="card-head"><h3>All Payouts ({{ payoutTotal }})</h3><span class="card-sub">Page {{ payoutPage }} / {{ payoutTotalPages || 1 }}</span></div>
        <p v-if="payoutsError" class="error" role="alert">{{ payoutsError }}</p>
        <p v-if="!payoutsLoading && payouts.length===0 && !payoutsError" class="empty">No payouts found.</p>
        <div v-if="payouts.length" class="table-wrap">
          <table class="table">
            <thead><tr><th>Payout ID</th><th>User</th><th>Amount</th><th>Bank</th><th>Account</th><th>IFSC</th><th>Trn ID</th><th>Status</th><th>Remark</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="p in payouts" :key="p.payoutId">
                <td class="mono">{{ p.payoutId }}</td>
                <td>{{ p.userid }}</td>
                <td class="mono">{{ formatNum(p.amount) }}</td>
                <td><span class="badge">{{ p.bankName }}</span></td>
                <td class="mono">{{ p.accountNumber }}</td>
                <td class="mono">{{ p.ifsc }}</td>
                <td class="mono">{{ p.trnId || '—' }}</td>
                <td><span :class="['badge', payoutStatusClass(p.status)]">{{ p.status }}</span></td>
                <td class="muted remark">{{ p.remark || '—' }}</td>
                <td class="muted">{{ fmt(p.createdAt) }}</td>
                <td>
                  <div class="row-actions">
                    <button v-if="p.status==='pending'" class="btn btn-sm action-btn action-btn--success" type="button" :disabled="acting===p.payoutId" @click="openApproveDialog(p)">Approve</button>
                    <button v-if="p.status==='pending'" class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="acting===p.payoutId" @click="openRejectDialog(p)">Reject</button>
                    <span v-if="p.status!=='pending'" class="muted">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="payoutTotalPages > 1" class="pagination">
          <button class="btn btn-ghost btn-sm" type="button" :disabled="payoutPage<=1 || payoutsLoading" @click="fetchPayouts(payoutPage-1)">Prev</button>
          <span class="muted">Page {{ payoutPage }} of {{ payoutTotalPages }}</span>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="payoutPage>=payoutTotalPages || payoutsLoading" @click="fetchPayouts(payoutPage+1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Create Payout Dialog -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Create Payout — {{ createForm.user?.mobile }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closeCreateModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">User</label>
            <div class="mono">{{ createForm.user?.uid }} — {{ createForm.user?.mobile }}</div>
          </div>
          <div class="field">
            <label class="field-label">Balance</label>
            <div class="mono">{{ formatNum(createForm.user?.balance) }}</div>
          </div>
          <div class="field">
            <label class="field-label">Bank Account</label>
            <select v-model="createForm.accountNumber" class="input">
              <option v-for="b in (createForm.user?.banks || [])" :key="b.accountNumber" :value="b.accountNumber">{{ b.bankName }} — {{ b.holderName }} — {{ b.accountNumber }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Amount per order (₹)</label>
            <input v-model.number="createForm.amount" class="input" type="number" min="1" placeholder="100" />
          </div>
          <div class="field">
            <label class="field-label">Number of orders</label>
            <input v-model.number="createForm.numberOfOrders" class="input" type="number" min="1" max="50" placeholder="3" />
          </div>
          <div v-if="createForm.total > 0" class="total-row">
            <span>Total deduction:</span>
            <span class="mono">₹ {{ formatNum(createForm.total) }}</span>
          </div>
          <p v-if="createForm.error" class="error">{{ createForm.error }}</p>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="closeCreateModal">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="createForm.saving" @click="submitCreatePayout">{{ createForm.saving ? 'Creating…' : 'Create Payout' }}</button>
        </div>
      </div>
    </div>

    <!-- Approve Dialog -->
    <div v-if="approveDialog.open" class="modal-overlay" @click.self="closeApproveDialog">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Approve Payout — {{ approveDialog.payoutId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closeApproveDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">Remark (required)</label>
            <textarea v-model="approveDialog.remark" class="input" rows="3" placeholder="e.g. Payment processed via NEFT"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="closeApproveDialog">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="approveDialog.saving" @click="confirmApprove">{{ approveDialog.saving ? 'Approving…' : 'Approve' }}</button>
        </div>
      </div>
    </div>

    <!-- Reject Dialog -->
    <div v-if="rejectDialog.open" class="modal-overlay" @click.self="closeRejectDialog">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>Reject Payout — {{ rejectDialog.payoutId }}</h3>
          <button class="btn btn-ghost btn-sm" type="button" aria-label="Close" @click="closeRejectDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">Remark (required)</label>
            <textarea v-model="rejectDialog.remark" class="input" rows="3" placeholder="e.g. Bank details mismatch"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" @click="closeRejectDialog">Cancel</button>
          <button class="btn btn-primary" type="button" :disabled="rejectDialog.saving" @click="confirmReject">{{ rejectDialog.saving ? 'Rejecting…' : 'Reject' }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { getPayoutUsers, createPayout, getAdminPayouts, approvePayout, rejectPayout } from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

const activeTab = ref('users')

const payoutUsers = ref([])
const usersLoading = ref(false)
const usersError = ref('')

const payouts = ref([])
const payoutTotal = ref(0)
const payoutPage = ref(1)
const payoutTotalPages = ref(1)
const payoutsLoading = ref(false)
const payoutsError = ref('')
const payoutFilters = reactive({ userid: '', status: '', payoutId: '' })
const acting = ref('')

const showCreateModal = ref(false)
const createForm = reactive({ user: null, accountNumber: '', amount: '', numberOfOrders: '', saving: false, error: '' })
const createTotal = computed(() => (Number(createForm.amount) || 0) * (Number(createForm.numberOfOrders) || 0))
Object.defineProperty(createForm, 'total', { get() { return createTotal.value } })

const approveDialog = reactive({ open: false, payoutId: '', remark: '', saving: false })
const rejectDialog = reactive({ open: false, payoutId: '', remark: '', saving: false })

function formatNum(n) { try { return Number(n || 0).toLocaleString() } catch { return n } }
function fmt(d) { try { return new Date(d).toLocaleString() } catch { return d || '—' } }
function payoutStatusClass(s) { return s === 'success' ? 'badge--success' : s === 'pending' ? 'badge--warning' : 'badge--danger' }

async function fetchPayoutUsers() {
  usersLoading.value = true; usersError.value = ''
  try {
    const data = await getPayoutUsers({ limit: 100 })
    payoutUsers.value = data.users || []
  } catch (e) { usersError.value = e.message; toast.error(e.message) } finally { usersLoading.value = false }
}

async function fetchPayouts(p = 1) {
  payoutsLoading.value = true; payoutsError.value = ''; payoutPage.value = p
  try {
    const data = await getAdminPayouts({
      userid: payoutFilters.userid.trim() || undefined,
      status: payoutFilters.status || undefined,
      payoutId: payoutFilters.payoutId.trim() || undefined,
      page: payoutPage.value,
      limit: 20,
    })
    payouts.value = data.payouts || []
    payoutTotal.value = data.count || 0
    payoutTotalPages.value = data.totalPages || 1
  } catch (e) { payoutsError.value = e.message; toast.error(e.message) } finally { payoutsLoading.value = false }
}

function resetPayoutFilters() { payoutFilters.userid = ''; payoutFilters.status = ''; payoutFilters.payoutId = ''; fetchPayouts(1) }

function openCreatePayout(user) {
  createForm.user = user
  createForm.accountNumber = user.banks?.[0]?.accountNumber || ''
  createForm.amount = ''
  createForm.numberOfOrders = ''
  createForm.saving = false
  createForm.error = ''
  showCreateModal.value = true
}
function closeCreateModal() { showCreateModal.value = false; createForm.user = null }

async function submitCreatePayout() {
  createForm.error = ''
  const amount = Number(createForm.amount)
  const numberOfOrders = Number(createForm.numberOfOrders)
  if (!amount || amount <= 0) { createForm.error = 'Enter a valid amount'; return }
  if (!numberOfOrders || numberOfOrders <= 0) { createForm.error = 'Enter valid number of orders'; return }
  if (!createForm.accountNumber) { createForm.error = 'Select a bank account'; return }
  if (createForm.total > (createForm.user?.balance || 0)) {
    createForm.error = `Insufficient balance. Required: ${createForm.total}, Available: ${createForm.user?.balance}`
    return
  }
  createForm.saving = true
  try {
    const data = await createPayout({
      userid: createForm.user.uid,
      amount,
      numberOfOrders,
      accountNumber: createForm.accountNumber,
    })
    toast.success(data.msg || `${numberOfOrders} payout orders created`)
    closeCreateModal()
    fetchPayoutUsers()
    fetchPayouts(1)
  } catch (e) { createForm.error = e.message; toast.error(e.message) } finally { createForm.saving = false }
}

function openApproveDialog(p) {
  approveDialog.payoutId = p.payoutId
  approveDialog.remark = ''
  approveDialog.saving = false
  approveDialog.open = true
}
function closeApproveDialog() { approveDialog.open = false }
async function confirmApprove() {
  if (!approveDialog.remark.trim()) return toast.error('A remark is required')
  acting.value = approveDialog.payoutId
  approveDialog.saving = true
  try {
    const data = await approvePayout(approveDialog.payoutId, { remark: approveDialog.remark.trim() })
    toast.success(data.msg || 'Payout approved')
    const p = payouts.value.find(x => x.payoutId === approveDialog.payoutId)
    if (p) { p.status = 'success'; p.remark = approveDialog.remark.trim() }
    closeApproveDialog()
  } catch (e) { toast.error(e.message) } finally { acting.value = ''; approveDialog.saving = false }
}

function openRejectDialog(p) {
  rejectDialog.payoutId = p.payoutId
  rejectDialog.remark = ''
  rejectDialog.saving = false
  rejectDialog.open = true
}
function closeRejectDialog() { rejectDialog.open = false }
async function confirmReject() {
  if (!rejectDialog.remark.trim()) return toast.error('A remark is required')
  acting.value = rejectDialog.payoutId
  rejectDialog.saving = true
  try {
    const data = await rejectPayout(rejectDialog.payoutId, { remark: rejectDialog.remark.trim() })
    toast.success(data.msg || 'Payout rejected')
    const p = payouts.value.find(x => x.payoutId === rejectDialog.payoutId)
    if (p) { p.status = 'failed'; p.remark = rejectDialog.remark.trim() }
    closeRejectDialog()
  } catch (e) { toast.error(e.message) } finally { acting.value = ''; rejectDialog.saving = false }
}

onMounted(() => { fetchPayoutUsers(); fetchPayouts(1) })
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px} .page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px} .page-head h1{font-size:var(--text-h1)} .page-head p{color:var(--color-text-secondary);font-size:var(--text-h4);margin-top:4px}
.tabs{display:flex;gap:0;border-bottom:1px solid var(--color-border);margin-bottom:4px}
.tab{padding:10px 18px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--color-text-secondary);font-size:var(--text-h4);font-weight:500;cursor:pointer;transition:color .15s ease,border-color .15s ease}
.tab:hover{color:var(--color-text)}
.tab--active{color:var(--color-primary);border-bottom-color:var(--color-primary)}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:130px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--color-border);border-radius:var(--radius-md);scrollbar-width:thin;scrollbar-color:var(--color-border) transparent} .table-wrap::-webkit-scrollbar{height:8px} .table-wrap::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:4px} .table-wrap::-webkit-scrollbar-track{background:transparent} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:1050px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600} .table tbody tr:nth-child(odd){background:var(--color-row-alt)} .table tbody tr:hover{background:var(--color-surface-raised)}
.mono{font-family:ui-monospace,monospace;font-size:12px} .muted{color:var(--color-text-secondary);font-size:11px} .remark{max-width:160px;word-break:break-word}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--warning{background:var(--color-warning);color:#fff} .badge--danger{background:var(--color-danger);color:#fff}
.bank-info{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.row-actions{display:flex;gap:4px;flex-wrap:nowrap;white-space:nowrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
.modal-overlay{position:fixed;inset:0;background:rgba(15,18,24,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px} .modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-dropdown);width:100%;max-width:420px} .modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--color-border)} .modal-head h3{font-size:var(--text-h3)} .modal-body{padding:16px} .modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 16px;border-top:1px solid var(--color-border)} .modal .field-label{font-size:11px} .modal textarea{resize:vertical;font-family:inherit}
.total-row{display:flex;justify-content:space-between;padding:8px 12px;background:var(--color-surface-raised);border-radius:var(--radius-sm);font-size:var(--text-h4);font-weight:600}
</style>
