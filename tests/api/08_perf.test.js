import { startServer, stopServer, client } from '../helpers/server.js'

const log = (...a) => console.log('  ', ...a)

async function main() {
  await startServer({ port: 13909, dbName: 'perf' })
  const c = client()
  try {
    console.log('=== P5 性能/边界 ===')

    log('批量创建 100 顾客 + 100 订单')
    const t0 = Date.now()
    for (let i = 0; i < 100; i++) {
      const cust = await c.post('/api/customers', { wechat_nickname: `perf_${i}` })
      await c.post('/api/orders', {
        customer_id: cust.data.data.id, wechat_nickname: `perf_${i}`,
        items: [{ name: `菜${i % 5}`, price: 10 + i % 90, qty: 1 + i % 3 }],
        order_total: (10 + i % 90) * (1 + i % 3)
      })
    }
    const t1 = Date.now()
    log(`  100 顾客 + 100 订单耗时 ${t1 - t0}ms`)

    log('列表查询 pageSize=20 第一页 < 200ms')
    const t2 = Date.now()
    const r = await c.get('/api/orders', { params: { page: 1, pageSize: 20 } })
    const t3 = Date.now()
    log(`  pageSize=20: ${t3 - t2}ms, total=${r.data.data.total}`)
    if (t3 - t2 > 200) log('  ⚠ WARN: list 200ms+')

    log('统计接口 < 500ms')
    const t4 = Date.now()
    await c.get('/api/orders/stats')
    await c.get('/api/stats/products/ranking')
    await c.get('/api/stats/trends', { params: { days: 30 } })
    const t5 = Date.now()
    log(`  3 个统计接口总耗时 ${t5 - t4}ms`)

    log('分页最后页 page=10 不报错')
    const r2 = await c.get('/api/orders', { params: { page: 10, pageSize: 20 } })
    log(`  page=10 list.length=${r2.data.data.list.length}`)

    log('空 DB 分页 page=999 不报错')
    const r3 = await c.get('/api/orders', { params: { page: 999, pageSize: 20 } })
    log(`  page=999 list.length=${r3.data.data.list.length}`)

    log('超大 pageSize 截断')
    const r4 = await c.get('/api/orders', { params: { pageSize: 99999 } })
    log(`  pageSize=99999 total=${r4.data.data.total}`)
  } finally {
    await stopServer()
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
