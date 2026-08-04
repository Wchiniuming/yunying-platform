<template>
  <div class="od-page" v-loading="loading">
    <!-- ========== P0 顶栏：状态 + 总额 ========== -->
    <header v-if="order" class="od-topbar">
      <div class="od-topbar__left">
        <button class="od-back" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </button>
        <span class="od-divider-v" />
        <span class="od-status" :class="`od-status--${statusColor(order.status)}`">
          <span class="od-status__dot" />
          {{ getStatusText(order.status) }}
        </span>
        <span class="od-no">#{{ order.order_no }}</span>
      </div>
      <div class="od-topbar__right">
        <div class="od-meta">
          <span class="od-meta__label">下单时间</span>
          <span class="od-meta__value">{{ formatDateTime(order.created_at) }}</span>
        </div>
        <div class="od-meta od-meta--primary">
          <span class="od-meta__label">订单总额</span>
          <span class="od-meta__amount">¥{{ formatMoney(order.order_total) }}</span>
        </div>
      </div>
    </header>

    <!-- ========== P1 主信息卡：6 字段 3×2 栅格 ========== -->
    <section v-if="order" class="od-card">
      <div class="od-grid-3">
        <div class="od-field">
          <div class="od-field__label">顾客</div>
          <div class="od-field__value">
            <div class="od-customer">
              <span class="od-avatar">{{ avatarChar }}</span>
              <span class="od-customer__meta">
                <span class="od-customer__name">{{ order.wechat_nickname || '-' }}</span>
                <span class="od-customer__sub">{{ order.phone || '未填写' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="od-field">
          <div class="od-field__label">配送方式</div>
          <div class="od-field__value">
            <el-tag
              size="small"
              :type="order.delivery_method === 'self' ? 'warning' : 'primary'"
              effect="light"
            >
              {{ order.delivery_method === 'self' ? '自送' : '顺丰' }}
            </el-tag>
          </div>
        </div>

        <div class="od-field" v-if="orderTags.length > 0">
          <div class="od-field__label">订单标签</div>
          <div class="od-field__value">
            <div class="od-inline-tags">
              <span
                v-for="tag in orderTags"
                :key="tag.id"
                class="od-inline-tag"
                :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>

        <div class="od-field">
          <div class="od-field__label">支付方式</div>
          <div class="od-field__value">{{ getPaymentMethod(order.payment_method) }}</div>
        </div>

        <div class="od-field">
          <div class="od-field__label">联系电话</div>
          <div class="od-field__value od-mono">{{ order.phone || '未填写' }}</div>
        </div>

        <div class="od-field">
          <div class="od-field__label">顺丰单号</div>
          <div class="od-field__value od-mono od-sf-cell">
            <template v-if="editingSf">
              <input
                v-model="sfInput"
                class="sf-input"
                placeholder="输入顺丰单号"
                @keyup.enter="saveSfTracking"
              />
              <el-button type="primary" size="small" @click="saveSfTracking">保存</el-button>
              <el-button size="small" @click="editingSf = false">取消</el-button>
            </template>
            <template v-else>
              <span>{{ order.sf_tracking_no || '—' }}</span>
              <el-button v-if="order.sf_tracking_no" link size="small" @click="copyText(order.sf_tracking_no)">复制</el-button>
              <el-button link size="small" @click="openSfEdit">{{ order.sf_tracking_no ? '修改' : '补录' }}</el-button>
            </template>
          </div>
        </div>

        <div class="od-field">
          <div class="od-field__label">支付状态</div>
          <div class="od-field__value">
            <el-tag
              size="small"
              :type="order.payment_status === 'paid' ? 'success' : 'warning'"
              effect="light"
            >
              {{ order.payment_status === 'paid' ? '已支付' : '未支付' }}
            </el-tag>
          </div>
        </div>

        <div class="od-field od-field--full">
          <div class="od-field__label">送餐地址</div>
          <div class="od-field__value">
            <div class="od-address">
              <span class="od-address__text">{{ order.address || '到店自取' }}</span>
              <el-button v-if="order.address" link size="small" @click="copyText(order.address)">复制</el-button>
            </div>
          </div>
        </div>

        <div class="od-field od-field--full">
          <div class="od-field__label">订单标签</div>
          <div class="od-field__value">
            <div class="od-tags">
              <span
                v-for="tag in orderTags"
                :key="tag.id"
                class="od-tag-chip"
                :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
              >
                {{ tag.name }}
              </span>
              <el-button size="small" link @click="openTagDialog">
                <el-icon><Plus /></el-icon>
                管理标签
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========== P2 商品明细 + 时间线：左 2/3 + 右 1/3 ========== -->
    <section v-if="order" class="od-row-products">
      <!-- 左 2/3：商品明细 -->
      <div class="od-card od-card--lg">
        <header class="od-section__head">
          <h3 class="od-section__title">
            <i class="od-section__bar" />商品明细
          </h3>
          <div class="od-section__meta">
            <span>共 <b>{{ (order.items && order.items.length) || 0 }}</b> 件</span>
            <span class="od-section__divider" />
            <span>合计 <b class="od-amount">¥{{ formatMoney(orderTotal) }}</b></span>
          </div>
        </header>
        <el-table v-if="order.items && order.items.length" :data="order.items" class="od-table" size="small" :show-overflow-tooltip="false">
          <el-table-column type="index" label="#" width="56" align="center" />
          <el-table-column label="商品" min-width="0">
            <template #default="{ row }">
              <div class="od-item__name">{{ row.name }}</div>
              <div v-if="row.spec || row.unit" class="od-item__sub">
                <template v-if="row.spec">{{ row.spec }}</template>
                <template v-if="row.spec && row.unit"> · </template>
                <template v-if="row.unit">{{ row.unit }}</template>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110" align="right">
            <template #default="{ row }">¥{{ formatMoney(row.price) }}</template>
          </el-table-column>
          <el-table-column prop="qty" label="数量" width="80" align="center" />
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }">
              <span class="od-item__total">¥{{ formatMoney((row.price || 0) * (row.qty || 0)) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="od-table__empty">
          <el-icon class="od-table__empty-icon"><Goods /></el-icon>
          <span>暂无商品明细</span>
        </div>
      </div>

      <!-- 右 1/3：时间线 -->
      <div class="od-card od-card--sm">
        <header class="od-section__head">
          <h3 class="od-section__title od-section__title--info">
            <i class="od-section__bar" />订单时间线
          </h3>
          <span class="od-section__meta">{{ (order.timeline && order.timeline.length) || 0 }} 条</span>
        </header>
        <ol v-if="order.timeline && order.timeline.length" class="od-timeline">
          <li
            v-for="(log, i) in order.timeline"
            :key="i"
            class="od-timeline__item"
            :class="{ 'is-latest': i === order.timeline.length - 1 }"
          >
            <span class="od-timeline__dot" />
            <div class="od-timeline__content">
              <div class="od-timeline__action">{{ timelineAction(log) }}</div>
              <div class="od-timeline__time">{{ formatDateTime(timelineTime(log)) }}</div>
            </div>
          </li>
        </ol>
        <div v-else class="od-timeline__empty">
          <el-icon class="od-timeline__empty-icon"><Document /></el-icon>
          <span>暂无状态变更记录</span>
        </div>
      </div>
    </section>

    <!-- ========== P3 备注（独立行） ========== -->
    <section v-if="order && order.remark" class="od-card">
      <header class="od-section__head">
        <h3 class="od-section__title od-section__title--warning">
          <i class="od-section__bar" />备注
        </h3>
      </header>
      <div class="od-remark">{{ order.remark }}</div>
    </section>

    <!-- ========== P4 底部 sticky 操作栏 ========== -->
    <footer v-if="order" class="od-bar">
      <div class="od-bar__left">
        <span class="od-bar__hint">订单号 #{{ order.order_no }}</span>
      </div>
      <div class="od-bar__right">
        <button class="od-btn od-btn--ghost" @click="$router.back()">返回列表</button>
        <button
          v-if="!isFinalStatus(order.status)"
          class="od-btn od-btn--primary"
          @click="openStatusDialog"
        >
          <el-icon><Check /></el-icon>
          <span>更新状态</span>
        </button>
      </div>
    </footer>

    <!-- ========== 状态切换弹窗 ========== -->
    <el-dialog
      v-model="statusDialogVisible"
      title="更新订单状态"
      width="440px"
      :close-on-click-modal="false"
      align-center
    >
      <div class="od-dialog__row">
        <span class="od-dialog__label">当前状态</span>
        <span class="od-status" :class="`od-status--${statusColor(order && order.status)}`">
          <span class="od-status__dot" />
          {{ currentStatusLabel }}
        </span>
      </div>
      <div class="od-dialog__row">
        <label class="od-dialog__label">新状态</label>
        <el-select v-model="newStatus" placeholder="请选择新状态" class="od-dialog__select" size="default">
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          />
        </el-select>
      </div>
      <template #footer>
        <div class="od-dialog__footer">
          <button class="od-btn od-btn--ghost" @click="closeStatusDialog">取消</button>
          <button
            class="od-btn od-btn--primary"
            :disabled="submitting"
            @click="submitStatusUpdate"
          >
            {{ submitting ? '更新中…' : '确定更新' }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- ========== 标签管理弹窗 ========== -->
    <el-dialog
      v-model="showTagDialog"
      title="管理订单标签"
      width="480px"
      :close-on-click-modal="false"
      align-center
      @opened="loadAllOrderTags"
    >
      <div class="od-tag-grid">
        <div
          v-for="tag in allOrderTags"
          :key="tag.id"
          class="od-tag-item"
          :class="{ 'od-tag-item--selected': selectedTagIds.includes(tag.id) }"
          :style="selectedTagIds.includes(tag.id)
            ? { background: tag.color + '22', borderColor: tag.color, color: tag.color }
            : {}"
          @click="toggleTag(tag.id)"
        >
          <span class="od-tag-item__check" v-if="selectedTagIds.includes(tag.id)">✓</span>
          {{ tag.name }}
        </div>
      </div>
      <template #footer>
        <div class="od-dialog__footer">
          <button class="od-btn od-btn--ghost" @click="showTagDialog = false">取消</button>
          <button class="od-btn od-btn--primary" @click="saveOrderTags">保存</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check, Document, Goods, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(false)
const statusDialogVisible = ref(false)
const newStatus = ref('')
const submitting = ref(false)
const orderTags = ref([])
const allOrderTags = ref([])
const showTagDialog = ref(false)
const selectedTagIds = ref([])
const editingSf = ref(false)
const sfInput = ref('')

async function loadOrderTags() {
  if (!order.value) return
  try {
    const res = await api.order.getTags(order.value.id)
    if (res.code === 200) {
      orderTags.value = res.data
      selectedTagIds.value = res.data.map(t => t.id)
    }
  } catch {}
}

async function loadAllOrderTags() {
  try {
    const res = await api.tags.list({ category: 'order' })
    if (res.code === 200) {
      allOrderTags.value = res.data
    }
  } catch {}
}

function openTagDialog() {
  selectedTagIds.value = orderTags.value.map(t => t.id)
  showTagDialog.value = true
}

function toggleTag(tagId) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx === -1) {
    selectedTagIds.value.push(tagId)
  } else {
    selectedTagIds.value.splice(idx, 1)
  }
}

async function saveOrderTags() {
  submitting.value = true
  try {
    const res = await api.order.updateTags(order.value.id, { tag_ids: selectedTagIds.value })
    if (res.code === 200) {
      orderTags.value = res.data || []
      showTagDialog.value = false
      ElMessage.success('标签已更新')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

function openSfEdit() {
  sfInput.value = order.value.sf_tracking_no || ''
  editingSf.value = true
}

async function saveSfTracking() {
  try {
    const res = await api.order.update(order.value.id, { sf_tracking_no: sfInput.value.trim() })
    if (res.code === 200) {
      order.value.sf_tracking_no = sfInput.value.trim() || null
      editingSf.value = false
      ElMessage.success('顺丰单号已保存')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

// ===== 原状保留：状态字典 =====
const statusOptions = [
  { value: 'pending', label: '待接单' },
  { value: 'preparing', label: '制作中' },
  { value: 'waiting_pickup', label: '待取餐' },
  { value: 'delivering', label: '配送中' },
  { value: 'delivered', label: '已送达' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const STATUS_COLOR_MAP = {
  pending: 'warning',
  preparing: 'accent',
  waiting_pickup: 'info',
  delivering: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger'
}

const statusColor = (status) => STATUS_COLOR_MAP[status] || 'muted'

const currentStatusLabel = computed(() => {
  if (!order.value) return ''
  return getStatusText(order.value.status)
})

const getStatusText = (status) => {
  const map = {
    pending: '待接单', preparing: '制作中', waiting_pickup: '待取餐',
    delivering: '配送中', delivered: '已送达', completed: '已完成', cancelled: '已取消'
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

// ===== 新增辅助（仅 UI 用） =====
const formatMoney = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}
const avatarChar = computed(() => (order.value && order.value.wechat_nickname
  ? order.value.wechat_nickname.charAt(0) : '?'))
const orderTotal = computed(() => {
  if (!order.value || !order.value.items) return 0
  return order.value.items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0
  )
})
const isFinalStatus = (s) => s === 'completed' || s === 'cancelled'

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 时间线字段兜底：兼容后端不同版本（action vs remark vs old/new_status）
const hasStatus = (s) => s && STATUS_COLOR_MAP[s]
const timelineAction = (log) => {
  if (!log) return ''
  if (log.action) return log.action
  if (log.remark) return log.remark
  const from = hasStatus(log.old_status) ? getStatusText(log.old_status) : ''
  const to = hasStatus(log.new_status) ? getStatusText(log.new_status) : ''
  if (from && to) return `${from} → ${to}`
  return to || from || '状态更新'
}
const timelineTime = (log) => {
  if (!log) return ''
  return log.time || log.operate_time || log.created_at || ''
}

// ===== 原状保留：数据获取 =====
const loadOrder = async () => {
  loading.value = true
  try {
    const result = await api.order.get(route.params.id)
    if (result.code === 200) {
      order.value = result.data
      await loadOrderTags()
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

// ===== 原状保留：状态切换 =====
const openStatusDialog = () => {
  newStatus.value = order.value ? order.value.status : ''
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
/* ============================================================
   OrderDetail scoped - 全部以 od- 前缀命名
   严禁使用通用类名（.page / .card / .btn / .field / .tag /
   .topbar / .bar / .dialog / .timeline / .data-table / .section），
   防止与其它页面（Orders/CustomerDetail/OrderCreate 等）样式串扰。
   ============================================================ */

/* === 基线 === */
.od-page {
  --od-pad-card: 20px 24px;
  --od-gap: 16px;
  --od-radius: 12px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 96px;
}
.od-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--od-radius);
  padding: var(--od-pad-card);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

/* === 顶栏 P0 === */
.od-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--od-radius);
  box-shadow: var(--shadow-sm);
}
.od-topbar__left,
.od-topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.od-topbar__right { gap: 0; }
.od-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
}
.od-back:hover {
  background: var(--surface-2);
  color: var(--text);
}
.od-back .el-icon {
  font-size: 14px;
}
.od-divider-v {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 4px;
}
.od-no {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.2px;
}

.od-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: var(--surface-2);
  color: var(--text-secondary);
  white-space: nowrap;
}
.od-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.od-status--warning { background: var(--warning-bg); color: var(--warning-text); }
.od-status--accent  { background: rgba(250, 163, 7, 0.14); color: #B45309; }
.od-status--info    { background: var(--info-bg); color: var(--info-text); }
.od-status--success { background: var(--success-bg); color: var(--success-text); }
.od-status--danger  { background: rgba(214, 40, 40, 0.10); color: var(--warning); }
[data-theme="dark"] .od-status--accent { background: rgba(250, 163, 7, 0.22); }
[data-theme="dark"] .od-status--danger { background: rgba(214, 40, 40, 0.22); }

.od-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 16px;
}
.od-meta:first-child { padding-left: 0; }
.od-meta:last-child  { padding-right: 0; }
.od-meta + .od-meta { border-left: 1px solid var(--border); }
.od-meta__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}
.od-meta__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}
.od-meta--primary .od-meta__label { color: var(--primary); }
.od-meta__amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.3px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* === 主信息卡 P1：3 列等宽栅格 === */
.od-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 16px;
}
.od-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.od-field--full { grid-column: 1 / -1; }
.od-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.2px;
}
.od-field__value {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}
.od-mono {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
}
.od-customer { display: flex; align-items: center; gap: 10px; min-width: 0; }
.od-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.od-customer__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.od-customer__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.od-customer__sub {
  font-size: 12px;
  color: var(--text-muted);
}

.od-address {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  background: var(--surface-2);
  border-radius: 8px;
  border: 1px solid var(--border-light);
}
.od-address__text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
}

/* === 区段标题 === */
.od-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  flex-wrap: wrap;
}
.od-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.od-section__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--primary);
  display: inline-block;
}
.od-section__title--info    .od-section__bar { background: #457B9D; }
.od-section__title--warning .od-section__bar { background: var(--warning); }
.od-section__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
.od-section__divider {
  width: 1px;
  height: 12px;
  background: var(--border);
}
.od-amount {
  color: var(--primary);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* === 商品表 P2（覆盖 Element Plus 内部样式） === */
.od-table {
  --el-table-row-height: 40px;
  --el-table-border: 0;
  --el-table-border-color: transparent;
  --el-table-border-left-color: transparent;
  width: 100%;
  flex: 1;
  min-height: 0;
}
.od-table :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}
.od-table :deep(.el-table__cell) {
  padding: 6px 0;
}
.od-table :deep(.el-table__header-wrapper) th {
  background: var(--bg);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--text-muted);
}
.od-table :deep(.el-table__row) td {
  font-size: 13px;
}
.od-table :deep(.el-table),
.od-table :deep(.el-table__inner-wrapper),
.od-table :deep(.el-table__header-wrapper),
.od-table :deep(.el-table__body-wrapper),
.od-table :deep(.el-table__footer-wrapper) {
  border: 0 !important;
}
.od-table :deep(.el-table__row:last-child td),
.od-table :deep(.el-table__row--empty td),
.od-table :deep(td.el-table__cell) {
  border-bottom: 0 !important;
}
.od-table :deep(.el-table__inner-wrapper::after),
.od-table :deep(.el-table__border-left-patch) {
  display: none;
}
.od-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}
.od-table__empty-icon {
  font-size: 28px;
  color: var(--text-muted);
  opacity: 0.6;
}
.od-item__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}
.od-item__sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.3;
}
.od-item__total {
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* === 商品明细 + 时间线：左 2/3 + 右 1/3，等高 + 内部滚动 === */
.od-row-products {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: stretch;
}
.od-card--lg {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 320px;
}
.od-card--sm {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 320px;
}

.od-timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}
.od-timeline__item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 8px 0 8px 24px;
}
.od-timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 24px;
  bottom: -4px;
  width: 1px;
  background: var(--border);
}
.od-timeline__dot {
  position: absolute;
  left: 4px;
  top: 14px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid var(--text-muted);
  box-sizing: border-box;
  flex-shrink: 0;
}
.od-timeline__item.is-latest .od-timeline__dot {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(232, 93, 4, 0.15);
}
.od-timeline__item.is-latest .od-timeline__action {
  color: var(--primary);
  font-weight: 600;
}
.od-timeline__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.od-timeline__action {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}
.od-timeline__time {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Consolas', monospace;
}
.od-timeline__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  padding: 24px 16px;
}
.od-timeline__empty-icon {
  font-size: 28px;
  color: var(--text-muted);
  opacity: 0.6;
}

