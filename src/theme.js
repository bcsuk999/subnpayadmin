const THEME_KEY = 'sunpay_admin_theme'

const media = window.matchMedia('(prefers-color-scheme: dark)')

export function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'dark' || stored === 'light' ? stored : null
}

export function resolveTheme() {
  return getStoredTheme() ?? (media.matches ? 'dark' : 'light')
}

export function applyDocumentTheme(theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#111111' : '#324157')
}

export function setStoredTheme(theme) {
  if (theme === null) {
    localStorage.removeItem(THEME_KEY)
  } else {
    localStorage.setItem(THEME_KEY, theme)
  }
}

export function onSystemThemeChange(callback) {
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
