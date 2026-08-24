<template>
  <main class="placeholder">
    <h1>Dashboard</h1>
    <p>Admin panel shell coming next.</p>
    <div class="placeholder-actions">
      <button class="btn btn-ghost" type="button" :disabled="updating" @click="onDemoSuccess">Demo success toast</button>
      <button class="btn btn-ghost" type="button" :disabled="updating" @click="onDemoError">Demo error toast</button>
      <button class="btn btn-ghost" type="button" @click="onLogout">Log out</button>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession } from '../auth'
import { useToast } from '../composables/useToast.js'
import { updateUserStatus } from '../api/client.js'

const router = useRouter()
const toast = useToast()
const updating = ref(false)

function onLogout() {
  clearSession()
  toast.info('Logged out')
  router.replace({ name: 'login' })
}

function onDemoSuccess() {
  toast.success('Action completed successfully')
}

function onDemoError() {
  toast.error('Something went wrong. Please try again.')
}

async function onUpdateStatusDemo(userid, status) {
  updating.value = true
  try {
    const data = await updateUserStatus(userid, status)
    toast.success(data.message || `User status updated to ${status}`)
  } catch (err) {
    toast.error(err.message || 'Failed to update user status')
  } finally {
    updating.value = false
  }
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

.placeholder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-10);
  justify-content: center;
  margin-top: var(--space-8);
}
</style>
