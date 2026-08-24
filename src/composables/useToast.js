import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function add(message, type = 'info', duration = 4000) {
  const id = ++nextId
  const toast = { id, message, type, duration }
  toasts.value.push(toast)
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

function dismiss(id) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

function clear() {
  toasts.value = []
}

export function useToast() {
  return {
    toasts,
    add,
    dismiss,
    clear,
    success: (msg, duration) => add(msg, 'success', duration ?? 3500),
    error: (msg, duration) => add(msg, 'error', duration ?? 4500),
    warning: (msg, duration) => add(msg, 'warning', duration ?? 4000),
    info: (msg, duration) => add(msg, 'info', duration ?? 4000),
  }
}
