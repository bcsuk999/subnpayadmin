<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" aria-label="Main navigation">
    <div class="sidebar-head">
      <div class="sidebar-brand">
        <span class="sidebar-logo">SunPay</span>
        <span class="sidebar-badge">Admin</span>
      </div>
      <button v-if="!collapsed" class="sidebar-collapse-btn" type="button" aria-label="Collapse sidebar" @click="$emit('toggle-collapse')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-item--active"
        @click="$emit('close')"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div v-if="!collapsed" class="sidebar-foot">
      <p class="sidebar-foot-title">SunPay Admin Panel</p>
      <p class="sidebar-foot-sub">Manage users & transactions</p>
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
  { label: 'Dashboard', to: '/', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/></svg>' },
  { label: 'Users', to: '/users', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 19a4 4 0 0 0-8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M19 19a5.5 5.5 0 0 0-2.2-4.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="18.5" cy="7.5" r="2.2" stroke="currentColor" stroke-width="1.3"/></svg>' },
  { label: 'Deposits', to: '/deposits', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M12 5l-5 5M12 5l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { label: 'Withdrawals', to: '/withdrawals', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 19l5-5M12 19l-5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 6.5V5A1.5 1.5 0 0 1 5.5 3.5h13A1.5 1.5 0 0 1 20 5v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
]
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  transition: width var(--duration-normal) ease, min-width var(--duration-normal) ease;
  z-index: 40;
}
.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}
.sidebar-head {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border);
  gap: 8px;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}
.sidebar-logo {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}
.sidebar.collapsed .sidebar-logo {
  font-size: 14px;
}
.sidebar-badge {
  background: var(--color-surface-raised);
  color: var(--color-primary);
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-round);
  white-space: nowrap;
}
.sidebar.collapsed .sidebar-badge {
  display: none;
}
.sidebar-collapse-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
}
.sidebar-collapse-btn:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-h4);
  font-weight: 500;
  text-decoration: none;
  transition: background var(--duration-instant) ease, color var(--duration-instant) ease;
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
.nav-item--active {
  background: var(--color-surface-raised);
  color: var(--color-primary);
}
.nav-icon {
  display: inline-flex;
  flex-shrink: 0;
}
.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-foot {
  padding: 12px 14px;
  border-top: 1px solid var(--color-border);
}
.sidebar-foot-title {
  font-size: var(--text-body-l);
  font-weight: 600;
}
.sidebar-foot-sub {
  font-size: var(--text-body-l);
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.sidebar.collapsed .sidebar-foot {
  display: none;
}

/* mobile */
@media (max-width: 880px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform var(--duration-normal) ease;
    box-shadow: var(--shadow-dropdown);
    width: 260px;
    min-width: 260px;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    width: 260px;
    min-width: 260px;
  }
  .sidebar.collapsed .sidebar-badge,
  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .sidebar-foot {
    display: block;
  }
}
</style>
