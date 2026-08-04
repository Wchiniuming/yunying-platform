import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert, assertHasFields } from '../helpers/assert.js'

const runner = new TestRunner('P1-1 Orders (4 endpoints)')

let orderId = null
let customerId = null

runner
  .case('列表：空 DB 返回 total=0', async () => {
    const c = client()
    const r = await c.get('/api/orders')
    assertOk(r)
    assertEqual(r.data.data.total, 0)
  })
  .case('列表：分页参数 NaN 不抛 500', async () => {
    const c = client()
    const r = await c.get('/api/orders', { params: { page: 'x', pageSize: '' } })
    assertOk(r)
  })
  .case('统计：空 DB 数字正确', async () => {
    const c = client()
    const r = await c.get('/api/orders/stats')
    assertOk(r)
    assertEqual(r.data.data.totalOrders, 0)
    assertEqual(r.data.data.totalRevenue, 0)
  })
  .case('创建：缺 wechat_nickname 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/orders', { items: [{ name: '菜', price: 10, qty: 1 }], order_total: 10 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：缺 items 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/orders', { wechat_nickname: '测试' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：items 为空数组返回 400', async () => {
    const c = client()
    const r = await c.post('/api/orders', { wechat_nickname: '测试', items: [], order_total: 0 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：负数金额返回 400', async () => {
    const c = client()
    const r = await c.post('/api/orders', { wechat_nickname: '测试', items: [{ name: '菜', price: -1, qty: 1 }], order_total: -10 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：无效 delivery_method 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/orders', { wechat_nickname: '测试', items: [{ name: '菜', price: 10, qty: 1 }], order_total: 10, delivery_method: 'drone' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：成功返回 200 + order_no', async () => {
    const c = client()
    const r = await c.post('/api/orders', {
      wechat_nickname: '订单顾客A',
      phone: '13800138000',
      delivery_address: '深圳市南山区',
      items: [{ name: '麻辣鸡腿', price: 28, qty: 2, unit: '份' }],
      order_total: 56,
      delivery_method: 'self',
      payment_status: 'paid'
    })
    assertOk(r)
    assert(typeof r.data.data.id === 'number')
    assert(typeof r.data.data.order_no === 'string')
    orderId = r.data.data.id
  })
  .case('创建：自动写入 status_log 含 action', async () => {
    const c = client()
    const r = await c.get(`/api/orders/${orderId}`)
    assertOk(r)
    assert(Array.isArray(r.data.data.timeline))
    assert(r.data.data.timeline.length >= 1, 'at least 1 log')
    const first = r.data.data.timeline[0]
    assert(first.action || first.remark, 'log has action or remark')
  })
  .case('创建：items_json 正确解析', async () => {
    const c = client()
    const r = await c.get(`/api/orders/${orderId}`)
    assertEqual(r.data.data.items.length, 1)
    assertEqual(r.data.data.items[0].name, '麻辣鸡腿')
  })
  .case('创建：自动创建 status_log 包含 action 字段（适配前端）', async () => {
    const c = client()
    const r = await c.get(`/api/orders/${orderId}`)
    const log = r.data.data.timeline[0]
    assert(log.action, `action should be set, got: ${JSON.stringify(log)}`)
  })
  .case('详情：不存在的 id 返回 404', async () => {
    const c = client()
    const r = await c.get('/api/orders/99999')
    assertEqual(r.data.code, 404)
  })
  .case('列表：keyword 命中', async () => {
    const c = client()
    const r = await c.get('/api/orders', { params: { keyword: '订单顾客A' } })
    assertOk(r)
    assert(r.data.data.total >= 1)
  })
  .case('列表：status 筛选', async () => {
    const c = client()
    const r = await c.get('/api/orders', { params: { status: 'pending' } })
    assertOk(r)
    assert(r.data.data.total >= 1)
  })
  .case('列表：customerId 筛选', async () => {
    const c = client()
    const cust = await c.post('/api/customers', { wechat_nickname: '订单顾客A' })
    customerId = cust.data.data.id
    const r = await c.get('/api/orders', { params: { customerId } })
    assertOk(r)
  })
  .case('改状态：pending → preparing 成功', async () => {
    const c = client()
    const r = await c.put(`/api/orders/${orderId}`, { status: 'preparing' })
    assertOk(r)
  })
  .case('改状态：增加新日志', async () => {
    const c = client()
    const r = await c.get(`/api/orders/${orderId}`)
    const logs = r.data.data.timeline
    assert(logs.length >= 2)
    const last = logs[logs.length - 1]
    assertEqual(last.new_status, 'preparing')
    assert(last.action, 'action should be set')
  })
  .case('改状态：BUG-006 修复验证 - 非法状态返回 400', async () => {
    const c = client()
    const r = await c.put(`/api/orders/${orderId}`, { status: 'invalid_status_xyz' })
    assertEqual(r.data.code, 400)
  })
  .case('改状态：缺失 status 返回 400', async () => {
    const c = client()
    const r = await c.put(`/api/orders/${orderId}`, {})
    assertEqual(r.data.code, 400)
  })
  .case('改状态：不存在的订单返回 404', async () => {
    const c = client()
    const r = await c.put('/api/orders/99999', { status: 'preparing' })
    assertEqual(r.data.code, 404)
  })
  .case('改状态：7 种合法状态都能设置', async () => {
    const c = client()
    const statuses = ['pending', 'preparing', 'waiting_pickup', 'delivering', 'delivered', 'completed', 'cancelled']
    for (const s of statuses) {
      const r = await c.put(`/api/orders/${orderId}`, { status: s })
      assertEqual(r.data.code, 200, `status ${s} should succeed`)
    }
  })
  .case('订单列表带分页：第二页有数据', async () => {
    const c = client()
    for (let i = 0; i < 5; i++) {
      await c.post('/api/orders', {
        wechat_nickname: `批量${i}`, items: [{ name: '菜', price: 1, qty: 1 }], order_total: 1
      })
    }
    const r = await c.get('/api/orders', { params: { page: 1, pageSize: 3 } })
    assertOk(r)
    assertEqual(r.data.data.list.length, 3)
    assert(r.data.data.total >= 6)
  })
  .case('订单删除：当前 API 不支持 DELETE（验证行为）', async () => {
    const c = client()
    const r = await c.delete(`/api/orders/${orderId}`)
    assertEqual(r.status, 404, 'orders has no DELETE endpoint')
  })

async function main() {
  await startServer({ port: 13904, dbName: 'orders' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
