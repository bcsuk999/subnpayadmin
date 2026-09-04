<template>
  <header class="app-header">
    <div class="header-left">
      <button class="sidebar-toggle" type="button" :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="$emit('toggle-sidebar')">
        <svg class="hamburger" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <button class="sidebar-toggle hide-desktop" type="button" aria-label="Open menu" @click="$emit('toggle-mobile')">
        <svg class="hamburger" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="breadcrumb__item">
          <RouterLink to="/" class="breadcrumb__link">Home</RouterLink>
        </span>
        <span class="breadcrumb__separator" aria-hidden="true">/</span>
        <span class="breadcrumb__item">
          <span class="breadcrumb__text">{{ pageTitle }}</span>
        </span>
      </nav>
    </div>

    <div class="header-right">
      <ThemeToggle />
      <button class="btn-logout-header" type="button" @click="onLogout">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 17l4-5-4-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Logout</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import { clearSession, getStoredUser } from '../auth'
import { useToast } from '../composables/useToast.js'

defineProps({ collapsed: Boolean })
defineEmits(['toggle-sidebar', 'toggle-mobile'])

const route = useRoute()
const router = useRouter()
const toast = useToast()

const titleMap = {
  home: 'Dashboard',
  users: 'Users',
  banks: 'Banks',
  'payin-config': 'Payin Config',
  'deposit-addresses': 'Addresses',
  payins: 'Payins',
  transactions: 'Transactions',
  deposits: 'Deposits',
  withdrawals: 'Withdrawals',
  payouts: 'Payouts',
  login: 'Login',
}

const pageTitle = computed(() => titleMap[route.name] || 'Dashboard')

function onLogout() {
  clearSession()
  toast.info('Logged out')
  router.replace({ name: 'login' })
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  background: var(--color-header-bg);
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  color: #fff;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 30;
  overflow: hidden;
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  margin-right: 24px;
}

.sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 10px;
  cursor: pointer;
  background: transparent;
  border: none;
  color: #fff;
  transition: background 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sidebar-toggle:focus-visible {
  outline: 2px solid rgba(255,255,255,0.5);
  outline-offset: -2px;
}

.hamburger {
  display: inline-block;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  fill: #fff;
}

.breadcrumb {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-h4);
  line-height: 50px;
  margin-left: 10px;
  gap: 0;
}

.breadcrumb__item {
  display: inline-flex;
  align-items: center;
}

.breadcrumb__link {
  font-weight: 400;
  color: #d7d7d7;
  text-decoration: none;
}

.breadcrumb__link:hover {
  color: #fff;
}

.breadcrumb__text {
  color: #fff;
  cursor: text;
}

.breadcrumb__separator {
  margin: 0 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
}

.btn-logout-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  background: transparent;
  color: #fff;
  border: 1px solid #ef4444;
  border-radius: var(--radius-sm);
  font-size: var(--text-body-l);
  cursor: pointer;
  transition: all 200ms;
}

.btn-logout-header:hover {
  background: #ef4444;
  border-color: #ef4444;
}

.hide-desktop {
  display: none;
}

@media (max-width: 880px) {
  .hide-mobile {
    display: none;
  }
  .hide-desktop {
    display: inline-flex;
  }
  .breadcrumb {
    font-size: 12px;
  }
  .header-right {
    margin-right: 8px;
  }
}

@media (max-width: 600px) {
  .btn-logout-header span { display: none; }
  .btn-logout-header { gap: 0; }
  .breadcrumb__item:first-child { display: none; }
  .breadcrumb { margin-left: 4px; }
  .breadcrumb__separator { display: none; }
  .header-right {
    gap: 8px;
  }
}
</style>
