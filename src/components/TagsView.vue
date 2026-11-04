<template>
  <div class="tags-view">
    <div class="tags-view__scroll">
      <button
        v-for="tag in tags"
        :key="tag.path"
        type="button"
        :class="['btn', 'tags-view-item', tag.path === currentPath ? 'btn-primary is-active' : 'btn-ghost']"
        @click="$router.push(tag.path)"
      >
        {{ tag.title }}
        <span
          v-if="tag.path !== '/'"
          class="tags-view-item-close"
          aria-hidden="true"
          @click.stop="closeTag(tag.path)"
        >
          ×
        </span>
      </button>
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
  '/bot': 'Bot',
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
  height: 35.2px;
  padding: 0 8px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-header-bg);
  flex-shrink: 0;
}

.tags-view__scroll {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  height: 100%;
  padding: 0;
  scrollbar-width: none;
}

.tags-view__scroll::-webkit-scrollbar { display: none; }

/* Same button UI as the app buttons (ghost / primary) */
.tags-view .tags-view-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 6px;
  height: 27.2px;
  min-height: 27.2px;
  margin: 0;
  padding: 0 14px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: #606266;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: none;
  cursor: pointer;
  user-select: none;
  transition: color .2s ease, background-color .2s ease, border-color .2s ease, transform .2s ease;
}

.tags-view .tags-view-item:hover {
  color: #ebaf5b;
  background: #fdf7ef;
  border-color: #f9e7ce;
}

.tags-view .tags-view-item.is-active {
  color: #ffffff;
  background: #ebaf5b;
  border-color: #ebaf5b;
}

.tags-view .tags-view-item.is-active:hover {
  color: #ffffff;
  background: #efbf7c;
  border-color: #efbf7c;
}

.tags-view-item-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  font-size: 14px;
  line-height: 1;
  border-radius: 50%;
  transition: background 200ms;
}

.tags-view-item-close:hover {
  background: rgba(0, 0, 0, 0.12);
}

.tags-view .tags-view-item.is-active .tags-view-item-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 600px) {
  .tags-view { height: 33.6px; }
  .tags-view .tags-view-item { height: 25.6px; min-height: 25.6px; padding: 0 10px; font-size: 13px; }
}
</style>
