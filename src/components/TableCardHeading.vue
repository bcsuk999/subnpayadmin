<template>
  <div class="table-card-heading values-header">
    <div class="table-card-heading__main">
      <h3 class="title">{{ title }}</h3>
      <div v-if="$slots.subtitle" class="table-card-heading__subtitle">
        <slot name="subtitle" />
      </div>
    </div>
    <div v-if="$slots.actions" class="table-card-heading__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<style scoped>
.table-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.table-card-heading__main {
  min-width: 0;
}

.table-card-heading .title {
  display: inline-block;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -.01em;
  background: linear-gradient(120deg, #ebaf5b, #f0c078);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.table-card-heading__subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.table-card-heading__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
