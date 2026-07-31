<template>
  <div class="products-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">商品管理</h1>
        <p class="page-subtitle">维护菜单商品、价格与上下架</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="openAddDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新增商品</span>
        </button>
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
          placeholder="搜索商品名"
          @input="debouncedSearch"
        />
        <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''; debouncedSearch()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="tab-bar">
        <button
          type="button"
          class="tab-item"
          :class="{ active: filters.status === '' }"
          @click="filters.status = ''; loadProducts()"
        >全部</button>
        <button
          type="button"
          class="tab-item"
          :class="{ active: filters.status === 'available' }"
          @click="filters.status = 'available'; loadProducts()"
        >在售</button>
        <button
          type="button"
          class="tab-item"
          :class="{ active: filters.status === 'unavailable' }"
          @click="filters.status = 'unavailable'; loadProducts()"
        >下架</button>
      </div>
    </div>

    <div class="table-container" v-loading="loading">
      <table class="table product-table">
        <thead>
          <tr>
            <th style="width: 60px;">序号</th>
            <th style="width: 80px;">分类</th>
            <th style="min-width: 200px;">商品名称</th>
            <th style="width: 130px;">单价</th>
            <th style="width: 100px;">单位</th>
            <th style="width: 100px;">排序</th>
            <th style="width: 110px;">状态</th>
            <th style="width: 160px;" class="fixed-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(product, index) in products" :key="product.id" @click="openEditDialog(product)">
            <td>
              <div class="row-index">{{ index + 1 }}</div>
            </td>
            <td>
              <span class="category-tag" :class="`category-${product.category}`">
                {{ getCategoryLabel(product.category) }}
              </span>
            </td>
            <td>
              <div class="product-name">{{ product.name }}</div>
            </td>
            <td class="amount-cell">¥{{ Number(product.price).toFixed(2) }}</td>
            <td class="muted-cell">/{{ product.unit || '斤' }}</td>
            <td class="muted-cell">{{ product.sort_order || 0 }}</td>
            <td>
              <span
                class="status-tag"
                :class="product.status === 'available' ? 'status-delivered' : 'status-cancelled'"
              >
                {{ product.status === 'available' ? '在售' : '下架' }}
              </span>
            </td>
            <td class="fixed-right" @click.stop>
              <div class="table-actions">
                <button class="btn-ghost-link" @click.stop="openEditDialog(product)">编辑</button>
                <button class="btn-ghost-link danger" @click.stop="confirmDelete(product)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && products.length === 0">
            <td colspan="8" class="empty-row">
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p>暂无商品，点击右上角"新增商品"开始添加</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="dialogVisible" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <div class="dialog-header">
          <h3>{{ isEdit ? '编辑商品' : '新增商品' }}</h3>
          <button class="dialog-close" @click="closeDialog" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-field full-width">
              <label class="form-label">商品名称</label>
              <input
                v-model="form.name"
                class="form-input"
                placeholder="例如：麻辣土鸡"
                maxlength="40"
              />
            </div>

            <div class="form-field">
              <label class="form-label">分类</label>
              <select v-model="form.category" class="form-input form-select">
                <option value="main">主菜</option>
                <option value="side">配菜</option>
                <option value="drink">饮品</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">单位</label>
              <select v-model="form.unit" class="form-input form-select">
                <option value="斤">斤</option>
                <option value="份">份</option>
                <option value="个">个</option>
                <option value="袋">袋</option>
                <option value="盒">盒</option>
                <option value="瓶">瓶</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">单价 (¥)</label>
              <input
                v-model.number="form.price"
                class="form-input"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.00"
              />
            </div>

            <div class="form-field">
              <label class="form-label">排序</label>
              <input
                v-model.number="form.sort_order"
                class="form-input"
                type="number"
                min="0"
                placeholder="数字越小越靠前"
              />
            </div>

            <div class="form-field full-width">
              <label class="form-label">状态</label>
              <div class="status-toggle">
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.status === 'available' }"
                  @click="form.status = 'available'"
                >
                  在售
                </button>
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.status === 'unavailable' }"
                  @click="form.status = 'unavailable'"
                >
                  下架
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '保存中...' : (isEdit ? '保存修改' : '新增商品') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const products = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const filters = reactive({
  keyword: '',
  status: ''
})

