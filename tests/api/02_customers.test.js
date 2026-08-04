import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert, assertHasFields } from '../helpers/assert.js'

const runner = new TestRunner('P0-3 Customers (7 endpoints)')

let createdId = null

runner
  .case('列表：空 DB 返回 total=0 + list=[]', async () => {
    const c = client()
    const r = await c.get('/api/customers', { params: { page: 1, pageSize: 20 } })
    assertOk(r)
    assertEqual(r.data.data.total, 0)
    assertEqual(r.data.data.list.length, 0)
  })
  .case('列表：分页参数 NaN 安全（BUG-002 修复验证）', async () => {
    const c = client()
    const r = await c.get('/api/customers', { params: { page: 'abc', pageSize: '' } })
    assertOk(r, 'should not 500 on NaN params')
  })
  .case('详情：不存在的 id 返回 404', async () => {
    const c = client()
    const r = await c.get('/api/customers/99999')
    assertEqual(r.data.code, 404)
  })
  .case('详情：负 id 不抛 500', async () => {
    const c = client()
    const r = await c.get('/api/customers/-1')
    assert(r.data.code === 404 || r.data.code === 200, 'graceful response')
  })
  .case('创建：必填昵称缺失返回 400（BUG-003 修复验证）', async () => {
    const c = client()
    const r = await c.post('/api/customers', { phone: '13800138000' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：空字符串昵称返回 400', async () => {
    const c = client()
    const r = await c.post('/api/customers', { wechat_nickname: '   ' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：手机号格式错误返回 400', async () => {
    const c = client()
    const r = await c.post('/api/customers', { wechat_nickname: '张三', phone: 'abc<script>alert(1)</script>' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：成功返回 200 + 新 id', async () => {
    const c = client()
    const r = await c.post('/api/customers', { wechat_nickname: '测试顾客A', phone: '13800138000', address: '深圳市南山区' })
    assertOk(r)
    assert(typeof r.data.data.id === 'number', 'id should be a number')
    createdId = r.data.data.id
  })
  .case('创建：空 body 不抛 500', async () => {
    const c = client()
    const r = await c.post('/api/customers', {})
    assertEqual(r.data.code, 400)
  })
  .case('详情：刚创建的顾客能查到', async () => {
    const c = client()
    const r = await c.get(`/api/customers/${createdId}`)
    assertOk(r)
    assertEqual(r.data.data.wechat_nickname, '测试顾客A')
    assertHasFields(r.data.data, ['address', 'remark', 'order_count', 'recent_orders'])
  })
  .case('更新：合法更新返回 200', async () => {
    const c = client()
    const r = await c.put(`/api/customers/${createdId}`, { wechat_nickname: '测试顾客A-改', customer_level: 'vip' })
    assertOk(r)
    const r2 = await c.get(`/api/customers/${createdId}`)
    assertEqual(r2.data.data.wechat_nickname, '测试顾客A-改')
    assertEqual(r2.data.data.customer_level, 'vip')
  })
  .case('更新：缺失昵称返回 400', async () => {
    const c = client()
    const r = await c.put(`/api/customers/${createdId}`, { phone: '111' })
    assertEqual(r.data.code, 400)
  })
  .case('更新：不存在的 id 返回 404', async () => {
    const c = client()
    const r = await c.put('/api/customers/99999', { wechat_nickname: '不存在' })
    assertEqual(r.data.code, 404)
  })
  .case('更新：非数字 id 返回 400', async () => {
    const c = client()
    const r = await c.put('/api/customers/abc', { wechat_nickname: 'x' })
    assertEqual(r.data.code, 400)
  })
  .case('搜索：关键字命中', async () => {
    const c = client()
    const r = await c.get('/api/customers/search', { params: { keyword: '测试' } })
    assertOk(r)
    assert(r.data.data.length >= 1, 'should find the customer')
  })
  .case('搜索：空关键字返回 20 条以内（不爆 500）', async () => {
    const c = client()
    const r = await c.get('/api/customers/search', { params: { keyword: '' } })
    assertOk(r)
  })
  .case('搜索：特殊字符不抛 500', async () => {
    const c = client()
    const r = await c.get('/api/customers/search', { params: { keyword: "'; DROP TABLE customers; --" } })
    assertOk(r, 'SQL injection in search should be safely escaped')
  })
  .case('列表：keyword 筛选', async () => {
    const c = client()
    const r = await c.get('/api/customers', { params: { keyword: '测试' } })
    assertOk(r)
    assertEqual(r.data.data.total, 1)
  })
  .case('统计：1 个活跃顾客', async () => {
    const c = client()
    const r = await c.get('/api/customers/stats')
    assertOk(r)
    assertEqual(r.data.data.total, 1, '前面用例创建了 1 个顾客')
  })
  .case('删除：成功软删除', async () => {
    const c = client()
    const r = await c.delete(`/api/customers/${createdId}`)
    assertOk(r)
    const r2 = await c.get(`/api/customers/${createdId}`)
    assertEqual(r2.data.code, 404, 'soft-deleted should not be findable')
  })
  .case('删除：重复删除返回 404（不重复 chenges）', async () => {
    const c = client()
    const r = await c.delete(`/api/customers/${createdId}`)
    assertEqual(r.data.code, 404)
  })
  .case('删除：非数字 id 返回 400', async () => {
    const c = client()
    const r = await c.delete('/api/customers/abc')
    assertEqual(r.data.code, 400)
  })
  .case('删除：顾客有未删除订单返回 409（BUG-004 修复验证）', async () => {
    const c = client()
    const cust = await c.post('/api/customers', { wechat_nickname: '有单顾客' })
    const custId = cust.data.data.id
    await c.post('/api/orders', {
      wechat_nickname: '有单顾客',
      customer_id: custId,
      items: [{ name: '测试菜', price: 10, qty: 1 }],
      order_total: 10
    })
    const r = await c.delete(`/api/customers/${custId}`)
    assertEqual(r.data.code, 409)
  })

async function main() {
  await startServer({ port: 13903, dbName: 'customers' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
