<template>
  <div class="dashboard">

    <!-- ── Page Header ────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <h1 class="page-title">数据概览</h1>
      <span class="date-badge">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" class="date-icon">
          <rect x="2" y="3" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ today }}
      </span>
    </div>

    <!-- ── Main Layout: Left flex | Right 260px ───────────────────────────────── -->
    <div class="dashboard-body">

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- LEFT PANEL                                                           -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <div class="left-panel">

        <!-- ── Stats Cards Row ──────────────────────────────────────────────── -->
        <div class="stats-grid">
          <div class="stat-card stat-card--orders">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayOrders }}</div>
              <div class="stat-label">今日订单</div>
            </div>
            <div class="stat-trend stat-trend--up">
              <el-icon><Top /></el-icon>
              <span>较昨日</span>
            </div>
          </div>

          <div class="stat-card stat-card--revenue">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ stats.todayRevenue }}</div>
              <div class="stat-label">今日营收</div>
            </div>
            <div class="stat-trend stat-trend--up">
              <el-icon><Top /></el-icon>
              <span>较昨日</span>
            </div>
          </div>

          <div class="stat-card stat-card--avg">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ stats.todayAvgOrder }}</div>
              <div class="stat-label">客单价</div>
            </div>
          </div>

          <div class="stat-card stat-card--pending">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-label">待处理</div>
            </div>
            <div v-if="stats.pendingOrders > 0" class="stat-badge">{{ stats.pendingOrders }}</div>
          </div>

          <div class="stat-card stat-card--customers">
            <div class="stat-icon-wrap">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.newCustomers }}</div>
              <div class="stat-label">新顾客</div>
            </div>
          </div>
        </div>

        <!-- ── Time Range Selector ──────────────────────────────────────────── -->
        <div class="time-range-bar">
          <div class="time-range-label">时间范围</div>
          <div class="time-range-group">
            <button
              v-for="opt in timeRangeOptions"
              :key="opt.value"
              class="time-range-btn"
              :class="{ active: timeRange === opt.value }"
              @click="changeTimeRange(opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- ── Section 1: Trend Charts ───────────────────────────────────────── -->
        <div class="section-group">
          <div class="charts-grid charts-grid-2">
            <div class="chart-card">
              <div class="chart-header">
                <div class="chart-title-group">
                  <h3 class="chart-title">订单量趋势</h3>
                </div>
                <div class="chart-legend">
                  <span class="legend-dot legend-dot--primary"></span>
                  <span class="legend-text">订单量</span>
                </div>
              </div>
              <div v-loading="chartsLoading.trends" class="chart-body">
                <div ref="ordersTrendRef" class="chart-container"></div>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-header">
                <div class="chart-title-group">
                  <h3 class="chart-title">营收趋势</h3>
                </div>
                <div class="chart-legend">
                  <span class="legend-dot legend-dot--accent"></span>
                  <span class="legend-text">营收</span>
                </div>
              </div>
              <div v-loading="chartsLoading.trends" class="chart-body">
                <div ref="revenueTrendRef" class="chart-container"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Section 2: Distribution & Ranking ─────────────────────────────── -->
        <div class="section-group">
          <div class="charts-grid charts-grid-2">
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">订单状态分布</h3>
              </div>
              <div v-loading="chartsLoading.distribution" class="chart-body">
                <div ref="statusDistRef" class="chart-container chart-container--donut"></div>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">热销菜品 TOP10</h3>
              </div>
              <div v-loading="chartsLoading.ranking" class="chart-body">
                <div ref="productsRankingRef" class="chart-container"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Section 3: Hourly & Price Distribution ────────────────────────── -->
        <div class="section-group">
          <div class="charts-grid charts-grid-2">
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">下单时段分布</h3>
              </div>
              <div v-loading="chartsLoading.hourly" class="chart-body">
                <div ref="hourlyDistRef" class="chart-container"></div>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">客单价分布</h3>
              </div>
              <div v-loading="chartsLoading.price" class="chart-body">
                <div ref="priceDistRef" class="chart-container"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <!-- END LEFT PANEL -->

      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <!-- RIGHT PANEL (260px)                                                   -->
      <!-- ════════════════════════════════════════════════════════════════════════ -->
      <div class="right-panel">

        <!-- ── Recent Orders Card ─────────────────────────────────────────────── -->
        <div class="recent-orders-card">
          <div class="recent-orders-header">
            <div class="recent-orders-title-group">
              <h3 class="recent-orders-title">最新订单</h3>
              <span class="recent-orders-count">{{ stats.recentOrders?.length || 0 }} 单</span>
            </div>
            <el-button type="primary" link class="view-all-btn" @click="$router.push('/orders')">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div class="recent-orders-list" ref="ordersListRef">
            <div
              v-for="order in stats.recentOrders"
              :key="order.id"
              class="order-row"
              @click="goToOrder(order)"
            >
              <div class="order-row-main">
                <div class="order-row-left">
                  <span class="order-no">{{ order.order_no }}</span>
                  <span class="order-customer">{{ order.wechat_nickname }}</span>
                </div>
                <div class="order-row-right">
                  <span class="order-amount">¥{{ order.order_total }}</span>
                  <span class="status-tag" :class="statusClassMap[order.status] || 'status-pending'">
                    {{ getStatusText(order.status) }}
                  </span>
                </div>
              </div>
              <div class="order-row-meta">
                <span class="order-time">{{ formatTime(order.created_at) }}</span>
                <span class="order-action">
                  查看
                  <el-icon><ArrowRight /></el-icon>
                </span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!stats.recentOrders || stats.recentOrders.length === 0" class="orders-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="orders-empty-icon">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="orders-empty-text">暂无订单</span>
            </div>
          </div>
        </div>

        <!-- ── Quick Stats Card ─────────────────────────────────────────────── -->
        <div class="quick-stats-card">
          <div class="quick-stats-title">运营速览</div>
          <div class="quick-stats-list">
            <div class="quick-stat-item">
              <span class="quick-stat-label">今日完成</span>
              <span class="quick-stat-value">{{ stats.todayOrders - stats.pendingOrders }} 单</span>
            </div>
            <div class="quick-stat-divider"></div>
            <div class="quick-stat-item">
              <span class="quick-stat-label">平均送达</span>
              <span class="quick-stat-value">32 分钟</span>
            </div>
            <div class="quick-stat-divider"></div>
            <div class="quick-stat-item">
              <span class="quick-stat-label">好评率</span>
              <span class="quick-stat-value quick-stat-value--highlight">98.5%</span>
            </div>
          </div>
        </div>

      </div>
      <!-- END RIGHT PANEL -->

    </div>
    <!-- END Dashboard Body -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Money, TrendCharts, Clock, User, ArrowRight, Top } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import api from '@/api'

