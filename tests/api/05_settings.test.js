import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert } from '../helpers/assert.js'

const runner = new TestRunner('P1-3 Settings (2 endpoints)')

runner
  .case('获取：空 DB 返回 {}', async () => {
    const c = client()
    const r = await c.get('/api/settings')
    assertOk(r)
    assertEqual(typeof r.data.data, 'object')
    assertEqual(Object.keys(r.data.data).length, 0)
  })
  .case('保存：单条成功', async () => {
    const c = client()
    const r = await c.post('/api/settings', { key: 'shop_name', value: '黄小帅麻辣鸡' })
    assertOk(r)
    const r2 = await c.get('/api/settings')
    assertEqual(r2.data.data.shop_name, '黄小帅麻辣鸡')
  })
  .case('保存：覆盖已存在的 key', async () => {
    const c = client()
    await c.post('/api/settings', { key: 'shop_name', value: '黄小帅旗舰店' })
    const r = await c.get('/api/settings')
    assertEqual(r.data.data.shop_name, '黄小帅旗舰店')
  })
  .case('保存：多 key 累加', async () => {
    const c = client()
    await c.post('/api/settings', { key: 'phone', value: '13800138000' })
    await c.post('/api/settings', { key: 'address', value: '深圳市' })
    const r = await c.get('/api/settings')
    assertEqual(r.data.data.shop_name, '黄小帅旗舰店')
    assertEqual(r.data.data.phone, '13800138000')
    assertEqual(r.data.data.address, '深圳市')
    assertEqual(Object.keys(r.data.data).length, 3)
  })
  .case('保存：value 为 null 合法', async () => {
    const c = client()
    const r = await c.post('/api/settings', { key: 'nullable_key', value: null })
    assertOk(r)
  })
  .case('保存：value 为复杂对象（被序列化为 JSON 字符串）', async () => {
    const c = client()
    const r = await c.post('/api/settings', { key: 'config', value: { theme: 'dark', lang: 'zh' } })
    assertOk(r)
  })

async function main() {
  await startServer({ port: 13906, dbName: 'settings' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
