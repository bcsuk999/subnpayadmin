<template>
  <section class="page">
    <div class="page-head">
      <h1>Deposits</h1>
      <p>Review and manage deposit requests</p>
    </div>
    <div class="card">
      <div class="card-head">
        <h3>Deposit queue</h3>
        <button class="btn btn-primary" type="button" @click="toast.info('Fetch deposits API coming soon')">Refresh</button>
      </div>
      <p class="empty">No deposits to display. Hook to <code>GET /api/admin/deposits</code> when ready.</p>
    </div>
  </section>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'
const toast = useToast()
</script>

<style scoped>
.page { display:flex; flex-direction:column; gap:16px; }
.page-head h1 { font-size: var(--text-h1); }
.page-head p { color: var(--color-text-secondary); font-size: var(--text-h4); margin-top:4px;}
.card { background: var(--color-bg); border:1px solid var(--color-border); border-radius: var(--radius-md); padding:16px; box-shadow: var(--shadow-subtle); }
.card-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px;}
.empty { color: var(--color-text-secondary); font-size: var(--text-h4); line-height:1.5; }
code { background: var(--color-surface-raised); padding:2px 6px; border-radius:4px; font-size:12px;}
</style>
