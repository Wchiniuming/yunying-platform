<template>
  <div class="cost-materials-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">库存查询</h1>
        <p class="page-subtitle">管理原材料库存，低于阈值会标红提醒</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" :class="{ active: filters.low_stock === '1' }" @click="toggleLowStock">{{ filters.low_stock === '1' ? '显示全部' : '只看低库存' }}</button>
        <button class="btn btn-primary" @click="openAddDialog">+ 新增原材料</button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="filter-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="filters.keyword" placeholder="搜索原材料" @input="debouncedSearch" />
        <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''; loadData()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="filter-tabs">
        <button v-for="c in categories" :key="c.key" :class="{ active: filters.category === c.key }" @click="filters.category = c.key; loadData()">{{ c.label }}</button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="list" v-loading="loading" stripe class="table" empty-text="暂无原材料" :row-class-name="rowClass">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="名称" min-width="160">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="当前库存" width="120">
          <template #default="{ row }">
            <strong>{{ formatNum(row.current_stock) }}</strong>
            <span v-if="isLowStock(row)" class="status-tag badge-danger" style="margin-left:6px;">低</span>
          </template>
        </el-table-column>
        <el-table-column prop="low_stock_threshold" label="低库存阈值" width="120">
          <template #default="{ row }">{{ formatNum(row.low_stock_threshold) }}</template>
        </el-table-column>
        <el-table-column label="最近进价" width="120">
          <template #default="{ row }">¥{{ formatNum(row.last_purchase_price) }}</template>
        </el-table-column>
        <el-table-column label="默认供应商" min-width="140">
          <template #default="{ row }">{{ supplierMap[row.default_supplier_id] || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="right" fixed="right">
          <template #default="{ row }">
            <button class="btn-ghost-link" @click="openAdjustDialog(row)">调库存</button>
            <button class="btn-ghost-link" @click="openEditDialog(row)">编辑</button>
            <button class="btn-ghost-link btn-danger-link" @click="handleDelete(row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑原材料' : '新增原材料'" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="原材料名称" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" style="width: 100%;">
            <el-option v-for="c in categories.filter(c => c.key !== '')" :key="c.key" :label="c.label" :value="c.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="form.unit" placeholder="斤/公斤/袋/箱" />
        </el-form-item>
        <el-form-item label="初始库存">
          <el-input-number v-model="form.current_stock" :precision="2" :step="1" :min="0" style="width: 100%;" :disabled="!!editId" />
          <span v-if="editId" style="display:block;font-size:12px;color:var(--text-muted);margin-top:4px;">编辑时不可改初始库存，请用「调库存」</span>
        </el-form-item>
        <el-form-item label="低库存阈值">
          <el-input-number v-model="form.low_stock_threshold" :precision="2" :step="1" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="默认供应商">
          <el-select v-model="form.default_supplier_id" clearable style="width: 100%;">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-secondary" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="handleSave">保存</button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustVisible" title="调整库存" width="400px">
      <p style="margin-top:0;color:var(--text-muted);">调整 {{ adjustTarget?.name }} 的库存</p>
      <el-form :model="adjustForm" label-width="80px">
        <el-form-item label="当前库存">
          <span style="font-weight:600;font-size:16px;">{{ formatNum(adjustTarget?.current_stock) }} {{ adjustTarget?.unit }}</span>
        </el-form-item>
        <el-form-item label="变动量">
          <el-input-number v-model="adjustForm.delta" :precision="2" :step="0.5" style="width: 100%;" />
          <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:4px;">正数=增加，负数=减少</span>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="adjustForm.reason" placeholder="盘点/损耗/退换等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn btn-secondary" @click="adjustVisible = false">取消</button>
        <button class="btn btn-primary" @click="handleAdjust">确认调整</button>
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
const suppliers = ref([])
const dialogVisible = ref(false)
const adjustVisible = ref(false)
const adjustTarget = ref(null)
const adjustForm = reactive({ delta: 0, reason: '' })
const editId = ref(null)

