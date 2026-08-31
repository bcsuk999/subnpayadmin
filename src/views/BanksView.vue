<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>Banks</h1>
        <p>View and manage user bank accounts</p>
      </div>
      <button class="btn btn-ghost btn-sm filter-toggle" type="button" @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h10M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-show="showFilters" class="card filters">
      <div class="filter-row">
        <div class="field">
          <label class="field-label" for="f-userid">User ID</label>
          <input id="f-userid" v-model="filters.userid" class="input" type="text" placeholder="e.g. 3056579" @keyup.enter="fetchBanks" />
        </div>
        <div class="field">
          <label class="field-label" for="f-bankName">Bank Name</label>
          <input id="f-bankName" v-model="filters.bankName" class="input" type="text" placeholder="e.g. SBI" @keyup.enter="fetchBanks" />
        </div>
        <div class="field">
          <label class="field-label" for="f-status">Status</label>
          <select id="f-status" v-model="filters.status" class="input">
            <option value="">All</option>
            <option value="enable">Enable</option>
            <option value="disable">Disable</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" type="button" :disabled="loading" @click="fetchBanks">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span>{{ loading ? 'Loading…' : 'Search' }}</span>
          </button>
          <button class="btn btn-ghost" type="button" :disabled="loading" @click="resetFilters">Reset</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Banks ({{ total }})</h3>
        <span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && banks.length === 0 && !error" class="empty">No banks found. Adjust filters or check backend <code>GET /api/admin/banks</code>.</p>

      <div v-if="banks.length" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Bank</th>
              <th>Holder</th>
              <th>Account No.</th>
              <th>IFSC</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in banks" :key="b._id">
              <td><strong>{{ b.bankName }}</strong><br /><span class="muted">{{ b._id }}</span></td>
              <td>{{ b.holderName }}</td>
              <td class="mono">{{ b.accountNumber }}</td>
              <td class="mono">{{ b.ifsc }}</td>
              <td>{{ b.userid }}</td>
              <td><span :class="['badge', b.status === 'enable' ? 'badge--success' : 'badge--danger']">{{ b.status }}</span></td>
              <td>
                <button
                  :class="['btn btn-sm action-btn', b.status === 'enable' ? 'action-btn--danger' : 'action-btn--success']"
                  type="button"
                  :disabled="updatingId === b._id"
                  @click="toggleStatus(b)"
                >
                  {{ updatingId === b._id ? 'Updating…' : (b.status === 'enable' ? 'Disable' : 'Enable') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page <= 1 || loading" @click="goPage(page - 1)">Prev</button>
        <span class="muted">Page {{ page }} of {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page >= totalPages || loading" @click="goPage(page + 1)">Next</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminBanks, updateAdminBankStatus } from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()

const filters = reactive({ userid: '', bankName: '', status: '' })
const showFilters = ref(true)
const banks = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const updatingId = ref('')

async function fetchBanks(p = 1) {
  loading.value = true
  error.value = ''
  page.value = p
  try {
    const params = {
      userid: filters.userid.trim() || undefined,
      bankName: filters.bankName.trim() || undefined,
      status: filters.status || undefined,
      page: page.value,
      limit: 20,
    }
    const data = await getAdminBanks(params)
    banks.value = data.banks || []
    total.value = data.count ?? banks.value.length
    totalPages.value = data.totalPages || 1
    if (banks.value.length === 0) {
      // no toast on empty, silent
    }
  } catch (err) {
    error.value = err.message
    toast.error(err.message || 'Failed to fetch banks')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.userid = ''
  filters.bankName = ''
  filters.status = ''
  fetchBanks(1)
}

function goPage(p) {
  fetchBanks(p)
}

async function toggleStatus(bank) {
  const next = bank.status === 'enable' ? 'disable' : 'enable'
  updatingId.value = bank._id
  try {
    const data = await updateAdminBankStatus(bank._id, next)
    bank.status = data.bank?.status || next
    toast.success(data.msg || `Bank ${next === 'enable' ? 'enabled' : 'disabled'} successfully`)
  } catch (err) {
    toast.error(err.message || 'Failed to update bank status')
  } finally {
    updatingId.value = ''
  }
}

onMounted(() => fetchBanks(1))
</script>

<style scoped>
.page { display:flex; flex-direction:column; gap:16px; }
.page-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.page-head h1 { font-size: var(--text-h1); }
.page-head p { color: var(--color-text-secondary); font-size: var(--text-h4); margin-top:4px; }
.card { background: var(--color-bg); border:1px solid var(--color-border); border-radius: var(--radius-md); padding:16px; box-shadow: var(--shadow-subtle); }
.card.filters { padding:11px; }
.card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
.card-sub { color: var(--color-text-secondary); font-size: var(--text-body-l); }
.filters .filter-row { display:flex; flex-wrap:wrap; gap:8px; align-items:end; }
.filters .field { flex:1; min-width:112px; gap:4px; }
.filters .field-label { font-size:11px; }
.filters .input { padding:6px 10px; font-size:12px; }
.filters .btn { padding:6px 10px; font-size:12px; }
.filter-actions { display:flex; gap:6px; align-items:center; }
.error { color: var(--color-danger); font-size: var(--text-h4); margin-bottom:8px; }
.empty { color: var(--color-text-secondary); font-size: var(--text-h4); line-height:1.5; }
.table-wrap { overflow:auto; border:1px solid var(--color-border); border-radius: var(--radius-md); }
.table { width:100%; border-collapse:collapse; font-size: var(--text-h4); min-width:720px; }
.table th, .table td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--color-border); vertical-align:top; }
.table th { background: var(--color-surface-raised); font-weight:600; white-space:nowrap; }
.table td { background: var(--color-bg); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; }
.muted { color: var(--color-text-secondary); font-size:11px; }
.badge { display:inline-flex; padding:3px 8px; border-radius: var(--radius-round); font-size:11px; font-weight:600; text-transform:capitalize; }
.badge--success { background: var(--color-surface-raised); color: var(--color-success); border:1px solid var(--color-success); }
.badge--danger { background: #fef2f2; color: var(--color-danger); border:1px solid var(--color-danger); }
html[data-theme='dark'] .badge--danger { background: rgba(248,113,113,0.12); }
.row-actions { display:flex; gap:4px; flex-wrap:nowrap; white-space:nowrap; }
.pagination { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:12px; }
code { background: var(--color-surface-raised); padding:2px 6px; border-radius:4px; font-size:12px; }
@media (max-width: 880px) { .filters .field { min-width:84px; } }
</style>
