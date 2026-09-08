<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1>Payin Config</h1>
      </div>
    </div>

    <div class="tabs">
      <button :class="['tab', { 'tab--active': activeTab === 'usdt' }]" type="button" @click="activeTab = 'usdt'">USDT</button>
      <button :class="['tab', { 'tab--active': activeTab === 'inr' }]" type="button" @click="activeTab = 'inr'">INR</button>
      <button :class="['tab', { 'tab--active': activeTab === 'agents' }]" type="button" @click="activeTab = 'agents'">Agents</button>
    </div>

    <!-- USDT Tab -->
    <div v-show="activeTab === 'usdt'" class="tab-panel">

      <!-- Exchange Rate -->
      <div class="card">
        <div class="card-head">
          <div>
            <h3>USDT Exchange Rate</h3>
            <span class="card-sub">Single rate shared by all USDT addresses. Credited = amount × rate. Fallback ₹ 1.</span>
          </div>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" type="button" :disabled="rateLoading" @click="fetchRates">Refresh</button>
            <button class="btn btn-primary btn-sm" type="button" @click="openCreateRate">Set Rate</button>
          </div>
        </div>

        <div class="rate-hero">
          <span class="muted">Current rate</span>
          <span class="rate-value">₹ {{ currentRate ?? 1 }}</span>
          <span class="badge badge--success">USDT → INR</span>
        </div>
        <p v-if="rateLoading" class="empty">Loading…</p>
        <p v-if="rateError" class="error" role="alert">{{ rateError }}</p>

        <div v-if="rates.length" class="table-wrap" style="margin-top:12px">
          <table class="table">
            <thead><tr><th>Currency</th><th>Rate</th><th>Label</th><th>Active</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="r in rates" :key="r._id">
                <td><span class="badge">{{ r.currency }}</span></td>
                <td class="mono"><strong>₹ {{ r.rate }}</strong></td>
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
        <p v-else-if="!rateLoading && !rateError" class="empty" style="margin-top:10px">No rate set yet. Default fallback is ₹ 1. Click Set Rate to create.</p>
      </div>

      <!-- Deposit Addresses -->
      <div class="card">
        <div class="card-head">
          <div>
            <h3>Deposit Addresses ({{ total }})</h3>
            <span class="card-sub">Active address per network is used when users deposit.</span>
          </div>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" type="button" :disabled="seeding" @click="seedDefaults">{{ seeding ? 'Seeding…' : 'Seed Defaults' }}</button>
            <button class="btn btn-primary btn-sm" type="button" @click="openCreate">Add Address</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="field">
            <label class="field-label">Network</label>
            <select v-model="filters.network" class="input">
              <option value="">All</option>
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Active</label>
            <select v-model="filters.isActive" class="input">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" type="button" :disabled="loading" @click="fetchAddresses(1)">Search</button>
          </div>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="!loading && addresses.length === 0 && !error" class="empty">No addresses. Add one or seed defaults.</p>
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
    </div>

    <!-- INR Tab -->
    <div v-show="activeTab === 'inr'" class="tab-panel">
      <div class="card">
        <div class="card-head">
          <div>
            <h3>INR Bonus Config</h3>
            <span class="card-sub">Every INR payin gets bonus = amount × bonusPercentage / 100 + bonusFlat.</span>
          </div>
          <span :class="['badge', bonusForm.isActive ? 'badge--success' : 'badge--danger']">{{ bonusForm.isActive ? 'bonus active' : 'bonus inactive' }}</span>
        </div>
        <p v-if="bonusError" class="error" role="alert">{{ bonusError }}</p>
        <p v-if="bonusLoading" class="empty">Loading…</p>
        <form v-else @submit.prevent="saveBonus">
          <div class="field"><label class="field-label">Bonus (%)</label><input v-model="bonusForm.bonusPercentage" class="input" type="number" step="0.1" min="0" placeholder="5.2" /></div>
          <div class="field"><label class="field-label">Flat Bonus (₹)</label><input v-model="bonusForm.bonusFlat" class="input" type="number" step="0.1" min="0" placeholder="6" /></div>
          <div class="field checkbox"><label><input type="checkbox" v-model="bonusForm.isActive" /> Bonus active</label></div>
          <div class="row-actions">
            <button class="btn btn-primary" type="submit" :disabled="bonusSaving">{{ bonusSaving ? 'Saving…' : 'Save' }}</button>
          </div>
          <p v-if="bonusMessage" class="muted">{{ bonusMessage }}</p>
        </form>
      </div>
    </div>

    <!-- Agents Tab -->
    <div v-show="activeTab === 'agents'" class="tab-panel">
      <div class="tabs">
        <button :class="['tab', { 'tab--active': agentSubTab === 'config' }]" type="button" @click="agentSubTab = 'config'">Config</button>
        <button :class="['tab', { 'tab--active': agentSubTab === 'stats' }]" type="button" @click="agentSubTab = 'stats'">Stats</button>
      </div>

      <div v-show="agentSubTab === 'config'">
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

      <div v-show="agentSubTab === 'stats'">
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
          <div class="field"><label class="field-label">Rate (INR per USDT)</label><input v-model="rateForm.rate" class="input" type="number" step="0.01" min="0.01" placeholder="90" required /></div>
          <div class="field"><label class="field-label">Label</label><input v-model="rateForm.label" class="input" placeholder="USDT rate" /></div>
          <div class="field checkbox"><label><input type="checkbox" v-model="rateForm.isActive" /> Active</label></div>
          <p class="muted" style="font-size:11px">Rate applies to all USDT deposit addresses. Fallback is ₹ 1.</p>
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
  getBonusConfig, updateBonusConfig,
  getCommissionConfig, updateCommissionConfig, getAdminCommissions, getReferralStats,
} from '../api/client.js'
import { useToast } from '../composables/useToast.js'