.od-remark {
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 16px;
  background: var(--warning-bg);
  color: var(--warning-text);
  border-left: 3px solid var(--warning);
  border-radius: 0 8px 8px 0;
  word-break: break-word;
}

/* === 底部 sticky 栏 P4 === */
.od-bar {
  position: sticky;
  bottom: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--od-radius);
  box-shadow: var(--shadow-md);
}
.od-bar__hint {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Consolas', monospace;
}
.od-bar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.od-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
  font-family: inherit;
  white-space: nowrap;
}
.od-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.od-btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 6px rgba(232, 93, 4, 0.25);
}
.od-btn--primary:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: 0 4px 12px rgba(232, 93, 4, 0.4);
  transform: translateY(-1px);
}
.od-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border);
}
.od-btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--text);
}
.od-btn .el-icon {
  font-size: 14px;
}

/* === 弹窗内 === */
.od-dialog__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.od-dialog__row + .od-dialog__row {
  border-top: 1px dashed var(--border-light);
}
.od-dialog__label {
  width: 80px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
}
.od-dialog__select {
  flex: 1;
  width: 100%;
}
.od-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* === 响应式 === */
@media (max-width: 1024px) {
  .od-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .od-row-products { grid-template-columns: 1fr 1fr; }
  .od-card--lg,
  .od-card--sm {
    height: 300px;
  }
}
.od-inline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.od-inline-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}
@media (max-width: 768px) {
  .od-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .od-topbar__right {
    justify-content: space-between;
    gap: 0;
  }
  .od-meta { padding: 0 8px; }
  .od-meta:first-child { padding-left: 0; }
  .od-meta:last-child { padding-right: 0; }
  .od-grid-3 { grid-template-columns: 1fr; }
  .od-row-products { grid-template-columns: 1fr; }
  .od-card--lg,
  .od-card--sm {
    height: auto;
    min-height: 280px;
  }
  .od-card--sm { position: static; }
  .od-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .od-bar__right {
    display: flex;
    gap: 8px;
  }
  .od-bar__right .od-btn { flex: 1; }
}

.od-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.od-tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.od-tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.od-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  border: 1px solid var(--border-light);
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}

.od-tag-item:hover {
  border-color: var(--primary);
}

.od-tag-item--selected {
  font-weight: 600;
}

.od-tag-item__check {
  font-size: 12px;
}

.sf-input {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: var(--surface);
  color: var(--text);
  outline: none;
  min-width: 160px;
}

.sf-input:focus {
  border-color: var(--primary);
}
</style>
