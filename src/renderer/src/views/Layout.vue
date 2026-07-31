<template>
  <div class="layout-wrapper">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-top">
        <div class="logo-mark">黄</div>
        <div class="logo-info">
          <div class="logo-name">黄小帅麻辣鸡</div>
          <div class="logo-sub">运营管理平台</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">主导航</div>

        <button class="nav-item" :class="{ active: activeMenu === '/dashboard' }" @click="handleMenuSelect('/dashboard')">
          <span class="nav-icon"><DataAnalysis /></span>
          <span class="nav-label">数据概览</span>
        </button>

        <button class="nav-item" :class="{ active: activeMenu === '/orders' }" @click="handleMenuSelect('/orders')">
          <span class="nav-icon"><Document /></span>
          <span class="nav-label">订单管理</span>
          <span class="nav-badge">3</span>
        </button>

        <button class="nav-item" :class="{ active: activeMenu === '/customers' }" @click="handleMenuSelect('/customers')">
          <span class="nav-icon"><User /></span>
          <span class="nav-label">顾客管理</span>
        </button>

        <button class="nav-item" :class="{ active: activeMenu === '/products' }" @click="handleMenuSelect('/products')">
          <span class="nav-icon"><Goods /></span>
          <span class="nav-label">商品管理</span>
        </button>

        <button class="nav-item" :class="{ active: activeMenu === '/delivery' }" @click="handleMenuSelect('/delivery')">
          <span class="nav-icon"><Van /></span>
          <span class="nav-label">配送管理</span>
        </button>

        <div class="nav-divider"></div>
        <div class="nav-section-label">系统</div>

        <button class="nav-item" :class="{ active: activeMenu === '/settings' }" @click="handleMenuSelect('/settings')">
          <span class="nav-icon"><Setting /></span>
          <span class="nav-label">系统设置</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <button class="user-row" @click="handleLogout">
          <div class="user-avatar">{{ username.charAt(0) }}</div>
          <div class="user-info">
            <div class="user-name">{{ username }}</div>
            <div class="user-role">管理员</div>
          </div>
          <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>

        <div class="sidebar-actions">
          <button class="icon-action-btn" @click="toggleDark" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
            <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button class="icon-action-btn" @click="toggleCollapse" :title="isCollapsed ? '展开侧栏' : '收起侧栏'">
            <Expand v-if="isCollapsed" />
            <Fold v-else />
          </button>
        </div>
      </div>
    </aside>

    <el-container>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Document,
  User,
  Goods,
  Van,
  Setting,
  Fold,
  Expand
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const username = ref(localStorage.getItem('username') || 'admin')
const isCollapsed = ref(false)
const isDark = ref(localStorage.getItem('theme') === 'dark')

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', isCollapsed.value)
}

const handleMenuSelect = (index) => {
  router.push(index)
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }).catch(() => {})
}

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.dataset.theme = isDark.value ? 'dark' : ''
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const storedUsername = localStorage.getItem('username')
  if (storedUsername) {
    username.value = storedUsername
  }

  const savedCollapse = localStorage.getItem('sidebarCollapsed')
  if (savedCollapse !== null) {
    isCollapsed.value = savedCollapse === 'true'
  } else {
    isCollapsed.value = false
  }

  document.documentElement.dataset.theme = isDark.value ? 'dark' : ''
})
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 16px;
  top: 16px;
  bottom: 16px;
  width: var(--sidebar-w);
  background: var(--surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width var(--transition-slow) var(--ease-smooth),
              background var(--transition-slow) var(--ease-smooth),
              border-color var(--transition-slow) var(--ease-smooth),
              box-shadow var(--transition-slow) var(--ease-smooth);
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-w-collapsed);
}

.sidebar-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  min-height: 72px;
  transition: border-color var(--transition-slow);
}

.logo-mark {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: -0.5px;
  box-shadow: 0 2px 8px rgba(232, 93, 4, 0.35);
  transition: transform var(--transition-base) var(--ease-spring),
              box-shadow var(--transition-base);
}

.logo-mark:hover {
  transform: scale(1.08) rotate(-2deg);
  box-shadow: 0 4px 16px rgba(232, 93, 4, 0.45);
}

.logo-info {
  flex: 1;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--transition-base) var(--ease-smooth);
}

.sidebar.collapsed .logo-info {
  opacity: 0;
  width: 0;
}