const categories = [
  { key: '', label: '全部' },
  { key: '肉类', label: '肉类' },
  { key: '蔬菜', label: '蔬菜' },
  { key: '调料', label: '调料' },
  { key: '主食', label: '主食' },
  { key: '包装', label: '包装' },
  { key: '其他', label: '其他' }
]

const filters = reactive({ keyword: '', category: '', low_stock: '' })
const form = reactive({ name: '', category: '其他', unit: '斤', current_stock: 0, low_stock_threshold: 0, default_supplier_id: null, status: 'active' })

const supplierMap = computed(() => {
  const m = {}
  suppliers.value.forEach(s => { m[s.id] = s.name })
  return m
})

function isLowStock(row) {
  return Number(row.current_stock) <= Number(row.low_stock_threshold) && Number(row.low_stock_threshold) > 0
}

function rowClass({ row }) {
  return isLowStock(row) ? 'low-stock-row' : ''
}

function formatNum(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v.toFixed(2).replace(/\.?0+$/, '') : '0'
}

let timer = null
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(loadData, 300)
}

async function loadData() {
  loading.value = true
  try {
    const [matRes, supRes] = await Promise.all([
      api.material.list({ keyword: filters.keyword, category: filters.category, low_stock: filters.low_stock }),
      api.supplier.list()
    ])
    if (matRes.code === 200) list.value = matRes.data || []
    if (supRes.code === 200) suppliers.value = supRes.data || []
  } finally {
    loading.value = false
  }
}

function toggleLowStock() {
  filters.low_stock = filters.low_stock === '1' ? '' : '1'
  loadData()
}

function resetForm() {
  Object.assign(form, { name: '', category: '其他', unit: '斤', current_stock: 0, low_stock_threshold: 0, default_supplier_id: null, status: 'active' })
  editId.value = null
}

function openAddDialog() { resetForm(); dialogVisible.value = true }

function openEditDialog(row) {
  resetForm()
  Object.assign(form, { name: row.name, category: row.category, unit: row.unit, current_stock: row.current_stock, low_stock_threshold: row.low_stock_threshold, default_supplier_id: row.default_supplier_id, status: row.status })
  editId.value = row.id
  dialogVisible.value = true
}

function openAdjustDialog(row) {
  adjustTarget.value = row
  Object.assign(adjustForm, { delta: 0, reason: '' })
  adjustVisible.value = true
}

async function handleSave() {
  if (!form.name || !form.name.trim()) { ElMessage.warning('请输入名称'); return }
  if (!form.category) { ElMessage.warning('请选择分类'); return }
  if (!form.unit || !form.unit.trim()) { ElMessage.warning('请输入单位'); return }
  const payload = { ...form }
  if (editId.value) delete payload.current_stock
  const res = editId.value
    ? await api.material.update(editId.value, payload)
    : await api.material.create(payload)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '保存失败')
  }
}

async function handleAdjust() {
  if (!adjustForm.delta) { ElMessage.warning('请输入变动量'); return }
  const res = await api.material.adjustStock(adjustTarget.value.id, adjustForm)
  if (res.code === 200) {
    ElMessage.success(`库存已调整：${res.data.old_stock} → ${res.data.new_stock}`)
    adjustVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '调整失败')
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除原材料「${row.name}」？`, '删除确认', { type: 'warning' })
  } catch { return }
  const res = await api.material.delete(row.id)
  if (res.code === 200) { ElMessage.success('已删除'); loadData() }
  else { ElMessage.error(res.message || '删除失败') }
}

onMounted(loadData)
</script>

<style scoped>
.cost-materials-page {
  width: 100%;
}
.filter-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.filter-tabs button {
  padding: 6px 14px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  height: 36px;
  transition: all var(--transition-fast);
}
.filter-tabs button.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
:deep(.low-stock-row) {
  background: rgba(214, 40, 40, 0.04);
}
:deep(.low-stock-row:hover > td) {
  background: rgba(214, 40, 40, 0.08) !important;
}
</style>