const router = useRouter()

const stats = reactive({
  todayOrders: 0,
  todayRevenue: 0,
  todayAvgOrder: 0,
  pendingOrders: 0,
  newCustomers: 0,
  recentOrders: []
})

// ─── Time Range ───────────────────────────────────────────────────────────────
const timeRangeOptions = [
  { label: '7天', value: 7 },
  { label: '30天', value: 30 },
  { label: '全量', value: 0 }
]
const timeRange = ref(7)

// ─── Chart Refs ───────────────────────────────────────────────────────────────
const ordersTrendRef = ref(null)
const revenueTrendRef = ref(null)
const statusDistRef = ref(null)
const productsRankingRef = ref(null)
const hourlyDistRef = ref(null)
const priceDistRef = ref(null)
const ordersListRef = ref(null)

// ─── Chart Instances ─────────────────────────────────────────────────────────
let ordersTrendChart = null
let revenueTrendChart = null
let statusDistChart = null
let productsRankingChart = null
let hourlyDistChart = null
let priceDistChart = null

// ─── Loading States ───────────────────────────────────────────────────────────
const chartsLoading = reactive({
  trends: false,
  distribution: false,
  ranking: false,
  hourly: false,
  price: false
})

// ─── Chart Data ───────────────────────────────────────────────────────────────
const trendsData = reactive({ dates: [], orders: [], revenue: [] })
const statusDistData = reactive([])
const productsRankingData = reactive([])
const hourlyDistData = reactive([])
const priceDistData = reactive([])

// ─── Theme Colors ────────────────────────────────────────────────────────────
const colors = {
  primary: '#E85D04',
  primaryLight: '#F48C06',
  primaryDark: '#DC2F02',
  success: '#2D6A4F',
  accent: '#FAA307',
  warning: '#D62828',
  info: '#457B9D',
  muted: '#A8A29E',
  border: '#E7E5E4',
  text: '#1C1917',
  textMuted: '#A8A29E',
  surface: '#FFFFFF',
  bg: '#FAFAF9'
}

