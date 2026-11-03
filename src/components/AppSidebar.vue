<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" aria-label="Main navigation">
    <div class="sidebar-brand">
      <span class="sidebar-logo">SunPay</span>
      <span class="sidebar-badge">Admin</span>
      <span class="sidebar-mark" aria-hidden="true">S</span>
    </div>

    <ul class="sidebar-el-menu el-menu" role="menubar">
      <li v-for="item in navItems" :key="item.to" role="none" class="el-menu-item-wrap">
        <RouterLink
          :to="item.to"
          role="menuitem"
          class="el-menu-item"
          :class="{ 'is-active': isActive(item) }"
          :title="collapsed ? item.label : null"
          :aria-label="collapsed ? item.label : null"
          @click="$emit('close')"
        >
          <i class="icon" v-html="item.icon"></i>
          <span class="el-menu-item__label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="sidebar-footer">
      <p>SunPay Admin Panel</p>
      <p class="sidebar-footer-sub">Manage users & transactions</p>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean,
})
defineEmits(['close', 'toggle-collapse'])

const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.6"/></svg>' },
  { label: 'Users', to: '/users', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 19a4 4 0 0 0-8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M19 19a5.5 5.5 0 0 0-2.2-4.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="18.5" cy="7.5" r="2.2" stroke="currentColor" stroke-width="1.3"/></svg>' },
  { label: 'Banks', to: '/banks', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6.5" width="19" height="11" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 9.5h19" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="14" r="1.4" fill="currentColor"/><path d="M11 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' },
  { label: 'Payin Config', to: '/payin-config', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.5l7 4v7l-7 4-7-4v-7l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12.5v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="12" cy="8.5" r="1.6" stroke="currentColor" stroke-width="1.3"/></svg>' },
  { label: 'Agents', to: '/agents', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M17 13.5l4 4-1.5 1.5M21 13.5l-4 4 1.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  { label: 'Payins', to: '/payins', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.2"/><circle cx="15.5" cy="12.5" r="1.2" fill="currentColor"/><path d="M7 15h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  { label: 'Transactions', to: '/transactions', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="6" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/><circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/><circle cx="9" cy="18" r="1.8" fill="currentColor" stroke="currentColor" stroke-width="1.2"/></svg>' },
  { label: 'Deposits', to: '/deposits', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M12 5l-5 5M12 5l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { label: 'Withdrawals', to: '/withdrawals', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M12 19l5-5M12 19l-5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 6.5V5A1.5 1.5 0 0 1 5.5 3.5h13A1.5 1.5 0 0 1 20 5v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  { label: 'Payouts', to: '/payouts', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h20" stroke="currentColor" stroke-width="1.3"/><path d="M6 12h4M6 15h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' },
  { label: 'Bot', to: '/bot', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="12" cy="3" r="1.2" fill="currentColor"/><circle cx="9" cy="13.5" r="1.3" fill="currentColor"/><circle cx="15" cy="13.5" r="1.3" fill="currentColor"/><path d="M9.5 16.5h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg>' },
]

function isActive(item) {
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}
</script>

<style scoped>
/* Shell */
.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: var(--layout-sidebar-width, 242px);
  height: 100%;
  overflow: hidden;
  z-index: 40;
  background-color: var(--theme-sidebar, #324157);
  border-right: 0.8px solid #e6e6e6;
  transition: width var(--motion-normal) ease;
}

.sidebar.collapsed {
  width: var(--layout-sidebar-collapsed-width, 64px);
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 50px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  color: #ffffff;
}

.sidebar-badge {
  margin-left: 8px;
  padding: 3px 8px;
  border-radius: var(--radius-round);
  background: rgba(235, 175, 91, 0.15);
  color: #ebaf5b;
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-mark {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(235, 175, 91, 0.15);
  color: #ebaf5b;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
}

/* Collapsed / minimized sidebar */
.sidebar.collapsed .sidebar-logo,
.sidebar.collapsed .sidebar-badge {
  display: none;
}

.sidebar.collapsed .sidebar-mark {
  display: inline-flex;
}

.sidebar.collapsed .sidebar-footer {
  display: none;
}

.sidebar.collapsed .sidebar-el-menu {
  width: var(--layout-sidebar-collapsed-width, 64px);
}

.sidebar.collapsed .el-menu-item {
  justify-content: center;
  padding: 0;
}

.sidebar.collapsed .el-menu-item .icon {
  margin-right: 0;
}

.sidebar.collapsed .el-menu-item__label {
  display: none;
}

/* Menu — the captured ul spec */
.sidebar-el-menu {
  position: relative;
  width: var(--layout-sidebar-width, 242px);
  flex: 1 1 auto;
  min-height: 0;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16.1px;
  text-align: left;
  color: #666666;
  background-color: var(--theme-sidebar, #324157);
  overflow: hidden auto;
  cursor: crosshair;
  transition: all;
}

.sidebar-el-menu::before,
.sidebar-el-menu::after {
  content: "";
  display: table;
  position: static;
  width: 0;
  height: 0;
  background-color: rgba(0, 0, 0, 0);
  color: rgb(102, 102, 102);
  font-size: 14px;
  font-weight: 400;
  border-radius: 0px;
  border: 0px none rgb(102, 102, 102);
  opacity: 1;
}

.el-menu-item-wrap {
  list-style: none;
}

/* Rows (reskinned original nav items) */
.sidebar-el-menu .el-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 56px;
  color: rgb(191, 203, 217);
  background-color: var(--theme-sidebar, #324157);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.sidebar-el-menu .el-menu-item:hover {
  background-color: #283441;
}

.sidebar-el-menu .el-menu-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.sidebar-el-menu .el-menu-item.is-active {
  color: rgb(235, 175, 91);
  background-color: var(--theme-sidebar, #324157);
}

.sidebar-el-menu .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  font-style: normal;
  color: inherit;
}

.sidebar-el-menu .icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.el-menu-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer */
.sidebar-footer {
  flex-shrink: 0;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: var(--text-body-l);
  color: rgb(191, 203, 217);
}

.sidebar-footer-sub {
  margin-top: 2px;
  opacity: 0.6;
}

@media (max-width: 880px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--layout-sidebar-width, 242px);
    transform: translateX(-100%);
    transition: transform var(--motion-normal) ease;
    box-shadow: var(--shadow-dropdown);
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    width: var(--layout-sidebar-width, 242px);
  }
}
</style>
