<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Transactions</h1>
      </div>
      <button class="btn btn-ghost btn-sm filter-toggle" type="button" @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h10M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="showFilters" class="card filters">
      <div class="filter-row">
        <div class="field"><label class="field-label">User ID</label><input v-model="filters.userid" class="input" placeholder="3056579" @keyup.enter="fetchTransactions(1)" /></div>
        <div class="field"><label class="field-label">Trn ID</label><input v-model="filters.trnId" class="input" placeholder="TXN..." @keyup.enter="fetchTransactions(1)" /></div>
        <div class="field"><label class="field-label">Status</label><select v-model="filters.status" class="input"><option value="">All</option><option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option><option value="reversed">reversed</option></select></div>
        <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="loading" @click="fetchTransactions(1)">{{ loading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="reset">Reset</button></div>
      </div>
      <div class="filter-row" style="margin-top:6px">
        <div class="field"><label class="field-label">Type</label><select v-model="filters.type" class="input"><option value="">All</option><option value="credit">credit</option><option value="debit">debit</option></select></div>
        <div class="field"><label class="field-label">Note</label><select v-model="filters.note" class="input"><option value="">All</option><option value="payin">payin</option><option value="payout">payout</option><option value="reversal">reversal</option></select></div>
        <div class="field"><label class="field-label">Network</label><select v-model="filters.network" class="input"><option value="">All</option><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option></select></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Transactions ({{ total }})</h3><span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && transactions.length===0 && !error" class="empty">No transactions.</p>
      <div v-if="transactions.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>Trn ID</th><th>Ref</th><th>User</th><th>Amount</th><th>Type</th><th>Note</th><th>Balance After</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="t in transactions" :key="t.trnId">
              <td class="mono">{{ t.trnId }}<br /><span class="muted">{{ fmt(t.createdAt) }}</span></td>
              <td class="mono">{{ t.referenceId || '—' }}</td>
              <td>{{ t.userid }}</td><td class="mono">{{ t.amount }}</td><td><span class="badge">{{ t.type }}</span></td><td>{{ t.note }}<br /><span class="muted">{{ t.remark }}</span></td>
              <td class="mono">{{ t.balanceAfter }}</td><td><span :class="['badge', statusClass(t.status)]">{{ t.status }}</span></td>
              <td>
                <div class="row-actions">
                  <button v-if="t.status==='pending' && t.type==='credit' && t.referenceId" class="btn btn-sm action-btn action-btn--success" type="button" :disabled="acting===t.trnId" @click="approve(t)">Approve</button>
                  <button v-if="t.status==='pending' && t.referenceId" class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="acting===t.trnId" @click="reject(t)">Reject</button>
                  <button v-if="t.status==='success' && t.type==='credit'" class="btn btn-sm action-btn" type="button" :disabled="acting===t.trnId" @click="reverse(t)">Reverse</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination :page="page" :total-pages="totalPages" :disabled="loading" @change="fetchTransactions" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminTransactions, approveTransaction, rejectTransaction, reverseTransaction } from '../api/client.js'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmt } from '../utils/format.js'
import Pagination from '../components/Pagination.vue'

const toast = useToast()
const filters = reactive({ userid:'', trnId:'', status:'', type:'', note:'', network:'' })
const showFilters = ref(true)
const transactions = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const acting = ref('')

function statusClass(s){ return s==='success' ? 'badge--success' : s==='pending' ? 'badge--warning' : 'badge--danger' }

async function fetchTransactions(p=1){
  loading.value=true; error.value=''; page.value=p
  try{
    const data = await getAdminTransactions({ userid: filters.userid.trim() || undefined, trnId: filters.trnId.trim() || undefined, status: filters.status || undefined, type: filters.type || undefined, note: filters.note || undefined, network: filters.network || undefined, page: page.value, limit: 20 })
    transactions.value = data.transactions || []; total.value=data.count||0; totalPages.value=data.totalPages||1
  } catch(e){ error.value=e.message; toast.error(e.message) } finally{ loading.value=false }
}
function reset(){ filters.userid=''; filters.trnId=''; filters.status=''; filters.type=''; filters.note=''; filters.network=''; fetchTransactions(1) }

async function approve(t){
  const payinId = t.referenceId
  if (!payinId) return toast.error('No linked payin reference for this transaction')
  const txHash = prompt('Optional txHash (leave empty to skip):') || undefined
  const rate = prompt('Optional exchangeRate override (USDT→INR, empty = configured rate):', '')
  const rateNum = rate && rate.trim() ? Number(rate.trim()) : undefined
  if (rate && rate.trim() && (!isFinite(rateNum) || rateNum <= 0)) return toast.error('Invalid exchange rate')
  const payload = {}
  if (txHash) payload.txHash = txHash
  if (rateNum !== undefined) payload.exchangeRate = rateNum
  acting.value = t.trnId
  try{ const data = await approveTransaction(payinId, payload); toast.success(data.msg || 'Approved'); fetchTransactions(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
}
async function reject(t){
  const payinId = t.referenceId
  if (!payinId) return toast.error('No linked payin reference for this transaction')
  const remark = prompt('Reject remark (optional):') || undefined
  acting.value = t.trnId
  try{ const data = await rejectTransaction(payinId, remark ? { remark } : {}); toast.success(data.msg || 'Rejected'); fetchTransactions(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
}
async function reverse(t){
  if (!confirm(`Reverse ${t.trnId} for ${t.amount}? Creates debit reversal.`)) return
  const remark = prompt('Reverse remark (optional):') || undefined
  acting.value = t.trnId
  try{ const data = await reverseTransaction(t.trnId, remark ? { remark } : {}); toast.success(data.msg || 'Reversed'); fetchTransactions(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
}

onMounted(()=>fetchTransactions(1))
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:98px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md)} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:900px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--warning{background:var(--color-warning);color:#fff} .badge--danger{background:var(--color-danger);color:#fff}
.row-actions{display:flex;gap:4px;flex-wrap:wrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
</style>