const statusColorMap = {
  pending: '#FAA307',
  preparing: '#E85D04',
  waiting_pickup: '#457B9D',
  delivering: '#F48C06',
  delivered: '#2D6A4F',
  completed: '#2D6A4F',
  cancelled: '#D62828'
}

const statusLabelMap = {
  pending: '待接单',
  preparing: '制作中',
  waiting_pickup: '待取餐',
  delivering: '配送中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = dayjs().format('MM-DD')

const getStatusText = (status) => statusLabelMap[status] || status

const statusClassMap = {
  pending: 'status-pending',
  preparing: 'status-preparing',
  waiting_pickup: 'status-waiting',
  delivering: 'status-delivering',
  delivered: 'status-delivered',
  completed: 'status-completed',
  cancelled: 'status-cancelled'
}

const formatTime = (time) => dayjs(time).format('HH:mm')
const goToOrder = (row) => router.push(`/orders/${row.id}`)

// ─── Chart Initialization ─────────────────────────────────────────────────────

function initOrdersTrend() {
  if (!ordersTrendRef.value) return
  ordersTrendChart = echarts.init(ordersTrendRef.value)
  const option = {
    grid: { top: 12, right: 12, bottom: 28, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<span style="font-weight:600">${p.axisValue}</span><br/>订单量：<b>${p.value}</b> 单`
      }
    },
    xAxis: {
      type: 'category',
      data: trendsData.dates,
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false },
      axisLabel: { 
        color: colors.textMuted, 
        fontSize: 10, 
        interval: timeRange.value === 0 
          ? Math.floor(trendsData.dates.length / 7)  // 全量：约显示7个标签
          : timeRange.value > 7 
            ? Math.floor(trendsData.dates.length / Math.min(timeRange.value, 7))  // 7天以上
            : 0  // 7天以内显示所有
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted, fontSize: 10 }
    },
    series: [{
      type: 'line',
      data: trendsData.orders,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: colors.primary, width: 2 },
      itemStyle: { color: colors.primary },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(232, 93, 4, 0.18)' },
          { offset: 1, color: 'rgba(232, 93, 4, 0.02)' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        color: colors.textMuted,
        fontSize: 9,
        formatter: '{c}'
      }
    }],
    animation: true
  }
  ordersTrendChart.setOption(option)
}

function initRevenueTrend() {
  if (!revenueTrendRef.value) return
  revenueTrendChart = echarts.init(revenueTrendRef.value)
  const option = {
    grid: { top: 12, right: 12, bottom: 28, left: 56 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<span style="font-weight:600">${p.axisValue}</span><br/>营收：<b>¥${p.value}</b>`
      }
    },
    xAxis: {
      type: 'category',
      data: trendsData.dates,
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false },
      axisLabel: { 
        color: colors.textMuted, 
        fontSize: 10, 
        interval: timeRange.value === 0 
          ? Math.floor(trendsData.dates.length / 7)  // 全量：约显示7个标签
          : timeRange.value > 7 
            ? Math.floor(trendsData.dates.length / Math.min(timeRange.value, 7))  // 7天以上
            : 0  // 7天以内显示所有
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted, fontSize: 10, formatter: (v) => `¥${v}` }
    },
    series: [{
      type: 'line',
      data: trendsData.revenue,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: colors.accent, width: 2 },
      itemStyle: { color: colors.accent },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(250, 163, 7, 0.18)' },
          { offset: 1, color: 'rgba(250, 163, 7, 0.02)' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        color: colors.textMuted,
        fontSize: 9,
        formatter: '¥{c}'
      }
    }],
    animation: true
  }
  revenueTrendChart.setOption(option)
}

