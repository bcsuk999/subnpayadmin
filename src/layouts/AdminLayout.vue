<template>
  <div class="app-layout">
    <AppSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @close="mobileOpen = false" @toggle-collapse="collapsed = !collapsed" />
    <div class="main-area">
      <AppHeader :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed" @toggle-mobile="mobileOpen = !mobileOpen" />
      <TagsView />
      <main class="app-content">
        <div class="route-transition">
          <div class="content">
            <RouterView />
          </div>
        </div>
      </main>
    </div>
    <div v-if="mobileOpen" class="sidebar-backdrop" aria-hidden="true" @click="mobileOpen = false"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppHeader from '../components/AppHeader.vue'
import TagsView from '../components/TagsView.vue'

const collapsed = ref(true)
const mobileOpen = ref(false)
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.route-transition {
  height: 100%;
  animation: routeEnter 0.3s ease;
}

@keyframes routeEnter {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

.content {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  height: 100%;
  overflow-y: auto;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

@media (max-width: 880px) {
  .content {
    padding: 10px;
  }
}
</style>
