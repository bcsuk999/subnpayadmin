<template>
  <aside :class="['sidebar', { collapsed, 'mobile-open': mobileOpen }]" aria-label="Main navigation">
    <div class="sidebar-brand">
      <span class="sidebar-logo">SunPay</span>
      <span class="sidebar-badge">Admin</span>
      <span class="sidebar-mark" aria-hidden="true">S</span>
    </div>

    <ul class="sidebar-el-menu el-menu" :class="{ 'el-menu--collapse': collapsed }" role="menubar">
      <template v-for="item in navItems" :key="item.key">
        <li
          v-if="item.children"
          role="menuitem"
          aria-haspopup="true"
          class="el-submenu"
          :class="{ 'is-active': isItemActive(item) }"
          :tabindex="collapsed ? 0 : -1"
          :aria-expanded="openSubmenuKey === item.key"
          :aria-controls="openSubmenuKey === item.key ? 'sidebar-submenu' : null"
          @mouseenter="openSubmenu(item, $event)"
          @mouseleave="scheduleClose()"
          @focus="openSubmenu(item, $event)"
          @blur="scheduleClose()"
          @keydown="onTriggerKeydown($event, item)"
        >
          <div class="el-submenu__title" @click="onSubmenuTitleClick(item, $event)">
            <i class="icon" :class="item.iconClass" aria-hidden="true"></i>
            <span class="el-menu-item__label">{{ item.label }}</span>
            <svg
              class="el-submenu__icon-arrow el-menu-item__arrow"
              :class="{ 'is-open': openSubmenuKey === item.key }"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </li>
        <li
          v-else
          role="menuitem"
          class="el-menu-item"
          :class="{ 'is-active': isItemActive(item) }"
          :tabindex="collapsed ? 0 : -1"
          @click="goTo(item)"
          @keydown.enter.prevent="goTo(item)"
          @keydown.space.prevent="goTo(item)"
        >
          <i class="icon" :class="item.iconClass" aria-hidden="true"></i>
          <span v-if="item.label" class="el-menu-item__label">{{ item.label }}</span>
        </li>
      </template>
    </ul>

    <Teleport to="body">
      <Transition name="submenu-pop">
        <div
          v-if="activeSubmenu"
          id="sidebar-submenu"
          class="el-menu--vertical"
          :style="{ top: popup.top + 'px', left: popup.left + 'px' }"
          x-placement="right-start"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
          @focusin="cancelClose"
          @focusout="scheduleClose"
          @keydown="onPopupKeydown"
        >
          <ul role="menu" class="el-menu el-menu--popup el-menu--popup-right-start" :aria-label="activeSubmenu.label">
            <li
              v-for="(child, index) in activeSubmenu.children"
              :key="child.key"
              role="menuitem"
              tabindex="-1"
              class="el-menu-item"
              :class="{ 'is-active': isChildActive(activeSubmenu, child) }"
              :style="{ '--item-index': index }"
              @click="goToChild(activeSubmenu, child)"
            >
              {{ child.label }}
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>

    <div class="sidebar-footer">
      <p>SunPay Admin Panel</p>
      <p class="sidebar-footer-sub">Manage users & transactions</p>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineProps({
  collapsed: Boolean,
  mobileOpen: Boolean,
})
const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()

const navItems = [
  {
    key: 'bot',
    to: '/bot',
    iconClass: 'icon-developer',
    label: 'Bot',
    children: [
      { key: 'groups', label: 'Groups' },
      { key: 'transactions', label: 'Transactions' },
      { key: 'orders', label: 'Deposit Records' },
      { key: 'payout', label: 'Payout' },
    ],
  },
]

