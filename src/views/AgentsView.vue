<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Agents</h1>
      </div>
      <button class="btn btn-ghost btn-sm" type="button" :disabled="statsLoading" @click="fetchStats">Refresh</button>
    </div>

    <div class="tabs">
      <button :class="['tab', { 'tab--active': subTab === 'config' }]" type="button" @click="subTab = 'config'">Config</button>
      <button :class="['tab', { 'tab--active': subTab === 'stats' }]" type="button" @click="subTab = 'stats'">Stats</button>
    </div>

    <div v-show="subTab === 'config'" class="tab-panel">
      <div class="card">
        <div class="card-head">
          <div>
            <h3>Commission Config</h3>
            <span class="card-sub">Referrer earns commission % of each referred user's deposit.</span>
          </div>
          <span :class="['badge', commissionForm.isActive ? 'badge--success' : 'badge--danger']">{{ commissionForm.isActive ? 'commission active' : 'commission inactive' }}</span>
        </div>
        <p v-if="commissionError" class="error" role="alert">{{ commissionError }}</p>
        <p v-if="commissionLoading" class="empty">Loading…</p>
        <form v-else @submit.prevent="saveCommission">
          <div class="field"><label class="field-label">Commission (%)</label><input v-model="commissionForm.commissionPercentage" class="input" type="number" step="0.5" min="0" max="100" placeholder="5" /></div>
          <div class="field checkbox"><label><input type="checkbox" v-model="commissionForm.isActive" /> Commission active</label></div>
          <div class="row-actions">
            <button class="btn btn-primary" type="submit" :disabled="commissionSaving">{{ commissionSaving ? 'Saving…' : 'Save' }}</button>
          </div>
          <p v-if="commissionMessage" class="muted">{{ commissionMessage }}</p>
        </form>
      </div>
    </div>

    <div v-show="subTab === 'stats'" class="tab-panel">
      <div class="card">
        <div class="card-head">
          <div>
            <h3>Referral Stats</h3>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="statsLoading" @click="fetchStats">Refresh</button>
        </div>
        <p v-if="statsError" class="error" role="alert">{{ statsError }}</p>
        <p v-if="statsLoading" class="empty">Loading…</p>
        <div v-else class="stats-grid">
          <div class="stat"><span class="stat-label">Total Referrals</span><span class="stat-value">{{ stats.totalReferrals ?? 0 }}</span></div>
          <div class="stat"><span class="stat-label">Commissions Paid</span><span class="stat-value">{{ stats.commissionCount ?? 0 }}</span></div>
          <div class="stat"><span class="stat-label">Total Earned</span><span class="stat-value">₹ {{ stats.totalEarned ?? 0 }}</span></div>
          <div class="stat"><span class="stat-label">Joiners Today</span><span class="stat-value">{{ stats.joinersToday ?? 0 }}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h3>Commissions ({{ commTotal }})</h3>
          </div>
        </div>
        <div class="filter-row">
          <div class="field">
            <label class="field-label">Status</label>
            <select v-model="commFilters.status" class="input">
              <option value="">All</option>
              <option value="success">success</option>
              <option value="failed">failed</option>
              <option value="reversed">reversed</option>
              <option value="pending">pending</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Currency</label>
            <select v-model="commFilters.currency" class="input">
              <option value="">All</option>
              <option value="USDT">USDT</option>
              <option value="INR">INR</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">User ID</label>
            <input v-model="commFilters.userid" class="input" placeholder="referrer or referee" @keyup.enter="fetchCommissions(1)" />
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="commLoading" @click="fetchCommissions(1)">Search</button>
          </div>
        </div>
        <p v-if="commError" class="error" role="alert">{{ commError }}</p>
        <p v-if="!commLoading && commissions.length === 0 && !commError" class="empty">No commission records.</p>
        <div v-if="commissions.length" class="table-wrap">
          <table class="table">
            <thead><tr><th>Commission ID</th><th>Referrer</th><th>Referee</th><th>Payin</th><th>Deposit</th><th>Currency</th><th>%</th><th>Amount</th><th>Status</th><th>Credited</th></tr></thead>
            <tbody>
              <tr v-for="c in commissions" :key="c._id || c.commissionId">
                <td class="mono">{{ c.commissionId || c._id }}</td>
                <td>{{ c.referrerUserid }}</td>
                <td>{{ c.refereeUserid }}</td>
                <td class="mono">{{ c.payinId }}</td>
                <td class="mono">{{ c.depositAmount }}</td>
                <td><span class="badge">{{ c.currency }}</span></td>
                <td class="mono">{{ c.commissionPercentage }}%</td>
                <td class="mono"><strong>{{ c.commissionAmount }}</strong></td>
                <td><span :class="['badge', csClass(c.status)]">{{ c.status }}</span></td>
                <td class="muted">{{ fmtDate(c.creditedAt || c.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="commTotalPages > 1" class="pagination">
          <button class="btn btn-ghost btn-sm" type="button" :disabled="commPage <= 1 || commLoading" @click="fetchCommissions(commPage - 1)">Prev</button>
          <span class="muted">Page {{ commPage }} of {{ commTotalPages }}</span>
          <button class="btn btn-ghost btn-sm" type="button" :disabled="commPage >= commTotalPages || commLoading" @click="fetchCommissions(commPage + 1)">Next</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  getCommissionConfig, updateCommissionConfig, getAdminCommissions, getReferralStats,
} from '../api/client.js'
import { useToast } from '../composables/useToast.js'
import { fmtDateTime as fmtDate } from '../utils/format.js'

const toast = useToast()
const subTab = ref('config')

// — Commission Config state —
const commissionForm = reactive({ commissionPercentage: 0, isActive: true })
const commissionLoading = ref(false)
const commissionSaving = ref(false)
const commissionError = ref('')
const commissionMessage = ref('')

// — Referral Stats state —
const stats = ref({})
const statsLoading = ref(false)
const statsError = ref('')

// — Commissions list state —
const commFilters = reactive({ status: '', currency: '', userid: '' })
const commissions = ref([])
const commTotal = ref(0)
const commPage = ref(1)
const commTotalPages = ref(1)
const commLoading = ref(false)
const commError = ref('')



async function fetchCommission() {
  commissionLoading.value = true; commissionError.value = ''
  try {
    const data = await getCommissionConfig()
    Object.assign(commissionForm, { commissionPercentage: data.commissionPercentage != null ? Number(data.commissionPercentage) : 0, isActive: data.isActive !== false })
    commissionMessage.value = ''
  } catch (e) { commissionError.value = e.message } finally { commissionLoading.value = false }
}
async function saveCommission() {
  commissionSaving.value = true; commissionError.value = ''; commissionMessage.value = ''
  const p = Number(commissionForm.commissionPercentage)
  if (commissionForm.commissionPercentage === '' || !isFinite(p)) { commissionError.value = 'commissionPercentage is required'; commissionSaving.value = false; return }
  if (p < 0 || p > 100) { commissionError.value = 'commissionPercentage must be between 0 and 100'; commissionSaving.value = false; return }
  try {
    const data = await updateCommissionConfig({ commissionPercentage: p, isActive: commissionForm.isActive })
    Object.assign(commissionForm, { commissionPercentage: data.commissionPercentage != null ? Number(data.commissionPercentage) : p, isActive: data.isActive !== undefined ? data.isActive : commissionForm.isActive })
    toast.success(data.msg || 'Commission config updated')
    commissionMessage.value = `Referrer earns ${commissionForm.commissionPercentage}% of each referred deposit`
  } catch (e) { commissionError.value = e.message; toast.error(e.message) } finally { commissionSaving.value = false }
}

function csClass(s) { return s === 'success' ? 'badge--success' : s === 'pending' ? 'badge--warning' : 'badge--danger' }

async function fetchStats() {
  statsLoading.value = true; statsError.value = ''
  try { stats.value = await getReferralStats() || {} } catch (e) { statsError.value = e.message; toast.error(e.message) } finally { statsLoading.value = false }
}
async function fetchCommissions(p = 1) {
  commLoading.value = true; commError.value = ''; commPage.value = p
  try {
    const data = await getAdminCommissions({ page: commPage.value, limit: 20, status: commFilters.status || undefined, currency: commFilters.currency || undefined, userid: commFilters.userid.trim() || undefined })
    commissions.value = data.commissions || []; commTotal.value = data.count || 0; commTotalPages.value = data.totalPages || 1
  } catch (e) { commError.value = e.message; toast.error(e.message) } finally { commLoading.value = false }
}

onMounted(() => { fetchCommission(); fetchStats(); fetchCommissions(1) })
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.tabs{display:flex;gap:0;border-bottom:1px solid var(--color-border)}
.tab{padding:10px 18px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--color-text-secondary);font-size:var(--text-h4);font-weight:500;cursor:pointer;transition:color .15s ease,border-color .15s ease} .tab:hover{color:var(--color-text)}
.tab--active{color:var(--color-primary);border-bottom-color:var(--color-primary)}
.tab-panel{display:flex;flex-direction:column;gap:16px}
.filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:12px} .filter-row .field{flex:1;min-width:120px;gap:4px} .filter-row .field-label{font-size:11px} .filter-row .input{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md)} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:760px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .break{word-break:break-all} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--danger{background:var(--color-danger);color:#fff} .badge--warning{background:var(--color-warning);color:#fff} .badge--primary{background:var(--color-primary);color:#fff}
.row-actions{display:flex;gap:4px;flex-wrap:wrap} .pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px} .stat{display:flex;flex-direction:column;gap:4px;padding:14px;background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:var(--radius-md)} .stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--color-text-secondary)} .stat-value{font-size:22px;font-weight:700}
.field{display:flex;flex-direction:column;gap:6px} .field-label{font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:0} .field .input{padding:8px 10px;font-size:13px}
.checkbox label{display:flex;gap:8px;align-items:center;font-size:var(--text-h4)}
</style>