function initStatusDist() {
  if (!statusDistRef.value) return
  statusDistChart = echarts.init(statusDistRef.value)

  const total = statusDistData.reduce((s, d) => s + d.count, 0)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (p) => `<span style="font-weight:600">${p.name}</span><br/>${p.value} 单 (${p.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 6,
      top: 'middle',
      itemWidth: 9,
      itemHeight: 9,
      borderRadius: 2,
      textStyle: { color: colors.textMuted, fontSize: 10 }
    },
    series: [{
      type: 'pie',
      radius: ['42%', '66%'],
      center: ['34%', '50%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'outside',
        color: colors.textMuted,
        fontSize: 10,
        formatter: '{d}%'
      },
      labelLine: {
        show: true,
        lineStyle: { color: colors.border }
      },
      data: statusDistData.map(d => ({
        name: statusLabelMap[d.status] || d.status,
        value: d.count,
        itemStyle: { color: statusColorMap[d.status] || colors.muted }
      })),
      emphasis: {
        itemStyle: { shadowBlur: 6, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.1)' }
      }
    }],
    graphic: [{
      type: 'text',
      left: '34%',
      top: '44%',
      style: {
        text: String(total),
        fill: colors.text,
        fontSize: 18,
        fontWeight: 700,
        textAlign: 'center'
      }
    }, {
      type: 'text',
      left: '34%',
      top: '56%',
      style: {
        text: '总订单',
        fill: colors.textMuted,
        fontSize: 10,
        textAlign: 'center'
      }
    }],
    graphic: [],
    animation: true
  }
  statusDistChart.setOption(option)
}

function initProductsRanking() {
  if (!productsRankingRef.value) return
  productsRankingChart = echarts.init(productsRankingRef.value)

  const sorted = [...productsRankingData].sort((a, b) => b.qty - a.qty).slice(0, 10)
  const names = sorted.map(d => d.name)
  const qtys = sorted.map(d => d.qty)

  const option = {
    grid: { top: 6, right: 56, bottom: 6, left: 6, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' },
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<span style="font-weight:600">${p.name}</span><br/>销量：<b>${p.value}</b> 份`
      }
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted, fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.text,
        fontSize: 10,
        width: 88,
        overflow: 'truncate'
      }
    },
    series: [{
      type: 'bar',
      data: qtys,
      barMaxWidth: 16,
      itemStyle: {
        borderRadius: [0, 3, 3, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: colors.primary },
          { offset: 1, color: colors.primaryLight }
        ])
      },
      label: {
        show: true,
        position: 'right',
        color: colors.textMuted,
        fontSize: 10,
        formatter: '{c}'
      }
    }],
    animation: true
  }
  productsRankingChart.setOption(option)
}