function isItemActive(item) {
  if (!item.to) return false
  if (item.to === '/') return route.path === '/'
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function isChildActive(parent, child) {
  const tab = route.query.tab || parent.children?.[0]?.key
  return route.path === parent.to && tab === child.key
}

function goTo(item) {
  if (!item?.to) return
  closeSubmenu()
  emit('close')
  if (route.path !== item.to) router.push(item.to)
}

function goToChild(parent, child) {
  closeSubmenu()
  emit('close')
  router.push({ path: parent.to, query: { ...route.query, tab: child.key } })
}

function onSubmenuTitleClick(item, event) {
  // Touch/small screens have no hover: keep the flyout open when the row is tapped.
  if (window.matchMedia('(max-width: 880px)').matches) {
    openSubmenu(item, event)
    return
  }
  goTo(item)
}

/* ── Flyout submenu (captured .el-menu--vertical spec) ───────────────────── */
const POPUP_ITEM_HEIGHT = 56 // 3 × 56 + 2 × 5 padding = the captured 178px height
const POPUP_PADDING_Y = 5
const CLOSE_DELAY = 140

const openSubmenuKey = ref('')
const popup = reactive({ top: 0, left: 0 })
let closeTimer = null
let lastTrigger = null

const activeSubmenu = computed(() =>
  navItems.find((item) => item.key === openSubmenuKey.value && item.children) || null,
)

function openSubmenu(item, event) {
  cancelClose()
  const trigger = event?.currentTarget
  if (!trigger || !item.children) return
  lastTrigger = trigger
  const rect = trigger.getBoundingClientRect()
  const height = item.children.length * POPUP_ITEM_HEIGHT + POPUP_PADDING_Y * 2
  const maxTop = window.innerHeight - height - 8
  const maxLeft = window.innerWidth - 210 - 8
  popup.left = Math.round(Math.max(8, Math.min(rect.right, maxLeft)))
  popup.top = Math.round(Math.max(8, Math.min(rect.top, maxTop)))
  openSubmenuKey.value = item.key
}

function scheduleClose() {
  cancelClose()
  closeTimer = window.setTimeout(() => {
    openSubmenuKey.value = ''
    closeTimer = null
  }, CLOSE_DELAY)
}

function cancelClose() {
  if (closeTimer) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

function closeSubmenu(restoreFocus = false) {
  cancelClose()
  openSubmenuKey.value = ''
  if (restoreFocus && lastTrigger) lastTrigger.focus()
}

function focusPopupItem(index) {
  const items = Array.from(document.querySelectorAll('#sidebar-submenu [role="menuitem"]'))
  if (!items.length) return
  const next = index < 0 ? items.length - 1 : index % items.length
  items[next].focus()
}

async function onTriggerKeydown(event, item) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    goTo(item)
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    openSubmenu(item, event)
    await nextTick()
    focusPopupItem(0)
  } else if (event.key === 'Escape') {
    closeSubmenu()
  }
}

