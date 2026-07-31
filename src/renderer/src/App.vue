<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

watch(isDark, (val) => {
  document.documentElement.dataset.theme = val ? 'dark' : ''
  localStorage.setItem('theme', val ? 'dark' : 'light')
}, { immediate: true })
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  min-height: 100vh;
}

.el-button--primary {
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: var(--primary-light);
  --el-button-hover-border-color: var(--primary-light);
  --el-button-active-bg-color: var(--primary-dark);
  --el-button-active-border-color: var(--primary-dark);
}

.el-menu {
  border-right: none !important;
}

.el-card {
  --el-card-border-radius: var(--radius-lg);
  --el-card-border-color: var(--color-border);
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm) !important;
  border-radius: var(--radius-lg) !important;
}

[data-theme="dark"] .el-card {
  background-color: var(--surface);
}

[data-theme="dark"] .el-table,
[data-theme="dark"] .el-table__cell {
  background-color: var(--surface) !important;
  color: var(--text) !important;
}

[data-theme="dark"] .el-input__wrapper {
  background-color: var(--surface-2) !important;
  box-shadow: 0 0 0 1px var(--border) !important;
}

[data-theme="dark"] .el-select .el-input__wrapper,
[data-theme="dark"] .el-select .el-input__inner {
  background-color: var(--surface-2) !important;
  color: var(--text) !important;
}

[data-theme="dark"] .el-textarea__inner {
  background-color: var(--surface-2) !important;
  color: var(--text) !important;
  box-shadow: 0 0 0 1px var(--border) !important;
}

[data-theme="dark"] .el-form-item__label {
  color: var(--text-secondary) !important;
}

[data-theme="dark"] .el-tag {
  border-color: var(--border) !important;
}

[data-theme="dark"] .el-date-table td.available:hover {
  color: var(--primary) !important;
}

[data-theme="dark"] .el-popper,
[data-theme="dark"] .el-picker-panel,
[data-theme="dark"] .el-select-dropdown {
  background-color: var(--surface) !important;
  border-color: var(--border) !important;
  color: var(--text) !important;
}

[data-theme="dark"] .el-dialog {
  background-color: var(--surface) !important;
}

[data-theme="dark"] .el-message-box {
  background-color: var(--surface) !important;
  border-color: var(--border) !important;
}
</style>