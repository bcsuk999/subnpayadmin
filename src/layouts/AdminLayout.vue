<template>
  <div class="admin-layout">
    <AppSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @close="mobileOpen = false" @toggle-collapse="collapsed = !collapsed" />
    <div class="admin-main">
      <AppHeader :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed" @toggle-mobile="mobileOpen = !mobileOpen" />
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
    <div v-if="mobileOpen" class="sidebar-backdrop" aria-hidden="true" @click="mobileOpen = false"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppHeader from '../components/AppHeader.vue'

const collapsed = ref(false)
const mobileOpen = ref(false)
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}
.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.admin-content {
  flex: 1;
  padding: 24px;
  background: var(--color-bg);
}
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 35;
}
@media (max-width: 880px) {
  .admin-content {
    padding: 16px;
  }
}
</style>