function onPopupKeydown(event) {
  const items = Array.from(document.querySelectorAll('#sidebar-submenu [role="menuitem"]'))
  const current = items.indexOf(document.activeElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusPopupItem(current < 0 ? 0 : current + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusPopupItem(current < 0 ? 0 : current - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusPopupItem(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusPopupItem(items.length - 1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const target = items[current]
    if (target) target.click()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeSubmenu(true)
  } else if (event.key === 'Tab') {
    closeSubmenu()
  }
}

function onViewportChange() {
  if (openSubmenuKey.value) closeSubmenu()
}

onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})

onBeforeUnmount(() => {
  cancelClose()
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
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

.sidebar.collapsed .el-menu-item,
.sidebar.collapsed .el-submenu__title {
  justify-content: center;
  padding: 0;
}

.sidebar.collapsed .el-menu-item .icon,
.sidebar.collapsed .el-submenu__title .icon {
  width: 28px;
  height: 28px;
  margin-right: 0;
  font-size: 28px;
  line-height: 1;
}

.sidebar.collapsed .el-menu-item__label {
  display: none;
}

.sidebar.collapsed .el-submenu__title .el-menu-item__label {
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
  scrollbar-width: none;
  cursor: crosshair;
  transition: all;
}

.sidebar-el-menu::-webkit-scrollbar {
  display: none;
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

.el-submenu {
  list-style: none;
}

/* Rows (reskinned original nav items) */
.sidebar-el-menu .el-menu-item,
.sidebar-el-menu .el-submenu__title {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  line-height: 56px;
  color: rgb(191, 203, 217);
  background-color: var(--theme-sidebar, #324157);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.sidebar-el-menu .el-menu-item:hover,
.sidebar-el-menu .el-submenu__title:hover {
  background-color: #283441;
}

.sidebar-el-menu .el-menu-item:focus-visible,
.sidebar-el-menu .el-submenu:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.sidebar-el-menu .el-menu-item.is-active {
  color: rgb(235, 175, 91);
  background-color: var(--theme-sidebar, #324157);
}

.sidebar-el-menu .el-submenu.is-active > .el-submenu__title {
  color: rgb(191, 203, 217);
  background-color: var(--theme-sidebar, #324157);
}

.sidebar-el-menu .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  font-size: 20px;
  font-style: normal;
  line-height: 1;
  color: inherit;
}

.el-menu-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Submenu trigger arrow */
.el-menu-item__arrow {
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0.7;
  transition: transform var(--motion-fast) ease;
}

.el-menu-item__arrow.is-open {
  transform: rotate(90deg);
}

.sidebar.collapsed .el-menu-item__arrow {
  display: none;
}

/* Flyout submenu — captured .el-menu--vertical spec */
.el-menu--vertical {
  position: fixed;
  z-index: 2068;
  width: 210px;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16.1px;
  text-align: left;
  color: #666666;
  cursor: crosshair;
  transform-origin: left center;
  transition: all;
}

/* Smooth flyout open/close */
.submenu-pop-enter-active {
  transition: opacity 180ms ease, transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.submenu-pop-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.submenu-pop-enter-from,
.submenu-pop-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.97);
}

/* Staggered rows so the list unfolds instead of popping in at once */
.submenu-pop-enter-active .el-menu-item {
  animation: submenu-item-in 240ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
  animation-delay: calc(var(--item-index, 0) * 35ms);
}

@keyframes submenu-item-in {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.el-menu--vertical .el-menu--popup {
  position: relative;
  z-index: 100;
  min-width: 200px;
  margin: 0 5px;
  padding: 5px 0;
  list-style: none;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16.1px;
  text-align: left;
  color: #666666;
  background-color: var(--theme-sidebar, #324157);
  border-radius: 2px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 12px 0px;
  cursor: crosshair;
  transition: all;
}

.el-menu--vertical .el-menu--popup::before,
.el-menu--vertical .el-menu--popup::after {
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

.el-menu--vertical .el-menu-item {
  display: flex;
  align-items: center;
  height: 56px;
  margin: 0;
  padding: 0 20px;
  list-style: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 56px;
  white-space: nowrap;
  color: rgb(191, 203, 217);
  background-color: rgb(50, 65, 87);
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.el-menu--vertical .el-menu-item:hover {
  background-color: #283441;
}

.el-menu--vertical .el-menu-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.el-menu--vertical .el-menu-item.is-active {
  color: rgb(235, 175, 91);
  background-color: rgb(50, 65, 87);
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
    z-index: 1000;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    width: var(--layout-sidebar-width, 242px);
  }

  /* The drawer always shows the expanded layout, even when the desktop rail is collapsed */
  .sidebar.collapsed .sidebar-logo,
  .sidebar.collapsed .sidebar-badge {
    display: inline;
  }
  .sidebar.collapsed .sidebar-mark {
    display: none;
  }
  .sidebar.collapsed .sidebar-footer {
    display: block;
  }
  .sidebar.collapsed .sidebar-el-menu {
    width: 100%;
  }
  .sidebar.collapsed .el-menu-item,
  .sidebar.collapsed .el-submenu__title {
    justify-content: flex-start;
    padding: 0 20px;
  }
  .sidebar.collapsed .el-menu-item .icon,
  .sidebar.collapsed .el-submenu__title .icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    font-size: 20px;
  }
  .sidebar.collapsed .el-menu-item__label,
  .sidebar.collapsed .el-submenu__title .el-menu-item__label {
    display: inline;
  }
  .sidebar.collapsed .el-menu-item__arrow {
    display: block;
  }
}
</style>