const toast = useToast()
const activeTab = ref('usdt')
const agentSubTab = ref('config')

// — USDT Exchange Rate state —
const rates = ref([])
const currentRate = ref(null)
const rateLoading = ref(false)
const rateError = ref('')
const deletingRate = ref('')
const showRateModal = ref(false)
const editingRate = ref(null)
const savingRate = ref(false)
const rateModalError = ref('')
const rateForm = reactive({ currency: 'USDT', rate: '', label: '', isActive: true })

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
const form = reactive({ network: 'TRC20', address: '', label: '', currency: 'USDT', isActive: true })

// — INR Bonus Config state —
const bonusForm = reactive({ bonusPercentage: 0, bonusFlat: 0, isActive: true })
const bonusLoading = ref(false)
const bonusSaving = ref(false)
const bonusError = ref('')
const bonusMessage = ref('')

// — Agents: Commission Config state —
const commissionForm = reactive({ commissionPercentage: 0, isActive: true })
const commissionLoading = ref(false)
const commissionSaving = ref(false)
const commissionError = ref('')
const commissionMessage = ref('')

// — Agents: Referral Stats state —
const stats = ref({})
const statsLoading = ref(false)
const statsError = ref('')

// — Agents: Commissions list state —
const commFilters = reactive({ status: '', currency: '', userid: '' })
const commissions = ref([])
const commTotal = ref(0)
const commPage = ref(1)
const commTotalPages = ref(1)
const commLoading = ref(false)
const commError = ref('')

function fmtDate(v) { if (!v) return '—'; try { return new Date(v).toLocaleString() } catch { return String(v) } }

async function fetchRates() {
  rateLoading.value = true; rateError.value = ''
  try {
    const [listData, curData] = await Promise.all([
      getExchangeRates({ currency: 'USDT', page: 1, limit: 20 }),
      getCurrentExchangeRate({ currency: 'USDT' }).catch(() => null),
    ])
    rates.value = (listData.rates || []).map(r => ({ ...r, rate: r.rate != null ? Number(r.rate) : r.rate }))
    if (curData && curData.rate != null) currentRate.value = Number(curData.rate)
    else currentRate.value = null
  } catch (e) { rateError.value = e.message; toast.error(e.message) } finally { rateLoading.value = false }
}
function openCreateRate() {
  editingRate.value = null
  Object.assign(rateForm, { currency: 'USDT', rate: currentRate.value != null ? String(currentRate.value) : '90', label: '', isActive: true })
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
    closeRateModal(); fetchRates()
  } catch (e) { rateModalError.value = e.message; toast.error(e.message) } finally { savingRate.value = false }
}
async function removeRate(r) {
  if (!confirm(`Delete USDT rate ₹ ${r.rate}?`)) return
  deletingRate.value = r._id
  try { const data = await deleteExchangeRate(r._id); toast.success(data.msg || 'Deleted'); fetchRates() } catch (e) { toast.error(e.message) } finally { deletingRate.value = '' }
}

