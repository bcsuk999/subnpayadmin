<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-brand" aria-label="SunPay Admin">
        <span class="login-logo">SunPay</span>
        <span class="login-badge">Admin</span>
      </div>

      <h1 class="login-title">Sign in to your account</h1>

      <form class="login-form" novalidate @submit.prevent="onSubmit">
        <div class="field">
          <label class="field-label" for="mobile">Mobile number</label>
          <input
            id="mobile"
            v-model="form.mobile"
            v-focus
            class="input"
            type="tel"
            name="mobile"
            inputmode="tel"
            autocomplete="username"
            placeholder="Enter mobile number"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label class="field-label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            class="input"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Enter password"
            :disabled="loading"
          />
        </div>

        <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>

        <button class="btn btn-primary login-submit" type="submit" :disabled="loading">
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

const router = useRouter()

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
    errorMessage.value = 'Please enter your mobile number and password.'
    return
  }

  loading.value = true
  try {
    const data = await adminLogin(mobile, form.password)
    setSession(data.token, data.user)
    router.replace({ name: 'home' })
  } catch (err) {
    errorMessage.value = err.message
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
  padding: var(--space-20);
  background: var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 40px var(--space-20);
  transition:
    background-color var(--duration-fast) ease,
    border-color var(--duration-fast) ease;
}

html[data-theme='dark'] .login-card {
  border: 1px solid var(--color-border);
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
}

.login-badge {
  background: var(--color-surface-raised);
  color: var(--color-primary);
  font-family: var(--font-heading);
  font-size: var(--text-body-l);
  font-weight: 600;
  line-height: 1.15;
  padding: var(--space-5) var(--space-10);
  border-radius: var(--radius-round);
}

.login-title {
  margin-top: var(--space-12);
  text-align: center;
  font-weight: 600;
}

.login-form {
  margin-top: var(--space-20);
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.login-error {
  color: var(--color-danger);
  font-size: var(--text-h4);
  line-height: 1.4;
}

.login-submit {
  width: 100%;
  margin-top: var(--space-8);
  padding-block: var(--space-10);
}

@media (max-width: 640px) {
  .login-page {
    align-items: stretch;
    padding: var(--space-20) var(--space-12);
  }

  .login-card {
    max-width: none;
    margin-top: auto;
    margin-bottom: auto;
    box-shadow: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-20);
  }
}
</style>
