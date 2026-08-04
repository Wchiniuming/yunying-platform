import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert, assertHasFields } from '../helpers/assert.js'

const runner = new TestRunner('P2-1 Stats (7 endpoints) + Delivery (1) + App info (1)')

runner
  .case('App info: 返回基础信息', async () => {
    const c = client()
    const r = await c.get('/api/app/info')
    assertOk(r)
    assertHasFields(r.data.data, ['version', 'vue', 'dataPath'])
  })
  .case('Dashboard stats: 空 DB 返回 0', async () => {
    const c = client()
    const r = await c.get('/api/stats/dashboard')
    assertOk(r)
    assertEqual(r.data.data.todayOrders, 0)
    assertEqual(r.data.data.newCustomers, 0)
    assertEqual(r.data.data.pendingOrders, 0)
    assert(Array.isArray(r.data.data.recentOrders))
  })
  .case('Delivery stats: 空 DB 返回 0', async () => {
    const c = client()
    const r = await c.get('/api/delivery/stats')
    assertOk(r)
    assertEqual(r.data.data.pending, 0)
    assertEqual(r.data.data.delivering, 0)
    assertEqual(r.data.data.deliveredToday, 0)
    assertEqual(r.data.data.selfDelivery, 0)
  })
  .case('Trends: 默认 7 天', async () => {
    const c = client()
    const r = await c.get('/api/stats/trends')
    assertOk(r)
    assertEqual(r.data.data.trends.length, 7)
    assertEqual(r.data.data.customersTrend.length, 7)
  })
  .case('Trends: days=1', async () => {
    const c = client()
    const r = await c.get('/api/stats/trends', { params: { days: 1 } })
    assertOk(r)
    assertEqual(r.data.data.trends.length, 1)
  })
  .case('Trends: NaN days 不爆 500', async () => {
    const c = client()
    const r = await c.get('/api/stats/trends', { params: { days: 'abc' } })
    assertOk(r)
  })
  .case('Distributions: 空 DB 返回空数组', async () => {
    const c = client()
    const r = await c.get('/api/stats/distributions')
    assertOk(r)
    assert(Array.isArray(r.data.data.statusDist))
    assert(Array.isArray(r.data.data.deliveryDist))
    assert(Array.isArray(r.data.data.sourceDist))
  })
  .case('Products ranking: 空 DB 返回 []', async () => {
    const c = client()
    const r = await c.get('/api/stats/products/ranking')
    assertOk(r)
    assertEqual(Array.isArray(r.data.data), true)
    assertEqual(r.data.data.length, 0)
  })
  .case('Products ranking: limit 参数', async () => {
    const c = client()
    const r = await c.get('/api/stats/products/ranking', { params: { limit: 5 } })
    assertOk(r)
  })
  .case('Products ranking: limit 上限 50', async () => {
    const c = client()
    const r = await c.get('/api/stats/products/ranking', { params: { limit: 9999 } })
    assertOk(r)
  })
  .case('Hourly: 24 小时覆盖', async () => {
    const c = client()
    const r = await c.get('/api/stats/hourly')
    assertOk(r)
    assertEqual(r.data.data.length, 24)
    assertEqual(r.data.data[0].hour, 0)
    assertEqual(r.data.data[23].hour, 23)
  })
  .case('Price distribution: 6 区间', async () => {
    const c = client()
    const r = await c.get('/api/stats/price-distribution')
    assertOk(r)
    assertEqual(r.data.data.length, 6)
  })
  .case('Stats 接入数据后正确聚合', async () => {
    const c = client()
    await c.post('/api/orders', {
      wechat_nickname: '统计测试', items: [{ name: '统计菜', price: 50, qty: 2 }], order_total: 100, payment_status: 'paid'
    })
    await c.post('/api/orders', {
      wechat_nickname: '统计测试2', items: [{ name: '统计菜', price: 50, qty: 1 }], order_total: 50, payment_status: 'paid'
    })
    const r = await c.get('/api/orders/stats')
    assertOk(r)
    assertEqual(r.data.data.totalOrders, 2)
    assertEqual(r.data.data.totalRevenue, 150)
  })
  .case('Stats ranking 正确累计商品销量', async () => {
    const c = client()
    const r = await c.get('/api/stats/products/ranking')
    assertOk(r)
    const item = r.data.data.find(p => p.name === '统计菜')
    assert(item, '统计菜 should be in ranking')
    assertEqual(item.qty, 3)
  })

async function main() {
  await startServer({ port: 13907, dbName: 'stats' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
