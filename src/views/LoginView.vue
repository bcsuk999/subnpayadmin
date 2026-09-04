<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-brand" aria-label="SunPay Admin">
        <span class="login-logo">SunPay</span>
        <span class="login-badge">Admin</span>
      </div>

      <h1 class="login-title">Sign in to your account</h1>

      <form class="login-form" novalidate @submit.prevent="onSubmit">
        <div class="login-field">
          <label class="login-field-label" for="mobile">Mobile number</label>
          <input
            id="mobile"
            v-model="form.mobile"
            v-focus
            class="login-input"
            type="tel"
            name="mobile"
            inputmode="tel"
            autocomplete="username"
            placeholder="Enter mobile number"
            :disabled="loading"
          />
        </div>

        <div class="login-field">
          <label class="login-field-label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            class="login-input"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Enter password"
            :disabled="loading"
          />
        </div>

        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>

        <button class="btn btn-filled login-submit" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminLogin } from '../api/client'
import { setSession } from '../auth'
import { useToast } from '../composables/useToast.js'

const router = useRouter()
const toast = useToast()

const form = reactive({
  mobile: '',
  password: '',
})
const loading = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  errorMessage.value = ''

  const mobile = form.mobile.trim()
  if (!mobile || !form.password) {
    const msg = 'Please enter your mobile number and password.'
    errorMessage.value = msg
    toast.error(msg)
    return
  }

  loading.value = true
  try {
    const data = await adminLogin(mobile, form.password)
    setSession(data.token, data.user)
    toast.success(data.message || 'Login successful')
    router.replace({ name: 'home' })
  } catch (err) {
    const msg = err.message || 'Login failed'
    errorMessage.value = msg
    toast.error(msg)
  } finally {
    loading.value = false
  }
}

const vFocus = {
  mounted: (el) => el.focus(),
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  position: relative;
}

.login-card {
  width: 380px;
  max-width: 90vw;
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}

.login-logo {
  font-family: var(--font-heading);
  font-size: var(--text-display);
  font-weight: 700;
  line-height: 1.15;
  color: #fff;
}

.login-badge {
  background: rgba(32, 143, 255, 0.3);
  color: #60a5fa;
  font-family: var(--font-heading);
  font-size: var(--text-body-l);
  font-weight: 600;
  line-height: 1.15;
  padding: var(--space-5) var(--space-10);
  border-radius: var(--radius-round);
}

.login-title {
  margin-top: var(--space-4);
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: #fff;
}

.login-form {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.login-field-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.login-input {
  padding: var(--space-5) var(--space-3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-body);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
  transition: border-color var(--motion-fast);
}

.login-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.login-input:focus,
.login-input:focus-visible {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.login-error {
  color: #f87171;
  font-size: var(--text-h4);
  line-height: 1.4;
}

.login-submit {
  width: 100%;
  margin-top: var(--space-7);
}

@media (max-width: 640px) {
  .login-card {
    box-shadow: none;
    padding: var(--space-6);
  }
}
</style>
