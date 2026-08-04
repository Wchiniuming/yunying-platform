import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert } from '../helpers/assert.js'

const runner = new TestRunner('P1-2 Products (4 endpoints)')

let productId = null

runner
  .case('列表：空 DB 返回 []', async () => {
    const c = client()
    const r = await c.get('/api/products')
    assertOk(r)
    assertEqual(Array.isArray(r.data.data), true)
    assertEqual(r.data.data.length, 0)
  })
  .case('列表：keyword 筛选', async () => {
    const c = client()
    const r = await c.get('/api/products', { params: { keyword: '不存在的菜' } })
    assertOk(r)
    assertEqual(r.data.data.length, 0)
  })
  .case('列表：status 筛选参数', async () => {
    const c = client()
    const r = await c.get('/api/products', { params: { status: 'available' } })
    assertOk(r)
  })
  .case('创建：缺 name 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/products', { price: 10 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：缺 price 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: '测试菜' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：BUG-007 修复验证 - 负数价格返回 400', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: '负价格菜', price: -5 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：NaN 价格返回 400', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: 'NaN价格菜', price: 'not a number' })
    assertEqual(r.data.code, 400)
  })
  .case('创建：空字符串名称返回 400', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: '   ', price: 10 })
    assertEqual(r.data.code, 400)
  })
  .case('创建：成功返回 200 + id', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: '测试菜A', price: 28, category: 'main', unit: '份' })
    assertOk(r)
    assert(typeof r.data.data.id === 'number')
    productId = r.data.data.id
  })
  .case('创建：0 元价格合法', async () => {
    const c = client()
    const r = await c.post('/api/products', { name: '免费菜', price: 0 })
    assertOk(r)
  })
  .case('列表：刚才创建的能查到', async () => {
    const c = client()
    const r = await c.get('/api/products')
    assertOk(r)
    assert(r.data.data.length >= 2)
    const found = r.data.data.find(p => p.name === '测试菜A')
    assert(found, 'should find 测试菜A')
    assertEqual(found.price, 28)
  })
  .case('更新：合法更新返回 200', async () => {
    const c = client()
    const r = await c.put(`/api/products/${productId}`, { name: '测试菜A-改', price: 30 })
    assertOk(r)
    const r2 = await c.get('/api/products')
    const updated = r2.data.data.find(p => p.id === productId)
    assertEqual(updated.name, '测试菜A-改')
    assertEqual(updated.price, 30)
  })
  .case('更新：负数价格返回 400', async () => {
    const c = client()
    const r = await c.put(`/api/products/${productId}`, { name: 'x', price: -1 })
    assertEqual(r.data.code, 400)
  })
  .case('更新：不存在的 id 返回 404', async () => {
    const c = client()
    const r = await c.put('/api/products/99999', { name: 'x', price: 10 })
    assertEqual(r.data.code, 404)
  })
  .case('更新：非数字 id 返回 400', async () => {
    const c = client()
    const r = await c.put('/api/products/abc', { name: 'x', price: 10 })
    assertEqual(r.data.code, 400)
  })
  .case('删除：成功', async () => {
    const c = client()
    const r = await c.delete(`/api/products/${productId}`)
    assertOk(r)
    const r2 = await c.get('/api/products')
    const found = r2.data.data.find(p => p.id === productId)
    assert(!found, 'should be deleted')
  })
  .case('删除：不存在返回 404', async () => {
    const c = client()
    const r = await c.delete('/api/products/99999')
    assertEqual(r.data.code, 404)
  })
  .case('删除：非数字 id 返回 400', async () => {
    const c = client()
    const r = await c.delete('/api/products/abc')
    assertEqual(r.data.code, 400)
  })

async function main() {
  await startServer({ port: 13905, dbName: 'products' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
