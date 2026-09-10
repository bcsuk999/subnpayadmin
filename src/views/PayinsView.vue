<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Payins</h1>
      </div>
      <button class="btn btn-ghost btn-sm filter-toggle" type="button" @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h10M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="showFilters" class="card filters">
      <div class="filter-row">
        <div class="field"><label class="field-label">User ID</label><input v-model="filters.userid" class="input" placeholder="3056579" @keyup.enter="fetchPayins(1)" /></div>
        <div class="field"><label class="field-label">Status</label><select v-model="filters.status" class="input"><option value="">All</option><option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option><option value="reversed">reversed</option></select></div>
        <div class="field"><label class="field-label">Network</label><select v-model="filters.network" class="input"><option value="">All</option><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option><option value="SPAY">SPAY</option></select></div>
        <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="loading" @click="fetchPayins(1)">{{ loading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="reset">Reset</button></div>
      </div>
      <div class="filter-row" style="margin-top:6px">
        <div class="field"><label class="field-label">Payin ID</label><input v-model="filters.payinId" class="input" placeholder="P20260908..." @keyup.enter="fetchPayins(1)" /></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Payins ({{ total }})</h3><span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && payins.length===0 && !error" class="empty">No payins. Try different filters.</p>
      <div v-if="payins.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>Payin ID</th><th>User</th><th>Amount</th><th>Received</th><th>Network</th><th>Address</th><th>Deep Link</th><th>Rate</th><th>Tx Hash</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="p in payins" :key="p.payinId || p._id">
              <td class="mono">{{ p.payinId || p._id }}</td><td>{{ p.userid }}</td><td class="mono">{{ p.amount }} <span class="muted">{{ p.currency }}</span></td>
              <td class="mono">
                {{ p.receivedAmount ?? '—' }}
                <span v-if="p.bonus"><br /><span class="muted">bonus {{ p.bonus }}</span></span>
              </td>
              <td><span class="badge">{{ p.network }}</span></td>
              <td class="mono break">{{ p.address || '—' }}</td>
              <td class="mono break">{{ p.deepLink || '—' }}</td>
              <td class="mono">{{ p.exchangeRate ?? '—' }}</td>
              <td class="mono">{{ p.txHash || '—' }}</td><td><span :class="['badge', statusClass(p.status)]">{{ p.status }}</span></td><td class="muted">{{ fmt(p.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-sm action-btn" type="button" @click="onCopy(p.payinId || p._id, 'Payin ID')">Copy ID</button>
                  <button v-if="p.txHash" class="btn btn-sm action-btn" type="button" @click="onCopy(p.txHash, 'Tx Hash')">Copy Tx</button>
                  <template v-if="p.status==='pending'">
                    <button class="btn btn-sm action-btn action-btn--success" type="button" :disabled="acting===p.payinId" @click="onApprove(p)">{{ acting===p.payinId ? 'Approving…' : 'Approve' }}</button>
                    <button class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="acting===p.payinId" @click="onReject(p)">{{ acting===p.payinId ? 'Rejecting…' : 'Reject' }}</button>
                  </template>
                  <button v-if="p.status==='success' && p.trnId" class="btn btn-sm action-btn" type="button" :disabled="acting===p.payinId" @click="onReverse(p)">{{ acting===p.payinId ? 'Reversing…' : 'Reverse' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page<=1 || loading" @click="fetchPayins(page-1)">Prev</button>
        <span class="muted">Page {{ page }} of {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page>=totalPages || loading" @click="fetchPayins(page+1)">Next</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminPayins, approveTransaction, rejectTransaction, reverseTransaction } from '../api/client.js'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmt } from '../utils/format.js'

const toast = useToast()
const filters = reactive({ userid:'', status:'', network:'', payinId:'' })
const showFilters = ref(true)
const payins = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const acting = ref('')

function statusClass(s){ return s==='success' ? 'badge--success' : s==='pending' ? 'badge--warning' : 'badge--danger' }
async function onCopy(text, label){
  try{ await navigator.clipboard.writeText(String(text)); toast.success(`${label} copied`) } catch{ toast.error('Copy failed') }
}
function onView(p){
  const trn = p.trnId || '—'
  toast.info(`Payin ${p.payinId||p._id} • ${p.amount} ${p.network} • ${p.status} • Trn: ${trn}`)
}
async function onApprove(p){
  const payinId = p.payinId || p._id
  const txHash = prompt('Optional txHash (leave empty to skip):') || undefined
  const remark = prompt('Optional remark (leave empty to skip):') || undefined
  const payload = {}
  if (txHash) payload.txHash = txHash
  if (remark) payload.remark = remark
  acting.value = payinId
  try{
    const data = await approveTransaction(payinId, payload)
    toast.success(data.msg || 'Payin approved')
    if (data.transaction) p.status='success'
    await fetchPayins(page.value)
  } catch(e){ toast.error(e.message || 'Approve failed') } finally{ acting.value='' }
}
async function onReject(p){
  const payinId = p.payinId || p._id
  const remark = prompt('Reject remark (optional):') || undefined
  acting.value = payinId
  try{
    const data = await rejectTransaction(payinId, remark ? { remark } : {})
    toast.success(data.msg || 'Payin rejected')
    if (data.payin) p.status='failed'
    await fetchPayins(page.value)
  } catch(e){ toast.error(e.message || 'Reject failed') } finally{ acting.value='' }
}
async function onReverse(p){
  if (!p.trnId) return toast.error('No linked transaction')
  if (!confirm(`Reverse payin ${p.payinId} (${p.amount})? Creates debit reversal.`)) return
  const remark = prompt('Reverse remark (optional):') || undefined
  acting.value = p.payinId
  try{ const data = await reverseTransaction(p.trnId, remark ? { remark } : {}); toast.success(data.msg || 'Payin reversed'); await fetchPayins(page.value) } catch(e){ toast.error(e.message) } finally{ acting.value='' }
}
async function fetchPayins(p=1){
  loading.value=true; error.value=''; page.value=p
  try{
    const data = await getAdminPayins({ userid: filters.userid.trim() || undefined, status: filters.status || undefined, network: filters.network || undefined, payinId: filters.payinId.trim() || undefined, page: page.value, limit: 20 })
    payins.value = data.payins || []; total.value=data.count||0; totalPages.value=data.totalPages||1
  } catch(e){ error.value=e.message; toast.error(e.message) } finally{ loading.value=false }
}
function reset(){ filters.userid=''; filters.status=''; filters.network=''; filters.payinId=''; fetchPayins(1) }
onMounted(()=>fetchPayins(1))
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:112px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--color-border);border-radius:var(--radius-md);scrollbar-width:thin;scrollbar-color:var(--color-border) transparent} .table-wrap::-webkit-scrollbar{height:8px} .table-wrap::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:4px} .table-wrap::-webkit-scrollbar-track{background:transparent} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:1300px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .break{word-break:break-all} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--warning{background:var(--color-warning);color:#fff} .badge--danger{background:var(--color-danger);color:#fff}
.row-actions{display:flex;gap:4px;flex-wrap:nowrap;white-space:nowrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
</style>
