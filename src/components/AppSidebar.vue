<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" aria-label="Main navigation">
    <div class="sidebar-brand">
      <span class="sidebar-logo">SunPay</span>
      <span class="sidebar-badge">Admin</span>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="active"
        @click="$emit('close')"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <p>SunPay Admin Panel</p>
      <p class="sidebar-footer-sub">Manage users & transactions</p>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean,
})
defineEmits(['close', 'toggle-collapse'])

const navItems = [
  { label: 'Dashboard', to: '/', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/></svg>' },
  { label: 'Users', to: '/users', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 19a4 4 0 0 0-8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M19 19a5.5 5.5 0 0 0-2.2-4.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="18.5" cy="7.5" r="2.2" stroke="currentColor" stroke-width="1.3"/></svg>' },
  { label: 'Banks', to: '/banks', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6.5" width="19" height="11" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9.5h19" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="14" r="1.4" fill="currentColor"/><path d="M11 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' },
  { label: 'Payin Config', to: '/payin-config', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.5l7 4v7l-7 4-7-4v-7l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12.5v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="8.5" r="1.6" stroke="currentColor" stroke-width="1.3"/></svg>' },
  { label: 'Payins', to: '/payins', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.2"/><circle cx="15.5" cy="12.5" r="1.2" fill="currentColor"/><path d="M7 15h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  { label: 'Transactions', to: '/transactions', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="6" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/><circle cx="9" cy="18" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/></svg>' },
  { label: 'Deposits', to: '/deposits', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M12 5l-5 5M12 5l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { label: 'Withdrawals', to: '/withdrawals', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 19l5-5M12 19l-5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 6.5V5A1.5 1.5 0 0 1 5.5 3.5h13A1.5 1.5 0 0 1 20 5v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { label: 'Payouts', to: '/payouts', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h20" stroke="currentColor" stroke-width="1.3"/><path d="M6 12h4M6 15h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
]
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-sidebar-bg);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  transition: width var(--motion-normal) ease, padding var(--motion-normal) ease, border var(--motion-normal) ease;
  z-index: 40;
  border-right: 1px solid var(--color-sidebar-border);
}

.sidebar.collapsed {
  width: 0;
  padding: 0;
  border: none;
  overflow: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--color-sidebar-border);
  color: var(--color-sidebar-brand);
}

.sidebar-logo {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--color-sidebar-brand);
}

.sidebar-badge {
  background: rgba(32, 143, 255, 0.15);
  color: var(--color-primary);
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-round);
  white-space: nowrap;
  margin-left: 8px;
}

.sidebar-nav {
  padding: 6px 0;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  font-size: 16px;
  color: var(--color-text);
  text-decoration: none;
  cursor: pointer;
  transition: background 200ms, color 200ms;
  border-left: 3px solid transparent;
  font-family: var(--font-body);
}

.nav-item:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-primary);
}

.nav-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-sidebar-active);
  border-left-color: var(--color-primary);
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.8;
  display: inline-flex;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-item svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 12px 15px;
  border-top: 1px solid var(--color-sidebar-border);
  font-size: var(--text-h4);
  color: var(--color-text-secondary);
}

.sidebar-footer-sub {
  opacity: 0.6;
  margin-top: 2px;
  font-size: var(--text-body-l);
}

@media (min-width: 769px) {
  .sidebar {
    width: 0;
    padding: 0;
    border: none;
    overflow: hidden;
    transition: width var(--motion-normal) ease, padding var(--motion-normal) ease, border var(--motion-normal) ease;
  }
  .sidebar:not(.collapsed) {
    width: 220px;
    padding: 0;
    border: none;
    overflow: visible;
  }
}

@media (max-width: 880px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 220px;
    min-width: 220px;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform var(--motion-normal) ease;
    box-shadow: var(--shadow-dropdown);
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    width: 220px;
    min-width: 220px;
  }
}
</style>