.logo-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  line-height: 1.2;
  transition: color var(--transition-slow);
}

.logo-sub {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  margin-top: 1px;
  transition: color var(--transition-slow);
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 8px 10px 4px;
  white-space: nowrap;
  overflow: hidden;
  transition: color var(--transition-slow), opacity var(--transition-base);
}

.sidebar.collapsed .nav-section-label {
  opacity: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  transition: all var(--transition-fast) var(--ease-smooth);
  margin-bottom: 2px;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  background: var(--primary);
  border-radius: 0 2px 2px 0;
  transition: transform var(--transition-fast) var(--ease-spring);
}

.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
  transform: scale(1.02);
}

.nav-item:hover::before {
  transform: translateY(-50%) scaleY(1);
}

.nav-item:hover .nav-icon {
  transform: scale(1.12);
}

.nav-item.active {
  background: rgba(232, 93, 4, 0.08);
  color: var(--primary);
  font-weight: 600;
}

.nav-item.active::before {
  transform: translateY(-50%) scaleY(1);
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.nav-item.active .nav-icon {
  color: var(--primary);
}

[data-theme="dark"] .nav-item.active {
  background: rgba(244, 140, 6, 0.15);
}

[data-theme="dark"] .nav-item.active .nav-icon {
  color: var(--primary-light);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), transform var(--transition-fast) var(--ease-spring);
}

.nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.nav-label {
  flex: 1;
  opacity: 1;
  transition: opacity var(--transition-base) var(--ease-smooth);
}

.sidebar.collapsed .nav-label {
  opacity: 0;
  width: 0;
}

.nav-badge {
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  opacity: 1;
  transition: opacity var(--transition-base), transform var(--transition-fast) var(--ease-spring);
}

.sidebar.collapsed .nav-badge {
  opacity: 0;
  transform: scale(0.5);
}

.nav-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 10px;
  transition: background var(--transition-slow);
}

.sidebar-bottom {
  padding: 12px 10px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color var(--transition-slow);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
  border: none;
  background: transparent;
  width: 100%;
  transition: all var(--transition-fast) var(--ease-smooth);
}

.user-row:hover {
  background: var(--surface-2);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(232, 93, 4, 0.3);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast) var(--ease-spring);
}

.user-row:hover .user-avatar {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(232, 93, 4, 0.4);
}

.user-info {
  flex: 1;
  overflow: hidden;
  opacity: 1;
  transition: opacity var(--transition-base);
}

.sidebar.collapsed .user-info {
  opacity: 0;
  width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  text-align: left;
  transition: color var(--transition-slow);
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  text-align: left;
  transition: color var(--transition-slow);
}

.logout-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast), transform var(--transition-fast) var(--ease-spring);
}

.user-row:hover .logout-icon {
  opacity: 1;
  color: var(--warning);
  transform: scale(1.1);
}

.collapse-btn-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all var(--transition-fast) var(--ease-smooth);
  font-family: var(--font);
}

.collapse-btn-bottom:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  transform: scale(1.02);
}

.collapse-btn-bottom :deep(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.collapse-btn-label {
  flex: 1;
  text-align: left;
  opacity: 1;
  transition: opacity var(--transition-base) var(--ease-smooth);
}

.sidebar.collapsed .collapse-btn-label {
  opacity: 0;
  width: 0;
}

.sidebar-actions {
  display: flex;
  gap: 6px;
  padding: 4px 4px 0;
}

.icon-action-btn {
  flex: 1;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
}

.icon-action-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.icon-action-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(232, 93, 4, 0.3);
}

.icon-action-btn:active {
  transform: translateY(0);
}

.main-content {
  margin-left: calc(var(--sidebar-w) + 16px);
  background: var(--bg);
  padding: 24px;
  transition: margin-left var(--transition-slow) var(--ease-smooth),
              background var(--transition-slow) var(--ease-smooth);
  min-height: 100vh;
}

.sidebar.collapsed ~ .el-container .main-content {
  margin-left: calc(var(--sidebar-w-collapsed) + 16px);
}

@media (max-width: 768px) {
  .sidebar {
    left: 8px;
    top: 8px;
    bottom: 8px;
  }

  .main-content {
    margin-left: calc(var(--sidebar-w-collapsed) + 16px);
  }

  .sidebar.collapsed ~ .el-container .main-content {
    margin-left: calc(var(--sidebar-w-collapsed) + 16px);
  }
}
</style>