<template>
  <div class="settings-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">设置</h1>
    </div>

    <!-- Account Settings - Secondary -->
    <section class="settings-section">
      <div class="section-header">
        <span class="section-label">账号安全</span>
      </div>
      <div class="settings-grid">
        <div class="grid-item full-width">
          <label class="item-label">当前账号</label>
          <el-input :model-value="currentUsername" disabled class="item-input" />
        </div>
        <div class="grid-item">
          <label class="item-label">新密码</label>
          <el-input v-model="accountForm.newPassword" type="password" show-password placeholder="留空则不修改" class="item-input" />
        </div>
        <div class="grid-item">
          <label class="item-label">确认密码</label>
          <el-input v-model="accountForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" class="item-input" />
        </div>
      </div>
      <div class="section-footer">
        <el-button type="primary" size="small" @click="handleUpdatePassword">修改密码</el-button>
      </div>
    </section>

    <!-- Data Operations - Tertiary, compact action list -->
    <section class="settings-section">
      <div class="section-header">
        <span class="section-label">数据管理</span>
      </div>
      <div class="action-list">
        <div class="action-item" @click="handleExportData">
          <div class="action-content">
            <span class="action-title">导出数据</span>
          </div>
          <el-icon class="action-icon"><ArrowRight /></el-icon>
        </div>
        <div class="action-item" @click="handleBackup">
          <div class="action-content">
            <span class="action-title">数据备份</span>
          </div>
          <el-icon class="action-icon"><ArrowRight /></el-icon>
        </div>
        <div class="action-item danger" @click="handleClearCache">
          <div class="action-content">
            <span class="action-title">清除缓存</span>
          </div>
          <el-icon class="action-icon"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>

    <!-- System Info - Collapsed, rarely needed -->
    <div class="system-info-toggle" @click="infoCollapsed = !infoCollapsed">
      <span>系统信息</span>
      <el-icon class="toggle-icon" :class="{ collapsed: infoCollapsed }"><ArrowRight /></el-icon>
    </div>

    <div v-show="!infoCollapsed" class="system-info-panel">
      <div class="info-row">
        <span class="info-key">版本</span>
        <span class="info-value">{{ appInfo.version }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">数据路径</span>
        <span class="info-value path">{{ appInfo.dataPath }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import api from '@/api'

const infoCollapsed = ref(true)

const currentUsername = localStorage.getItem('username') || 'admin'

const accountForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const appInfo = reactive({
  version: '1.0.0',
  dataPath: ''
})

const handleUpdatePassword = async () => {
  if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  try {
    const result = await api.auth.updatePassword(accountForm.newPassword)
    if (result.code === 200) {
      ElMessage.success('密码修改成功')
      accountForm.newPassword = ''
      accountForm.confirmPassword = ''
    } else {
      ElMessage.error(result.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

const handleExportData = async () => {
  try {
    await ElMessageBox.confirm('确认导出所有订单和顾客数据?', '导出数据', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    })
    const result = await api.data.export()
    if (result.code === 200) {
      ElMessage.success(`数据已导出至: ${result.data.path}`)
    } else {
      ElMessage.error(result.message || '导出失败')
    }
  } catch {}
}

const handleBackup = async () => {
  try {
    const result = await api.data.backup()
    if (result.code === 200) {
      ElMessage.success(`备份已创建: ${result.data.path}`)
    } else {
      ElMessage.error(result.message || '备份失败')
    }
  } catch (error) {
    ElMessage.error('备份失败')
  }
}

const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm('确认清除缓存文件?', '清除缓存', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await api.data.clearCache()
    if (result.code === 200) {
      ElMessage.success('缓存已清除')
    } else {
      ElMessage.error(result.message || '清除失败')
    }
  } catch {}
}

const loadAppInfo = async () => {
  try {
    const result = await api.app.info()
    if (result.code === 200) {
      Object.assign(appInfo, result.data)
    }
  } catch (error) {
    console.error('加载应用信息失败:', error)
  }
}

onMounted(() => {
  loadAppInfo()
})
</script>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 12px 16px 24px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.settings-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 10px;
  overflow: hidden;
}

.section-header {
  padding: 8px 12px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
}

.grid-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-height: 36px;
  background: var(--surface);
}

.grid-item.full-width {
  grid-column: 1 / -1;
}

.item-label {
  width: 80px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.item-input {
  flex: 1;
}

.item-input :deep(.el-input__wrapper) {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.item-input :deep(.el-input__inner) {
  color: var(--text);
}

.item-input :deep(.el-input.is-disabled .el-input__wrapper) {
  background: var(--surface-2);
  opacity: 0.7;
}

.section-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  background: var(--surface-2);
  border-top: 1px solid var(--border);
}

.section-footer .el-button {
  padding: 5px 14px;
  font-size: 13px;
  background: var(--primary);
  border-color: var(--primary);
  border-radius: var(--radius-sm);
}

.action-list {
  padding: 0;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  min-height: 36px;
  cursor: pointer;
  transition: background 0.1s ease;
  border-bottom: 1px solid var(--border);
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background: var(--surface-2);
}

.action-content {
  display: flex;
  align-items: center;
}

.action-title {
  font-size: 13px;
  color: var(--text);
}

.action-item.danger .action-title {
  color: var(--warning);
}

.action-icon {
  font-size: 14px;
  color: var(--text-muted);
}

.system-info-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.1s ease;
}

.system-info-toggle:hover {
  background: var(--surface-2);
  color: var(--text-secondary);
}

.toggle-icon {
  transition: transform 0.2s ease;
  font-size: 12px;
}

.toggle-icon.collapsed {
  transform: rotate(0deg);
}

.system-info-toggle .toggle-icon:not(.collapsed) {
  transform: rotate(90deg);
}

.system-info-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  margin-top: 4px;
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  min-height: 24px;
}

.info-key {
  width: 60px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.info-value {
  color: var(--text);
  word-break: break-all;
}

.info-value.path {
  font-family: monospace;
  font-size: 11px;
  color: var(--text-secondary);
}
</style>
