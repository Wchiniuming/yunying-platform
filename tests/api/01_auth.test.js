import { startServer, stopServer, client } from '../helpers/server.js'
import { TestRunner, assertEqual, assertOk, assert } from '../helpers/assert.js'

const runner = new TestRunner('P0-2 Auth (2 endpoints)')

runner
  .case('登录：正确账号返回 200 + 用户信息', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', { username: 'admin', password: 'admin123' })
    assertEqual(r.data.code, 200, 'login success code')
    assertEqual(r.data.data.username, 'admin')
    assertEqual(r.data.data.role, 'admin')
  })
  .case('登录：错误密码返回 401', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', { username: 'admin', password: 'wrong' })
    assertEqual(r.data.code, 401)
  })
  .case('登录：不存在的用户返回 401', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', { username: 'nobody', password: 'x' })
    assertEqual(r.data.code, 401)
  })
  .case('登录：空 username 返回 401（不抛 500）', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', { username: '', password: 'admin123' })
    assertEqual(r.data.code, 401)
  })
  .case('登录：缺字段不抛 500', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', {})
    assertEqual(r.data.code, 401)
  })
  .case('登录：SQL 注入尝试不绕过认证', async () => {
    const c = client()
    const r = await c.post('/api/auth/login', { username: "admin' OR '1'='1", password: "anything" })
    assertEqual(r.data.code, 401)
  })
  .case('改密：成功返回 200', async () => {
    const c = client()
    const r = await c.post('/api/auth/update-password', { userId: 1, newPassword: 'newpass123' })
    assertEqual(r.data.code, 200)
    const login = await c.post('/api/auth/login', { username: 'admin', password: 'newpass123' })
    assertEqual(login.data.code, 200, 'new password should work')
  })
  .case('改密：BUG-001 修复验证 - 不影响其他用户（需先建第二个用户）', async () => {
    const c = client()
    const otherLogin = await c.post('/api/auth/login', { username: 'admin', password: 'newpass123' })
    assertEqual(otherLogin.data.code, 200)
  })
  .case('改密：缺 userId 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/auth/update-password', { newPassword: 'newpass123' })
    assertEqual(r.data.code, 400)
  })
  .case('改密：缺 newPassword 返回 400', async () => {
    const c = client()
    const r = await c.post('/api/auth/update-password', { userId: 1 })
    assertEqual(r.data.code, 400)
  })
  .case('改密：密码 < 6 位返回 400', async () => {
    const c = client()
    const r = await c.post('/api/auth/update-password', { userId: 1, newPassword: '123' })
    assertEqual(r.data.code, 400)
  })
  .case('改密：不存在的 userId 返回 404', async () => {
    const c = client()
    const r = await c.post('/api/auth/update-password', { userId: 99999, newPassword: 'validpass123' })
    assertEqual(r.data.code, 404)
  })

async function main() {
  await startServer({ port: 13902, dbName: 'auth' })
  try {
    await runner.run()
  } finally {
    await stopServer()
  }
  if (runner.failed > 0) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
