<template>
  <section class="admin-card admin-filter-card filters">
    <header class="filter-card-head">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="description" class="admin-filter-card__description">{{ description }}</p>
      </div>
      <div class="filter-card-actions">
        <slot name="actions" />
        <button
          v-if="collapsible"
          class="btn btn-ghost filter-toggle"
          type="button"
          :aria-controls="filterBodyId"
          :aria-expanded="modelValue"
          @click="$emit('update:modelValue', !modelValue)"
        >
          {{ modelValue ? 'Hide filters' : 'Show filters' }}
        </button>
      </div>
    </header>
    <div :id="filterBodyId" v-show="!collapsible || modelValue" class="admin-filter-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { useId } from 'vue'

const filterBodyId = useId()

defineProps({
  title: { type: String, default: 'Filters' },
  description: { type: String, default: '' },
  modelValue: { type: Boolean, default: true },
  collapsible: { type: Boolean, default: true },
})

defineEmits(['update:modelValue'])
</script>
