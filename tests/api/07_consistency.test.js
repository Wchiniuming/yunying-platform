import { startServer, stopServer, client } from '../helpers/server.js'

const runner = { passed: 0, failed: 0, bugs: [] }

async function run(name, fn) {
  try { await fn(); runner.passed++; console.log('  ✓', name) }
  catch (e) { runner.failed++; runner.bugs.push({ name, msg: e.message }); console.log('  ✗', name, ':', e.message) }
}

async function main() {
  await startServer({ port: 13908, dbName: 'consistency' })
  const c = client()
  try {
    console.log('=== P4 数据一致性 ===')

    await run('创建顾客 A', async () => {
      const r = await c.post('/api/customers', { wechat_nickname: '一致性A' })
      if (r.data.code !== 200) throw new Error('create failed')
    })

    let custId
    await run('拿顾客 id', async () => {
      const r = await c.get('/api/customers', { params: { keyword: '一致性A' } })
      custId = r.data.data.list[0].id
    })

    let orderId
    await run('创建订单 56 元', async () => {
      const r = await c.post('/api/orders', {
        customer_id: custId, wechat_nickname: '一致性A',
        items: [{ name: '菜', price: 28, qty: 2 }], order_total: 56
      })
      orderId = r.data.data.id
    })

    await run('订单状态日志 ≥ 1 条（含 action）', async () => {
      const r = await c.get(`/api/orders/${orderId}`)
      if (!r.data.data.timeline.length) throw new Error('no log')
      if (!r.data.data.timeline[0].action) throw new Error('log missing action')
    })

    await run('顾客 total_orders = 1', async () => {
      const r = await c.get(`/api/customers/${custId}`)
      if (r.data.data.order_count !== 1) throw new Error(`expected 1 got ${r.data.data.order_count}`)
    })

    await run('改状态 → 日志增加', async () => {
      const before = (await c.get(`/api/orders/${orderId}`)).data.data.timeline.length
      await c.put(`/api/orders/${orderId}`, { status: 'preparing' })
      const after = (await c.get(`/api/orders/${orderId}`)).data.data.timeline.length
      if (after !== before + 1) throw new Error(`log not incremented: ${before} → ${after}`)
    })

    await run('有订单时不能删除顾客（409）', async () => {
      const r = await c.delete(`/api/customers/${custId}`)
      if (r.data.code !== 409) throw new Error(`expected 409 got ${r.data.code}`)
    })

    await run('orders/stats 累计正确', async () => {
      const r = await c.get('/api/orders/stats')
      if (r.data.data.totalOrders !== 1) throw new Error('totalOrders wrong')
      if (r.data.data.totalRevenue !== 56) throw new Error('totalRevenue wrong')
    })

    await run('products/ranking 累计商品销量', async () => {
      const r = await c.get('/api/stats/products/ranking')
      const item = r.data.data.find(p => p.name === '菜')
      if (!item) throw new Error('no ranking entry')
      if (item.qty !== 2) throw new Error(`expected qty=2 got ${item.qty}`)
    })
  } finally {
    await stopServer()
  }
  console.log(`\n${runner.passed} passed, ${runner.failed} failed`)
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
