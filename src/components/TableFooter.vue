<template>
  <div v-if="total !== null || directInput || totalPages > 1" class="tbl-footer">
    <div class="tbl-footer-row">
      <span v-if="total !== null" class="tbl-total-pages" aria-live="polite">
      Total {{ total.toLocaleString() }}
      </span>
      <Pagination
        :page="page"
        :total-pages="totalPages"
        :disabled="disabled"
        :direct-input="directInput"
        :show-page-sizes="showPageSizes"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        @change="$emit('change', $event)"
        @size-change="$emit('size-change', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import Pagination from './Pagination.vue'

defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: null },
  disabled: { type: Boolean, default: false },
  directInput: { type: Boolean, default: true },
  showPageSizes: { type: Boolean, default: true },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100, 200, 500] },
})

defineEmits(['change', 'size-change'])
</script>

<style scoped>
.tbl-footer {
  display: flex;
  justify-content: center;
  margin: 20px 0 0;
  --theme-text-primary: #303133;
  color: var(--theme-text-primary, #303133);
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "microsoft yahei", arial, STHeiTi, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16.1px;
  cursor: crosshair;
  transition: all;
}

.tbl-footer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.tbl-total-pages {
  margin-right: 10px;
  color: inherit;
  font-size: inherit;
  font-weight: 400;
  white-space: nowrap;
}

.tbl-footer-row :deep(.pagination) {
  justify-content: center;
  gap: 0;
  margin-top: 0;
  margin-left: 0;
  padding: 2px 5px;
  color: inherit;
  font-size: inherit;
  font-weight: 400;
}

.tbl-footer-row :deep(.pagination > .btn) {
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  margin: 0 3px;
  padding: 0;
  color: #606266;
  background: #f4f4f5;
  border: none;
  border-radius: 3px;
  box-shadow: none;
  font-size: 14px;
}

.tbl-footer-row :deep(.pagination > .btn:hover:not(:disabled)) {
  color: #ebaf5b;
  background: #f4f4f5;
}

.tbl-footer-row :deep(.pagination > .btn:disabled) {
  color: #c0c4cc;
  background: #f4f4f5;
  opacity: 1;
}

.tbl-footer-row :deep(.pagination > .page-btn) {
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  box-shadow: none;
  font-size: 14px;
}

.tbl-footer-row :deep(.pagination > .page-btn.active),
.tbl-footer-row :deep(.pagination > .page-btn.active:hover) {
  color: #fff;
  background: #ebaf5b;
  border-color: #ebaf5b;
  box-shadow: none;
}

.tbl-footer-row :deep(.pagination > .page-input) {
  width: 52px;
  height: 28px;
  padding: 0 3px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
}

.tbl-footer-row :deep(.pagination > .page-input:focus) {
  border-color: #ebaf5b;
  outline: none;
  box-shadow: 0 0 0 2px #f0c078;
}

.tbl-footer-row :deep(.page-jump) {
  gap: 5px;
  margin-left: 10px;
  color: #606266;
  font-size: 14px;
  font-weight: 400;
}

.tbl-footer-row :deep(.page-size) {
  margin-left: 10px;
  margin-right: 0;
}

.tbl-footer .tbl-footer-row :deep(.page-size__select) {
  width: 110px;
  height: 28px;
  padding: 0;
  color: #606266;
  background: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
}

.tbl-footer .tbl-footer-row :deep(.page-size__select .el-input.el-input--small) {
  height: 28px;
  background: #fff;
  border-color: #dcdfe6;
  border-radius: 4px;
}

.tbl-footer .tbl-footer-row :deep(.page-size__select .el-input__inner) {
  height: 26px;
  padding-left: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 26px;
}

@media (max-width: 640px) {
  .tbl-footer-row {
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .tbl-footer-row :deep(.pagination > .page-btn:not(.active)) {
    display: none;
  }
}
</style>
