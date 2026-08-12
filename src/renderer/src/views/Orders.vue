<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">订单管理</h1>
        <p class="page-subtitle">查看和处理所有订单</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="$router.push('/orders/create')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新增订单</span>
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-orders">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ orderStats.totalOrders || 0 }}</div>
          <div class="stat-label">总订单</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-orders">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ orderStats.monthOrders || 0 }}</div>
          <div class="stat-label">本月订单</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-revenue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatMoney(orderStats.totalRevenue) }}</div>
          <div class="stat-label">总营收</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-revenue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatMoney(orderStats.monthRevenue) }}</div>
          <div class="stat-label">本月营收</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ orderStats.pendingOrders || 0 }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-avg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatMoney(orderStats.avgOrderValue) }}</div>
          <div class="stat-label">客单价</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-input">
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          size="small"
          @change="loadOrders"
        />
      </div>

      <div class="filter-select">
        <StatusFilterDropdown
          v-model="filters.status"
          placeholder="状态"
          @change="loadOrders"
        />
      </div>

      <div class="filter-input">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索顾客/订单号"
          :prefix-icon="Search"
          size="small"
          clearable
          @input="debouncedSearch"
        />
      </div>
    </div>

    <div v-if="filters.customerId" class="filter-chip-row">
      <div class="filter-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chip-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>仅显示「<strong>{{ filters.customerName || '该顾客' }}</strong>」的订单</span>
        <button class="chip-close" @click="clearCustomerFilter" aria-label="清除筛选">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        :data="orders"
        v-loading="loading"
        stripe
        class="table"
        @row-click="handleRowClick"
      >
        <el-table-column prop="order_no" label="订单号" width="150" min-width="150">
          <template #default="{ row }">
            <span class="order-no">{{ row.order_no }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="wechat_nickname" label="顾客" width="120" min-width="100" />

        <el-table-column prop="items" label="商品" min-width="280">
          <template #default="{ row }">
            <span class="items-summary">{{ getItemsSummary(row.items) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="order_total" label="金额" width="110" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.order_total }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="delivery_method" label="配送" width="90" align="center">
          <template #default="{ row }">
            <span
              class="delivery-tag"
              :class="row.delivery_method === 'self' ? 'delivery-tag-self' : 'delivery-tag-sf'"
            >
              {{ row.delivery_method === 'self' ? '自送' : '顺丰' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="getStatusClass(row.status)">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            <span class="time">{{ formatDateTime(row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" class="btn-ghost-link" @click.stop="goToDetail(row)">
              查看详情
            </el-button>
            <el-button type="danger" link size="small" class="btn-ghost-link" @click.stop="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, prev, pager, next"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'
import StatusFilterDropdown from '@/components/StatusFilterDropdown.vue'

const router = useRouter()
const route = useRoute()

const orders = ref([])
const loading = ref(false)

const orderStats = reactive({
  totalOrders: 0,
  totalRevenue: 0,
  monthOrders: 0,
  monthRevenue: 0,
  todayOrders: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  avgOrderValue: 0,
  cancelledToday: 0
})

const filters = reactive({
  dateRange: [],
  status: '',
  keyword: '',
  customerId: null,
  customerName: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

let searchTimer = null

const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    loadOrders()
  }, 300)
}

const getItemsSummary = (items) => {
  if (!items || !Array.isArray(items) || !items.length) return '-'
  return items.map(i => `${i.name}${i.qty > 1 ? `x${i.qty}` : ''}`).join(' + ')
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    preparing: '',
    waiting_pickup: 'info',
    delivering: '',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || ''
}

const getStatusClass = (status) => {
  const map = {
    pending: 'status-pending',
    preparing: 'status-active',
    waiting_pickup: 'status-info',
    delivering: 'status-active',
    delivered: 'status-success',
    completed: 'status-success',
    cancelled: 'status-danger'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '待接单',
    preparing: '制作中',
    waiting_pickup: '待取',
    delivering: '配送中',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatMoney = (value) => {
  const n = Number(value) || 0
  return n.toFixed(2)
}

const loadOrderStats = async () => {
  try {
    const result = await api.order.stats()
    if (result.code === 200) {
      Object.assign(orderStats, result.data || {})
    }
  } catch (error) {
    console.error('加载订单统计失败:', error)
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status,
      keyword: filters.keyword
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }

    if (filters.customerId) {
      params.customerId = filters.customerId
    }

    const result = await api.order.list(params)
    if (result.code === 200) {
      orders.value = result.data.list
      pagination.total = result.data.total
    }
  } catch (error) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const clearCustomerFilter = () => {
  filters.customerId = null
  filters.customerName = ''
  filters.keyword = ''
  router.replace({ path: '/orders', query: {} })
  pagination.page = 1
  loadOrders()
}

const handleRowClick = (row) => {
  router.push(`/orders/${row.id}`)
}

const goToDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除订单"${row.order_no}"？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    const res = await api.order.delete(row.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      loadOrders()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  const { customerId, keyword } = route.query
  if (customerId) {
    filters.customerId = Number(customerId)
    filters.customerName = String(keyword || '')
    if (keyword) {
      filters.keyword = String(keyword)
    }
  }
  loadOrders()
  loadOrderStats()
})
</script>

<style scoped>
.orders-page {
  width: 100%;
  --primary: #E85D04;
  --primary-dark: #DC2F02;
  --primary-light: #F48C06;
  --accent: #FAA307;
  --bg: #FAFAF9;
  --surface: #FFFFFF;
  --surface-2: #F5F5F4;
  --border: #E7E5E4;
  --text: #1C1917;
  --text-secondary: #57534E;
  --text-muted: #A8A29E;
  --success: #2D6A4F;
  --warning: #D62828;
  --info-bg: #DBEAFE;
  --info-text: #1E40AF;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-fast: 150ms;
  --transition-base: 200ms;
}

[data-theme="dark"] .orders-page {
  --bg: #1C1917;
  --surface: #292524;
  --surface-2: #1C1917;
  --border: #44403C;
  --text: #FAFAF9;
  --text-secondary: #D6D3D1;
  --text-muted: #78716C;
}

.filter-chip-row {
  margin: -8px 0 16px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 12px;
  background: rgba(232, 93, 4, 0.08);
  border: 1px solid rgba(232, 93, 4, 0.25);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--primary);
  font-weight: 500;
}

.filter-chip strong {
  font-weight: 600;
}

.chip-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.chip-close {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.chip-close svg {
  width: 12px;
  height: 12px;
}

.chip-close:hover {
  background: var(--primary);
  color: #fff;
}

.table-container {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

.table-container :deep(.el-table__row) {
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--ease-smooth);
}

.table-container :deep(.el-table__row:hover) {
  background-color: rgba(232, 93, 4, 0.03) !important;
}

.table :deep(th.el-table__cell) {
  background: var(--surface-2) !important;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--radius-md) var(--radius-md) !important;
}

.table :deep(td.el-table__cell) {
  padding: var(--radius-md) var(--radius-md) !important;
  font-size: 13px;
  color: var(--text);
}

.items-summary {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
}

.order-no {
  font-family: monospace;
  color: var(--text);
}

.amount {
  font-weight: 600;
  color: var(--text);
}

.time {
  color: var(--text-muted);
  font-size: 12px;
}

.status-tag {
  border-radius: var(--radius-sm);
  font-size: 11px;
  padding: 2px 8px;
  font-weight: 500;
  border: none;
}

.status-tag.status-pending {
  background: rgba(214, 40, 40, 0.1);
  color: #D62828;
}

.status-tag.status-active {
  background: rgba(232, 93, 4, 0.1);
  color: #E85D04;
}

.status-tag.status-info {
  background: var(--info-bg);
  color: var(--info-text);
}

.status-tag.status-success {
  background: rgba(45, 106, 79, 0.1);
  color: #2D6A4F;
}

.status-tag.status-danger {
  background: rgba(214, 40, 40, 0.1);
  color: #D62828;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
  outline: none;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(232, 93, 4, 0.3);
}

.btn-primary:hover {
  box-shadow: var(--shadow-glow-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(232, 93, 4, 0.3);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}

.btn-secondary:hover {
  background: var(--surface-2);
  border-color: var(--text-muted);
}

.btn-ghost {
  background: transparent;
  color: var(--primary);
  padding: 2px 4px;
}

.btn-ghost:hover {
  background: rgba(232, 93, 4, 0.05);
  color: var(--primary-dark);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: var(--radius-md) var(--radius-md);
  border-top: 1px solid var(--border);
}

.pagination :deep(.el-pagination) {
  --el-pagination-button-bg-color: var(--surface);
  --el-pagination-button-color: var(--text);
  --el-pagination-hover-color: var(--primary);
}

:deep(.el-table) {
  --el-table-border-color: var(--border);
  --el-table-header-bg-color: var(--surface-2);
  --el-table-tr-bg-color: var(--surface);
  --el-table-row-hover-bg-color: rgba(232, 93, 4, 0.03);
}

:deep(.el-tag) {
  border-radius: var(--radius-sm);
}

/* 订单管理页 filter 边框终极修复
   Element Plus 在嵌套的 __wrapper 元素上设置 box-shadow 边框 */
.filter-input :deep(.el-date-editor),
.filter-input :deep(.el-range-editor),
.filter-input :deep(.el-range-editor--small),
.filter-input :deep(.el-tooltip__trigger),
.filter-input :deep(.el-input__wrapper),
.filter-input :deep(.el-select__wrapper) {
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
}

.filter-input :deep(.el-date-editor:hover),
.filter-input :deep(.el-date-editor:focus),
.filter-input :deep(.el-range-editor:hover),
.filter-input :deep(.el-range-editor:focus),
.filter-input :deep(.el-input__wrapper:hover),
.filter-input :deep(.el-input__wrapper:focus-within) {
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
}
</style>