async function fetchAddresses(p = 1) {
  loading.value = true; error.value = ''; page.value = p
  try {
    const data = await getDepositAddresses({ network: filters.network || undefined, isActive: filters.isActive || undefined, page: page.value, limit: 20 })
    addresses.value = data.addresses || []; total.value = data.count || 0; totalPages.value = data.totalPages || 1
  } catch (e) { error.value = e.message; toast.error(e.message) } finally { loading.value = false }
}
function openCreate() { editing.value = null; Object.assign(form, { network: 'TRC20', address: '', label: '', currency: 'USDT', isActive: true }); modalError.value = ''; showModal.value = true }
function openEdit(a) { editing.value = a; Object.assign(form, { network: a.network, address: a.address, label: a.label || '', currency: a.currency || 'USDT', isActive: a.isActive }); modalError.value = ''; showModal.value = true }
function closeModal() { showModal.value = false; editing.value = null }
async function submit() {
  saving.value = true; modalError.value = ''
  const payload = { network: form.network, address: form.address.trim(), label: form.label.trim(), currency: 'USDT', isActive: form.isActive }
  if (!payload.address) { modalError.value = 'Address required'; saving.value = false; return }
  try {
    if (editing.value?._id) {
      const data = await updateDepositAddress(editing.value._id, payload)
      toast.success(data.msg || 'Address updated')
    } else {
      const data = await createDepositAddress(payload)
      toast.success(data.msg || 'Address created')
    }
    closeModal(); fetchAddresses(page.value)
  } catch (e) { modalError.value = e.message; toast.error(e.message) } finally { saving.value = false }
}
async function toggle(a) {
  toggling.value = a._id
  try { const data = await toggleDepositAddress(a._id, !a.isActive); a.isActive = data.address.isActive; toast.success(data.msg || (a.isActive ? 'Activated' : 'Deactivated')) } catch (e) { toast.error(e.message) } finally { toggling.value = '' }
}
async function remove(a) {
  if (!confirm(`Delete ${a.network} ${a.address}?`)) return
  deleting.value = a._id
  try { const data = await deleteDepositAddress(a._id); toast.success(data.msg || 'Deleted'); fetchAddresses(page.value) } catch (e) { toast.error(e.message) } finally { deleting.value = '' }
}
async function seedDefaults() {
  seeding.value = true
  try { const data = await seedDepositAddresses(); toast.success(data.msg || 'Seeded'); fetchAddresses(1) } catch (e) { toast.error(e.message) } finally { seeding.value = false }
}

async function fetchBonus() {
  bonusLoading.value = true; bonusError.value = ''
  try {
    const data = await getBonusConfig()
    const c = data.config || {}
    Object.assign(bonusForm, { bonusPercentage: c.bonusPercentage != null ? Number(c.bonusPercentage) : 0, bonusFlat: c.bonusFlat != null ? Number(c.bonusFlat) : 0, isActive: c.isActive !== false })
    bonusMessage.value = ''
  } catch (e) { bonusError.value = e.message } finally { bonusLoading.value = false }
}
async function saveBonus() {
  bonusSaving.value = true; bonusError.value = ''; bonusMessage.value = ''
  const p = Number(bonusForm.bonusPercentage)
  const f = Number(bonusForm.bonusFlat)
  if (!isFinite(p) || p < 0) { bonusError.value = 'Invalid bonus percentage'; bonusSaving.value = false; return }
  if (!isFinite(f) || f < 0) { bonusError.value = 'Invalid flat bonus'; bonusSaving.value = false; return }
  try {
    const data = await updateBonusConfig({ bonusPercentage: p, bonusFlat: f, isActive: bonusForm.isActive })
    const c = data.config || {}
    Object.assign(bonusForm, { bonusPercentage: c.bonusPercentage != null ? Number(c.bonusPercentage) : p, bonusFlat: c.bonusFlat != null ? Number(c.bonusFlat) : f, isActive: c.isActive !== undefined ? c.isActive : bonusForm.isActive })
    toast.success(data.msg || 'Bonus config updated')
    bonusMessage.value = `Bonus = amount × ${bonusForm.bonusPercentage}% + ₹ ${bonusForm.bonusFlat}`
  } catch (e) { bonusError.value = e.message; toast.error(e.message) } finally { bonusSaving.value = false }
}

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

onMounted(() => { fetchRates(); fetchAddresses(1); fetchBonus(); fetchCommission(); fetchStats(); fetchCommissions(1) })
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
.rate-hero{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:var(--radius-md)} .rate-value{font-size:20px;font-weight:700}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px} .stat{display:flex;flex-direction:column;gap:4px;padding:14px;background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:var(--radius-md)} .stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--color-text-secondary)} .stat-value{font-size:22px;font-weight:700}
.field{display:flex;flex-direction:column;gap:6px} .field-label{font-size:12px;font-weight:600;color:var(--color-text-secondary);margin-bottom:0} .field .input{padding:8px 10px;font-size:13px}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);display:grid;place-items:center;z-index:50;padding:16px} .modal{background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:20px;min-width:360px;max-width:480px;width:100%;display:flex;flex-direction:column;gap:12px}
.modal h3{font-size:var(--text-h2)} .modal form{display:flex;flex-direction:column;gap:12px} .checkbox label{display:flex;gap:8px;align-items:center;font-size:var(--text-h4)} .modal-actions{display:flex;justify-content:flex-end;gap:8px}
</style>