<template>
  <div class="cost-procurements-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">采购入库</h1>
        <p class="page-subtitle">登记原材料采购记录，库存自动更新</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" @click="downloadImportTemplate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载模板
        </button>
        <button class="btn btn-secondary" @click="openImportDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Excel 导入
        </button>
        <button class="btn btn-primary" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-svg">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          登记采购
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card--count">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon class="stat-icon"><Document /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ summary.count }}</div>
          <div class="stat-label">本期采购笔数</div>
        </div>
      </div>
      <div class="stat-card stat-card--total">
        <div class="stat-card-bg"></div>
        <div class="stat-icon-wrap">
          <el-icon class="stat-icon"><Money /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-value stat-value--money">¥{{ summary.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
          <div class="stat-label">本期采购总额</div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-section">
      <!-- Quick Date Tabs -->
      <div class="quick-filters">
        <button
          v-for="tab in quickDateTabs"
          :key="tab.key"
          class="quick-tab"
          :class="{ 'quick-tab--active': activeQuickDate === tab.key }"
          @click="applyQuickDate(tab)"
        >{{ tab.label }}</button>
      </div>

      <div class="filter-row">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="filters.keyword"
            placeholder="搜索供应商 / 材料 / 备注"
            @input="debouncedLoad"
          />
          <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''; loadData()" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
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
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table :data="list" v-loading="loading" class="cost-table" empty-text="暂无采购记录">
        <el-table-column prop="purchase_date" label="采购日期" width="140" min-width="140" />
        <el-table-column label="供应商" min-width="140">
          <template #default="{ row }">
            <span class="cell-supplier">{{ row.supplier_name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="材料" min-width="180">
          <template #default="{ row }">
            <span class="cell-material">
              <strong>{{ row.material_name }}</strong>
              <span class="cell-material-unit">({{ row.material_unit }})</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="90" align="right">
          <template #default="{ row }">{{ row.quantity }}</template>
        </el-table-column>
        <el-table-column label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ Number(row.unit_price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="cell-amount">¥{{ Number(row.total_amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="付款" width="100" align="center">
          <template #default="{ row }">
            <span class="cell-paymethod">{{ row.payment_method || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.payment_status === 'paid' ? 'status-badge--paid' : 'status-badge--unpaid'">
              <span class="status-dot"></span>
              {{ row.payment_status === 'paid' ? '已付' : '挂账' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="right" fixed="right">
          <template #default="{ row }">
            <button class="btn-action" @click="openEditDialog(row)">编辑</button>
            <button class="btn-action btn-action--danger" @click="handleDelete(row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Procurement Dialog -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑采购' : '登记采购'" width="min(90vw, 1100px)" class="procurement-dialog" destroy-on-close>
      <div class="dialog-layout">
        <!-- 顶部：基本信息 + 付款信息（横向两列） -->
        <div class="dialog-top">
          <!-- 基本信息卡片 -->
          <div class="info-card">
            <div class="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="info-card-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span class="info-card-title">基本信息</span>
            </div>
            <div class="info-card-body">
              <div class="form-field form-field--full">
                <label class="form-label">供应商</label>
                <el-input v-model="form.supplier_name" placeholder="请输入供应商名称" size="default" />
              </div>
              <div class="form-field form-field--narrow">
                <label class="form-label">采购日期</label>
                <el-date-picker v-model="form.purchase_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
              </div>
            </div>
          </div>

          <!-- 付款信息卡片 -->
          <div class="info-card">
            <div class="info-card-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="info-card-icon">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span class="info-card-title">付款信息</span>
            </div>
            <div class="info-card-body">
              <!-- 付款方式 + 付款状态 同行 -->
              <div class="payment-pills-row">
                <div class="form-field form-field--inline">
                  <label class="form-label">付款方式</label>
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
                <div class="form-field form-field--inline">
                  <label class="form-label">付款状态</label>
                  <div class="radio-pills">
                    <label class="radio-pill radio-pill--paid" :class="{ 'radio-pill--active': form.payment_status === 'paid' }">
                      <input type="radio" v-model="form.payment_status" value="paid" />
                      已付
                    </label>
                    <label class="radio-pill radio-pill--unpaid" :class="{ 'radio-pill--active': form.payment_status === 'unpaid' }">
                      <input type="radio" v-model="form.payment_status" value="unpaid" />
                      挂账
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">备注</label>
                <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="选填，备注信息" resize="none" />
              </div>
            </div>
          </div>
        </div>

        <!-- 底部：采购明细 -->
        <div class="dialog-bottom">
          <div class="detail-card">
            <div class="detail-card-header">
              <div class="detail-card-title-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="detail-card-icon">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <span class="detail-card-title">采购明细</span>
                <span class="detail-card-count">共 {{ form.items.length }} 项</span>
              </div>
              <button class="btn-add-item" type="button" @click="addItem">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                添加原料
              </button>
            </div>
            <div class="items-table">
              <div class="items-table-header">
                <span class="col-material">材料名称</span>
                <span class="col-unit">单位</span>
                <span class="col-qty">数量</span>
                <span class="col-price">单价 (¥)</span>
                <span class="col-subtotal">小计 (¥)</span>
                <span class="col-op"></span>
              </div>
              <div v-for="(item, index) in form.items" :key="index" class="items-table-row">
                <span class="col-material">
                  <el-input v-model="item.material_name" placeholder="原料名称" />
                </span>
                <span class="col-unit">
                  <el-select
                    v-model="item.unit"
                    placeholder="选择单位"
                    filterable
                    allow-create
                    default-first-option
                    :max-collapse-tags="1"
                    style="width: 100%;"
                  >
                    <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
                  </el-select>
                </span>
                <span class="col-qty">
                  <el-input-number v-model="item.quantity" :precision="2" :step="1" :min="0.01" controls-position="right" style="width: 100%;" @change="calcItemTotal(index)" />
                </span>
                <span class="col-price">
                  <el-input-number v-model="item.unit_price" :precision="2" :step="0.5" :min="0" controls-position="right" style="width: 100%;" @change="calcItemTotal(index)" />
                </span>
                <span class="col-subtotal">
                  <span class="item-subtotal">¥{{ item.subtotal.toFixed(2) }}</span>
                </span>
                <span class="col-op">
                  <button v-if="form.items.length > 1" class="btn-remove-item" type="button" title="删除该行" @click="removeItem(index)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              </div>
            </div>

            <div class="total-bar">
              <span class="total-hint">合计金额由明细自动汇总</span>
              <div class="total-display">
                <span class="total-label">合计</span>
                <span class="total-value">¥{{ form.total_amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog v-model="importVisible" title="Excel 批量导入采购记录" width="600px" class="import-dialog" destroy-on-close>
      <div class="import-content">
        <div class="import-hint">
          <div class="import-hint-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p class="import-hint-title">支持 .xlsx / .xls 文件</p>
          <p class="import-hint-sub">每行一条采购记录，最大 500 行</p>
        </div>
        <p class="import-columns">列：供应商名称、材料名称、分类、单位、数量、单价、采购日期、付款方式、付款状态、备注</p>
        <div class="import-drop-zone" @click="$refs.fileInput.click()">
          <input ref="fileInput" type="file" accept=".xlsx,.xls" @change="handleFileSelect" style="display:none;" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="upload-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>点击选择文件 或 拖拽文件至此</span>
        </div>
        <div v-if="importResult" class="import-result">
          <div class="import-result-summary">
            <span class="import-result-icon">✓</span>
            <span>导入完成：成功 <strong>{{ importResult.imported }}</strong> / 共 <strong>{{ importResult.total }}</strong> 行</span>
          </div>
          <div v-if="importResult.errors.length > 0" class="import-errors">
            <p class="import-errors-title">错误信息</p>
            <ul class="import-errors-list">
              <li v-for="(e, i) in importResult.errors.slice(0, 10)" :key="i">第 {{ e.row }} 行: {{ e.reason }}</li>
            </ul>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-secondary" @click="importVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { Document, Money } from '@element-plus/icons-vue'
import api from '@/api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const importVisible = ref(false)
const importResult = ref(null)
const dateRange = ref([])
const editId = ref(null)
const fileInput = ref(null)

const quickDateTabs = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' }
]
const activeQuickDate = ref('all')

function applyQuickDate(tab) {
  activeQuickDate.value = tab.key
  const now = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  if (tab.key === 'today') {
    dateRange.value = [fmt(now), fmt(now)]
  } else if (tab.key === 'week') {
    const dow = now.getDay() || 7
    const start = new Date(now); start.setDate(now.getDate() - dow + 1)
    const end = new Date(now); end.setDate(now.getDate() + (7 - dow))
    dateRange.value = [fmt(start), fmt(end)]
  } else if (tab.key === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    dateRange.value = [fmt(start), fmt(end)]
  } else {
    dateRange.value = []
  }
  onDateChange(dateRange.value)
}

const filters = reactive({ keyword: '', start_date: '', end_date: '' })

const unitOptions = ['斤', '公斤', '两', '克', '千克', '吨', '袋', '箱', '盒', '桶', '瓶', '包', '份', '个', '只', '条', '根', '块', '片', '把', '棵', '颗', '粒', '升', '毫升', '打']

function createEmptyItem() {
  return { material_name: '', unit: '', quantity: 1, unit_price: 0, subtotal: 0 }
}

const form = reactive({
  supplier_name: '', items: [createEmptyItem()],
  total_amount: 0, purchase_date: new Date().toISOString().slice(0, 10),
  payment_method: '现金', payment_status: 'paid', notes: ''
})

const summary = computed(() => {
  const count = list.value.length
  const total = list.value.reduce((s, r) => s + Number(r.total_amount || 0), 0)
  return { count, total }
})

function calcItemTotal(index) {
  const item = form.items[index]
  item.subtotal = Number((Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2))
  calcTotal()
}

function calcTotal() {
  form.total_amount = form.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
}

function addItem() {
  form.items.push(createEmptyItem())
}

function removeItem(index) {
  form.items.splice(index, 1)
  calcTotal()
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

let timer = null
function debouncedLoad() {
  clearTimeout(timer)
  timer = setTimeout(loadData, 300)
}

async function loadData() {
  loading.value = true
  try {
    const procRes = await api.procurement.list({ ...filters })
    if (procRes.code === 200) list.value = procRes.data.list || []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.supplier_name = ''
  form.items = [createEmptyItem()]
  form.total_amount = 0
  form.purchase_date = new Date().toISOString().slice(0, 10)
  form.payment_method = '现金'
  form.payment_status = 'paid'
  form.notes = ''
  editId.value = null
}

function openAddDialog() { resetForm(); dialogVisible.value = true }

function openEditDialog(row) {
  resetForm()
  form.supplier_name = row.supplier_name || ''
  form.items = [{
    material_name: row.material_name || '',
    unit: row.material_unit || '',
    quantity: row.quantity || 1,
    unit_price: row.unit_price || 0,
    subtotal: row.total_amount || 0
  }]
  form.total_amount = row.total_amount || 0
  form.purchase_date = row.purchase_date
  form.payment_method = row.payment_method || '现金'
  form.payment_status = row.payment_status || 'paid'
  form.notes = row.notes || ''
  editId.value = row.id
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.supplier_name.trim()) { ElMessage.warning('请输入供应商名称'); return }
  const validItems = form.items.filter(item => item.material_name.trim())
  if (validItems.length === 0) { ElMessage.warning('请至少输入一个原料名称'); return }
  for (const item of validItems) {
    if (!item.quantity || item.quantity <= 0) { ElMessage.warning('数量必须大于 0'); return }
    if (item.unit_price < 0) { ElMessage.warning('单价不能为负'); return }
  }
  if (!form.purchase_date) { ElMessage.warning('请选择采购日期'); return }
  calcTotal()

  const payload = {
    supplier_name: form.supplier_name,
    items: validItems.map(item => ({
      material_name: item.material_name,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal
    })),
    total_amount: form.total_amount,
    purchase_date: form.purchase_date,
    payment_method: form.payment_method,
    payment_status: form.payment_status,
    notes: form.notes
  }

  const res = editId.value
    ? await api.procurement.update(editId.value, payload)
    : await api.procurement.create(payload)
  if (res.code === 200) {
    ElMessage.success(editId.value ? '更新成功，库存已修正' : '采购已登记，库存已更新')
    dialogVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '保存失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除这条采购记录？`, '删除确认', { type: 'warning' })
  } catch { return }
  const res = await api.procurement.delete(row.id)
  if (res.code === 200) { ElMessage.success('已删除'); loadData() }
  else { ElMessage.error(res.message || '删除失败') }
}

function openImportDialog() {
  importResult.value = null
  importVisible.value = true
}

function downloadImportTemplate() {
  const headers = [
    '供应商名称*',
    '材料名称*',
    '分类',
    '单位(斤/公斤/两/克/千克/吨/袋/箱/盒/桶/瓶/包/份/个/只/条/根/块/片/把/棵/颗/粒/升/毫升/打)',
    '数量*',
    '单价*',
    '采购日期*',
    '付款方式(现金/转账/挂账)',
    '付款状态(已付/挂账)',
    '备注'
  ]
  // 示例行：引导用户填写的格式，不作为正式数据导入
  const example = ['示例供应商', '示例鸡肉', '食材', '斤', 10, 15.5, '2026-01-01', '现金', '已付', '示例备注（选填）']
  const ws = XLSX.utils.aoa_to_sheet([headers, example])

  ws['!dataValidation'] = [
    { sqref: 'D2:D1000', type: 'list', formula1: '"斤,公斤,两,克,千克,吨,袋,箱,盒,桶,瓶,包,份,个,只,条,根,块,片,把,棵,颗,粒,升,毫升,打"', showDropDown: true },
    { sqref: 'H2:H1000', type: 'list', formula1: '"现金,转账,挂账"', showDropDown: true },
    { sqref: 'I2:I1000', type: 'list', formula1: '"paid,unpaid"', showDropDown: true }
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '采购记录')
  XLSX.writeFile(wb, '采购导入模板.xlsx')
}

async function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const data = await file.arrayBuffer()
  const wb = XLSX.read(data)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  // 中文表头 → 英文字段映射
  const headerMap = {
    '供应商名称*': 'supplier_name', '供应商名称': 'supplier_name',
    '材料名称*': 'material_name', '材料名称': 'material_name',
    '分类': 'category',
    '单位(斤/公斤/两/克/千克/吨/袋/箱/盒/桶/瓶/包/份/个/只/条/根/块/片/把/棵/颗/粒/升/毫升/打)': 'unit',
    '数量*': 'quantity', '数量': 'quantity',
    '单价*': 'unit_price', '单价': 'unit_price',
    '采购日期*': 'purchase_date', '采购日期': 'purchase_date',
    '付款方式(现金/转账/挂账)': 'payment_method',
    '付款状态(已付/挂账)': 'payment_status',
    '备注': 'notes'
  }
  const validPaymentStatus = ['已付', '挂账', 'paid', 'unpaid']
  const validPaymentMethod = ['现金', '转账', '挂账']
  const validUnits = ['斤', '公斤', '两', '克', '千克', '吨', '袋', '箱', '盒', '桶', '瓶', '包', '份', '个', '只', '条', '根', '块', '片', '把', '棵', '颗', '粒', '升', '毫升', '打']
  const paymentStatusMap = { '已付': 'paid', '挂账': 'unpaid', 'paid': 'paid', 'unpaid': 'unpaid' }

  // 跳过示例行 & 校验
  const errors = []
  const mappedRows = []
  rows.forEach((row, idx) => {
    const mapped = {}
    for (const key in row) {
      const eng = headerMap[key.trim().replace(/\*$/, '')]
      if (eng) mapped[eng] = row[key]
    }
    // 跳过示例行
    const sName = String(mapped.supplier_name || '')
    const mName = String(mapped.material_name || '')
    if (sName.includes('示例') || mName.includes('示例')) return
    // 校验并转换付款状态
    if (mapped.payment_status) {
      if (!validPaymentStatus.includes(mapped.payment_status)) {
        errors.push({ row: idx + 1, reason: `付款状态只能是: 已付 / 挂账，当前填的「${mapped.payment_status}」无效` })
        return
      }
      mapped.payment_status = paymentStatusMap[mapped.payment_status]
    }
    // 校验付款方式
    if (mapped.payment_method && !validPaymentMethod.includes(mapped.payment_method)) {
      errors.push({ row: idx + 1, reason: `付款方式只能是: 现金/转账/挂账，当前填的「${mapped.payment_method}」无效` })
      return
    }
    // 校验单位
    if (mapped.unit && !validUnits.includes(mapped.unit)) {
      errors.push({ row: idx + 1, reason: `单位「${mapped.unit}」不在可选列表中` })
      return
    }
    mappedRows.push(mapped)
  })
  if (errors.length > 0) {
    importResult.value = { imported: 0, errors, total: rows.length }
    e.target.value = ''
    return
  }
  const res = await api.procurement.import(mappedRows)
  importResult.value = res.data || { imported: 0, errors: [], total: rows.length }
  if (res.code === 200) loadData()
  e.target.value = ''
}

onMounted(loadData)
</script>

<style scoped>
.cost-procurements-page { width: 100%; }

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

.stat-card--count .stat-icon-wrap {
  background: rgba(232, 93, 4, 0.1);
}
.stat-card--total .stat-icon-wrap {
  background: rgba(250, 163, 7, 0.1);
}

.stat-icon {
  font-size: 22px;
  color: var(--primary);
}
.stat-card--total .stat-icon { color: var(--accent); }

.stat-body { position: relative; z-index: 1; }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stat-value--money {
  color: var(--primary);
}

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

.quick-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.quick-tab {
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

.quick-tab:hover {
  border-color: var(--primary-light);
  color: var(--primary);
}

.quick-tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 360px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-wrap input {
  width: 100%;
  height: 36px;
  padding: 0 36px 0 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: inherit;
  color: var(--text);
  background: var(--surface-2);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.search-wrap input::placeholder { color: var(--text-muted); }

.search-wrap input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
  background: var(--surface);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clear-btn svg { width: 14px; height: 14px; }
.clear-btn:hover { color: var(--text-secondary); }

.date-picker-wrap :deep(.el-date-editor) {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

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

.cell-supplier { color: var(--text); font-weight: 500; }

.cell-material strong { color: var(--text); }
.cell-material-unit {
  color: var(--text-muted);
  font-size: 12px;
  margin-left: 4px;
}

.cell-amount {
  font-weight: 600;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.cell-paymethod {
  color: var(--text-secondary);
  font-size: 13px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge--paid {
  background: rgba(45, 106, 79, 0.1);
  color: var(--success);
}

.status-badge--unpaid {
  background: rgba(214, 40, 40, 0.1);
  color: var(--warning);
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
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

/* ===== Dialog Layout ===== */
.procurement-dialog :deep(.el-dialog__header) {
  padding: 14px 24px;
  margin-right: 0;
}
.procurement-dialog :deep(.el-dialog__title) { font-weight: 600; font-size: 15px; }
.procurement-dialog :deep(.el-dialog__body) {
  padding: 14px 22px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}
.procurement-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
}

/* Top: 2 columns (basic info + payment info); Bottom: items table */
.dialog-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.dialog-bottom { min-width: 0; }

/* ===== Info Cards ===== */
.info-card {
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-card-icon {
  width: 14px;
  height: 14px;
  color: var(--primary);
  flex-shrink: 0;
}

.info-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}

.info-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== Form Fields ===== */
.form-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.form-field--full { width: 100%; }
.form-field--narrow { width: 160px; max-width: 100%; }

.form-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

/* Payment pills row: 付款方式 + 付款状态 inline */
.payment-pills-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.form-field--inline { min-width: 0; }

/* ===== Detail Card (Items Table) ===== */
.detail-card {
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-card-icon {
  width: 14px;
  height: 14px;
  color: var(--primary);
  flex-shrink: 0;
}

.detail-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}

.detail-card-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface);
  padding: 1px 7px;
  border-radius: 8px;
  font-weight: 500;
  margin-left: 2px;
}

/* ===== Items Table ===== */
.items-table {
  display: flex;
  flex-direction: column;
}

.items-table-header {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 90px 100px 110px 110px 30px;
  gap: 8px;
  padding: 4px 6px;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.items-table-row {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 90px 100px 110px 110px 30px;
  gap: 8px;
  align-items: center;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.items-table-row:hover { background: var(--surface); }

.col-subtotal { text-align: right; }

.item-subtotal {
  font-weight: 600;
  color: var(--primary);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.btn-remove-item {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.btn-remove-item svg { width: 14px; height: 14px; }
.btn-remove-item:hover {
  background: rgba(214, 40, 40, 0.1);
  color: var(--warning);
}

.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--primary);
  background: rgba(232, 93, 4, 0.04);
  color: var(--primary);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.btn-add-item svg { width: 12px; height: 12px; }
.btn-add-item:hover {
  background: var(--primary);
  color: #fff;
}

.total-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 6px 0;
  margin-top: 6px;
  border-top: 1px dashed var(--border);
}

.total-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.total-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

/* Radio Pills */
.radio-pills {
  display: flex;
  gap: 8px;
}

.radio-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.radio-pill input { display: none; }

.radio-pill:hover { border-color: var(--primary-light); color: var(--primary); }

.radio-pill--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.radio-pill--paid.radio-pill--active {
  background: var(--success);
  border-color: var(--success);
}

.radio-pill--unpaid.radio-pill--active {
  background: var(--warning);
  border-color: var(--warning);
}

/* ===== Import Dialog ===== */
.import-content { display: flex; flex-direction: column; gap: 16px; }

.import-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
}

.import-hint-icon {
  width: 40px;
  height: 40px;
  color: var(--primary);
  margin-bottom: 4px;
}
.import-hint-icon svg { width: 100%; height: 100%; }

.import-hint-title { font-size: 14px; font-weight: 600; color: var(--text); margin: 0; }
.import-hint-sub { font-size: 12px; color: var(--text-muted); margin: 0; }

.import-columns {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-2);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin: 0;
  font-family: monospace;
}

.import-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.import-drop-zone:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(232, 93, 4, 0.03);
}

.upload-icon { width: 32px; height: 32px; }

.import-result {
  padding: 14px;
  background: rgba(45, 106, 79, 0.06);
  border: 1px solid rgba(45, 106, 79, 0.2);
  border-radius: var(--radius-md);
}

.import-result-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--success);
}

.import-result-icon {
  width: 20px;
  height: 20px;
  background: var(--success);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.import-errors { margin-top: 10px; }
.import-errors-title { font-size: 12px; color: var(--warning); margin: 0 0 6px; font-weight: 500; }
.import-errors-list {
  max-height: 180px;
  overflow-y: auto;
  padding-left: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* ===== Shared Buttons ===== */
.btn-icon-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.btn-primary:hover { background: var(--primary-dark); border-color: var(--primary-dark); }

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}
.btn-secondary:hover { background: var(--surface-2); }

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
