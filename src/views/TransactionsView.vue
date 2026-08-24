<template>
  <section class="page">
    <div class="page-head"><h1>Transactions</h1><p>Ledger — approve / reject / reverse</p></div>

    <div class="card filters">
      <div class="filter-row">
        <div class="field"><label class="field-label">User ID</label><input v-model="filters.userid" class="input" placeholder="3056579" @keyup.enter="fetchTransactions(1)" /></div>
        <div class="field"><label class="field-label">Trn ID</label><input v-model="filters.trnId" class="input" placeholder="TXN..." @keyup.enter="fetchTransactions(1)" /></div>
        <div class="field"><label class="field-label">Status</label><select v-model="filters.status" class="input"><option value="">All</option><option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option><option value="reversed">reversed</option></select></div>
        <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="loading" @click="fetchTransactions(1)">{{ loading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="reset">Reset</button></div>
      </div>
      <div class="filter-row" style="margin-top:8px">
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
          <thead><tr><th>Trn ID</th><th>User</th><th>Amount</th><th>Type</th><th>Note</th><th>Balance After</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="t in transactions" :key="t.trnId">
              <td class="mono">{{ t.trnId }}<br /><span class="muted">{{ fmt(t.createdAt) }}</span></td>
              <td>{{ t.userid }}</td><td>{{ t.amount }}</td><td><span class="badge">{{ t.type }}</span></td><td>{{ t.note }}<br /><span class="muted">{{ t.remark }}</span></td>
              <td>{{ t.balanceAfter }}</td><td><span :class="['badge', statusClass(t.status)]">{{ t.status }}</span></td>
              <td>
                <div class="row-actions">
                  <button v-if="t.status==='pending' && t.type==='credit'" class="btn btn-ghost btn-sm success" type="button" :disabled="acting===t.trnId" @click="approve(t)">Approve</button>
                  <button v-if="t.status==='pending'" class="btn btn-ghost btn-sm danger" type="button" :disabled="acting===t.trnId" @click="reject(t)">Reject</button>
                  <button v-if="t.status==='success' && t.type==='credit'" class="btn btn-ghost btn-sm" type="button" :disabled="acting===t.trnId" @click="reverse(t)">Reverse</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page<=1 || loading" @click="fetchTransactions(page-1)">Prev</button>
        <span class="muted">Page {{ page }} of {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page>=totalPages || loading" @click="fetchTransactions(page+1)">Next</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminTransactions, approveTransaction, rejectTransaction, reverseTransaction } from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const filters = reactive({ userid:'', trnId:'', status:'', type:'', note:'', network:'' })
const transactions = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const acting = ref('')

function statusClass(s){ return s==='success' ? 'badge--success' : s==='pending' ? 'badge--warning' : 'badge--danger' }
function fmt(d){ try{ return new Date(d).toLocaleString() } catch{ return d } }

async function fetchTransactions(p=1){
  loading.value=true; error.value=''; page.value=p
  try{
    const data = await getAdminTransactions({ userid: filters.userid.trim() || undefined, trnId: filters.trnId.trim() || undefined, status: filters.status || undefined, type: filters.type || undefined, note: filters.note || undefined, network: filters.network || undefined, page: page.value, limit: 20 })
    transactions.value = data.transactions || []; total.value=data.count||0; totalPages.value=data.totalPages||1
  } catch(e){ error.value=e.message; toast.error(e.message) } finally{ loading.value=false }
}
function reset(){ filters.userid=''; filters.trnId=''; filters.status=''; filters.type=''; filters.note=''; filters.network=''; fetchTransactions(1) }

async function approve(t){
  const txHash = prompt('Optional txHash (leave empty to skip):') || undefined
  acting.value = t.trnId
  try{ const data = await approveTransaction(t.trnId, txHash ? { txHash } : {}); toast.success(data.msg || 'Approved'); fetchTransactions(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
}
async function reject(t){
  const remark = prompt('Reject remark (optional):') || undefined
  acting.value = t.trnId
  try{ const data = await rejectTransaction(t.trnId, remark ? { remark } : {}); toast.success(data.msg || 'Rejected'); fetchTransactions(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
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
.page{display:flex;flex-direction:column;gap:16px} .page-head h1{font-size:var(--text-h1)} .page-head p{color:var(--color-text-secondary);font-size:var(--text-h4);margin-top:4px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:12px;align-items:end} .filters .field{flex:1;min-width:140px} .filter-actions{display:flex;gap:8px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md)} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:900px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:3px 8px;border-radius:var(--radius-round);font-size:11px;font-weight:600} .badge--success{border:1px solid var(--color-success);color:var(--color-success);background:var(--color-surface-raised)} .badge--warning{border:1px solid var(--color-warning);color:var(--color-warning);background:var(--color-surface-raised)} .badge--danger{border:1px solid var(--color-danger);color:var(--color-danger);background:#fef2f2} html[data-theme='dark'] .badge--danger{background:rgba(248,113,113,.12)}
.row-actions{display:flex;gap:4px;flex-wrap:wrap} .btn-sm{padding:6px 10px;font-size:var(--text-body-l)} .success{color:var(--color-success)} .danger{color:var(--color-danger)}
.pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
</style>
