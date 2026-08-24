<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>Payin Config</h1>
        <p>Manage USDT deposit addresses (TRC20 / BEP20) and global exchange rate (amount × rate)</p>
      </div>
      <button class="btn btn-ghost btn-sm filter-toggle" type="button" @click="showFilters = !showFilters">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h10M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="12" r="2" stroke="currentColor" stroke-width="1.4"/></svg>
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <!-- Exchange Rate Card -->
    <div class="card">
      <div class="card-head">
        <div>
          <h3>Exchange Rate</h3>
          <span class="card-sub">Global USDT rate — applied to every channel (TRC20/BEP20). Payin credited = amount × rate.</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" type="button" :disabled="rateLoading" @click="fetchRates()">Refresh</button>
          <button class="btn btn-primary btn-sm" type="button" @click="openCreateRate">Set Rate</button>
        </div>
      </div>

      <div v-if="currentRate !== null" class="rate-hero">
        <span class="muted">Current effective</span>
        <span class="rate-value">₹ {{ currentRate }}</span>
        <span class="badge badge--success">USDT → INR</span>
        <span class="muted">global · network: null</span>
      </div>
      <p v-else-if="rateLoading" class="empty">Loading rate…</p>

      <p v-if="rateError" class="error" role="alert">{{ rateError }}</p>

      <div v-if="rates.length" class="table-wrap" style="margin-top:12px">
        <table class="table">
          <thead><tr><th>Currency</th><th>Rate</th><th>Label</th><th>Active</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="r in rates" :key="r._id">
              <td><span class="badge">{{ r.currency }}</span> <span class="muted">{{ r.network ?? 'global' }}</span></td>
              <td class="mono"><strong>{{ r.rate }}</strong></td>
              <td>{{ r.label || '—' }}</td>
              <td><span :class="['badge', r.isActive ? 'badge--success' : 'badge--danger']">{{ r.isActive ? 'active' : 'inactive' }}</span></td>
              <td class="muted">{{ fmtDate(r.updatedAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-sm action-btn" type="button" @click="openEditRate(r)">Edit</button>
                  <button class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="deletingRate === r._id" @click="removeRate(r)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!rateLoading && !rateError" class="empty" style="margin-top:10px">No exchange rate configured. Default fallback is 112. Click Set Rate to create.</p>
      <div v-if="rateTotalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="ratePage <= 1 || rateLoading" @click="fetchRates(ratePage - 1)">Prev</button>
        <span class="muted">Page {{ ratePage }} of {{ rateTotalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="ratePage >= rateTotalPages || rateLoading" @click="fetchRates(ratePage + 1)">Next</button>
      </div>
    </div>

    <!-- Filters for Addresses -->
    <div v-show="showFilters" class="card filters">
      <div class="filter-row">
        <div class="field">
          <label class="field-label" for="da-network">Network</label>
          <select id="da-network" v-model="filters.network" class="input">
            <option value="">All</option>
            <option value="TRC20">TRC20</option>
            <option value="BEP20">BEP20</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="da-active">Active</label>
          <select id="da-active" v-model="filters.isActive" class="input">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" type="button" :disabled="loading" @click="fetchAddresses(1)">Search</button>
          <button class="btn btn-ghost" type="button" @click="openCreate">Add Address</button>
          <button class="btn btn-ghost" type="button" :disabled="seeding" @click="seedDefaults">{{ seeding ? 'Seeding…' : 'Seed Defaults' }}</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Deposit Addresses ({{ total }})</h3>
        <span class="card-sub">Page {{ page }} / {{ totalPages || 1 }}</span>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!loading && addresses.length === 0 && !error" class="empty">No addresses. Create one or seed defaults.</p>
      <div v-if="addresses.length" class="table-wrap">
        <table class="table">
          <thead><tr><th>Network</th><th>Address</th><th>Label</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="a in addresses" :key="a._id">
              <td><span class="badge">{{ a.network }}</span> <span class="muted">{{ a.currency }}</span></td>
              <td class="mono break">{{ a.address }}</td>
              <td>{{ a.label || '—' }}</td>
              <td><span :class="['badge', a.isActive ? 'badge--success' : 'badge--danger']">{{ a.isActive ? 'active' : 'inactive' }}</span></td>
              <td>
                <div class="row-actions">
                  <button :class="['btn btn-sm action-btn', a.isActive ? 'action-btn--danger' : 'action-btn--success']" type="button" :disabled="toggling === a._id" @click="toggle(a)">{{ a.isActive ? 'Deactivate' : 'Activate' }}</button>
                  <button class="btn btn-sm action-btn" type="button" @click="openEdit(a)">Edit</button>
                  <button class="btn btn-sm action-btn action-btn--danger" type="button" :disabled="deleting === a._id" @click="remove(a)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page <= 1 || loading" @click="fetchAddresses(page - 1)">Prev</button>
        <span class="muted">Page {{ page }} of {{ totalPages }}</span>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="page >= totalPages || loading" @click="fetchAddresses(page + 1)">Next</button>
      </div>
    </div>

    <!-- Address Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editing?._id ? 'Edit Address' : 'Add Address' }}</h3>
        <form @submit.prevent="submit">
          <div class="field"><label class="field-label">Network</label>
            <select v-model="form.network" class="input"><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option></select>
          </div>
          <div class="field"><label class="field-label">Address</label><input v-model="form.address" class="input" placeholder="T... or 0x..." /></div>
          <div class="field"><label class="field-label">Label</label><input v-model="form.label" class="input" placeholder="Main TRC20" /></div>
          <div class="field"><label class="field-label">Currency</label><input v-model="form.currency" class="input" disabled /></div>
          <div class="field"><label class="field-label">Exchange Rate (optional)</label><input v-model="form.exchangeRate" class="input" type="number" step="0.01" min="0" placeholder="112 — upserts global rate" /></div>
          <div class="field checkbox"><label><input type="checkbox" v-model="form.isActive" /> Active (deactivates other for same network)</label></div>
          <p v-if="modalError" class="error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Rate Modal -->
    <div v-if="showRateModal" class="modal-backdrop" @click.self="closeRateModal">
      <div class="modal">
        <h3>{{ editingRate?._id ? 'Edit Exchange Rate' : 'Set Exchange Rate' }}</h3>
        <form @submit.prevent="submitRate">
          <div class="field"><label class="field-label">Currency</label><input v-model="rateForm.currency" class="input" disabled /></div>
          <div class="field"><label class="field-label">Rate (INR per USDT)</label><input v-model="rateForm.rate" class="input" type="number" step="0.01" min="0.01" placeholder="112" required /></div>
          <div class="field"><label class="field-label">Label</label><input v-model="rateForm.label" class="input" placeholder="global 115" /></div>
          <div class="field checkbox"><label><input type="checkbox" v-model="rateForm.isActive" /> Active (deactivates previous global)</label></div>
          <p class="muted" style="font-size:11px">Rate is global for all networks (TRC20/BEP20). Use same value everywhere. User GET /api/user/payin/exchange returns this instantly.</p>
          <p v-if="rateModalError" class="error">{{ rateModalError }}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" @click="closeRateModal">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="savingRate">{{ savingRate ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  getDepositAddresses, createDepositAddress, updateDepositAddress, toggleDepositAddress, deleteDepositAddress, seedDepositAddresses,
  getExchangeRates, getCurrentExchangeRate, upsertExchangeRate, updateExchangeRate, deleteExchangeRate,
} from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const showFilters = ref(true)

// — Exchange Rate state —
const rates = ref([])
const currentRate = ref(null)
const ratePage = ref(1)
const rateTotalPages = ref(1)
const rateTotal = ref(0)
const rateLoading = ref(false)
const rateError = ref('')
const deletingRate = ref('')
const showRateModal = ref(false)
const editingRate = ref(null)
const savingRate = ref(false)
const rateModalError = ref('')
const rateForm = reactive({ currency: 'USDT', rate: '', label: '', isActive: true })

function fmtDate(v) { if (!v) return '—'; try { return new Date(v).toLocaleString() } catch { return String(v) } }

async function fetchRates(p = 1) {
  rateLoading.value = true; rateError.value = ''; ratePage.value = p
  try {
    const [listData, curData] = await Promise.all([
      getExchangeRates({ page: ratePage.value, limit: 20 }),
      getCurrentExchangeRate({ currency: 'USDT' }).catch(() => null),
    ])
    rates.value = (listData.rates || []).map(r => ({ ...r, rate: r.rate != null ? Number(r.rate) : r.rate }))
    rateTotal.value = listData.count || 0
    rateTotalPages.value = listData.totalPages || 1
    if (curData && curData.rate != null) currentRate.value = Number(curData.rate)
    else if (rates.value.find(r => r.isActive)) currentRate.value = Number(rates.value.find(r => r.isActive).rate)
    else currentRate.value = null
  } catch (e) { rateError.value = e.message; toast.error(e.message) } finally { rateLoading.value = false }
}
function openCreateRate() {
  editingRate.value = null
  Object.assign(rateForm, { currency: 'USDT', rate: currentRate.value ? String(currentRate.value) : '112', label: '', isActive: true })
  rateModalError.value = ''; showRateModal.value = true
}
function openEditRate(r) {
  editingRate.value = r
  Object.assign(rateForm, { currency: r.currency || 'USDT', rate: String(r.rate ?? ''), label: r.label || '', isActive: r.isActive })
  rateModalError.value = ''; showRateModal.value = true
}
function closeRateModal() { showRateModal.value = false; editingRate.value = null }
async function submitRate() {
  savingRate.value = true; rateModalError.value = ''
  const parsed = Number(rateForm.rate)
  if (!isFinite(parsed) || parsed <= 0) { rateModalError.value = 'Rate must be > 0'; savingRate.value = false; return }
  const payload = { currency: 'USDT', rate: parsed, label: rateForm.label.trim(), isActive: rateForm.isActive }
  try {
    let data
    if (editingRate.value?._id) data = await updateExchangeRate(editingRate.value._id, payload)
    else data = await upsertExchangeRate(payload)
    toast.success(data.msg || 'Exchange rate saved')
    closeRateModal(); fetchRates(ratePage.value)
  } catch (e) { rateModalError.value = e.message; toast.error(e.message) } finally { savingRate.value = false }
}
async function removeRate(r) {
  if (!confirm(`Delete exchange rate ${r.currency} ${r.rate}?`)) return
  deletingRate.value = r._id
  try { const data = await deleteExchangeRate(r._id); toast.success(data.msg || 'Deleted'); fetchRates(ratePage.value) } catch (e) { toast.error(e.message) } finally { deletingRate.value = '' }
}

// — Deposit Addresses state —
const filters = reactive({ network: '', isActive: '' })
const addresses = ref([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const toggling = ref('')
const deleting = ref('')
const seeding = ref(false)

const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const modalError = ref('')
const form = reactive({ network: 'TRC20', address: '', label: '', currency: 'USDT', exchangeRate: '', isActive: true })

async function fetchAddresses(p = 1) {
  loading.value = true; error.value = ''; page.value = p
  try {
    const data = await getDepositAddresses({ network: filters.network || undefined, isActive: filters.isActive || undefined, page: page.value, limit: 20 })
    addresses.value = data.addresses || []; total.value = data.count || 0; totalPages.value = data.totalPages || 1
  } catch (e) { error.value = e.message; toast.error(e.message) } finally { loading.value = false }
}
function openCreate() { editing.value = null; Object.assign(form, { network: 'TRC20', address: '', label: '', currency: 'USDT', exchangeRate: '', isActive: true }); modalError.value=''; showModal.value=true }
function openEdit(a) { editing.value = a; Object.assign(form, { network: a.network, address: a.address, label: a.label || '', currency: a.currency || 'USDT', exchangeRate: '', isActive: a.isActive }); modalError.value=''; showModal.value=true }
function closeModal() { showModal.value=false; editing.value=null }
async function submit() {
  saving.value=true; modalError.value=''
  const payload = { network: form.network, address: form.address.trim(), label: form.label.trim(), currency: 'USDT', isActive: form.isActive }
  if (!payload.address) { modalError.value='Address required'; saving.value=false; return }
  if (form.exchangeRate !== '' && form.exchangeRate != null) {
    const pr = Number(form.exchangeRate)
    if (!isFinite(pr) || pr <= 0) { modalError.value='Invalid exchange rate'; saving.value=false; return }
    payload.exchangeRate = pr
  }
  try {
    if (editing.value?._id) {
      const data = await updateDepositAddress(editing.value._id, payload)
      toast.success(data.msg || 'Address updated')
    } else {
      const data = await createDepositAddress(payload)
      toast.success(data.msg || 'Address created')
    }
    closeModal(); fetchAddresses(page.value); if (payload.exchangeRate != null) fetchRates(ratePage.value)
  } catch (e) { modalError.value = e.message; toast.error(e.message) } finally { saving.value=false }
}
async function toggle(a) {
  toggling.value = a._id
  try { const data = await toggleDepositAddress(a._id, !a.isActive); a.isActive = data.address.isActive; toast.success(data.msg || (a.isActive ? 'Activated' : 'Deactivated')) } catch (e) { toast.error(e.message) } finally { toggling.value='' }
}
async function remove(a) {
  if (!confirm(`Delete ${a.network} ${a.address}?`)) return
  deleting.value = a._id
  try { const data = await deleteDepositAddress(a._id); toast.success(data.msg || 'Deleted'); fetchAddresses(page.value) } catch (e) { toast.error(e.message) } finally { deleting.value='' }
}
async function seedDefaults() {
  seeding.value = true
  try { const data = await seedDepositAddresses(); toast.success(data.msg || 'Seeded'); fetchAddresses(1) } catch (e) { toast.error(e.message) } finally { seeding.value = false }
}

onMounted(() => { fetchRates(1); fetchAddresses(1) })
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:16px} .page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px} .page-head h1{font-size:var(--text-h1)} .page-head p{color:var(--color-text-secondary);font-size:var(--text-h4);margin-top:4px} .filter-toggle{white-space:nowrap;flex-shrink:0;margin-top:2px}
.card{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;box-shadow:var(--shadow-subtle)}
.card.filters{padding:11px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap} .card-sub{color:var(--color-text-secondary);font-size:var(--text-body-l)}
.rate-hero{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:var(--radius-md)} .rate-value{font-size:18px;font-weight:700}
.filters .filter-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end} .filters .field{flex:1;min-width:112px;gap:4px} .filters .field-label{font-size:11px} .filters .input{padding:6px 10px;font-size:12px} .filters .btn{padding:6px 10px;font-size:12px} .filter-actions{display:flex;gap:6px;flex-wrap:wrap}
.error{color:var(--color-danger);font-size:var(--text-h4);margin-bottom:8px} .empty{color:var(--color-text-secondary);font-size:var(--text-h4)}
.table-wrap{overflow:auto;border:1px solid var(--color-border);border-radius:var(--radius-md)} .table{width:100%;border-collapse:collapse;font-size:var(--text-h4);min-width:760px}
.table th,.table td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);vertical-align:top} .table th{background:var(--color-surface-raised);font-weight:600}
.mono{font-family:ui-monospace,monospace;font-size:12px} .break{word-break:break-all} .muted{color:var(--color-text-secondary);font-size:11px}
.badge{display:inline-flex;padding:3px 8px;border-radius:var(--radius-round);font-size:11px;font-weight:600} .badge--success{background:var(--color-surface-raised);color:var(--color-success);border:1px solid var(--color-success)} .badge--danger{background:#fef2f2;color:var(--color-danger);border:1px solid var(--color-danger)}
html[data-theme='dark'] .badge--danger{background:rgba(248,113,113,.12)}
.row-actions{display:flex;gap:4px;flex-wrap:wrap} .btn-sm{padding:6px 10px;font-size:var(--text-body-l)} .action-btn{background:var(--color-surface-raised);border:1px solid var(--color-border);color:var(--color-text)} .action-btn:hover:not(:disabled){background:var(--color-bg);border-color:var(--color-secondary);color:var(--color-primary)} .action-btn--success{background:var(--color-success);border-color:var(--color-success);color:#fff} .action-btn--danger{background:var(--color-danger);border-color:var(--color-danger);color:#fff}
.pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:grid;place-items:center;z-index:50;padding:16px} .modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:20px;min-width:360px;max-width:480px;width:100%;display:flex;flex-direction:column;gap:12px}
.modal h3{font-size:var(--text-h2)} .modal form{display:flex;flex-direction:column;gap:12px} .checkbox label{display:flex;gap:8px;align-items:center;font-size:var(--text-h4)} .modal-actions{display:flex;justify-content:flex-end;gap:8px}
</style>
