<template>
  <div class="delivery-order-list">
    <div class="table-container">
      <el-table :data="orders" v-loading="loading" stripe class="table">
        <el-table-column prop="order_no" label="订单号" width="150" min-width="150">
          <template #default="{ row }">
            <span class="order-no">{{ row.order_no }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="wechat_nickname" label="顾客" width="120" min-width="100" />

        <el-table-column prop="address" label="配送地址" min-width="280">
          <template #default="{ row }">
            <div class="address-cell">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="address-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ row.address || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="delivery_method" label="配送方式" width="100" align="center">
          <template #default="{ row }">
            <span
              class="delivery-tag"
              :class="row.delivery_method === 'self' ? 'delivery-tag-self' : 'delivery-tag-sf'"
            >
              {{ row.delivery_method === 'self' ? '自送' : '顺丰' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="order_total" label="金额" width="110" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.order_total }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            <span class="time">{{ formatDateTime(row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="status === 'waiting_pickup' && row.delivery_method === 'sf'"
              type="primary"
              link
              size="small"
              class="btn-ghost-link"
              @click.stop="handleStartDelivery(row)"
            >
              开始配送
            </el-button>
            <el-button
              v-if="status === 'delivering'"
              type="success"
              link
              size="small"
              class="btn-ghost-link"
              @click.stop="handleMarkDelivered(row)"
            >
              确认送达
            </el-button>
            <el-button type="primary" link size="small" class="btn-ghost-link" @click.stop="goToDetail(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next"
        @size-change="loadOrders"
        @current-change="loadOrders"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'

const router = useRouter()

const props = defineProps({
  status: {
    type: String,
    default: 'waiting_pickup'
  },
  keyword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['refresh'])

const orders = ref([])
const loading = ref(false)

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

let searchTimer = null

const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadOrders()
  }, 300)
}

watch(() => props.keyword, () => {
  debouncedSearch()
})

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('HH:mm')
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('MM-DD HH:mm')
}

const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      status: props.status === 'all' ? '' : props.status,
      keyword: props.keyword
    }

    const result = await api.order.list(params)
    if (result.code === 200) {
      orders.value = result.data.list
      total.value = result.data.total
    }
  } catch (error) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const handleStartDelivery = async (row) => {
  try {
    const result = await api.order.updateStatus(row.id, 'delivering')
    if (result.code === 200) {
      ElMessage.success('已开始配送')
      loadOrders()
      emit('refresh')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleMarkDelivered = async (row) => {
  try {
    const result = await api.order.updateStatus(row.id, 'delivered')
    if (result.code === 200) {
      ElMessage.success('已确认送达')
      loadOrders()
      emit('refresh')
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const goToDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

watch(() => props.status, () => {
  page.value = 1
  loadOrders()
})

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.delivery-order-list {
  padding: 0;
}

.list-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-input {
  width: 200px;
}

.filter-input :deep(.el-input__wrapper) {
  background: var(--surface-2);
  border: 1px solid var(--border);
  box-shadow: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast) var(--ease-smooth);
}

.filter-input :deep(.el-input__wrapper:hover) {
  border-color: var(--primary-light);
}

.filter-input :deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(232, 93, 4, 0.1);
}

.filter-input :deep(.el-input__inner) {
  color: var(--text);
  font-size: 13px;
}

.filter-input :deep(.el-input__inner::placeholder) {
  color: var(--text-muted);
}

.filter-input :deep(.el-input__prefix) {
  color: var(--text-muted);
}

.table-container {
  background: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.table {
  font-size: 12px;
}

.table :deep(.el-table__header th.el-table__cell) {
  background: var(--surface-2) !important;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 10px !important;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}

.table :deep(.el-table__body td.el-table__cell) {
  padding: 8px 10px !important;
  font-size: 12px;
  color: var(--text);
  border-bottom: 1px solid var(--surface-2);
}

.table :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--surface-2) !important;
}

.table :deep(.el-table__row) {
  transition: background var(--transition-fast) var(--ease-smooth);
}

.address-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.address-cell .el-icon {
  color: var(--primary);
  font-size: 12px;
  flex-shrink: 0;
}

.delivery-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.delivery-tag-self {
  background: var(--success-bg);
  color: var(--success-text);
}

.delivery-tag-sf {
  background: var(--info-bg);
  color: var(--info-text);
}

.order-no {
  font-family: monospace;
  font-size: 12px;
  color: var(--text);
}

.amount {
  font-weight: 600;
  color: var(--primary);
}

.time {
  color: var(--text-muted);
  font-size: 11px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--surface-2);
}

.pagination-bar :deep(.el-pagination) {
  font-size: 12px;
}

.pagination-bar :deep(.el-pagination__total) {
  color: var(--text-muted);
  font-size: 12px;
}

.pagination-bar :deep(.el-pager li) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  min-width: 28px;
  height: 28px;
  line-height: 28px;
  transition: all var(--transition-fast) var(--ease-smooth);
}

.pagination-bar :deep(.el-pager li:hover) {
  color: var(--primary);
  border-color: var(--primary-light);
}

.pagination-bar :deep(.el-pager li.is-active) {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.pagination-bar :deep(.btn-prev),
.pagination-bar :deep(.btn-next) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast) var(--ease-smooth);
}

.pagination-bar :deep(.btn-prev:hover),
.pagination-bar :deep(.btn-next:hover) {
  color: var(--primary);
  border-color: var(--primary-light);
}

.pagination-bar :deep(.el-pagination__jump) {
  color: var(--text-muted);
  font-size: 12px;
}
</style>