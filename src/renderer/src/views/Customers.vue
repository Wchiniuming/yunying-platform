<template>
  <div class="customers-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">顾客管理</h1>
        <p class="page-subtitle">维护顾客资料与级别标签</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="handleAddCustomer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新增顾客</span>
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-customers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">顾客总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-avg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.vipCount || 0) + (stats.svipCount || 0) }}</div>
          <div class="stat-label">VIP 会员</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeCount || 0 }}</div>
          <div class="stat-label">活跃顾客</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-orders">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.monthNew || 0 }}</div>
          <div class="stat-label">本月新增</div>
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
          <div class="stat-value">¥{{ (stats.totalSpent || 0).toFixed(2) }}</div>
          <div class="stat-label">总消费额</div>
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
          <div class="stat-value">¥{{ stats.avgSpent || 0 }}</div>
          <div class="stat-label">人均消费</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="filters.keyword"
          placeholder="搜索顾客/电话/地址"
          @input="debouncedSearch"
        />
        <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''; debouncedSearch()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="customers" v-loading="loading" stripe class="table">
        <el-table-column prop="wechat_nickname" label="顾客" min-width="140">
          <template #default="{ row }">
            <div class="customer-name">
              <div class="avatar-circle avatar-circle-sm">{{ (row.wechat_nickname || '?').charAt(0) }}</div>
              <span class="customer-name-text">{{ row.wechat_nickname || '-' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="customer_level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="getLevelClass(row.customer_level)">
              {{ getLevelLabel(row.customer_level) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="标签" width="160" align="left">
          <template #default="{ row }">
            <div class="customer-tags-cell">
              <template v-for="tag in (row.tags || [])" :key="tag.id">
                <span
                  class="customer-tag-chip"
                  :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
                >
                  {{ tag.name }}
                </span>
              </template>
              <el-tooltip
                v-if="row.tags && row.tags.length > 2"
                placement="top"
                :content="row.tags.map(t => t.name).join('、')"
              >
                <span class="customer-tag-more">+{{ row.tags.length - 2 }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="电话" width="130" min-width="110" />

        <el-table-column prop="address" label="地址" min-width="280">
          <template #default="{ row }">
            <span class="address-text">{{ row.address || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="order_count" label="订单数" width="90" align="center">
          <template #default="{ row }">
            <span class="status-tag badge-secondary">{{ row.order_count || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="total_spent" label="累计消费" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ Number(row.total_spent || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="last_order_at" label="最近下单" width="160">
          <template #default="{ row }">
            <span class="time">{{ formatTime(row.last_order_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" class="btn-ghost-link" @click.stop="handleViewOrders(row)">
              订单
            </el-button>
            <el-button type="primary" link size="small" class="btn-ghost-link" @click.stop="handleEditCustomer(row)">
              编辑
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
          @size-change="loadCustomers"
          @current-change="loadCustomers"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增顾客' : '编辑顾客'" width="440px">
      <el-form ref="formRef" :model="customerForm" :rules="rules" label-width="80px" size="default">
        <el-form-item label="昵称" prop="wechat_nickname">
          <el-input v-model="customerForm.wechat_nickname" placeholder="顾客微信昵称" />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input v-model="customerForm.phone" placeholder="联系电话" />
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input v-model="customerForm.address" type="textarea" :rows="2" placeholder="送餐地址" />
        </el-form-item>

        <el-form-item label="顾客级别">
          <div class="level-pills">
            <button
              type="button"
              class="level-pill"
              :class="{ active: customerForm.customer_level === 'normal' }"
              @click="customerForm.customer_level = 'normal'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="level-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>普通</span>
            </button>
            <button
              type="button"
              class="level-pill"
              :class="{ active: customerForm.customer_level === 'vip' }"
              @click="customerForm.customer_level = 'vip'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="level-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>VIP</span>
            </button>
            <button
              type="button"
              class="level-pill"
              :class="{ active: customerForm.customer_level === 'svip' }"
              @click="customerForm.customer_level = 'svip'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="level-icon"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>SVIP</span>
            </button>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="customerForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tag-compact-wrap">
            <div
              v-for="(group, gIdx) in groupedTags"
              :key="group.key"
              class="tag-compact-group"
              :class="{ 'tag-compact-group--separated': gIdx > 0 }"
            >
              <div class="tag-compact-group__header">
                <span class="tag-compact-group__label">{{ group.label }}</span>
                <div class="tag-compact-group__items">
                  <button
                    v-for="tag in group.tags"
                    :key="tag.id"
                    type="button"
                    class="tag-dot-btn"
                    :class="{ active: selectedTagIds.includes(tag.id) }"
                    :style="selectedTagIds.includes(tag.id)
                      ? { color: tag.color }
                      : {}"
                    @click="toggleTag(tag.id)"
                  >
                    <span
                      class="tag-dot"
                      :class="{ visible: selectedTagIds.includes(tag.id) }"
                      :style="selectedTagIds.includes(tag.id) ? { background: tag.color } : {}"
                    ></span>
                    {{ tag.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button size="default" class="btn btn-secondary" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="default" class="btn btn-primary" @click="handleSaveCustomer">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, UserFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'

const router = useRouter()

const customers = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const allCustomerTags = ref([])
const selectedTagIds = ref([])

const TAG_CATEGORIES = [
  { key: 'source', label: '来源' },
  { key: 'order', label: '订单' },
  { key: 'other', label: '其他' }
]

const groupedTags = computed(() => {
  const map = {}
  TAG_CATEGORIES.forEach(c => { map[c.key] = [] })
  allCustomerTags.value.forEach(tag => {
    if (map[tag.category]) map[tag.category].push(tag)
  })
  return TAG_CATEGORIES.filter(c => map[c.key].length > 0).map(c => ({
    ...c,
    tags: map[c.key]
  }))
})
const dialogMode = ref('add')
const formRef = ref()

const filters = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  total: 0,
  todayNew: 0,
  monthNew: 0,
  vipCount: 0,
  svipCount: 0,
  activeCount: 0,
  totalSpent: 0,
  avgSpent: 0
})

const customerForm = reactive({
  id: null,
  wechat_nickname: '',
  phone: '',
  address: '',
  remark: '',
  customer_level: 'normal'
})

const customerLevels = [
  { value: 'normal', label: '普通', cls: 'level-normal' },
  { value: 'vip', label: 'VIP', cls: 'level-vip' },
  { value: 'svip', label: 'SVIP', cls: 'level-svip' }
]

const getLevelClass = (level) => {
  const found = customerLevels.find(l => l.value === level)
  return found ? found.cls : 'level-normal'
}

const getLevelLabel = (level) => {
  const found = customerLevels.find(l => l.value === level)
  return found ? found.label : '普通'
}

const rules = {
  wechat_nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && !/^1[3-9]\d{9}$/.test(value.trim())) {
          callback(new Error('手机号格式不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

let searchTimer = null

const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    loadCustomers()
  }, 300)
}

const getOrderCountType = (count) => {
  if (!count || count === 0) return 'info'
  if (count === 1) return 'warning'
  if (count <= 5) return ''
  return 'success'
}

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('MM-DD')
}

const loadCustomers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword
    }

    const result = await api.customer.list(params)
    if (result.code === 200) {
      customers.value = result.data.list
      pagination.total = result.data.total
    }
  } catch (error) {
    ElMessage.error('加载顾客失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const result = await api.customer.stats()
    if (result.code === 200) {
      Object.assign(stats, result.data)
    }
  } catch (error) {
    console.error('加载顾客统计失败:', error)
  }
}

function toggleTag(tagId) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx === -1) {
    selectedTagIds.value.push(tagId)
  } else {
    selectedTagIds.value.splice(idx, 1)
  }
}

async function loadCustomerTags() {
  try {
    const res = await api.tags.list()
    if (res.code === 200) {
      // 只显示未删除的分类（source/order/other）
      allCustomerTags.value = res.data.filter(t => ['source', 'order', 'other'].includes(t.category))
    }
  } catch {}
}

const handleAddCustomer = async () => {
  dialogMode.value = 'add'
  Object.assign(customerForm, {
    id: null,
    wechat_nickname: '',
    phone: '',
    address: '',
    remark: '',
    customer_level: 'normal'
  })
  selectedTagIds.value = []
  await loadCustomerTags()
  dialogVisible.value = true
}

const handleEditCustomer = async (row) => {
  dialogMode.value = 'edit'
  selectedTagIds.value = []
  Object.assign(customerForm, {
    id: row.id,
    wechat_nickname: row.wechat_nickname || '',
    phone: row.phone || '',
    address: row.address || '',
    remark: row.remark || '',
    customer_level: row.customer_level || 'normal'
  })
  await loadCustomerTags()
  try {
    const res = await api.customer.getTags(row.id)
    if (res.code === 200) {
      selectedTagIds.value = res.data.map(t => t.id)
    }
  } catch {}
  dialogVisible.value = true
}

const handleSaveCustomer = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const payload = { ...customerForm, tag_ids: selectedTagIds.value }
      const result = dialogMode.value === 'add'
        ? await api.customer.create(payload)
        : await api.customer.update({ id: customerForm.id, ...payload })

      if (result.code === 200) {
        ElMessage.success(dialogMode.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        loadCustomers()
        loadStats()
      } else {
        ElMessage.error(result.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

const handleViewOrders = (row) => {
  router.push({
    path: '/orders',
    query: {
      customerId: row.id,
      keyword: row.wechat_nickname || ''
    }
  })
}

onMounted(() => {
  loadCustomers()
  loadStats()
})
</script>

<style scoped>
.customers-page {
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

[data-theme="dark"] .customers-page {
  --bg: #1C1917;
  --surface: #292524;
  --surface-2: #1C1917;
  --border: #44403C;
  --text: #FAFAF9;
  --text-secondary: #D6D3D1;
  --text-muted: #78716C;
}

.filter-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.table-container {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
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

.customer-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
}

.address-text {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
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
  box-shadow: var(--shadow-glow);
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(232, 93, 4, 0.4);
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

:deep(.el-dialog) {
  border-radius: var(--radius-lg);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid var(--border);
  padding: var(--radius-md) var(--radius-lg);
}

:deep(.el-dialog__body) {
  padding: var(--radius-lg);
}

:deep(.el-dialog__footer) {
  border-top: 1px solid var(--border);
  padding: var(--radius-md) var(--radius-lg);
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
}

:deep(.el-input__wrapper) {
  background: var(--surface);
  border-color: var(--border);
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary);
}

:deep(.el-textarea__inner) {
  background: var(--surface);
  border-color: var(--border);
}

:deep(.el-textarea__inner:hover),
:deep(.el-textarea__inner:focus) {
  border-color: var(--primary);
}

.customer-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
}

.customer-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 0 1 auto;
  min-width: 0;
}

.level-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.level-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
  font-family: var(--font);
}

.level-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(232, 93, 4, 0.04);
}

.level-pill.active {
  border-color: var(--primary);
  background: rgba(232, 93, 4, 0.08);
  color: var(--primary);
  font-weight: 600;
}

.level-pill .level-icon {
  width: 14px;
  height: 14px;
}

.tag-compact-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tag-compact-group {
  width: 100%;
}

.tag-compact-group--separated {
  border-top: 1px solid var(--border-light);
  margin-top: 6px;
  padding-top: 6px;
}

.tag-compact-group__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tag-compact-group__label {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 40px;
  padding-top: 3px;
  text-align: right;
  flex-shrink: 0;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.7;
}

.tag-compact-group__items {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.tag-dot-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px 2px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 450;
  letter-spacing: 0.01em;
  border: none;
  background: none;
  cursor: pointer;
  user-select: none;
  transition: color 0.12s, background 0.12s;
  color: var(--text-secondary);
  line-height: 1.7;
}

.tag-dot-btn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.tag-dot-btn.active {
  font-weight: 500;
}

.tag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.12s;
}

.tag-dot.visible {
  background: currentColor;
  opacity: 0.8;
}

.customer-tags-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1;
}

.customer-tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

.customer-tag-more {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
