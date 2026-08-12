<template>
  <div class="cost-analysis-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">成本分析</h1>
        <p class="page-subtitle">查看成本结构、成本趋势、毛利率</p>
      </div>
      <div class="page-header-actions">
        <div class="range-tabs">
          <button v-for="r in ranges" :key="r.key" :class="{ active: range === r.key }" @click="range = r.key; loadData()">{{ r.label }}</button>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-card--cost">
        <div class="stat-icon"><el-icon><Money /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatNum(stats.total_cost) }}</div>
          <div class="stat-label">本期成本</div>
        </div>
      </div>
      <div class="stat-card stat-card--revenue">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">¥{{ formatNum(stats.revenue) }}</div>
          <div class="stat-label">本期营收</div>
        </div>
      </div>
      <div class="stat-card stat-card--profit">
        <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value" :class="Number(stats.profit) >= 0 ? 'profit-pos' : 'profit-neg'">¥{{ formatNum(stats.profit) }}</div>
          <div class="stat-label">本期毛利</div>
        </div>
      </div>
      <div class="stat-card stat-card--avg">
        <div class="stat-icon"><el-icon><Top /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value" :class="Number(stats.profit_rate) >= 30 ? 'profit-pos' : Number(stats.profit_rate) >= 10 ? '' : 'profit-neg'">{{ stats.profit_rate }}%</div>
          <div class="stat-label">毛利率</div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="info-card">
        <h3>成本结构</h3>
        <div ref="categoryChartRef" class="chart-area"></div>
      </div>
      <div class="info-card">
        <h3>供应商采购排行 Top 5</h3>
        <div ref="supplierChartRef" class="chart-area"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { Money, Document, TrendCharts, Top } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import api from '@/api'

const ranges = [{ key: 'today', label: '今日' }, { key: 'week', label: '近 7 天' }, { key: 'month', label: '近 30 天' }]
const range = ref('month')
const stats = reactive({ total_cost: 0, revenue: 0, profit: 0, profit_rate: '0.0', by_category: [], by_supplier: [] })

const categoryChartRef = ref(null)
const supplierChartRef = ref(null)
let categoryChart = null
let supplierChart = null

const categoryColors = { ingredient: '#E85D04', packaging: '#409EFF', delivery: '#67C23A', platform: '#E6A23C', marketing: '#F56C6C', fixed: '#909399', labor: '#9C27B0', other: '#666' }
const categoryLabels = { ingredient: '食材', packaging: '包装', delivery: '配送', platform: '平台', marketing: '营销', fixed: '固定', labor: '人力', other: '其他' }

function formatNum(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0.00'
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  const res = await api.costStats.summary(range.value)
  if (res.code === 200) {
    Object.assign(stats, res.data)
    nextTick(() => renderCharts())
  }
}

function renderCharts() {
  if (categoryChart) categoryChart.dispose()
  if (supplierChart) supplierChart.dispose()

  if (categoryChartRef.value && stats.by_category.length > 0) {
    categoryChart = echarts.init(categoryChartRef.value)
    categoryChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
        label: { show: true, formatter: '{b} {d}%', fontSize: 11 },
        data: stats.by_category.map(c => ({
          value: Number(c.amount).toFixed(2),
          name: categoryLabels[c.name] || c.name,
          itemStyle: { color: categoryColors[c.name] || '#999' }
        }))
      }]
    })
  }

  if (supplierChartRef.value && stats.by_supplier.length > 0) {
    supplierChart = echarts.init(supplierChartRef.value)
    supplierChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
      yAxis: { type: 'category', data: stats.by_supplier.map(s => s.name || '未知') },
      series: [{
        type: 'bar', data: stats.by_supplier.map(s => Number(s.amount).toFixed(2)),
        itemStyle: { color: '#E85D04', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', formatter: '¥{c}' }
      }]
    })
  }
}

window.addEventListener('resize', () => {
  categoryChart?.resize()
  supplierChart?.resize()
})

onMounted(loadData)
onUnmounted(() => {
  categoryChart?.dispose()
  supplierChart?.dispose()
})
</script>

<style scoped>
.cost-analysis-page {
  width: 100%;
}
.range-tabs {
  display: flex;
  gap: 4px;
}
.range-tabs button {
  padding: 6px 16px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  height: 36px;
  transition: all var(--transition-fast);
}
.range-tabs button.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
}
.info-card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  color: var(--text);
  font-weight: 600;
}
.chart-area {
  width: 100%;
  height: 320px;
}
.profit-pos { color: var(--success); }
.profit-neg { color: var(--warning); }
</style>