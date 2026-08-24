<template>
  <section class="page">
    <div class="page-head"><h1>Payins</h1><p>All USDT payin requests</p></div>

    <div class="card filters">
      <div class="filter-row">
        <div class="field"><label class="field-label">User ID</label><input v-model="filters.userid" class="input" placeholder="3056579" @keyup.enter="fetchPayins(1)" /></div>
        <div class="field"><label class="field-label">Status</label><select v-model="filters.status" class="input"><option value="">All</option><option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option><option value="reversed">reversed</option></select></div>
        <div class="field"><label class="field-label">Network</label><select v-model="filters.network" class="input"><option value="">All</option><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option></select></div>
        <div class="filter-actions"><button class="btn btn-primary" type="button" :disabled="loading" @click="fetchPayins(1)">{{ loading ? 'Loading…' : 'Search' }}</button><button class="btn btn-ghost" type="button" @click="reset">Reset</button></div>
      </div>
      <div class="filter-row" style="margin-top:6px">
        <div class="field"><label class="field-label">Payin ID</label><input v-model="filters.payinId" class="input" placeholder="PAY..." @keyup.enter="fetchPayins(1)" /></div>
        <div class="field"><label class="field-label">Trn ID</label><input v-model="filters.trnId" class="input" placeholder="TXN..." @keyup.enter="fetchPayins(1)" /></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Payins ({{ total }})</h3><span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span></div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && payins.length===0 && !error" class="empty">No payins. Try different filters.</p>
      <div v-if="payins.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>Payin ID</th><th>User</th><th>Amount</th><th>Network</th><th>Address</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="p in payins" :key="p.payinId || p._id">
              <td class="mono">{{ p.payinId || p._id }}</td><td>{{ p.userid }}</td><td>{{ p.amount }}</td><td><span class="badge">{{ p.network }}</span></td>
              <td class="mono break">{{ p.address }}</td><td><span :class="['badge', statusClass(p.status)]">{{ p.status }}</span></td><td class="muted">{{ fmt(p.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-ghost btn-sm" type="button" @click="onView(p)">View</button>
                  <button class="btn btn-ghost btn-sm" type="button" @click="onCopy(p.payinId || p._id, 'Payin ID')">Copy ID</button>
                  <button v-if="p.trnId || p.referenceId" class="btn btn-ghost btn-sm" type="button" @click="onCopy(p.trnId || p.referenceId, 'Trn ID')">Copy Trn</button>
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
import { getAdminPayins } from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const filters = reactive({ userid:'', status:'', network:'', payinId:'', trnId:'' })
const payins = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')

function statusClass(s){ return s==='success' ? 'badge--success' : s==='pending' ? 'badge--warning' : 'badge--danger' }
function fmt(d){ try{ return new Date(d).toLocaleString() } catch{ return d } }
async function onCopy(text, label){
  try{ await navigator.clipboard.writeText(String(text)); toast.success(`${label} copied`) } catch{ toast.error('Copy failed') }
}
function onView(p){
  const trn = p.trnId || p.referenceId || '—'
  toast.info(`Payin ${p.payinId||p._id} • ${p.amount} ${p.network} • ${p.status} • Trn: ${trn}`)
}
async function fetchPayins(p=1){
  loading.value=true; error.value=''; page.value=p
  try{
    const data = await getAdminPayins({ userid: filters.userid.trim() || undefined, status: filters.status || undefined, network: filters.network || undefined, payinId: filters.payinId.trim() || undefined, trnId: filters.trnId.trim() || undefined, page: page.value, limit: 20 })
    payins.value = data.payins || []; total.value=data.count||0; totalPages.value=data.totalPages||1
  } catch(e){ error.value=e.message; toast.error(e.message) } finally{ loading.value=false }
}
function reset(){ filters.userid=''; filters.status=''; filters.network=''; filters.payinId=''; filters.trnId=''; fetchPayins(1) }
onMounted(()=>fetchPayins(1))
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px} .page-head h1{font-size:var(--text-h1)} .page-head p{color:var(--color-text-secondary);font-size:var(--text-h4);margin-top:4px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:112px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;border:1px solid var(--color-border);border-radius:var(--radius-md);scrollbar-width:thin;scrollbar-color:var(--color-border) transparent} .table-wrap::-webkit-scrollbar{height:8px} .table-wrap::-webkit-scrollbar-thumb{background:var(--color-border);border-radius:4px} .table-wrap::-webkit-scrollbar-track{background:transparent} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:960px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .break{word-break:break-all} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:3px 8px;border-radius:var(--radius-round);font-size:11px;font-weight:600} .badge--success{border:1px solid var(--color-success);color:var(--color-success);background:var(--color-surface-raised)} .badge--warning{border:1px solid var(--color-warning);color:var(--color-warning);background:var(--color-surface-raised)} .badge--danger{border:1px solid var(--color-danger);color:var(--color-danger);background:#fef2f2} html[data-theme='dark'] .badge--danger{background:rgba(248,113,113,.12)}
.row-actions{display:flex;gap:4px;flex-wrap:nowrap;white-space:nowrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px} .btn-sm{padding:6px 10px;font-size:var(--text-body-l);white-space:nowrap}
</style>
