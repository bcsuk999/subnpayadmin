<template>
  <nav class="admin-tabs" role="tablist" aria-label="Page sections">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="btn admin-tabs__tab"
      :class="modelValue === tab.value ? 'admin-tabs__tab--active btn-primary' : 'btn-ghost'"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.value"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true },
})

defineEmits(['update:modelValue'])
</script>
