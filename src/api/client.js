import { clearSession, getToken } from '../auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://subnpaybackend.onrender.com'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers })
  } catch {
    throw new ApiError('Cannot reach the server. Please try again.', 0)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      clearSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new ApiError(data.error || data.msg || `Request failed (${res.status})`, res.status)
  }
  return data
}

export function adminLogin(mobile, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ mobile, password }),
  })
}

export function updateUserStatus(userid, status, remark) {
  return request(`/admin/users/${userid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, remark }),
  })
}

export function resetUserPassword(userid, newPassword) {
  return request(`/admin/users/${userid}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}

export function getAdminUsers(params = {}) {
  const qs = new URLSearchParams()
  if (params.uid) qs.set('uid', String(params.uid))
  if (params.mobile) qs.set('mobile', String(params.mobile))
  if (params.sortBalance) qs.set('sortBalance', params.sortBalance)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/users${suffix}`, { method: 'GET' })
}

export function getAdminBanks(params = {}) {
  const qs = new URLSearchParams()
  if (params.userid) qs.set('userid', String(params.userid))
  if (params.status) qs.set('status', params.status)
  if (params.bankName) qs.set('bankName', params.bankName)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/banks${suffix}`, { method: 'GET' })
}

export function updateAdminBankStatus(bankId, status) {
  return request(`/admin/banks/${bankId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// —— Deposit Addresses (admin) ——
export function getDepositAddresses(params = {}) {
  const qs = new URLSearchParams()
  if (params.network) qs.set('network', params.network)
  if (params.isActive !== undefined && params.isActive !== '') qs.set('isActive', String(params.isActive))
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/deposit-addresses${suffix}`, { method: 'GET' })
}
export function createDepositAddress(data) {
  return request('/admin/deposit-addresses', { method: 'POST', body: JSON.stringify(data) })
}
export function updateDepositAddress(id, data) {
  return request(`/admin/deposit-addresses/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}
export function toggleDepositAddress(id, isActive) {
  return request(`/admin/deposit-addresses/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
}
export function deleteDepositAddress(id) {
  return request(`/admin/deposit-addresses/${id}`, { method: 'DELETE' })
}
export function seedDepositAddresses() {
  return request('/admin/deposit-addresses/seed', { method: 'POST' })
}

// —— Exchange Rates (admin) ——
export function getExchangeRates(params = {}) {
  const qs = new URLSearchParams()
  if (params.currency) qs.set('currency', params.currency)
  if (params.isActive !== undefined && params.isActive !== '') qs.set('isActive', String(params.isActive))
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/exchange-rates${suffix}`, { method: 'GET' })
}
export function getCurrentExchangeRate(params = {}) {
  const qs = new URLSearchParams()
  if (params.currency) qs.set('currency', params.currency)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/exchange-rates/current${suffix}`, { method: 'GET' })
}
export function upsertExchangeRate(data) {
  return request('/admin/exchange-rates', { method: 'POST', body: JSON.stringify(data) })
}
export function updateExchangeRate(id, data) {
  return request(`/admin/exchange-rates/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}
export function deleteExchangeRate(id) {
  return request(`/admin/exchange-rates/${id}`, { method: 'DELETE' })
}

// —— Bonus Config (admin) ——
export function getBonusConfig() {
  return request('/admin/bonus-config', { method: 'GET' })
}
export function updateBonusConfig(data) {
  return request('/admin/bonus-config', { method: 'POST', body: JSON.stringify(data) })
}

// —— Commission / Referrals (admin) ——
export function getCommissionConfig() {
  return request('/admin/commission-config', { method: 'GET' })
}
export function updateCommissionConfig(data) {
  return request('/admin/commission-config', { method: 'POST', body: JSON.stringify(data) })
}
export function getReferralStats() {
  return request('/admin/referral-stats', { method: 'GET' })
}
export function getAdminCommissions(params = {}) {
  const qs = new URLSearchParams()
  if (params.userid) qs.set('userid', String(params.userid))
  if (params.status) qs.set('status', params.status)
  if (params.currency) qs.set('currency', params.currency)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/commissions${suffix}`, { method: 'GET' })
}

// —— Payins / Transactions (admin) ——
export function getAdminPayins(params = {}) {
  const qs = new URLSearchParams()
  if (params.userid) qs.set('userid', String(params.userid))
  if (params.status) qs.set('status', params.status)
  if (params.network) qs.set('network', params.network)
  if (params.payinId) qs.set('payinId', params.payinId)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/payins${suffix}`, { method: 'GET' })
}
export function getAdminTransactions(params = {}) {
  const qs = new URLSearchParams()
  if (params.userid) qs.set('userid', String(params.userid))
  if (params.trnId) qs.set('trnId', params.trnId)
  if (params.status) qs.set('status', params.status)
  if (params.type) qs.set('type', params.type)
  if (params.note) qs.set('note', params.note)
  if (params.network) qs.set('network', params.network)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/transactions${suffix}`, { method: 'GET' })
}
export function getAdminTransaction(trnId) {
  return request(`/admin/transactions/${trnId}`, { method: 'GET' })
}
export function approveTransaction(payinId, data = {}) {
  return request(`/admin/payins/${payinId}/approve`, { method: 'POST', body: JSON.stringify(data) })
}
export function rejectTransaction(payinId, data = {}) {
  return request(`/admin/payins/${payinId}/reject`, { method: 'POST', body: JSON.stringify(data) })
}
export function reverseTransaction(trnId, data = {}) {
  return request(`/admin/transactions/${trnId}/reverse`, { method: 'POST', body: JSON.stringify(data) })
}

// —— Payouts (admin) ——
export function getPayoutUsers(params = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/payout-users${suffix}`, { method: 'GET' })
}
export function createPayout(data) {
  return request('/admin/payout', { method: 'POST', body: JSON.stringify(data) })
}
export function getAdminPayouts(params = {}) {
  const qs = new URLSearchParams()
  if (params.userid) qs.set('userid', String(params.userid))
  if (params.status) qs.set('status', params.status)
  if (params.payoutId) qs.set('payoutId', params.payoutId)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request(`/admin/payouts${suffix}`, { method: 'GET' })
}
export function approvePayout(payoutId, data = {}) {
  return request(`/admin/payouts/${payoutId}/approve`, { method: 'POST', body: JSON.stringify(data) })
}
export function rejectPayout(payoutId, data = {}) {
  return request(`/admin/payouts/${payoutId}/reject`, { method: 'POST', body: JSON.stringify(data) })
}
