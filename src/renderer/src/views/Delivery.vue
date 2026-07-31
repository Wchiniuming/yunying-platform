<template>
  <div class="delivery-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">配送管理</h1>
        <p class="page-subtitle">跟踪订单配送状态</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deliveryStats.pending || 0 }}</div>
          <div class="stat-label">待取餐</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-delivering">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deliveryStats.delivering || 0 }}</div>
          <div class="stat-label">配送中</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-delivered">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deliveryStats.deliveredToday || 0 }}</div>
          <div class="stat-label">今日送达</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-self">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ deliveryStats.selfDelivery || 0 }}</div>
          <div class="stat-label">自送订单</div>
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
          v-model="keyword"
          placeholder="搜索订单号/顾客"
          @input="debouncedSearch"
        />
        <button v-if="keyword" class="clear-btn" @click="keyword = ''; debouncedSearch()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'waiting_pickup' }"
          @click="activeTab = 'waiting_pickup'"
        >
          待取餐
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'delivering' }"
          @click="activeTab = 'delivering'"
        >
          配送中
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'delivered' }"
          @click="activeTab = 'delivered'"
        >
          今日完成
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          全部
        </div>
      </div>
    </div>

    <div class="table-container">
      <DeliveryOrderList :status="activeTab" :keyword="keyword" @refresh="loadDeliveryStats" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import DeliveryOrderList from './components/DeliveryOrderList.vue'
import api from '@/api'

const activeTab = ref('waiting_pickup')
const keyword = ref('')

const deliveryStats = reactive({
  pending: 0,
  delivering: 0,
  deliveredToday: 0,
  selfDelivery: 0
})

let searchTimer = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    // keyword change will trigger via prop
  }, 300)
}

const loadDeliveryStats = async () => {
  try {
    const result = await api.delivery.stats()
    if (result.code === 200) {
      Object.assign(deliveryStats, result.data)
    }
  } catch (error) {
    console.error('加载配送统计失败:', error)
  }
}

onMounted(() => {
  loadDeliveryStats()
})
</script>

<style scoped>
.delivery-page {
  width: 100%;
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-bottom: 20px;
  width: fit-content;
}

.tab-item {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base) var(--ease-smooth);
  position: relative;
  border: none;
  background: transparent;
  font-family: var(--font);
}

.tab-item:hover {
  color: var(--text);
  background: var(--surface);
}

.tab-item.active {
  color: var(--primary);
  background: var(--surface);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.table-container {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  border-top: none;
  padding: var(--radius-md);
}

.filter-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>