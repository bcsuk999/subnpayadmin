<template>
  <div class="tags-view">
    <div class="tags-view__scroll">
      <span
        v-for="tag in tags"
        :key="tag.path"
        :class="['tags-view-item', { active: tag.path === currentPath }]"
        @click="$router.push(tag.path)"
      >
        {{ tag.title }}
        <span
          v-if="tag.path !== '/'"
          class="tags-view-item-close"
          @click.stop="closeTag(tag.path)"
        >
          ×
        </span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const titleMap = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/banks': 'Banks',
  '/payin-config': 'Payin Config',
  '/deposit-addresses': 'Addresses',
  '/payins': 'Payins',
  '/transactions': 'Transactions',
  '/deposits': 'Deposits',
  '/withdrawals': 'Withdrawals',
  '/payouts': 'Payouts',
}

const tags = ref([{ path: '/', title: 'Dashboard' }])
const currentPath = computed(() => route.path)

function addTag() {
  const { path } = route
  if (tags.value.some(t => t.path === path)) return
  tags.value.push({
    path,
    title: titleMap[path] || route.name || path,
  })
}

function closeTag(path) {
  const idx = tags.value.findIndex(t => t.path === path)
  if (idx === -1) return
  tags.value.splice(idx, 1)
  if (route.path === path) {
    const last = tags.value[tags.value.length - 1]
    router.push(last ? last.path : '/')
  }
}

watch(() => route.path, () => addTag(), { immediate: true })
</script>

<style scoped>
.tags-view {
  display: flex;
  align-items: center;
  height: 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}

.tags-view__scroll {
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding: 0 4px;
  height: 100%;
  scrollbar-width: none;
}

.tags-view__scroll::-webkit-scrollbar { display: none; }

.tags-view-item {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  margin-left: 4px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  transition: all 200ms;
}

.tags-view-item:first-child { margin-left: 0; }

.tags-view-item:hover {
  color: var(--color-success);
  border-color: var(--color-success);
}

.tags-view-item.active {
  background: var(--color-success);
  color: #fff;
  border-color: var(--color-success);
  position: relative;
  padding-left: 18px;
}

.tags-view-item.active::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff;
}

.tags-view-item-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  font-size: 12px;
  border-radius: 50%;
  transition: background 200ms;
}

.tags-view-item-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tags-view-item.active .tags-view-item-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

html[data-theme='dark'] .tags-view-item.active,
html.dark .tags-view-item.active {
  background: rgba(66, 185, 131, 0.2);
  border-color: var(--color-success);
}

html[data-theme='dark'] .tags-view-item.active::before,
html.dark .tags-view-item.active::before {
  background: var(--color-success);
}

html[data-theme='dark'] .tags-view-item.active .tags-view-item-close:hover,
html.dark .tags-view-item.active .tags-view-item-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 600px) {
  .tags-view { height: 28px; }
  .tags-view-item { height: 26px; padding: 0 5px; font-size: 12px; }
  .tags-view-item.active { padding-left: 14px; }
  .tags-view-item.active::before { width: 4px; height: 4px; left: 5px; }
}
</style>
