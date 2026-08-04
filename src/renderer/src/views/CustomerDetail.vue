<template>
  <div class="customer-detail-page">
    <div class="back-section">
      <el-button class="back-btn" @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <div class="detail-header">
      <div class="detail-main">
        <h1 class="detail-title">顾客详情</h1>
      </div>
      <el-button type="primary" @click="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
    </div>

    <div v-loading="loading">
      <el-row :gutter="24" v-if="customer">
        <el-col :span="16">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <el-icon><User /></el-icon>
                <span>基本信息</span>
              </div>
            </template>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">微信昵称</span>
                <span class="info-value">{{ customer.wechat_nickname }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">顾客级别</span>
                <span class="info-value">
                  <span class="status-tag" :class="getLevelClass(customer.customer_level)">
                    {{ getLevelLabel(customer.customer_level) }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">电话</span>
                <span class="info-value">{{ customer.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">来源</span>
                <span class="info-value">{{ customer.source || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">地址</span>
                <span class="info-value">{{ customer.address || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">备注</span>
                <span class="info-value">{{ customer.remark || '-' }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="card mt-4">
            <template #header>
              <div class="card-header">
                <el-icon><PriceTag /></el-icon>
                <span>顾客标签</span>
                <el-button size="small" type="primary" plain class="ml-auto" @click="openTagDialog">
                  管理标签
                </el-button>
              </div>
            </template>

            <div class="tags-display" v-if="customer.tags && customer.tags.length > 0">
              <span
                v-for="tag in customer.tags"
                :key="tag.id"
                class="tag-chip"
                :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
              >
                {{ tag.name }}
              </span>
            </div>
            <div v-else class="text-muted" style="font-size:13px">暂无标签，点击"管理标签"添加</div>
          </el-card>

          <el-card class="card mt-4">
            <template #header>
              <div class="card-header">
                <el-icon><TrendCharts /></el-icon>
                <span>消费统计</span>
              </div>
            </template>

            <div class="grid-3">
              <div class="stat-card">
                <div class="stat-value">{{ customer.order_count || 0 }}</div>
                <div class="stat-label">订单数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ Number(customer.total_spent || 0).toFixed(2) }}</div>
                <div class="stat-label">累计消费</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">¥{{ avgOrderValue }}</div>
                <div class="stat-label">平均订单</div>
              </div>
            </div>
          </el-card>

          <el-card class="card mt-4">
            <template #header>
              <div class="card-header">
                <el-icon><Clock /></el-icon>
                <span>时间信息</span>
              </div>
            </template>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">首次下单</span>
                <span class="info-value">{{ formatDateTime(customer.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">最近下单</span>
                <span class="info-value">{{ formatDateTime(customer.last_order_at) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>最近订单</span>
              </div>
            </template>

            <div class="recent-orders">
              <div
                v-for="order in customer.recent_orders"
                :key="order.id"
                class="order-item"
                @click="goToOrder(order)"
              >
                <div class="order-header">
                  <span class="order-no">{{ order.order_no }}</span>
                  <el-tag :type="getStatusType(order.status)" size="small">
                    {{ getStatusText(order.status) }}
                  </el-tag>
                </div>
                <div class="order-info">
                  <span class="order-amount">¥{{ order.order_total }}</span>
                  <span class="order-time">{{ formatDate(order.created_at) }}</span>
                </div>
              </div>

              <el-empty v-if="!customer.recent_orders?.length" description="暂无订单" />

              <el-button
                v-if="customer.order_count > 3"
                type="primary"
                link
                class="view-all-btn"
                @click="$router.push({ path: '/orders', query: { customerId: customer.id, keyword: customer.wechat_nickname || '' } })"
              >
                查看全部 {{ customer.order_count }} 个订单
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="dialogVisible" title="编辑顾客" width="500px">
      <el-form ref="formRef" :model="customerForm" :rules="rules" label-width="80px">
        <el-form-item label="微信昵称" prop="wechat_nickname">
          <el-input v-model="customerForm.wechat_nickname" placeholder="顾客微信昵称" />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input v-model="customerForm.phone" placeholder="联系电话" />
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input v-model="customerForm.address" type="textarea" :rows="2" placeholder="送餐地址" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="customerForm.remark" type="textarea" :rows="2" placeholder="其他备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTagDialog" title="管理顾客标签" width="480px" :close-on-click-modal="false">
      <div class="tag-dialog-body">
        <p class="tag-dialog-tip">勾选该顾客的标签</p>
        <el-checkbox-group v-model="selectedTagIds" class="tag-checkbox-group">
          <el-checkbox
            v-for="tag in allTags"
            :key="tag.id"
            :value="tag.id"
            :label="tag.id"
            class="tag-checkbox-item"
          >
            <span
              class="tag-chip"
              :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
            >
              {{ tag.name }}
            </span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTags" :loading="tagSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User, Edit, Document, Clock, TrendCharts, PriceTag } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const customer = ref(null)
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

const showTagDialog = ref(false)
const allTags = ref([])
const selectedTagIds = ref([])
const tagSaving = ref(false)

const customerForm = reactive({
  wechat_nickname: '',
  phone: '',
  address: '',
  remark: ''
})

const rules = {
  wechat_nickname: [{ required: true, message: '请输入微信昵称', trigger: 'blur' }]
}

const avgOrderValue = computed(() => {
  if (!customer.value?.order_count) return '0.00'
  return (customer.value.total_spent / customer.value.order_count).toFixed(2)
})

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const formatDate = (time) => {
  if (!time) return '-'
  return dayjs(time).format('MM-DD HH:mm')
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    preparing: 'primary',
    waiting_pickup: 'info',
    delivering: 'primary',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待接单',
    preparing: '制作中',
    waiting_pickup: '待取餐',
    delivering: '配送中',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const customerLevels = [
  { value: 'normal', label: '普通顾客', cls: 'level-normal' },
  { value: 'vip', label: 'VIP 顾客', cls: 'level-vip' },
  { value: 'svip', label: 'SVIP 顾客', cls: 'level-svip' }
]

const getLevelClass = (level) => {
  const found = customerLevels.find(l => l.value === level)
  return found ? found.cls : 'level-normal'
}

const getLevelLabel = (level) => {
  const found = customerLevels.find(l => l.value === level)
  return found ? found.label : '普通顾客'
}

const goToOrder = (order) => {
  router.push(`/orders/${order.id}`)
}

const loadCustomer = async () => {
  loading.value = true
  try {
    const result = await api.customer.get(route.params.id)
    if (result.code === 200) {
      customer.value = result.data
    } else {
      ElMessage.error('加载顾客失败')
      router.back()
    }
  } catch (error) {
    ElMessage.error('加载顾客失败')
    router.back()
  } finally {
    loading.value = false
  }
}

const handleEdit = () => {
  Object.assign(customerForm, {
    wechat_nickname: customer.value.wechat_nickname,
    phone: customer.value.phone,
    address: customer.value.address,
    remark: customer.value.remark
  })
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      const result = await api.customer.update({
        id: customer.value.id,
        ...customerForm,
        tag_ids: selectedTagIds.value
      })

      if (result.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        loadCustomer()
      } else {
        ElMessage.error(result.message || '更新失败')
      }
    } catch (error) {
      ElMessage.error('更新失败')
    }
  })
}

async function openTagDialog() {
  try {
    const res = await api.tags.list()
    if (res.code === 200) {
      allTags.value = res.data
    }
    selectedTagIds.value = (customer.value.tags || []).map(t => t.id)
    showTagDialog.value = true
  } catch (e) {
    ElMessage.error('加载标签失败')
  }
}

async function handleSaveTags() {
  tagSaving.value = true
  try {
    const res = await api.customer.updateTags(customer.value.id, selectedTagIds.value)
    if (res.code === 200) {
      customer.value.tags = res.data
      ElMessage.success('标签已更新')
      showTagDialog.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    tagSaving.value = false
  }
}

onMounted(() => {
  loadCustomer()
})
</script>

<style scoped>
.customer-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.back-section {
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  transition: all var(--transition-base) var(--ease-smooth);
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base) var(--ease-smooth);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.mt-4 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text);
}

.card-header .el-icon {
  font-size: 18px;
  color: var(--primary);
}

.card-header .ml-auto {
  margin-left: auto;
  font-weight: 400;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item.full-width {
  grid-column: span 2;
}

.info-label {
  font-size: 13px;
  color: var(--text-muted);
}

.info-value {
  font-size: 15px;
  color: var(--text);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.recent-orders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  padding: 12px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-smooth);
}

.order-item:hover {
  background: var(--border);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-amount {
  font-weight: 600;
  color: var(--primary);
}

.order-time {
  font-size: 12px;
  color: var(--text-muted);
}

.view-all-btn {
  margin-top: 8px;
}

:deep(.el-button--primary) {
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: var(--primary-light);
  --el-button-hover-border-color: var(--primary-light);
  --el-button-active-bg-color: var(--primary-dark);
  --el-button-active-border-color: var(--primary-dark);
}

:deep(.el-card__header) {
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-dialog) {
  border-radius: var(--radius-lg);
}

:deep(.el-form-item__label) {
  color: var(--text);
}

:deep(.el-empty__description) {
  color: var(--text-muted);
}

[data-theme="dark"] {
  .card {
    background: var(--surface);
  }

  .stat-card {
    background: var(--surface-2);
  }

  .order-item {
    background: var(--surface-2);
  }

  .order-item:hover {
    background: var(--border);
  }
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.tag-dialog-body {
  padding: 4px 0;
}

.tag-dialog-tip {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 14px;
}

.tag-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-checkbox-item {
  margin-right: 0;
}
</style>