function initHourlyDist() {
  if (!hourlyDistRef.value) return
  hourlyDistChart = echarts.init(hourlyDistRef.value)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const countMap = {}
  hourlyDistData.forEach(d => { countMap[d.hour] = d.count })
  const counts = hours.map(h => countMap[h] || 0)

  const option = {
    grid: { top: 12, right: 12, bottom: 28, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<span style="font-weight:600">${p.name}:00</span><br/>订单：<b>${p.value}</b> 单`
      }
    },
    xAxis: {
      type: 'category',
      data: hours.map(h => `${h}`),
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false },
      axisLabel: {
        color: colors.textMuted,
        fontSize: 9,
        interval: 3,
        formatter: (v) => `${v}:00`
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted, fontSize: 10 }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 16,
      itemStyle: {
        borderRadius: [3, 3, 0, 0],
        color: colors.primary
      },
      label: {
        show: true,
        position: 'top',
        color: colors.textMuted,
        fontSize: 9,
        formatter: '{c}'
      }
    }],
    animation: true
  }
  hourlyDistChart.setOption(option)
}

function initPriceDist() {
  if (!priceDistRef.value) return
  priceDistChart = echarts.init(priceDistRef.value)

  const ranges = priceDistData.map(d => d.range)
  const counts = priceDistData.map(d => d.count)

  const option = {
    grid: { top: 12, right: 12, bottom: 28, left: 36 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 11 },
      formatter: (params) => {
        const p = params[0]
        return `<span style="font-weight:600">${p.name}</span><br/>订单：<b>${p.value}</b> 单`
      }
    },
    xAxis: {
      type: 'category',
      data: ranges,
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false },
      axisLabel: { color: colors.textMuted, fontSize: 10, rotate: 0 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted, fontSize: 10 }
    },
    series: [{
      type: 'bar',
      data: counts,
      barMaxWidth: 32,
      itemStyle: {
        borderRadius: [3, 3, 0, 0],
        color: colors.accent
      },
      label: {
        show: true,
        position: 'top',
        color: colors.textMuted,
        fontSize: 9,
        formatter: '{c}'
      }
    }],
    animation: true
  }
  priceDistChart.setOption(option)
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function loadTrends() {
  chartsLoading.trends = true
  try {
    const res = await api.stats.trends(timeRange.value)
    if (res.code === 200) {
      trendsData.dates = res.data.trends.map(t => t.date)
      trendsData.orders = res.data.trends.map(t => t.orders)
      trendsData.revenue = res.data.trends.map(t => t.revenue)
      await nextTick()
      initOrdersTrend()
      initRevenueTrend()
    }
  } catch (e) {
    console.error('加载趋势数据失败', e)
  } finally {
    chartsLoading.trends = false
  }
}

async function loadDistribution() {
  chartsLoading.distribution = true
  try {
    const res = await api.stats.distributions(timeRange.value)
    if (res.code === 200) {
      statusDistData.length = 0
      statusDistData.push(...(res.data.statusDist || []))
      await nextTick()
      initStatusDist()
    }
  } catch (e) {
    console.error('加载分布数据失败', e)
  } finally {
    chartsLoading.distribution = false
  }
}

async function loadRanking() {
  chartsLoading.ranking = true
  try {
    const res = await api.stats.productsRanking(10, timeRange.value)
    if (res.code === 200) {
      productsRankingData.length = 0
      productsRankingData.push(...(res.data || []))
      await nextTick()
      initProductsRanking()
    }
  } catch (e) {
    console.error('加载排名数据失败', e)
  } finally {
    chartsLoading.ranking = false
  }
}

async function loadHourly() {
  chartsLoading.hourly = true
  try {
    const res = await api.stats.hourly(timeRange.value)
    if (res.code === 200) {
      hourlyDistData.length = 0
      hourlyDistData.push(...(res.data || []))
      await nextTick()
      initHourlyDist()
    }
  } catch (e) {
    console.error('加载时段数据失败', e)
  } finally {
    chartsLoading.hourly = false
  }
}

async function loadPriceDist() {
  chartsLoading.price = true
  try {
    const res = await api.stats.priceDistribution(timeRange.value)
    if (res.code === 200) {
      priceDistData.length = 0
      priceDistData.push(...(res.data || []))
      await nextTick()
      initPriceDist()
    }
  } catch (e) {
    console.error('加载客单价数据失败', e)
  } finally {
    chartsLoading.price = false
  }
}

function changeTimeRange(days) {
  timeRange.value = days
  Promise.all([
    loadTrends(),
    loadDistribution(),
    loadRanking(),
    loadHourly(),
    loadPriceDist()
  ])
}

// ─── Resize Handler ───────────────────────────────────────────────────────────
function resizeCharts() {
  ordersTrendChart?.resize()
  revenueTrendChart?.resize()
  statusDistChart?.resize()
  productsRankingChart?.resize()
  hourlyDistChart?.resize()
  priceDistChart?.resize()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
const loadStats = async () => {
  try {
    const result = await api.stats.dashboard()
    if (result.code === 200) {
      Object.assign(stats, result.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(async () => {
  await loadStats()
  await Promise.all([
    loadTrends(),
    loadDistribution(),
    loadRanking(),
    loadHourly(),
    loadPriceDist()
  ])
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  ordersTrendChart?.dispose()
  revenueTrendChart?.dispose()
  statusDistChart?.dispose()
  productsRankingChart?.dispose()
  hourlyDistChart?.dispose()
  priceDistChart?.dispose()
})
</script>

<style scoped>
/* ─── Dashboard Root ─────────────────────────────────────────────────────────── */
.dashboard {
  width: 100%;
  overflow-x: hidden;
}

/* ─── Page Header ─────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 2px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 5px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  box-shadow: var(--shadow-sm);
}

.date-icon {
  flex-shrink: 0;
}

/* ─── Dashboard Body: flex | 260px ─────────────────────────────────────────── */
.dashboard-body {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 16px;
  align-items: start;
}

/* ─── Left Panel ──────────────────────────────────────────────────────────── */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

/* ─── Stats Grid ──────────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  cursor: default;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--primary-light);
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
  font-size: 16px;
}

.stat-card--orders .stat-icon { background: rgba(232, 93, 4, 0.1); color: #E85D04; }
.stat-card--revenue .stat-icon { background: rgba(250, 163, 7, 0.12); color: #FAA307; }
.stat-card--avg .stat-icon { background: rgba(69, 123, 157, 0.1); color: #457B9D; }
.stat-card--pending .stat-icon { background: rgba(214, 40, 40, 0.1); color: #D62828; }
.stat-card--customers .stat-icon { background: rgba(45, 106, 79, 0.1); color: #2D6A4F; }

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: var(--radius-xs);
}

.stat-trend--up {
  color: #2D6A4F;
  background: rgba(45, 106, 79, 0.1);
}

.stat-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #D62828;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* ─── Time Range Selector ─────────────────────────────────────────────────── */
.time-range-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.time-range-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.time-range-group {
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.time-range-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  line-height: 1.5;
}

.time-range-btn + .time-range-btn {
  border-left: 1px solid var(--border);
}

.time-range-btn:hover {
  color: var(--text);
  background: var(--bg);
}

.time-range-btn.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

/* ─── Section Group ───────────────────────────────────────────────────────── */
.section-group {
  display: flex;
  flex-direction: column;
}

/* ─── Chart Grid ──────────────────────────────────────────────────────────── */
.charts-grid {
  display: grid;
  gap: 12px;
}

.charts-grid-2 {
  grid-template-columns: 1fr 1fr;
}

.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.chart-card:hover {
  box-shadow: var(--shadow-md);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--border-light);
}

.chart-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--primary { background: var(--primary); }
.legend-dot--accent { background: var(--accent); }

.legend-text {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.chart-body {
  position: relative;
  padding: 6px 0 2px;
}

.chart-container {
  width: 100%;
  height: 200px;
}

.chart-container--donut {
  height: 220px;
}

/* ─── Right Panel ─────────────────────────────────────────────────────────── */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 16px;
}

/* ─── Recent Orders Card ─────────────────────────────────────────────────── */
.recent-orders-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.recent-orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
}

.recent-orders-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recent-orders-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.recent-orders-count {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  color: var(--text-muted);
}

.view-all-btn {
  font-size: 11px;
  font-weight: 500;
  color: var(--primary) !important;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 0 !important;
}

.view-all-btn:hover {
  color: var(--primary-light) !important;
}

.view-all-btn .el-icon {
  font-size: 12px;
  transition: transform 0.15s ease;
}

.view-all-btn:hover .el-icon {
  transform: translateX(2px);
}

/* ─── Orders List ────────────────────────────────────────────────────────── */
.recent-orders-list {
  max-height: 440px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.order-row {
  padding: 8px 14px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.15s ease;
}

.order-row:last-child {
  border-bottom: none;
}

.order-row:hover {
  background: var(--bg);
}

.order-row-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.order-row-left {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.order-no {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.2px;
}

.order-customer {
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.order-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}

.order-row-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-time {
  font-size: 10px;
  color: var(--text-muted);
}

.order-action {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: var(--primary);
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.order-row:hover .order-action {
  opacity: 1;
}

.order-action .el-icon {
  font-size: 11px;
  transition: transform 0.15s ease;
}

.order-row:hover .order-action .el-icon {
  transform: translateX(2px);
}

/* ─── Status Tags ─────────────────────────────────────────────────────────── */
.status-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  white-space: nowrap;
  line-height: 1.5;
}

.status-pending { background: rgba(250, 163, 7, 0.15); color: #D97706; }
.status-preparing { background: rgba(232, 93, 4, 0.12); color: #E85D04; }
.status-waiting { background: rgba(69, 123, 157, 0.12); color: #457B9D; }
.status-delivering { background: rgba(244, 140, 6, 0.15); color: #D97706; }
.status-delivered { background: rgba(45, 106, 79, 0.12); color: #2D6A4F; }
.status-completed { background: rgba(45, 106, 79, 0.12); color: #2D6A4F; }
.status-cancelled { background: rgba(214, 40, 40, 0.1); color: #D62828; }

/* ─── Empty State ────────────────────────────────────────────────────────── */
.orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 10px;
}

.orders-empty-icon {
  color: var(--text-muted);
  opacity: 0.4;
}

.orders-empty-text {
  font-size: 12px;
  color: var(--text-muted);
}

/* ─── Quick Stats Card ───────────────────────────────────────────────────── */
.quick-stats-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.quick-stats-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
}

.quick-stats-list {
  padding: 2px 0;
}

.quick-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
}

.quick-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.quick-stat-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.quick-stat-value--highlight {
  color: var(--success);
}

.quick-stat-divider {
  height: 1px;
  background: var(--border-light);
  margin: 0 14px;
}

/* ─── Element Plus Overrides ─────────────────────────────────────────────── */
:deep(.el-button--primary) {
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: var(--primary-light);
  --el-button-hover-border-color: var(--primary-light);
  --el-button-active-bg-color: var(--primary-dark);
  --el-button-active-border-color: var(--primary-dark);
  color: #fff;
}

:deep(.el-tag) {
  border-radius: var(--radius-xs);
  font-size: 10px;
  padding: 0 5px;
  height: 18px;
  line-height: 16px;
}

:deep(.el-loading-mask) {
  background: rgba(255,255,255,0.7);
  border-radius: var(--radius-lg);
}

/* ─── Dark Mode ────────────────────────────────────────────────────────────── */
[data-theme="dark"] .dashboard {
  --bg: #0F0E0D;
  --surface: #1C1917;
  --surface-2: #292524;
  --border: #44403C;
  --border-light: #292524;
  --text: #FAFAF9;
  --text-secondary: #D6D3D1;
  --text-muted: #78716C;
}

[data-theme="dark"] .page-title,
[data-theme="dark"] .section-title,
[data-theme="dark"] .chart-title,
[data-theme="dark"] .recent-orders-title,
[data-theme="dark"] .quick-stats-title {
  color: var(--text);
}

[data-theme="dark"] .stat-card {
  background: var(--surface);
  border-color: var(--border);
}

[data-theme="dark"] .chart-card,
[data-theme="dark"] .recent-orders-card,
[data-theme="dark"] .quick-stats-card {
  background: var(--surface);
  border-color: var(--border);
}

[data-theme="dark"] .date-badge {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-muted);
}

[data-theme="dark"] .time-range-group {
  background: var(--surface);
  border-color: var(--border);
}

[data-theme="dark"] .recent-orders-count {
  background: var(--surface-2);
  border-color: var(--border);
  color: var(--text-muted);
}

[data-theme="dark"] .order-no {
  color: var(--text-secondary);
}

[data-theme="dark"] .stat-label {
  color: var(--text-muted);
}

[data-theme="dark"] .order-time {
  color: var(--text-muted);
}

[data-theme="dark"] .chart-header {
  border-bottom-color: var(--border);
}

[data-theme="dark"] .recent-orders-header {
  border-bottom-color: var(--border);
}

[data-theme="dark"] .quick-stat-divider {
  background: var(--border);
}

[data-theme="dark"] .order-row {
  border-bottom-color: var(--border-light);
}

[data-theme="dark"] .el-loading-mask {
  background: rgba(28, 25, 23, 0.7);
}

[data-theme="dark"] .stat-badge {
  background: #EF4444;
  color: #fff;
}

/* ─── Responsive Breakpoints ────────────────────────────────────────────────── */
@media (max-width: 1400px) {
  .dashboard-body {
    grid-template-columns: 1fr 240px;
    gap: 14px;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-card {
    padding: 10px;
  }
}

@media (max-width: 1200px) {
  .dashboard-body {
    grid-template-columns: 1fr 220px;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .dashboard-body {
    grid-template-columns: 1fr 220px;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-container {
    height: 180px;
  }

  .chart-container--donut {
    height: 200px;
  }
}

@media (max-width: 900px) {
  .dashboard-body {
    grid-template-columns: 1fr;
  }

  .right-panel {
    position: static;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-grid-2 {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 180px;
  }

  .recent-orders-list {
    max-height: 320px;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 10px;
    flex-direction: row;
    align-items: center;
  }

  .stat-icon-wrap {
    margin-bottom: 0;
    margin-right: 8px;
  }

  .stat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-trend {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .stat-badge {
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .time-range-bar {
    padding: 0;
  }

  .time-range-btn {
    padding: 5px 12px;
    font-size: 12px;
  }

  .chart-container {
    height: 170px;
  }

  .right-panel {
    gap: 10px;
  }

  .recent-orders-list {
    max-height: 280px;
  }
}

@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