const form = reactive({
  name: '',
  category: 'main',
  price: 0,
  unit: '斤',
  sort_order: 0,
  status: 'available'
})

const categoryMap = {
  main: '主菜',
  side: '配菜',
  drink: '饮品',
  other: '其他'
}

const getCategoryLabel = (key) => categoryMap[key] || key || '未分类'

let searchTimer = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadProducts, 300)
}

const resetForm = () => {
  form.name = ''
  form.category = 'main'
  form.price = 0
  form.unit = '斤'
  form.sort_order = 0
  form.status = 'available'
}

const openAddDialog = () => {
  isEdit.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (product) => {
  isEdit.value = true
  editingId.value = product.id
  form.name = product.name
  form.category = product.category || 'main'
  form.price = Number(product.price) || 0
  form.unit = product.unit || '斤'
  form.sort_order = Number(product.sort_order) || 0
  form.status = product.status || 'available'
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入商品名称')
    return
  }
  if (!form.price || form.price <= 0) {
    ElMessage.warning('请输入有效的单价')
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: form.price,
      unit: form.unit,
      sort_order: form.sort_order,
      status: form.status
    }

    let result
    if (isEdit.value) {
      result = await api.product.update(editingId.value, payload)
    } else {
      result = await api.product.create(payload)
    }

    if (result.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      closeDialog()
      loadProducts()
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('保存商品失败:', error)
    ElMessage.error('保存失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (product) => {
  ElMessageBox.confirm(
    `确定要删除「${product.name}」吗？此操作不可撤销。`,
    '删除商品',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const result = await api.product.delete(product.id)
      if (result.code === 200) {
        ElMessage.success('删除成功')
        loadProducts()
      } else {
        ElMessage.error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('删除商品失败:', error)
      ElMessage.error('删除失败，请稍后再试')
    }
  }).catch(() => {})
}

const loadProducts = async () => {
  loading.value = true
  try {
    const result = await api.product.list({
      keyword: filters.keyword.trim(),
      status: filters.status
    })
    if (result.code === 200) {
      products.value = result.data || []
    } else {
      ElMessage.error(result.message || '加载商品失败')
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.products-page {
  width: 100%;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.filter-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
}

.product-table th {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.product-table td {
  padding: 14px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border-light);
}

.product-table tbody tr {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.product-table tbody tr:hover {
  background: rgba(232, 93, 4, 0.03);
}

.product-table tbody tr:last-child td {
  border-bottom: none;
}

.product-table .fixed-right {
  position: sticky;
  right: 0;
  background: var(--surface);
  z-index: 1;
}

.product-table tbody tr:hover .fixed-right {
  background: rgba(250, 250, 249, 0.95);
}

[data-theme="dark"] .product-table .fixed-right {
  background: var(--surface);
}

[data-theme="dark"] .product-table tbody tr:hover .fixed-right {
  background: rgba(41, 37, 36, 0.95);
}

.row-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.amount-cell {
  font-weight: 600;
  color: var(--primary);
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
}

.muted-cell {
  color: var(--text-muted);
  font-size: 13px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.category-main { background: rgba(232, 93, 4, 0.1); color: var(--primary); }
.category-side { background: rgba(250, 163, 7, 0.12); color: var(--accent); }
.category-drink { background: rgba(69, 123, 157, 0.15); color: #457B9D; }
.category-other { background: var(--surface-2); color: var(--text-muted); }

.empty-row {
  padding: 0;
  border-bottom: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: var(--text-muted);
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.4;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

/* ===== Dialog ===== */
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
  max-width: 540px;
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
  overflow-y: auto;
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

.status-toggle {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 4px;
  width: fit-content;
}
</style>