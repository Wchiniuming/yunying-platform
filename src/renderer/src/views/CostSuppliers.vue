<template>
  <div class="cost-suppliers-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">供应商管理</h1>
        <p class="page-subtitle">管理原材料采购供应商档案</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" @click="openAddDialog">+ 新增供应商</button>
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
          placeholder="搜索供应商"
          @input="debouncedSearch"
        />
        <button v-if="filters.keyword" class="clear-btn" @click="filters.keyword = ''; loadData()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="list" v-loading="loading" stripe class="table" empty-text="暂无供应商">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="供应商名称" min-width="160">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="contact_name" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="notes" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 'active' ? 'badge-success' : 'badge-secondary'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="right" fixed="right">
          <template #default="{ row }">
            <button class="btn-ghost-link" @click="openEditDialog(row)">编辑</button>
            <button class="btn-ghost-link btn-danger-link" @click="handleDelete(row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editId ? '编辑供应商' : '新增供应商'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="供应商名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_name" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact_phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="备注" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const editId = ref(null)

const filters = reactive({ keyword: '' })
const form = reactive({ name: '', contact_name: '', contact_phone: '', address: '', notes: '', status: 'active' })

let timer = null
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(loadData, 300)
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.supplier.list({ keyword: filters.keyword })
    if (res.code === 200) list.value = res.data || []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', contact_name: '', contact_phone: '', address: '', notes: '', status: 'active' })
  editId.value = null
}

function openAddDialog() { resetForm(); dialogVisible.value = true }

function openEditDialog(row) {
  resetForm()
  Object.assign(form, row)
  editId.value = row.id
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name || !form.name.trim()) { ElMessage.warning('请输入供应商名称'); return }
  const res = editId.value
    ? await api.supplier.update(editId.value, form)
    : await api.supplier.create(form)
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
    await ElMessageBox.confirm(`确定删除供应商「${row.name}」？`, '删除确认', { type: 'warning' })
  } catch { return }
  const res = await api.supplier.delete(row.id)
  if (res.code === 200) { ElMessage.success('已删除'); loadData() }
  else { ElMessage.error(res.message || '删除失败') }
}

onMounted(loadData)
</script>

<style scoped>
.cost-suppliers-page {
  width: 100%;
}
</style>