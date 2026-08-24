<template>
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn hide-desktop" type="button" aria-label="Open menu" @click="$emit('toggle-mobile')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <button class="icon-btn hide-mobile" type="button" :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click="$emit('toggle-sidebar')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      </button>
      <div class="header-title">
        <h2 class="header-heading">{{ pageTitle }}</h2>
        <p v-if="userLabel" class="header-sub">{{ userLabel }}</p>
      </div>
    </div>

    <div class="header-right">
      <ThemeToggle />
      <div class="header-divider" aria-hidden="true"></div>
      <button class="btn btn-ghost header-logout" type="button" @click="onLogout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 17l4-5-4-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Logout</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  'deposit-addresses': 'Addresses',
  payins: 'Payins',
  transactions: 'Transactions',
  deposits: 'Deposits',
  withdrawals: 'Withdrawals',
  login: 'Login',
}

const pageTitle = computed(() => titleMap[route.name] || 'Dashboard')
const userLabel = computed(() => {
  const u = getStoredUser()
  return u?.mobile ? `Admin • ${u.mobile}` : ''
})

function onLogout() {
  clearSession()
  toast.info('Logged out')
  router.replace({ name: 'login' })
}
</script>

<style scoped>
.app-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: sticky;
  top: 0;
  z-index: 30;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.header-title {
  min-width: 0;
}
.header-heading {
  font-size: var(--text-h2);
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.header-sub {
  font-size: var(--text-body-l);
  color: var(--color-text-secondary);
  line-height: 1;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.header-divider {
  width: 1px;
  height: 22px;
  background: var(--color-border);
  margin: 0 2px;
}
.header-logout {
  gap: 6px;
  padding: 7px 10px;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.icon-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
.hide-desktop {
  display: none;
}
@media (max-width: 880px) {
  .hide-mobile {
    display: none;
  }
  .hide-desktop {
    display: grid;
  }
  .header-heading {
    font-size: var(--text-h3);
  }
}
</style>
