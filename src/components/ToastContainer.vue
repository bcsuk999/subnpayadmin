<template>
  <Teleport to="body">
    <div class="toast-viewport" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', `toast--${t.type}`]"
          role="alert"
        >
          <span class="toast-icon" aria-hidden="true">
            <span v-if="t.type === 'success'">✓</span>
            <span v-else-if="t.type === 'error'">✕</span>
            <span v-else-if="t.type === 'warning'">!</span>
            <span v-else>●</span>
          </span>
          <p class="toast-message">{{ t.message }}</p>
          <button class="toast-close" type="button" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-viewport {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-width: 420px;
  width: calc(100% - 32px);
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: var(--shadow-dropdown);
  font-size: var(--text-h4);
  line-height: 1.4;
  min-width: 260px;
}

.toast-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  margin-top: 1px;
}

.toast-message {
  flex: 1;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  margin-top: -1px;
}
.toast-close:hover {
  color: var(--color-text);
}

/* types */
.toast--success {
  border-left: 3px solid var(--color-success);
}
.toast--success .toast-icon {
  background: var(--color-success);
  color: #fff;
}
.toast--error {
  border-left: 3px solid var(--color-danger);
}
.toast--error .toast-icon {
  background: var(--color-danger);
  color: #fff;
}
.toast--warning {
  border-left: 3px solid var(--color-warning);
}
.toast--warning .toast-icon {
  background: var(--color-warning);
  color: #fff;
}
.toast--info {
  border-left: 3px solid var(--color-primary);
}
.toast--info .toast-icon {
  background: var(--color-primary);
  color: #fff;
}

html[data-theme='dark'] .toast {
  border-color: var(--color-border);
  background: #1e2430;
}

/* transitions */
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 220ms ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(16px) scale(0.98);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.toast-leave-active {
  position: absolute;
}

@media (max-width: 640px) {
  .toast-viewport {
    top: 12px;
    left: 12px;
    right: 12px;
    width: auto;
    max-width: none;
  }
  .toast {
    min-width: 0;
    width: 100%;
  }
}
</style>
