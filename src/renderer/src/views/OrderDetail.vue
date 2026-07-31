<template>
  <div class="order-detail-page">
    <div class="detail-topbar">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>返回</span>
      </button>
      <span v-if="order" class="status-tag" :class="getStatusClass(order.status)">
        {{ getStatusText(order.status) }}
      </span>
    </div>

    <div class="detail-hero" v-if="order">
      <div class="hero-meta">
        <div class="hero-label">订单号</div>
        <div class="hero-value mono">{{ order.order_no }}</div>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-meta">
        <div class="hero-label">下单时间</div>
        <div class="hero-value">{{ formatDateTime(order.created_at) }}</div>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-meta">
        <div class="hero-label">订单总额</div>
        <div class="hero-value hero-amount">¥{{ order.order_total }}</div>
      </div>
    </div>

    <div v-loading="loading" class="detail-grid">
      <div class="detail-main">
        <section class="info-card">
          <header class="info-card-header">
            <div class="header-icon" data-color="primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2>订单信息</h2>
          </header>
          <div class="info-grid" v-if="order">
            <div class="info-item">
              <span class="info-label">配送方式</span>
              <span class="info-value">
                <span class="delivery-tag" :class="order.delivery_method === 'self' ? 'delivery-tag-self' : 'delivery-tag-sf'">
                  {{ order.delivery_method === 'self' ? '自送' : '顺丰' }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">支付方式</span>
              <span class="info-value">{{ getPaymentMethod(order.payment_method) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">支付状态</span>
              <span class="info-value">
                <span class="status-tag" :class="order.payment_status === 'paid' ? 'status-delivered' : 'status-pending'">
                  {{ order.payment_status === 'paid' ? '已支付' : '未支付' }}
                </span>
              </span>
            </div>
            <div class="info-item" v-if="order.sf_tracking_no">
              <span class="info-label">顺丰单号</span>
              <span class="info-value mono">{{ order.sf_tracking_no }}</span>
            </div>
          </div>
        </section>

        <section class="info-card">
          <header class="info-card-header">
            <div class="header-icon" data-color="accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h2>商品明细</h2>
            <span class="header-meta" v-if="order">{{ order.items?.length || 0 }} 件</span>
          </header>
          <div class="items-list" v-if="order">
            <div v-for="(item, index) in order.items" :key="index" class="item-row">
              <div class="item-index">{{ index + 1 }}</div>
              <div class="item-main">
                <div class="item-name">{{ item.name }}</div>
              </div>
              <div class="item-qty">x{{ item.qty }}</div>
              <div class="item-price">¥{{ item.price }}</div>
              <div class="item-subtotal">¥{{ (item.qty * item.price).toFixed(2) }}</div>
            </div>
            <div class="items-summary">
              <div class="summary-line">
                <span class="summary-label">商品小计</span>
                <span class="summary-value">¥{{ order.order_total }}</span>
              </div>
              <div class="summary-line summary-total">
                <span class="summary-label">合计</span>
                <span class="summary-value summary-amount">¥{{ order.order_total }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="info-card" v-if="order && order.remark">
          <header class="info-card-header">
            <div class="header-icon" data-color="warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>备注</h2>
          </header>
          <p class="remark-text">{{ order.remark }}</p>
        </section>
      </div>

      <aside class="detail-side">
        <section class="info-card customer-card" v-if="order">
          <header class="info-card-header">
            <div class="header-icon" data-color="success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2>顾客信息</h2>
          </header>
          <div class="customer-info">
            <div class="customer-avatar">
              {{ (order.wechat_nickname || '?').charAt(0) }}
            </div>
            <div class="customer-details">
              <div class="customer-name">{{ order.wechat_nickname || '-' }}</div>
              <div class="customer-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="phone-icon">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>{{ order.phone || '未填写' }}</span>
              </div>
            </div>
          </div>

          <div class="address-block" v-if="order.address">
            <div class="address-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>送餐地址</span>
            </div>
            <p class="address-text">{{ order.address }}</p>
          </div>
        </section>

        <section class="info-card" v-if="order && order.timeline && order.timeline.length">
          <header class="info-card-header">
            <div class="header-icon" data-color="info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2>订单时间线</h2>
          </header>
          <div class="timeline">
            <div v-for="(log, index) in order.timeline" :key="index" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-action">{{ log.action }}</div>
                <div class="timeline-time">{{ formatDateTime(log.time) }}</div>
              </div>
            </div>
          </div>
        </section>

        <div class="action-buttons" v-if="order && order.status !== 'completed' && order.status !== 'cancelled'">
          <button class="btn btn-primary btn-lg action-btn" @click="openStatusDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>更新订单状态</span>
          </button>
        </div>
      </aside>
    </div>

    <div v-if="statusDialogVisible" class="dialog-mask" @click.self="closeStatusDialog">
      <div class="dialog-card status-dialog">
        <div class="dialog-header">
          <h3>更新订单状态</h3>
          <button class="dialog-close" @click="closeStatusDialog" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <div class="status-current-row">
            <span class="status-current-label">当前状态</span>
            <span class="status-tag" :class="getStatusClass(order?.status)">
              {{ currentStatusLabel }}
            </span>
          </div>

          <div class="status-select-row">
            <label class="status-select-label">选择新状态</label>
            <select v-model="newStatus" class="form-input form-select status-select">
              <option
                v-for="opt in statusOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeStatusDialog">取消</button>
          <button class="btn btn-primary" @click="submitStatusUpdate" :disabled="submitting">
            {{ submitting ? '更新中...' : '确定更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(false)
const statusDialogVisible = ref(false)
const newStatus = ref('')
const submitting = ref(false)

const statusOptions = [
  { value: 'pending', label: '待接单' },
  { value: 'preparing', label: '制作中' },
  { value: 'waiting_pickup', label: '待取餐' },
  { value: 'delivering', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const currentStatusLabel = computed(() => {
  if (!order.value) return ''
  return getStatusText(order.value.status)
})

const getStatusClass = (status) => {
  const map = {
    pending: 'status-pending',
    preparing: 'status-preparing',
    waiting_pickup: 'status-waiting',
    delivering: 'status-delivering',
    delivered: 'status-delivered',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }
  return map[status] || 'status-default'
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

const getPaymentMethod = (method) => {
  const map = { wechat: '微信支付', alipay: '支付宝', cash: '现金' }
  return map[method] || method || '-'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadOrder = async () => {
  loading.value = true
  try {
    const result = await api.order.get(route.params.id)
    if (result.code === 200) {
      order.value = result.data
    } else {
      ElMessage.error('加载订单失败')
      router.back()
    }
  } catch (error) {
    ElMessage.error('加载订单失败')
    router.back()
  } finally {
    loading.value = false
  }
}

const openStatusDialog = () => {
  newStatus.value = order.value?.status || ''
  statusDialogVisible.value = true
}

const closeStatusDialog = () => {
  statusDialogVisible.value = false
  newStatus.value = ''
}

const submitStatusUpdate = async () => {
  if (!newStatus.value) {
    ElMessage.warning('请选择新状态')
    return
  }
  if (newStatus.value === order.value.status) {
    ElMessage.warning('新状态与当前状态相同')
    return
  }

  submitting.value = true
  try {
    const result = await api.order.updateStatus(order.value.id, newStatus.value)
    if (result.code === 200) {
      ElMessage.success('状态更新成功')
      closeStatusDialog()
      loadOrder()
    } else {
      ElMessage.error(result.message || '更新失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail-page {
  width: 100%;
}

.detail-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
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

.back-btn :deep(svg),
.back-btn svg {
  width: 16px;
  height: 16px;
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(232, 93, 4, 0.04);
  transform: translateX(-2px);
}

.detail-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.hero-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.hero-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.hero-value.hero-amount {
  font-size: 24px;
  color: var(--primary);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.hero-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.status-pending { background: var(--warning-bg); color: var(--warning-text); }
.status-preparing { background: var(--info-bg); color: var(--info-text); }
.status-delivering { background: rgba(232, 93, 4, 0.12); color: var(--primary); }
.status-delivered,
.status-completed { background: var(--success-bg); color: var(--success-text); }
.status-cancelled { background: rgba(214, 40, 40, 0.12); color: var(--warning); }
.status-waiting { background: rgba(107, 33, 168, 0.12); color: #6B21A8; }
.status-default { background: var(--surface-2); color: var(--text-secondary); }

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.detail-main,
.detail-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.info-card:hover {
  box-shadow: var(--shadow-md);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}

.info-card-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon svg {
  width: 16px;
  height: 16px;
}

.header-icon[data-color="primary"] { background: rgba(232, 93, 4, 0.1); color: var(--primary); }
.header-icon[data-color="accent"] { background: rgba(250, 163, 7, 0.12); color: var(--accent); }
.header-icon[data-color="success"] { background: rgba(45, 106, 79, 0.12); color: var(--success); }
.header-icon[data-color="warning"] { background: rgba(214, 40, 40, 0.1); color: var(--warning); }
.header-icon[data-color="info"] { background: rgba(69, 123, 157, 0.12); color: #457B9D; }

.header-meta {
  font-size: 12px;
  color: var(--text-muted);
  padding: 3px 8px;
  background: var(--surface-2);
  border-radius: var(--radius-xs);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.info-value.mono {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
}

.delivery-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.delivery-tag-self { background: var(--success-bg); color: var(--success-text); }
.delivery-tag-sf { background: var(--info-bg); color: var(--info-text); }

.items-list {
  display: flex;
  flex-direction: column;
}

.item-row {
  display: grid;
  grid-template-columns: 24px 1fr 60px 80px 100px;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.item-row:last-child {
  border-bottom: none;
}

.item-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-main {
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-qty {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.item-price {
  font-size: 13px;
  color: var(--text-muted);
  text-align: right;
}

.item-subtotal {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  text-align: right;
}

.items-summary {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  color: var(--text);
  font-weight: 500;
}

.summary-line.summary-total {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.summary-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
}

.remark-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.customer-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(232, 93, 4, 0.25);
}

.customer-details {
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-phone {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.phone-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.address-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.address-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.address-label svg {
  width: 14px;
  height: 14px;
  color: var(--primary);
}

.address-text {
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 8px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border);
}

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  border: 3px solid var(--surface);
  box-shadow: 0 0 0 2px var(--primary);
  flex-shrink: 0;
  margin-top: 3px;
  z-index: 1;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-action {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.timeline-time {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-hero {
    flex-wrap: wrap;
    gap: 16px 24px;
  }

  .hero-divider {
    display: none;
  }
}

/* ===== Status Dialog ===== */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 24px;
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-light);
}

.dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.dialog-close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.dialog-close svg {
  width: 16px;
  height: 16px;
}

.dialog-close:hover {
  background: var(--surface-2);
  color: var(--text);
}

.dialog-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--border-light);
}

.dialog-footer .btn {
  min-width: 96px;
  justify-content: center;
}

.status-current-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.status-current-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.status-select-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-select-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.status-select {
  font-size: 14px;
  font-weight: 500;
}
</style>