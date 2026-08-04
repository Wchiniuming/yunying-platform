import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assertHasFields } from '../helpers/assert.js'

const runner = new TestRunner('L0 启动与基础设施')

runner
  .case('服务能启动并响应 /api/app/info', async () => {
    const c = client()
    const r = await c.get('/api/app/info')
    assertOk(r)
    assertHasFields(r.data.data, ['version', 'vue', 'dataPath'])
  })
  .case('app info 返回 vue 3.x', async () => {
    const c = client()
    const r = await c.get('/api/app/info')
    assertEqual(r.data.data.vue, '3.x')
  })
  .case('不存在的路由返回 404', async () => {
    const c = client()
    const r = await c.get('/api/__nonexistent__')
    assertEqual(r.status, 404)
  })
  .case('GET 请求 body 解析正确', async () => {
    const c = client()
    const r = await c.get('/api/customers', { params: { page: 1, pageSize: 5 } })
    assertOk(r)
  })

async function main() {
  await startServer({ port: 13901, dbName: 'l0' })
  try {
    const res = await runner.run()
    globalThis.__TEST_RESULT__ = { ...res, suite: 'L0' }
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
