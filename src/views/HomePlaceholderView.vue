<template>
  <main class="placeholder">
    <h1>Dashboard</h1>
    <p>Admin panel shell coming next.</p>
    <button class="btn btn-ghost" type="button" @click="onLogout">Log out</button>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { clearSession } from '../auth'

const router = useRouter()

function onLogout() {
  clearSession()
  router.replace({ name: 'login' })
}
</script>

<style scoped>
.placeholder {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-12);
  padding: var(--space-20);
}

.placeholder p {
  color: var(--color-text-secondary);
  font-size: var(--text-h4);
}
</style>
