<template>
  <section class="page">
    <div class="tabs">
      <button :class="['tab', { 'tab--active': activeTab === 'groups' }]" type="button" @click="activeTab = 'groups'">Groups</button>
      <button :class="['tab', { 'tab--active': activeTab === 'transactions' }]" type="button" @click="activeTab = 'transactions'">Transactions</button>
      <button :class="['tab', { 'tab--active': activeTab === 'deposits' }]" type="button" @click="activeTab = 'deposits'">Deposit Records</button>
    </div>

    <div class="tab-panel"></div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('groups')
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
}
.tab {
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-h4);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.tab:hover {
  color: var(--color-text);
}
.tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 120px;
}
</style>
