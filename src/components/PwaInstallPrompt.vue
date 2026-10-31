<template>
  <aside v-if="visible" class="pwa-prompt" aria-label="Install SunPay Admin">
    <div class="pwa-prompt__copy">
      <strong>{{ iosInstructions ? 'Add SunPay to your home screen' : 'Install SunPay Admin' }}</strong>
      <p v-if="iosInstructions">Tap Share, then choose “Add to Home Screen”.</p>
      <p v-else>Install the app for quick access from your device.</p>
    </div>
    <div class="pwa-prompt__actions">
      <button v-if="installEvent" class="btn btn-primary" type="button" :disabled="installing" @click="install">
        {{ installing ? 'Opening…' : 'Install' }}
      </button>
      <button class="pwa-prompt__close" type="button" aria-label="Dismiss install prompt" @click="visible = false">×</button>
    </div>
  </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const visible = ref(false)
const installing = ref(false)
const installEvent = ref(null)
const iosInstructions = ref(false)
let iosPromptTimer

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

function onBeforeInstallPrompt(event) {
  event.preventDefault()
  installEvent.value = event
  visible.value = true
}

function onAppInstalled() {
  visible.value = false
  installEvent.value = null
}

async function install() {
  if (!installEvent.value || installing.value) return

  installing.value = true
  try {
    const promptEvent = installEvent.value
    installEvent.value = null
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === 'accepted') visible.value = false
  } catch (error) {
    console.error('PWA install prompt failed:', error)
  } finally {
    installing.value = false
  }
}

onMounted(() => {
  if (isInstalled()) return

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)

  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios|edgios/i.test(window.navigator.userAgent)
  if (isIos && isSafari) {
    iosInstructions.value = true
    iosPromptTimer = window.setTimeout(() => {
      visible.value = true
    }, 2500)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
  window.clearTimeout(iosPromptTimer)
})
</script>

<style scoped>
.pwa-prompt {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: min(440px, calc(100vw - 32px));
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: var(--shadow-dropdown);
}

.pwa-prompt__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pwa-prompt__copy strong {
  font-size: var(--text-h4);
}

.pwa-prompt__copy p {
  color: var(--color-text-secondary);
  font-size: var(--text-body-l);
  line-height: 1.4;
}

.pwa-prompt__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pwa-prompt__close {
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 20px;
  cursor: pointer;
}

.pwa-prompt__close:hover {
  color: var(--color-text);
}

@media (max-width: 480px) {
  .pwa-prompt {
    right: 12px;
    bottom: 12px;
    left: 12px;
    max-width: none;
    gap: 10px;
    padding: 12px;
  }

  .pwa-prompt .btn {
    min-height: 36px;
    padding: 0 10px;
  }
}
</style>
