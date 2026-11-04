<template>
  <section class="page">
    <FilterCard v-model="showFilters" title="Bank filters">
      <div class="filter-row">
        <div class="field">
          <label class="field-label" for="f-userid">User ID</label>
          <input id="f-userid" v-model="filters.userid" class="input" type="text" placeholder="Please enter UID to search" @keyup.enter="fetchBanks" />
        </div>
        <div class="field">
          <label class="field-label" for="f-bankName">Bank Name</label>
          <input id="f-bankName" v-model="filters.bankName" class="input" type="text" placeholder="Please enter bank name to search" @keyup.enter="fetchBanks" />
        </div>
        <div class="field">
          <label class="field-label" for="f-status">Status</label>
          <SelectDropdown id="f-status" v-model="filters.status" class="filter-select" :options="[{ value: '', label: 'All' }, { value: 'enable', label: 'Enable' }, { value: 'disable', label: 'Disable' }]" aria-label="Status" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" type="button" :disabled="loading" @click="fetchBanks">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span>{{ loading ? 'Loading…' : 'Search' }}</span>
          </button>
          <button class="btn btn-ghost" type="button" :disabled="loading" @click="resetFilters">Reset</button>
        </div>
      </div>
    </FilterCard>

    <TableCard>
      <TableCardHeading :title="`Banks (${total})`">
        <template #subtitle>Page {{ page }} / {{ totalPages || 1 }}</template>
      </TableCardHeading>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && banks.length === 0 && !error" class="empty">No banks found. Adjust filters or check backend <code>GET /api/admin/banks</code>.</p>

      <DataTable v-if="banks.length">
          <thead><tr><th>Bank</th><th>Holder</th><th>Account No.</th><th>IFSC</th><th>User ID</th><th>Status</th><th>Action</th></tr></thead>
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
      </DataTable>

      <TableFooter :page="page" :total-pages="totalPages" :total="total" :page-size="pageSize" :disabled="loading" @change="goPage" @size-change="setPageSize" />
    </TableCard>
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
const pageSize = ref(10)
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
      limit: pageSize.value,
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

function setPageSize(size) {
  pageSize.value = size
  fetchBanks(1)
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
.card { background: var(--color-bg); border:1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--spacing-4); box-shadow: var(--shadow-card); }
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
.badge{display:inline-flex;padding:4px 9px;font-size:12px;font-weight:600;border-radius:3px;white-space:nowrap} .badge--success{background:var(--color-success);color:#fff} .badge--danger{background:var(--color-danger);color:#fff}
.row-actions { display:flex; gap:4px; flex-wrap:nowrap; white-space:nowrap; }
.pagination { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:12px; }
code { background: var(--color-surface-raised); padding:2px 6px; border-radius:4px; font-size:12px; }
@media (max-width: 880px) { .filters .field { min-width:84px; } }
</style>
