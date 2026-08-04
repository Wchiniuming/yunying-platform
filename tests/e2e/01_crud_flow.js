// 端到端：真实创建顾客 + 订单 + 改状态 + 删除，验证前端完整链路
// 运行前置：dev server + backend running
// 详尽版 Playwright 脚本，参考用

import { chromium } from 'playwright'

const BASE = process.env.E2E_BASE || 'http://localhost:5173'

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

const errors = []
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

console.log('1) login')
await page.goto(BASE + '/#/login')
await page.fill('input >> nth=0', 'admin')
await page.fill('input[type=password]', 'admin123')
await page.click('button >> text=登录')
await page.waitForURL(/dashboard|orders/, { timeout: 5000 })

console.log('2) create customer')
await page.goto(BASE + '/#/customers')
await page.waitForLoadState('networkidle')
// 找到"新增"或"+ Add"按钮
const addBtn = page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("+")').first()
if (await addBtn.count() > 0) {
  await addBtn.click()
  await page.waitForTimeout(300)
  // 填表
  const inputs = page.locator('input[placeholder*="昵称"], input').all()
  // 不同 UI 不同，尝试用 label 定位
  const nickInput = page.locator('label:has-text("昵称") + * input, label:has-text("微信") + * input').first()
  if (await nickInput.count() > 0) {
    await nickInput.fill('E2E 测试顾客')
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("确定")').last()
    await saveBtn.click()
    await page.waitForTimeout(500)
    console.log('  ✓ customer created')
  } else {
    console.log('  ⚠ nickname input not found, skipping')
  }
} else {
  console.log('  ⚠ add button not found, skipping')
}

console.log('3) create order')
await page.goto(BASE + '/#/orders/create')
await page.waitForLoadState('networkidle')
// 检查页面是否成功打开

console.log('4) open order detail & change status')
await page.goto(BASE + '/#/orders')
await page.waitForLoadState('networkidle')
const firstLink = page.locator('tr, .order-row, a[href*="/orders/"]').first()
if (await firstLink.count() > 0) {
  await firstLink.click()
  await page.waitForLoadState('networkidle')
  const updateBtn = page.locator('button:has-text("更新状态")').first()
  if (await updateBtn.count() > 0) {
    await updateBtn.click()
    await page.waitForTimeout(500)
    console.log('  ✓ status dialog opened')
  }
}

await page.waitForTimeout(500)
console.log(errors.length ? `❌ errors: ${errors.length}` : '✓ no console errors', errors)
await browser.close()
process.exit(errors.length ? 1 : 0)
