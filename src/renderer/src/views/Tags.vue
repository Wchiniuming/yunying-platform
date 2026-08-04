<template>
  <div class="tags-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">标签管理</h1>
        <p class="page-subtitle">为顾客打标签，便于分类运营</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="openAddDialog">
          <span>新建标签</span>
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
          placeholder="搜索标签名称"
          @input="debouncedLoad"
        />
        <button
          v-if="filters.keyword"
          type="button"
          class="filter-clear"
          @click="clearKeyword"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="tab-bar">
        <button type="button" class="tab-item" :class="{ active: filters.category === '' }" @click="filters.category = ''; loadTags()">全部</button>
        <button
          v-for="cat in categories"
          :key="cat.value"
          type="button"
          class="tab-item"
          :class="{ active: filters.category === cat.value }"
          @click="filters.category = cat.value; loadTags()"
        >{{ cat.label }}</button>
      </div>
    </div>

    <div class="table-container" v-loading="loading">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 80px;">颜色</th>
            <th style="min-width: 160px;">标签名称</th>
            <th style="width: 120px;">分类</th>
            <th style="width: 100px;">排序</th>
            <th style="width: 100px;">使用次数</th>
            <th style="width: 160px;" class="fixed-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in tags" :key="tag.id">
            <td>
              <span class="color-dot" :style="{ background: tag.color }"></span>
            </td>
            <td>
              <span class="tag-preview" :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }">
                {{ tag.name }}
              </span>
            </td>
            <td>
              <span class="text-muted">{{ getCategoryLabel(tag.category) }}</span>
            </td>
            <td>
              <span class="text-muted">{{ tag.sort_order }}</span>
            </td>
            <td>
              <span class="text-muted">{{ tag.usage_count || 0 }}</span>
            </td>
            <td class="fixed-right">
              <button class="btn-icon" @click.stop="openEditDialog(tag)" title="编辑">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="btn-icon danger" @click.stop="handleDelete(tag)" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!loading && tags.length === 0">
            <td colspan="6" class="empty-row">
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                <p>暂无标签，点击右上角"新建标签"开始添加</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="dialogVisible" class="dialog-mask" @click.self="closeDialog">
      <div class="dialog-card">
        <div class="dialog-header">
          <h3>{{ isEdit ? '编辑标签' : '新建标签' }}</h3>
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
              <label class="form-label">标签名称</label>
              <input
                v-model="form.name"
                class="form-input"
                placeholder="例如：重要客户"
                maxlength="20"
              />
            </div>

            <div class="form-field">
              <label class="form-label">分类</label>
              <select v-model="form.category" class="form-input form-select">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">排序</label>
              <input
                v-model.number="form.sort_order"
                type="number"
                class="form-input"
                placeholder="数字越小越靠前"
                min="0"
              />
            </div>

            <div class="form-field full-width">
              <label class="form-label">颜色</label>
              <div class="color-picker-row">
                <input
                  v-model="form.color"
                  type="color"
                  class="color-input"
                />
                <span class="color-hex">{{ form.color }}</span>
                <div class="color-presets">
                  <button
                    v-for="preset in colorPresets"
                    :key="preset"
                    type="button"
                    class="color-preset"
                    :class="{ active: form.color === preset }"
                    :style="{ background: preset }"
                    @click="form.color = preset"
                  ></button>
                </div>
              </div>
            </div>

            <div class="form-field full-width">
              <div class="tag-preview-large" :style="{ background: form.color + '22', color: form.color, borderColor: form.color + '44' }">
                {{ form.name || '标签预览' }}
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-ghost" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="handleSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
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

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const tags = ref([])
const editId = ref(null)

const filters = reactive({
  keyword: '',
  category: ''
})

const form = reactive({
  name: '',
  color: '#409EFF',
  category: 'order',
  sort_order: 0
})

const categories = [
  { label: '来源类', value: 'source' },
  { label: '订单类', value: 'order' },
  { label: '其他', value: 'other' }
]

const colorPresets = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#C71585', '#00BCD4', '#8B4513',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
]

function getCategoryLabel(cat) {
  return categories.find(c => c.value === cat)?.label || cat
}

async function loadTags() {
  loading.value = true
  try {
    const params = {}
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.category) params.category = filters.category
    const res = await api.tags.list(params)
    if (res.code === 200) {
      tags.value = res.data
    }
  } catch (e) {
    console.error('加载标签失败', e)
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadTags, 300)
}

function clearKeyword() {
  filters.keyword = ''
  loadTags()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { name: '', color: '#409EFF', category: 'customer', sort_order: 0 })
  dialogVisible.value = true
}

function openEditDialog(tag) {
  isEdit.value = true
  editId.value = tag.id
  Object.assign(form, {
    name: tag.name,
    color: tag.color,
    category: tag.category,
    sort_order: tag.sort_order
  })
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function handleSave() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }
  saving.value = true
  try {
    let res
    if (isEdit.value) {
      res = await api.tags.update(editId.value, {
        name: form.name.trim(),
        color: form.color,
        category: form.category,
        sort_order: form.sort_order
      })
    } else {
      res = await api.tags.create({
        name: form.name.trim(),
        color: form.color,
        category: form.category,
        sort_order: form.sort_order
      })
    }
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      closeDialog()
      loadTags()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(tag) {
  try {
    await ElMessageBox.confirm(`确认删除标签「${tag.name}」？删除后已打标的顾客不受影响。`, '删除标签', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await api.tags.delete(tag.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadTags()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {}
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tags-page {
  padding: 24px;
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.page-header-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-light);
}

.btn-ghost:hover {
  background: var(--surface-2);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-input {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.filter-input input {
  padding: 7px 32px 7px 34px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
  width: 200px;
  outline: none;
  box-shadow: none;
  transition: box-shadow 0.15s;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--border);
}

.filter-input input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: var(--shadow-glow);
  appearance: none;
}

.filter-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  transition: color 0.12s, background 0.12s;
}

.filter-clear:hover {
  color: var(--text);
  background: var(--border);
}

.filter-clear svg {
  width: 12px;
  height: 12px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tab-item {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s;
}

.tab-item:hover {
  background: var(--surface-2);
  color: var(--text);
}

.tab-item.active {
  background: var(--primary);
  color: #fff;
}

.table-container {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead tr {
  background: var(--surface-2);
}

.table th {
  padding: 8px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
}

.table td {
  padding: 8px 14px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border-light);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover {
  background: var(--surface-2);
}

.color-dot {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.6);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.tag-preview {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.tag-preview-large {
  display: inline-flex;
  align-items: center;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
}

.fixed-right {
  text-align: right;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.15s;
}

.btn-icon svg {
  width: 15px;
  height: 15px;
}

.btn-icon:hover {
  background: var(--surface-2);
  color: var(--primary);
}

.btn-icon.danger:hover {
  background: #FEF0F0;
  color: #F56C6C;
}

.empty-row td {
  padding: 60px 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
}

.empty-icon {
  width: 40px;
  height: 40px;
  opacity: 0.4;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

.text-muted {
  color: var(--text-muted);
  font-size: 13px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-card {
  background: var(--surface);
  border-radius: 12px;
  width: 440px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
}

.dialog-close:hover {
  background: var(--surface-2);
  color: var(--text);
}

.dialog-close svg {
  width: 16px;
  height: 16px;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
}

.form-select {
  cursor: pointer;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.color-input {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  background: var(--surface);
}

.color-hex {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.color-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-preset {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-preset:hover {
  transform: scale(1.15);
}

.color-preset.active {
  border-color: var(--text);
  transform: scale(1.1);
}
</style>
