<template>
  <div class="cost-records-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">成本记录</h1>
        <p class="page-subtitle">登记非采购类成本（包装、配送、平台、营销、固定、人力）</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新增记录
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card--count">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="stat-svg">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ statsSummary.count }}</div>
          <div class="stat-label">总笔数</div>
        </div>
      </div>
      <div class="stat-card stat-card--total">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="stat-svg">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-body">
          <div class="stat-value stat-value--money">¥{{ statsSummary.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
          <div class="stat-label">总金额</div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-section">
      <!-- Type Tabs -->
      <div class="type-tabs">
        <button
          v-for="tab in typeTabs"
          :key="tab.key"
          class="type-tab"
          :class="[`type-tab--${tab.key}`, { 'type-tab--active': filters.type === tab.key }]"
          @click="selectType(tab.key)"
        >{{ tab.label }}</button>
      </div>

      <div class="filter-row">
        <div class="date-picker-wrap">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="onDateChange"
          />
        </div>
        <button v-if="filters.type || dateRange.length" class="btn-clear-filter" @click="clearFilters" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          清除筛选
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table :data="list" v-loading="loading" class="cost-table" empty-text="暂无记录">
        <el-table-column prop="record_date" label="日期" width="140" min-width="140" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <span class="type-pill" :class="`type-${row.type}`">{{ typeLabel(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="付款方式" width="110" align="center">
          <template #default="{ row }">
            <span class="cell-paymethod">{{ paymentLabel(row.payment_method) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130" align="right">
          <template #default="{ row }">
            <span class="cell-amount">¥{{ Number(row.amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="280" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="right" fixed="right">
          <template #default="{ row }">
            <button class="btn-action" @click="openEditDialog(row)">编辑</button>
            <button class="btn-action btn-action--danger" @click="handleDelete(row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑记录' : '新增记录'" width="580px" class="record-dialog" destroy-on-close>
      <div class="dialog-layout">
        <!-- 成本类型 -->
        <div class="dialog-section">
          <label class="section-label">成本类型</label>
          <div class="type-pills">
            <label
              v-for="tab in typeTabs.filter(t => t.key !== '')"
              :key="tab.key"
              class="type-pill-btn"
              :class="[`type-pill-btn--${tab.key}`, { 'type-pill-btn--active': form.type === tab.key }]"
            >
              <input type="radio" v-model="form.type" :value="tab.key" />
              {{ tab.label }}
            </label>
          </div>
        </div>

        <!-- 金额 + 日期 + 付款 -->
        <div class="dialog-section dialog-section--row">
          <div class="field-group field-group--amount">
            <label class="field-group-label">金额</label>
            <div class="amount-wrap">
              <span class="amount-prefix">¥</span>
              <el-input-number
                v-model="form.amount"
                :precision="2"
                :step="1"
                :min="0.01"
                controls-position="right"
                style="width: 108px;"
              />
            </div>
          </div>

          <div class="field-group field-group--date">
            <label class="field-group-label">日期</label>
            <el-date-picker
              v-model="form.record_date"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            />
          </div>

          <div class="field-group field-group--wide">
            <label class="field-group-label">付款方式</label>
            <div class="radio-pills">
              <label class="radio-pill" :class="{ 'radio-pill--active': form.payment_method === '现金' }">
                <input type="radio" v-model="form.payment_method" value="现金" />
                现金
              </label>
              <label class="radio-pill" :class="{ 'radio-pill--active': form.payment_method === '转账' }">
                <input type="radio" v-model="form.payment_method" value="转账" />
                转账
              </label>
              <label class="radio-pill" :class="{ 'radio-pill--active': form.payment_method === '挂账' }">
                <input type="radio" v-model="form.payment_method" value="挂账" />
                挂账
              </label>
            </div>
          </div>
        </div>

        <!-- 说明 -->
        <div class="dialog-section">
          <label class="section-label">说明</label>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="说明这笔成本的用途，可补充收据号、供应商等信息"
            resize="none"
            class="input-underline"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="dialogVisible = false">取消</button>
          <button class="btn btn-primary" @click="handleSave">保存</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const dateRange = ref([])
const editId = ref(null)

const typeTabs = [
  { key: '', label: '全部' },
  { key: 'packaging', label: '包装' },
  { key: 'delivery', label: '配送' },
  { key: 'platform', label: '平台佣金' },
  { key: 'marketing', label: '营销' },
  { key: 'fixed', label: '固定成本' },
  { key: 'labor', label: '人力' },
  { key: 'other', label: '其他' }
]

const typeMap = {
  packaging: '包装', delivery: '配送', platform: '平台佣金',
  marketing: '营销', fixed: '固定成本', labor: '人力', other: '其他'
}
const paymentMap = { cash: '现金', transfer: '转账', credit: '挂账' }

function typeLabel(v) { return typeMap[v] || v }
function paymentLabel(v) { return paymentMap[v] || v || '-' }

const filters = reactive({ type: '', start_date: '', end_date: '' })

const statsSummary = computed(() => {
  const count = list.value.length
  const total = list.value.reduce((s, r) => s + Number(r.amount || 0), 0)
  return { count, total }
})

const form = reactive({
  type: 'packaging', amount: 0, record_date: new Date().toISOString().slice(0, 10),
  payment_method: '现金', description: ''
})

function selectType(key) {
  filters.type = key
  loadData()
}

function clearFilters() {
  filters.type = ''
  dateRange.value = []
  filters.start_date = ''
  filters.end_date = ''
  loadData()
}

function onDateChange(val) {
  if (val && val.length === 2) {
    filters.start_date = val[0]
    filters.end_date = val[1]
  } else {
    filters.start_date = ''
    filters.end_date = ''
  }
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.costRecord.list({ ...filters })
    if (res.code === 200) list.value = res.data || []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { type: 'packaging', amount: 0, record_date: new Date().toISOString().slice(0, 10), payment_method: '现金', description: '' })
  editId.value = null
}

function openAddDialog() { resetForm(); dialogVisible.value = true }

function openEditDialog(row) {
  resetForm()
  Object.assign(form, { type: row.type, amount: row.amount, record_date: row.record_date, payment_method: row.payment_method || '现金', description: row.description || '', notes: row.notes || '' })
  editId.value = row.id
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.type) { ElMessage.warning('请选择类型'); return }
  if (!form.amount || form.amount <= 0) { ElMessage.warning('金额必须大于 0'); return }
  if (!form.record_date) { ElMessage.warning('请选择日期'); return }
  const res = editId.value
    ? await api.costRecord.update(editId.value, form)
    : await api.costRecord.create(form)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '保存失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除这条记录？', '删除确认', { type: 'warning' })
  } catch { return }
  const res = await api.costRecord.delete(row.id)
  if (res.code === 200) { ElMessage.success('已删除'); loadData() }
  else { ElMessage.error(res.message || '删除失败') }
}

onMounted(loadData)
</script>

<style scoped>
.cost-records-page { width: 100%; }

/* ===== Stats Grid ===== */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  transition: box-shadow var(--transition-base) var(--ease-smooth), transform var(--transition-base) var(--ease-smooth);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.stat-card-bg {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  border-radius: inherit;
}

.stat-card--count .stat-card-bg { background: var(--primary); }
.stat-card--total .stat-card-bg { background: var(--accent); }

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.stat-card--count .stat-icon-wrap { background: rgba(232, 93, 4, 0.1); }
.stat-card--total .stat-icon-wrap { background: rgba(250, 163, 7, 0.1); }

.stat-svg { width: 22px; height: 22px; color: var(--primary); }
.stat-card--total .stat-svg { color: var(--accent); }

.stat-body { position: relative; z-index: 1; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stat-value--money { color: var(--primary); }

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ===== Filter Section ===== */
.filter-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.type-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.type-tab {
  padding: 5px 14px;
  border: 1px solid var(--border);
  background: transparent;
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
  font-family: inherit;
}

.type-tab:hover {
  border-color: var(--primary-light);
  color: var(--primary);
}

.type-tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.type-tab--active.type-tab--packaging { background: #1565C0; border-color: #1565C0; }
.type-tab--active.type-tab--delivery { background: #E65100; border-color: #E65100; }
.type-tab--active.type-tab--platform { background: #6A1B9A; border-color: #6A1B9A; }
.type-tab--active.type-tab--marketing { background: #AD1457; border-color: #AD1457; }
.type-tab--active.type-tab--fixed { background: #37474F; border-color: #37474F; }
.type-tab--active.type-tab--labor { background: #00695C; border-color: #00695C; }
.type-tab--active.type-tab--other { background: var(--text-secondary); border-color: var(--text-secondary); }

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-picker-wrap :deep(.el-date-editor) {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.btn-clear-filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}
.btn-clear-filter svg { width: 12px; height: 12px; }
.btn-clear-filter:hover { color: var(--warning); border-color: var(--warning); }

/* ===== Table ===== */
.table-container { overflow: hidden; }

.cost-table {
  --el-table-border-color: var(--border);
  --el-table-header-bg-color: var(--surface-2);
  --el-table-row-hover-bg-color: rgba(232, 93, 4, 0.03);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.type-packaging { background: #E3F2FD; color: #1565C0; }
.type-delivery { background: #FFF3E0; color: #E65100; }
.type-platform { background: #F3E5F5; color: #6A1B9A; }
.type-marketing { background: #FCE4EC; color: #AD1457; }
.type-fixed { background: #ECEFF1; color: #37474F; }
.type-labor { background: #E0F2F1; color: #00695C; }
.type-other { background: var(--surface-2); color: var(--text-muted); }

.cell-paymethod {
  color: var(--text-secondary);
  font-size: 13px;
}

.cell-amount {
  font-weight: 700;
  color: var(--primary);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.btn-action {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  padding: 0 6px;
  font-family: inherit;
  transition: color var(--transition-fast);
}
.btn-action:hover { color: var(--primary-dark); text-decoration: underline; }
.btn-action--danger { color: var(--warning); }
.btn-action--danger:hover { color: #a31f1f; }

/* ===== Dialog ===== */
/* ===== Record Dialog ===== */
.record-dialog {
  width: min(92vw, 580px) !important;
  max-width: 580px;
}
.record-dialog :deep(.el-dialog__header) {
  padding: 16px 24px 14px;
  margin-right: 0;
  border-bottom: 1px solid var(--border-light);
}
.record-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  letter-spacing: -0.01em;
}
.record-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}
.record-dialog :deep(.el-dialog__footer) {
  padding: 14px 24px;
  border-top: 1px solid var(--border-light);
}

/* ===== Dialog Layout ===== */
.dialog-layout {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Dialog Section */
.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Horizontal row of fields */
.dialog-section--row {
  flex-direction: row;
  align-items: flex-end;
  gap: 20px;
  padding: 16px 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

/* Section label (left-aligned, above field) */
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Field Group: label + input stacked */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.field-group--wide {
  flex: 1;
  min-width: 0;
}

/* Fixed-width field groups for data row */
.field-group--amount {
  width: 140px;
  flex-shrink: 0;
}

.field-group--date {
  width: 150px;
  flex-shrink: 0;
}

.field-group-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* Amount with ¥ prefix */
.amount-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 140px;
}

.amount-prefix {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
  letter-spacing: -0.03em;
  flex-shrink: 0;
}

/* Underline-style input overrides for dialog (match theme's minimal aesthetic) */
.record-dialog :deep(.el-input__wrapper),
.record-dialog :deep(.el-input-number .el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  border-radius: 0 !important;
  border-bottom: 1.5px solid var(--border) !important;
  padding: 4px 0 !important;
  font-size: 14px !important;
  color: var(--text) !important;
  transition: border-color var(--transition-base) !important;
}

.record-dialog :deep(.el-input__wrapper:hover),
.record-dialog :deep(.el-input-number .el-input__wrapper:hover) {
  border-bottom-color: var(--primary-light) !important;
}

.record-dialog :deep(.el-input.is-focus .el-input__wrapper),
.record-dialog :deep(.el-input-number.is-focus .el-input__wrapper) {
  border-bottom-color: var(--primary) !important;
  box-shadow: none !important;
}

.record-dialog :deep(.el-input__inner),
.record-dialog :deep(.el-input-number .el-input__inner) {
  color: var(--text) !important;
  font-size: 14px !important;
}

.record-dialog :deep(.el-input-number__decrease),
.record-dialog :deep(.el-input-number__increase) {
  color: var(--text-secondary) !important;
  border-radius: var(--radius-xs) !important;
  transition: all var(--transition-fast) !important;
}

.record-dialog :deep(.el-input-number__decrease:hover),
.record-dialog :deep(.el-input-number__increase:hover) {
  color: var(--primary) !important;
}

/* Date picker underline style */
.record-dialog :deep(.el-date-editor) {
  width: 100% !important;
}
.record-dialog :deep(.el-date-editor .el-input__wrapper) {
  width: 100% !important;
}

/* Textarea underline style */
.record-dialog :deep(.el-textarea__inner) {
  box-shadow: none !important;
  background: transparent !important;
  border-radius: 0 !important;
  border-bottom: 1.5px solid var(--border) !important;
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  padding: 6px 0 !important;
  font-size: 14px !important;
  color: var(--text) !important;
  resize: none !important;
  transition: border-color var(--transition-base) !important;
  font-family: inherit !important;
}

.record-dialog :deep(.el-textarea__inner:hover) {
  border-bottom-color: var(--primary-light) !important;
}

.record-dialog :deep(.el-textarea.is-focus .el-textarea__inner) {
  border-bottom-color: var(--primary) !important;
}

/* Type Pills */
.type-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 15px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
  white-space: nowrap;
  background: var(--surface);
}

.type-pill-btn input { display: none; }

.type-pill-btn:hover {
  border-color: var(--primary-light);
  color: var(--primary);
  transform: translateY(-1px);
}

.type-pill-btn--active {
  color: #fff;
  border-color: transparent;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}
.type-pill-btn--active.type-pill-btn--packaging { background: #1565C0; }
.type-pill-btn--active.type-pill-btn--delivery { background: #E65100; }
.type-pill-btn--active.type-pill-btn--platform { background: #6A1B9A; }
.type-pill-btn--active.type-pill-btn--marketing { background: #AD1457; }
.type-pill-btn--active.type-pill-btn--fixed { background: #37474F; }
.type-pill-btn--active.type-pill-btn--labor { background: #00695C; }
.type-pill-btn--active.type-pill-btn--other { background: var(--text-secondary); }

/* Radio Pills */
.radio-pills { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

.radio-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
  background: var(--surface);
}
.radio-pill input { display: none; }
.radio-pill:hover {
  border-color: var(--primary-light);
  color: var(--primary);
  transform: translateY(-1px);
}
.radio-pill--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(232, 93, 4, 0.25);
}

/* ===== Dialog Footer ===== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ===== Shared Buttons ===== */
.btn-icon-svg { width: 14px; height: 14px; flex-shrink: 0; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1.5px solid transparent;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(232, 93, 4, 0.3);
}
.btn-primary:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  box-shadow: 0 4px 12px rgba(232, 93, 4, 0.4);
  transform: translateY(-1px);
}
.btn-secondary {
  background: var(--surface);
  color: var(--text-secondary);
  border-color: var(--border);
}
.btn-secondary:hover {
  background: var(--surface-2);
  color: var(--text);
  transform: translateY(-1px);
}

/* Element Plus border fix */
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
