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
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  }
  return data
}

export function adminLogin(mobile, password) {
  return request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ mobile, password }),
  })
}

export function updateUserStatus(userid, status) {
  return request(`/admin/users/${userid}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
