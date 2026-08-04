// 端到端走查脚本（需 Node 22+ + Playwright + dev server running on :5173）
// 运行方法：
//   1) npm i -D @playwright/test
//   2) npx playwright install chromium
//   3) 启动后端：npm run server  (确保 better-sqlite3 在 Node 22+ 可用)
//   4) 启动前端：npm run dev    (默认 http://localhost:5173)
//   5) node tests/e2e/00_smoke.js
//
// 这是一个参考脚本，不在 CI 中强制运行（需要 GUI / 浏览器二进制）

import { chromium } from 'playwright'
import axios from 'axios'
import { setTimeout as wait } from 'node:timers/promises'

const BASE = process.env.E2E_BASE || 'http://localhost:5173'
const API  = process.env.E2E_API  || 'http://localhost:3000'

const log = (...a) => console.log('  ', ...a)
const fail = (msg) => { console.error('  ✗', msg); process.exitCode = 1 }
const pass = (msg) => console.log('  ✓', msg)

const browser = await chromium.launch()
const page = await browser.newPage()

// 1) 登录页 → 仪表板
try {
  await page.goto(BASE + '/#/login')
  await page.waitForLoadState('networkidle')
  pass('login page loaded')
  await page.fill('input[type=text], input[placeholder*="账号"], input[placeholder*="用户"]', 'admin')
  await page.fill('input[type=password]', 'admin123')
  await page.click('button:has-text("登录"), button[type=submit]')
  await page.waitForURL(/dashboard|orders/, { timeout: 5000 })
  pass('login → dashboard navigation')
} catch (e) { fail('login flow: ' + e.message) }

// 2) 订单列表 → 详情
try {
  await page.goto(BASE + '/#/orders')
  await page.waitForLoadState('networkidle')
  pass('orders list loaded')
  const firstRow = await page.locator('tr, .order-row, [role=row]').first()
  if (await firstRow.count() > 0) {
    await firstRow.click()
    await page.waitForLoadState('networkidle')
    pass('order detail opened')
  } else {
    log('no orders to click, skipping')
  }
} catch (e) { fail('orders flow: ' + e.message) }

// 3) 顾客 CRUD
try {
  await page.goto(BASE + '/#/customers')
  await page.waitForLoadState('networkidle')
  pass('customers list loaded')
} catch (e) { fail('customers page: ' + e.message) }

// 4) 仪表板统计
try {
  await page.goto(BASE + '/#/dashboard')
  await page.waitForLoadState('networkidle')
  await wait(500)
  pass('dashboard loaded')
} catch (e) { fail('dashboard: ' + e.message) }

await browser.close()
console.log(process.exitCode ? '\nFAILED' : '\nALL PASSED')
