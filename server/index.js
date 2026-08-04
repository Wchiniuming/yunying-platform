import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import crypto from 'crypto'
import pkg from 'xlsx'
const { utils, writeFile } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 应用配置
const userDataPath = process.env.APPDATA || path.join(process.env.HOME || '', '.huangxiaoshuai')
const dbPath = process.env.DB_PATH || path.join(userDataPath, 'data', 'huangxiaoshuai.db')

// 确保数据目录存在
const dataDir = path.join(userDataPath, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

console.log('黄小帅麻辣鸡数据库路径:', dbPath)

// 数据库初始化
let db

function initDatabase() {
  try {
    db = new DatabaseSync(dbPath)
    console.log('黄小帅麻辣鸡数据库连接成功')
    initTables()
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

function initTables() {
  // 顾客表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wechat_nickname TEXT NOT NULL,
      wechat_remark TEXT,
      phone TEXT,
      default_address TEXT,
      customer_level TEXT DEFAULT 'normal',
      source TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_order_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted INTEGER DEFAULT 0
    )
  `)

  // 订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      wechat_nickname TEXT NOT NULL,
      phone TEXT,
      delivery_address TEXT NOT NULL,
      items_json TEXT,
      food_total REAL NOT NULL DEFAULT 0,
      packaging_fee REAL DEFAULT 0,
      delivery_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      order_total REAL NOT NULL,
      delivery_method TEXT NOT NULL,
      driver_name TEXT,
      driver_phone TEXT,
      sf_waybill_no TEXT,
      expected_delivery TEXT,
      actual_pickup TEXT,
      actual_delivery TEXT,
      delivery_notes TEXT,
      status TEXT NOT NULL DEFAULT 'preparing',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      payment_method TEXT,
      source TEXT NOT NULL,
      wechat_order_time TEXT,
      is_first_order INTEGER DEFAULT 0,
      coupon_used TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted INTEGER DEFAULT 0
    )
  `)

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#409EFF',
      category TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(name, category)
    )
  `)

  // 顾客标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_tags (
      customer_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (customer_id, tag_id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_tags (
      order_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (order_id, tag_id)
    )
  `)

  // 菜品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      specs_json TEXT,
      flavors_json TEXT,
      status TEXT DEFAULT 'available',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 订单状态日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      operator TEXT,
      operate_time TEXT DEFAULT (datetime('now')),
      remark TEXT
    )
  `)

  // 兼容旧库：补齐 action 列（已存在则忽略）
  const orderStatusLogCols = db.prepare("PRAGMA table_info(order_status_log)").all()
  if (!orderStatusLogCols.some(c => c.name === 'action')) {
    db.exec(`ALTER TABLE order_status_log ADD COLUMN action TEXT`)
  }

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT,
      role TEXT DEFAULT 'operator',
      status TEXT DEFAULT 'active',
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // 初始化默认用户 (密码: admin123)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count === 0) {
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex')
    db.prepare(`INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)`).run(
      'admin',
      passwordHash,
      '管理员',
      'admin'
    )
  }

  if (process.env.DISABLE_SEED === '1') return

  // 初始化预置标签
  const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get()
  if (tagCount.count === 0) {
    const defaultTags = [
      ['重辣', '#F56C6C', 'flavor', 1],
      ['中辣', '#E6A23C', 'flavor', 2],
      ['微辣', '#67C23A', 'flavor', 3],
      ['不要辣', '#909399', 'flavor', 4],
      ['麻辣', '#F56C6C', 'flavor', 5],
      ['五香', '#409EFF', 'flavor', 6],
      ['不要香菜', '#67C23A', 'avoid', 1],
      ['不要葱蒜', '#909399', 'avoid', 2],
      ['不要辣椒', '#E6A23C', 'avoid', 3],
      ['海鲜过敏', '#F56C6C', 'avoid', 4],
      ['坚果过敏', '#F56C6C', 'avoid', 5],
      ['普通', '#909399', 'level', 1],
      ['常客', '#409EFF', 'level', 2],
      ['VIP', '#E6A23C', 'level', 3],
      ['SVIP', '#F56C6C', 'level', 4],
      ['微信群', '#409EFF', 'source', 1],
      ['朋友圈', '#67C23A', 'source', 2],
      ['朋友推荐', '#E6A23C', 'source', 3],
      ['投诉过', '#F56C6C', 'special', 1],
      ['退款多', '#E6A23C', 'special', 2],
      ['需重点关注', '#F56C6C', 'special', 3]
    ]
    const insert = db.prepare('INSERT INTO tags (name, color, category, sort_order) VALUES (?, ?, ?, ?)')
    for (const tag of defaultTags) {
      insert.run(...tag)
    }
  }

  // 初始化商品菜单
  const dishCount = db.prepare('SELECT COUNT(*) as count FROM dishes').get()
  if (dishCount.count === 0) {
    const defaultDishes = [
      ['麻辣土鸡', 'main', 73, '斤', 1],
      ['麻辣鸡脚', 'main', 58.8, '斤', 2],
      ['麻辣豆干', 'side', 18.8, '斤', 3],
      ['冷吃牛肉', 'main', 130, '斤', 4],
      ['五香什锦豆干丝', 'side', 15.8, '斤', 5]
    ]
    const insertDish = db.prepare('INSERT INTO dishes (name, category, price, specs_json, sort_order) VALUES (?, ?, ?, ?, ?)')
    for (const dish of defaultDishes) {
      insertDish.run(dish[0], dish[1], dish[2], JSON.stringify({ unit: dish[3] }), dish[4])
    }
  }

  console.log('黄小帅麻辣鸡数据库表初始化完成')
}

// 生成订单号
function generateOrderNo() {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MJ${dateStr}${random}`
}

const ORDER_STATUS_TEXT = {
  pending: '待接单',
  preparing: '制作中',
  waiting_pickup: '待取餐',
  delivering: '配送中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消'
}

function getStatusText(status) {
  return ORDER_STATUS_TEXT[status] || status || '-'
}

function buildStatusActionText(oldStatus, newStatus) {
  if (!oldStatus) return `订单创建：${getStatusText(newStatus)}`
  return `${getStatusText(oldStatus)} → ${getStatusText(newStatus)}`
}

// API 响应格式化
function apiResponse(code, data, message) {
  return { code, data, message }
}

function parseIntSafe(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : fallback
}

function parseFloatSafe(v, fallback) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

// 创建 Express 应用
const app = express()
app.use(cors())
app.use(express.json())

// 静态文件服务（生产模式）
app.use(express.static(path.join(__dirname, '../dist')))

// ========== 认证相关 ==========

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.json(apiResponse(401, null, '用户名或密码错误'))
    }
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ? AND status = ?').get(username, passwordHash, 'active')

    if (!user) {
      return res.json(apiResponse(401, null, '用户名或密码错误'))
    }

    // 更新最后登录时间
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id)

    res.json(apiResponse(200, {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role
    }, '登录成功'))
  } catch (error) {
    console.error('登录错误:', error)
    res.json(apiResponse(500, null, '登录失败'))
  }
})

app.post('/api/auth/update-password', (req, res) => {
  try {
    const { userId, newPassword } = req.body
    if (!userId) {
      return res.json(apiResponse(400, null, '用户ID不能为空'))
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.json(apiResponse(400, null, '密码不能少于6位'))
    }
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex')
    const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(passwordHash, userId)
    if (result.changes === 0) {
      return res.json(apiResponse(404, null, '用户不存在'))
    }
    res.json(apiResponse(200, null, '密码修改成功'))
  } catch (error) {
    console.error('修改密码失败:', error)
    res.json(apiResponse(500, null, '修改失败'))
  }
})

// ========== 标签管理 ==========

app.get('/api/tags', (req, res) => {
  try {
    const { category, keyword } = req.query
    let sql = `
      SELECT t.*, COUNT(ct.customer_id) as usage_count
      FROM tags t
      LEFT JOIN customer_tags ct ON ct.tag_id = t.id
    `
    const params = []
    const conditions = []
    if (category) {
      conditions.push('t.category = ?')
      params.push(category)
    }
    if (keyword) {
      conditions.push('t.name LIKE ?')
      params.push(`%${keyword}%`)
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' GROUP BY t.id ORDER BY t.sort_order ASC, t.id ASC'
    const list = db.prepare(sql).all(...params)
    res.json(apiResponse(200, list))
  } catch (error) {
    console.error('获取标签失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.post('/api/tags', (req, res) => {
  try {
    const { name, color, category, sort_order } = req.body
    if (!name || !category) {
      return res.json(apiResponse(400, null, '名称和分类不能为空'))
    }
    const stmt = db.prepare('INSERT INTO tags (name, color, category, sort_order) VALUES (?, ?, ?, ?)')
    const result = stmt.run(name, color || '#409EFF', category, sort_order || 0)
    res.json(apiResponse(200, { id: result.lastInsertRowid }, '创建成功'))
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.json(apiResponse(409, null, '该标签已存在'))
    }
    console.error('创建标签失败:', error)
    res.json(apiResponse(500, null, '创建失败'))
  }
})

app.put('/api/tags/:id', (req, res) => {
  try {
    const { name, color, category, sort_order } = req.body
    const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.json(apiResponse(404, null, '标签不存在'))
    }
    db.prepare('UPDATE tags SET name = ?, color = ?, category = ?, sort_order = ? WHERE id = ?')
      .run(name, color, category, sort_order || 0, req.params.id)
    res.json(apiResponse(200, null, '更新成功'))
  } catch (error) {
    console.error('更新标签失败:', error)
    res.json(apiResponse(500, null, '更新失败'))
  }
})

app.delete('/api/tags/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.json(apiResponse(404, null, '标签不存在'))
    }
    db.prepare('DELETE FROM customer_tags WHERE tag_id = ?').run(req.params.id)
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id)
    res.json(apiResponse(200, null, '删除成功'))
  } catch (error) {
    console.error('删除标签失败:', error)
    res.json(apiResponse(500, null, '删除失败'))
  }
})

// ========== 顾客相关 ==========

app.get('/api/customers', (req, res) => {
  try {
    const { keyword = '', orderCount = '' } = req.query
    const pageNum = parseIntSafe(req.query.page, 1)
    const sizeNum = parseIntSafe(req.query.pageSize, 20)
    const offset = (pageNum - 1) * sizeNum

    let sql = 'SELECT * FROM customers WHERE deleted = 0'
    let countSql = 'SELECT COUNT(*) as total FROM customers WHERE deleted = 0'
    const params = []

    if (keyword) {
      sql += ' AND (wechat_nickname LIKE ? OR wechat_remark LIKE ? OR phone LIKE ? OR default_address LIKE ?)'
      countSql += ' AND (wechat_nickname LIKE ? OR wechat_remark LIKE ? OR phone LIKE ? OR default_address LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(sizeNum, offset)

    const list = db.prepare(sql).all(...params)
    const { total } = db.prepare(countSql).get(...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []))

    // 批量加载顾客标签
    const customerIds = list.map(c => c.id)
    let tagsMap = {}
    if (customerIds.length > 0) {
      const placeholders = customerIds.map(() => '?').join(',')
      const allTags = db.prepare(`
        SELECT ct.customer_id, t.* FROM tags t
        JOIN customer_tags ct ON ct.tag_id = t.id
        WHERE ct.customer_id IN (${placeholders})
      `).all(...customerIds)
      allTags.forEach(t => {
        if (!tagsMap[t.customer_id]) tagsMap[t.customer_id] = []
        tagsMap[t.customer_id].push({ id: t.id, name: t.name, color: t.color, category: t.category })
      })
    }

    const enrichedList = list.map(c => ({
      ...c,
      address: c.default_address || '',
      remark: c.notes || '',
      order_count: c.total_orders || 0,
      last_order_at: c.last_order_date || null,
      customer_level: c.customer_level || 'normal',
      tags: tagsMap[c.id] || []
    }))

    res.json(apiResponse(200, { list: enrichedList, total }))
  } catch (error) {
    console.error('获取顾客列表失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.get('/api/customers/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM customers WHERE deleted = 0').get().count
    const todayNew = db.prepare("SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND date(created_at) = date('now')").get().count
    const monthNew = db.prepare("SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')").get().count
    const vipCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND customer_level = 'vip'").get().count
    const svipCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND customer_level = 'svip'").get().count
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND total_orders > 0").get().count
    const totalSpent = db.prepare("SELECT COALESCE(SUM(total_spent), 0) as total FROM customers WHERE deleted = 0").get().total
    const avgSpent = total > 0 ? (Number(totalSpent) / total) : 0

    res.json(apiResponse(200, {
      total,
      todayNew,
      monthNew,
      vipCount,
      svipCount,
      activeCount,
      totalSpent: Number(totalSpent) || 0,
      avgSpent: Number(avgSpent.toFixed(2)) || 0
    }))
  } catch (error) {
    console.error('获取顾客统计失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.get('/api/customers/search', (req, res) => {
  try {
    const { keyword } = req.query
    if (keyword === undefined) {
      return res.json(apiResponse(200, []))
    }
    const list = db.prepare(`
      SELECT * FROM customers WHERE deleted = 0
      AND (wechat_nickname LIKE ? OR phone LIKE ?)
      LIMIT 20
    `).all(`%${keyword}%`, `%${keyword}%`)

    const enriched = list.map(c => ({
      ...c,
      address: c.default_address || '',
      remark: c.notes || '',
      customer_level: c.customer_level || 'normal'
    }))

    res.json(apiResponse(200, enriched))
  } catch (error) {
    res.json(apiResponse(500, null, '搜索失败'))
  }
})

app.get('/api/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!customer) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }

    const recentOrders = db.prepare('SELECT id, order_no, order_total, status, created_at FROM orders WHERE customer_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT 5').all(req.params.id)
    const customerTags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN customer_tags ct ON ct.tag_id = t.id
      WHERE ct.customer_id = ?
    `).all(req.params.id)

    res.json(apiResponse(200, {
      ...customer,
      address: customer.default_address || '',
      remark: customer.notes || '',
      order_count: customer.total_orders || 0,
      last_order_at: customer.last_order_date || null,
      tags: customerTags,
      recent_orders: recentOrders.map(o => ({
        ...o,
        items: (() => { try { return JSON.parse(o.items_json || '[]') } catch { return [] } })(),
        sf_tracking_no: o.sf_waybill_no || o.sf_tracking_no
      }))
    }))
  } catch (error) {
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.post('/api/customers', (req, res) => {
  try {
    const { wechat_nickname, phone, address, remark, customer_level, source, tag_ids } = req.body
    if (!wechat_nickname || !String(wechat_nickname).trim()) {
      return res.json(apiResponse(400, null, '顾客昵称不能为空'))
    }
    if (phone && !/^[\d\-\+\s]{0,20}$/.test(String(phone))) {
      return res.json(apiResponse(400, null, '手机号格式不正确'))
    }
    const result = db.prepare(`
      INSERT INTO customers (wechat_nickname, phone, default_address, notes, customer_level, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      String(wechat_nickname).trim(),
      phone || '',
      address || '',
      remark || '',
      customer_level || 'normal',
      source || '微信群'
    )

    const customerId = result.lastInsertRowid
    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO customer_tags (customer_id, tag_id) VALUES (?, ?)')
      for (const tagId of tag_ids) {
        insertTag.run(customerId, tagId)
      }
    }

    res.json(apiResponse(200, { id: customerId }, '添加成功'))
  } catch (error) {
    console.error('添加顾客失败:', error)
    res.json(apiResponse(500, null, '添加失败'))
  }
})

app.put('/api/customers/:id', (req, res) => {
  try {
    const id = parseIntSafe(req.params.id, NaN)
    if (!Number.isFinite(id)) {
      return res.json(apiResponse(400, null, '无效的顾客ID'))
    }
    const { wechat_nickname, phone, address, remark, customer_level, source, tag_ids } = req.body
    if (!wechat_nickname || !String(wechat_nickname).trim()) {
      return res.json(apiResponse(400, null, '顾客昵称不能为空'))
    }
    if (phone && !/^[\d\-\+\s]{0,20}$/.test(String(phone))) {
      return res.json(apiResponse(400, null, '手机号格式不正确'))
    }
    const result = db.prepare(`
      UPDATE customers SET wechat_nickname = ?, phone = ?, default_address = ?, notes = ?,
      customer_level = ?, source = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(wechat_nickname).trim(),
      phone || '',
      address || '',
      remark || '',
      customer_level || 'normal',
      source || '微信群',
      id
    )
    if (result.changes === 0) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }

    if (Array.isArray(tag_ids)) {
      db.prepare('DELETE FROM customer_tags WHERE customer_id = ?').run(id)
      const insertTag = db.prepare('INSERT OR IGNORE INTO customer_tags (customer_id, tag_id) VALUES (?, ?)')
      for (const tagId of tag_ids) {
        insertTag.run(id, tagId)
      }
    }

    res.json(apiResponse(200, null, '更新成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '更新失败'))
  }
})

app.delete('/api/customers/:id', (req, res) => {
  try {
    const id = parseIntSafe(req.params.id, NaN)
    if (!Number.isFinite(id)) {
      return res.json(apiResponse(400, null, '无效的顾客ID'))
    }
    const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders WHERE customer_id = ? AND deleted = 0').get(id).c
    if (orderCount > 0) {
      return res.json(apiResponse(409, null, `该顾客有 ${orderCount} 个未删除订单，无法删除`))
    }
    const result = db.prepare('UPDATE customers SET deleted = 1 WHERE id = ? AND deleted = 0').run(id)
    if (result.changes === 0) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }
    res.json(apiResponse(200, null, '删除成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '删除失败'))
  }
})

app.get('/api/customers/:id/tags', (req, res) => {
  try {
    const customer = db.prepare('SELECT id FROM customers WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!customer) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN customer_tags ct ON ct.tag_id = t.id
      WHERE ct.customer_id = ?
    `).all(req.params.id)
    res.json(apiResponse(200, tags))
  } catch (error) {
    console.error('获取顾客标签失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.put('/api/customers/:id/tags', (req, res) => {
  try {
    const customer = db.prepare('SELECT id FROM customers WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!customer) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }
    const { tag_ids } = req.body
    if (!Array.isArray(tag_ids)) {
      return res.json(apiResponse(400, null, 'tag_ids 必须是数组'))
    }
    db.prepare('DELETE FROM customer_tags WHERE customer_id = ?').run(req.params.id)
    const insertStmt = db.prepare('INSERT OR IGNORE INTO customer_tags (customer_id, tag_id) VALUES (?, ?)')
    for (const tagId of tag_ids) {
      insertStmt.run(req.params.id, tagId)
    }
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN customer_tags ct ON ct.tag_id = t.id
      WHERE ct.customer_id = ?
    `).all(req.params.id)
    res.json(apiResponse(200, tags, '标签已更新'))
  } catch (error) {
    console.error('更新顾客标签失败:', error)
    res.json(apiResponse(500, null, '更新失败'))
  }
})

// ========== 订单相关 ==========

app.get('/api/orders', (req, res) => {
  try {
    const { status = '', keyword = '', startDate = '', endDate = '', customerId = '' } = req.query
    const pageNum = parseIntSafe(req.query.page, 1)
    const sizeNum = parseIntSafe(req.query.pageSize, 20)
    const offset = (pageNum - 1) * sizeNum

    let sql = 'SELECT * FROM orders WHERE deleted = 0'
    let countSql = 'SELECT COUNT(*) as total FROM orders WHERE deleted = 0'
    const params = []

    if (status) {
      sql += ' AND status = ?'
      countSql += ' AND status = ?'
      params.push(status)
    }

    if (keyword) {
      sql += ' AND (order_no LIKE ? OR wechat_nickname LIKE ? OR delivery_address LIKE ?)'
      countSql += ' AND (order_no LIKE ? OR wechat_nickname LIKE ? OR delivery_address LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    if (startDate) {
      sql += ' AND date(created_at) >= ?'
      countSql += ' AND date(created_at) >= ?'
      params.push(startDate)
    }

    if (endDate) {
      sql += ' AND date(created_at) <= ?'
      countSql += ' AND date(created_at) <= ?'
      params.push(endDate)
    }

    if (customerId) {
      sql += ' AND customer_id = ?'
      countSql += ' AND customer_id = ?'
      params.push(customerId)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(sizeNum, offset)

    const list = db.prepare(sql).all(...params)
    const countParams = status || keyword || startDate || endDate || customerId
      ? params.slice(0, params.length - 2)
      : []
    const { total } = db.prepare(countSql).get(...countParams)

    const enrichedList = list.map(order => {
      let items = []
      try {
        items = JSON.parse(order.items_json || '[]')
      } catch (e) {
        items = []
      }
      return {
        ...order,
        items,
        sf_tracking_no: order.sf_waybill_no || order.sf_tracking_no
      }
    })

    res.json(apiResponse(200, { list: enrichedList, total }))
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.get('/api/orders/stats', (req, res) => {
  try {
    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0`).get().count
    const totalRevenue = db.prepare(`SELECT COALESCE(SUM(order_total), 0) as total FROM orders WHERE deleted = 0 AND payment_status = 'paid'`).get().total

    const monthOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get().count
    const monthRevenue = db.prepare(`SELECT COALESCE(SUM(order_total), 0) as total FROM orders WHERE deleted = 0 AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND payment_status = 'paid'`).get().total

    const weekOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND strftime('%W', created_at) = strftime('%W', 'now') AND strftime('%Y', created_at) = strftime('%Y', 'now')`).get().count
    const weekRevenue = db.prepare(`SELECT COALESCE(SUM(order_total), 0) as total FROM orders WHERE deleted = 0 AND strftime('%W', created_at) = strftime('%W', 'now') AND strftime('%Y', created_at) = strftime('%Y', 'now') AND payment_status = 'paid'`).get().total

    const todayOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND date(created_at) = date('now')`).get().count
    const todayRevenue = db.prepare(`SELECT COALESCE(SUM(order_total), 0) as total FROM orders WHERE deleted = 0 AND date(created_at) = date('now') AND payment_status = 'paid'`).get().total

    const pendingOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status IN ('pending', 'preparing')`).get().count

    const avgOrderValue = totalOrders > 0 ? (Number(totalRevenue) / totalOrders) : 0

    const cancelledToday = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status = 'cancelled' AND date(created_at) = date('now')`).get().count

    res.json(apiResponse(200, {
      totalOrders,
      totalRevenue: Number(totalRevenue) || 0,
      monthOrders,
      monthRevenue: Number(monthRevenue) || 0,
      weekOrders,
      weekRevenue: Number(weekRevenue) || 0,
      todayOrders,
      todayRevenue: Number(todayRevenue) || 0,
      pendingOrders,
      avgOrderValue: Number(avgOrderValue.toFixed(2)) || 0,
      cancelledToday
    }))
  } catch (error) {
    console.error('获取订单统计失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!order) {
      return res.json(apiResponse(404, null, '订单不存在'))
    }

    const timelineRows = db.prepare('SELECT * FROM order_status_log WHERE order_id = ? ORDER BY operate_time ASC').all(req.params.id)
    const timeline = timelineRows.map(row => ({
      ...row,
      time: row.operate_time,
      action: row.action || row.remark || buildStatusActionText(row.old_status, row.new_status)
    }))

    let items = []
    try {
      items = JSON.parse(order.items_json || '[]')
    } catch (e) {
      items = []
    }

    res.json(apiResponse(200, {
      ...order,
      address: order.delivery_address || '',
      items,
      sf_tracking_no: order.sf_waybill_no || order.sf_tracking_no,
      timeline
    }))
  } catch (error) {
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.post('/api/orders', (req, res) => {
  try {
    const {
      customer_id, wechat_nickname, phone, delivery_address, items,
      order_total, delivery_method, sf_tracking_no, remark, payment_method, payment_status, tag_ids
    } = req.body

    let resolvedNickname = wechat_nickname
    let resolvedCustomerId = customer_id || null

    if (!resolvedNickname || !String(resolvedNickname).trim()) {
      if (resolvedCustomerId) {
        const customerRow = db.prepare('SELECT wechat_nickname FROM customers WHERE id = ? AND deleted = 0').get(resolvedCustomerId)
        if (customerRow) {
          resolvedNickname = customerRow.wechat_nickname
        } else {
          return res.json(apiResponse(400, null, '顾客不存在或已删除'))
        }
      } else {
        return res.json(apiResponse(400, null, '顾客昵称不能为空'))
      }
    } else if (!resolvedCustomerId) {
      // 新顾客：自动入库
      const newCustomer = db.prepare(`
        INSERT INTO customers (wechat_nickname, phone, default_address, notes, source, total_orders, total_spent)
        VALUES (?, ?, ?, ?, ?, 0, 0)
      `).run(
        String(resolvedNickname).trim(),
        phone || '',
        delivery_address || '',
        '',
        '订单创建'
      )
      resolvedCustomerId = newCustomer.lastInsertRowid
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json(apiResponse(400, null, '订单至少包含一件商品'))
    }
    const totalNum = parseFloat(order_total)
    if (!Number.isFinite(totalNum) || totalNum < 0) {
      return res.json(apiResponse(400, null, '订单金额必须为非负数'))
    }
    if (delivery_method && !['self', 'sf'].includes(delivery_method)) {
      return res.json(apiResponse(400, null, '配送方式无效'))
    }
    if (payment_status && !['paid', 'unpaid'].includes(payment_status)) {
      return res.json(apiResponse(400, null, '支付状态无效'))
    }

    const orderNo = generateOrderNo()
    const itemsJson = JSON.stringify(items)

    const result = db.prepare(`
      INSERT INTO orders (order_no, customer_id, wechat_nickname, phone, delivery_address,
        items_json, order_total, delivery_method, sf_waybill_no, notes, payment_method, payment_status, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, resolvedCustomerId, resolvedNickname, phone || '', delivery_address || '', itemsJson,
      totalNum, delivery_method || 'self', sf_tracking_no || null, remark || '', payment_method || 'wechat', payment_status || 'paid', 'preparing', 'wechat')

    if (resolvedCustomerId) {
      db.prepare(`
        UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?,
        last_order_date = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(totalNum, resolvedCustomerId)
    }

    db.prepare(`
      INSERT INTO order_status_log (order_id, old_status, new_status, operator, action, remark)
      VALUES (?, NULL, 'preparing', 'system', ?, '订单创建')
    `).run(result.lastInsertRowid, buildStatusActionText(null, 'preparing'))

    const orderId = result.lastInsertRowid
    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO order_tags (order_id, tag_id) VALUES (?, ?)')
      for (const tagId of tag_ids) {
        insertTag.run(orderId, tagId)
      }
    }

    res.json(apiResponse(200, { id: orderId, order_no: orderNo }, '订单创建成功'))
  } catch (error) {
    console.error('创建订单失败:', error)
    res.json(apiResponse(500, null, '创建失败'))
  }
})

app.put('/api/orders/:id', (req, res) => {
  try {
    const { status, operator = 'system', sf_tracking_no } = req.body

    const order = db.prepare('SELECT status FROM orders WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!order) {
      return res.json(apiResponse(404, null, '订单不存在'))
    }

    if (sf_tracking_no !== undefined) {
      const newNo = String(sf_tracking_no).trim()
      db.prepare(`UPDATE orders SET sf_waybill_no = ?, updated_at = datetime('now') WHERE id = ?`).run(newNo || null, req.params.id)
      return res.json(apiResponse(200, { sf_tracking_no: newNo || null }, '顺丰单号已更新'))
    }

    if (status) {
      if (!ORDER_STATUS_TEXT[status]) {
        return res.json(apiResponse(400, null, '无效的订单状态'))
      }
      const oldStatus = order.status
      const actionText = buildStatusActionText(oldStatus, status)
      const remarkText = `状态从 ${getStatusText(oldStatus)} 更新为 ${getStatusText(status)}`

      db.prepare(`
        UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(status, req.params.id)

      db.prepare(`
        INSERT INTO order_status_log (order_id, old_status, new_status, operator, action, remark)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.params.id, oldStatus, status, operator, actionText, remarkText)

      return res.json(apiResponse(200, null, '状态更新成功'))
    }

    res.json(apiResponse(400, null, '无有效更新字段'))
  } catch (error) {
    res.json(apiResponse(500, null, '更新失败'))
  }
})

app.get('/api/orders/:id/tags', (req, res) => {
  try {
    const order = db.prepare('SELECT id FROM orders WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!order) {
      return res.json(apiResponse(404, null, '订单不存在'))
    }
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN order_tags ot ON ot.tag_id = t.id
      WHERE ot.order_id = ?
    `).all(req.params.id)
    res.json(apiResponse(200, tags))
  } catch (error) {
    console.error('获取订单标签失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.put('/api/orders/:id/tags', (req, res) => {
  try {
    const order = db.prepare('SELECT id FROM orders WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!order) {
      return res.json(apiResponse(404, null, '订单不存在'))
    }
    const { tag_ids } = req.body
    if (!Array.isArray(tag_ids)) {
      return res.json(apiResponse(400, null, 'tag_ids 必须是数组'))
    }
    db.prepare('DELETE FROM order_tags WHERE order_id = ?').run(req.params.id)
    const insertStmt = db.prepare('INSERT OR IGNORE INTO order_tags (order_id, tag_id) VALUES (?, ?)')
    for (const tagId of tag_ids) {
      insertStmt.run(req.params.id, tagId)
    }
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN order_tags ot ON ot.tag_id = t.id
      WHERE ot.order_id = ?
    `).all(req.params.id)
    res.json(apiResponse(200, tags, '标签已更新'))
  } catch (error) {
    console.error('更新订单标签失败:', error)
    res.json(apiResponse(500, null, '更新失败'))
  }
})

// ========== 统计数据 ==========

app.get('/api/stats/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND date(created_at) = date('now')
    `).get().count

    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(order_total), 0) as total FROM orders
      WHERE deleted = 0 AND date(created_at) = date('now') AND status != 'cancelled'
    `).get().total

    const todayAvgOrder = todayOrders > 0 ? (todayRevenue / todayOrders).toFixed(2) : 0

    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status IN ('pending', 'preparing', 'waiting_pickup')
    `).get().count

    const newCustomers = db.prepare(`
      SELECT COUNT(*) as count FROM customers WHERE deleted = 0 AND date(created_at) = date('now')
    `).get().count

    const todayUnpaidOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND date(created_at) = date('now') AND payment_status = 'unpaid'
    `).get().count

    const todayFirstOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND date(created_at) = date('now') AND is_first_order = 1
    `).get().count

    const firstOrderRate = todayOrders > 0 ? ((todayFirstOrders / todayOrders) * 100).toFixed(1) : '0.0'

    const recentOrders = db.prepare(`
      SELECT id, order_no, wechat_nickname, order_total, status, created_at
      FROM orders WHERE deleted = 0 ORDER BY created_at DESC LIMIT 5
    `).all()

    res.json(apiResponse(200, {
      todayOrders,
      todayRevenue: todayRevenue.toFixed(2),
      todayAvgOrder,
      pendingOrders,
      newCustomers,
      recentOrders,
      todayUnpaidOrders,
      todayFirstOrders,
      firstOrderRate
    }))
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 配送统计 ==========

app.get('/api/delivery/stats', (req, res) => {
  try {
    const pending = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status = 'waiting_pickup'`).get().count
    const delivering = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status = 'delivering'`).get().count
    const deliveredToday = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND status = 'delivered' AND date(updated_at) = date('now')`).get().count
    const selfDelivery = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE deleted = 0 AND delivery_method = 'self' AND date(created_at) = date('now')`).get().count

    res.json(apiResponse(200, { pending, delivering, deliveredToday, selfDelivery }))
  } catch (error) {
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 趋势统计 ==========

app.get('/api/stats/trends', (req, res) => {
  try {
    const { days = 7 } = req.query
    const dayNum = parseIntSafe(days, 7) || 7
    // days=0 表示全量，设置一个很大的值获取所有历史数据
    const dayCount = dayNum === 0 ? 365 * 10 : Math.min(Math.max(dayNum, 1), 90)

    const trends = []
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)

      const ordersCount = db.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE deleted = 0 AND date(created_at) = ?
      `).get(dateStr).count

      const revenue = db.prepare(`
        SELECT COALESCE(SUM(order_total), 0) as total FROM orders
        WHERE deleted = 0 AND date(created_at) = ? AND status != 'cancelled'
      `).get(dateStr).total

      trends.push({
        date: dateStr,
        orders: ordersCount,
        revenue: Number(revenue) || 0
      })
    }

    const customersTrend = []
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)

      const newCustomers = db.prepare(`
        SELECT COUNT(*) as count FROM customers
        WHERE deleted = 0 AND date(created_at) = ?
      `).get(dateStr).count

      customersTrend.push({
        date: dateStr,
        newCustomers
      })
    }

    res.json(apiResponse(200, { trends, customersTrend }))
  } catch (error) {
    console.error('获取趋势统计失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 分布统计 ==========

app.get('/api/stats/distributions', (req, res) => {
  try {
    const { days = 0 } = req.query
    const dayNum = parseIntSafe(days, 0)
    const dateFilter = dayNum > 0 ? `AND created_at >= datetime('now', '-${dayNum} days')` : ''

    const statusDist = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders
      WHERE deleted = 0 ${dateFilter}
      GROUP BY status
    `).all()

    const deliveryDist = db.prepare(`
      SELECT delivery_method, COUNT(*) as count FROM orders
      WHERE deleted = 0 ${dateFilter}
      GROUP BY delivery_method
    `).all()

    const sourceDist = db.prepare(`
      SELECT source, COUNT(*) as count FROM orders
      WHERE deleted = 0 ${dateFilter}
      GROUP BY source
    `).all()

    res.json(apiResponse(200, {
      statusDist,
      deliveryDist,
      sourceDist
    }))
  } catch (error) {
    console.error('获取分布统计失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 热销菜品 ==========

app.get('/api/stats/products/ranking', (req, res) => {
  try {
    const { limit = 10, days = 0 } = req.query
    const topN = Math.min(Math.max(parseIntSafe(limit, 10), 1), 50)
    const dayNum = parseIntSafe(days, 0)
    const dateFilter = dayNum > 0 ? `AND created_at >= datetime('now', '-${dayNum} days')` : ''

    const orders = db.prepare(`
      SELECT items_json FROM orders WHERE deleted = 0 AND items_json IS NOT NULL AND items_json != '[]' ${dateFilter}
    `).all()

    const productStats = {}
    orders.forEach(order => {
      try {
        const items = JSON.parse(order.items_json || '[]')
        items.forEach(item => {
          if (!productStats[item.name]) {
            productStats[item.name] = { name: item.name, qty: 0, revenue: 0 }
          }
          productStats[item.name].qty += item.qty || 1
          productStats[item.name].revenue += (item.price || 0) * (item.qty || 1)
        })
      } catch (e) {
        // skip invalid JSON
      }
    })

    const ranking = Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, topN)
      .map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        qty: p.qty,
        revenue: Number(p.revenue.toFixed(2))
      }))

    res.json(apiResponse(200, ranking))
  } catch (error) {
    console.error('获取热销榜单失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 时段分布 ==========

app.get('/api/stats/hourly', (req, res) => {
  try {
    const { days = 0 } = req.query
    const dayNum = parseIntSafe(days, 0)
    const dateFilter = dayNum > 0 ? `AND created_at >= datetime('now', '-${dayNum} days')` : ''

    const hourlyDist = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COUNT(*) as count
      FROM orders
      WHERE deleted = 0 ${dateFilter}
      GROUP BY hour
      ORDER BY hour
    `).all()

    const fullHourly = []
    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, '0')
      const found = hourlyDist.find(d => d.hour === hourStr)
      fullHourly.push({
        hour: h,
        hourStr: `${hourStr}:00`,
        count: found ? found.count : 0
      })
    }

    res.json(apiResponse(200, fullHourly))
  } catch (error) {
    console.error('获取时段分布失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 客单价分布 ==========

app.get('/api/stats/price-distribution', (req, res) => {
  try {
    const { days = 0 } = req.query
    const dayNum = parseIntSafe(days, 0)
    const dateFilter = dayNum > 0 ? `AND created_at >= datetime('now', '-${dayNum} days')` : ''

    const priceRanges = [
      { label: '0-30', min: 0, max: 30 },
      { label: '30-50', min: 30, max: 50 },
      { label: '50-80', min: 50, max: 80 },
      { label: '80-100', min: 80, max: 100 },
      { label: '100-150', min: 100, max: 150 },
      { label: '150+', min: 150, max: 999999 }
    ]

    const distribution = priceRanges.map(range => {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE deleted = 0 AND order_total >= ? AND order_total < ? ${dateFilter}
      `).get(range.min, range.max)

      return {
        range: range.label,
        count: result.count
      }
    })

    res.json(apiResponse(200, distribution))
  } catch (error) {
    console.error('获取客单价分布失败:', error)
    res.json(apiResponse(500, null, '获取失败'))
  }
})

// ========== 商品菜单管理 ==========

app.get('/api/products', (req, res) => {
  try {
    const { keyword = '', status = '' } = req.query
    let sql = 'SELECT * FROM dishes WHERE 1=1'
    const params = []

    if (keyword) {
      sql += ' AND name LIKE ?'
      params.push(`%${keyword}%`)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY sort_order ASC, id ASC'
    const rows = db.prepare(sql).all(...params)
    const dishes = rows.map(r => ({
      ...r,
      unit: r.specs_json ? (JSON.parse(r.specs_json).unit || '') : ''
    }))
    res.json(apiResponse(200, dishes))
  } catch (error) {
    console.error('获取商品列表失败:', error)
    res.json(apiResponse(500, null, '获取商品列表失败'))
  }
})

app.post('/api/products', (req, res) => {
  try {
    const { name, category, price, unit, sort_order, status } = req.body
    if (!name || !String(name).trim()) {
      return res.json(apiResponse(400, null, '商品名称不能为空'))
    }
    const priceNum = parseFloat(price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.json(apiResponse(400, null, '价格必须为非负数'))
    }
    const sortNum = parseIntSafe(sort_order, 0)
    const result = db.prepare(`
      INSERT INTO dishes (name, category, price, specs_json, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      String(name).trim(),
      category || 'main',
      priceNum,
      JSON.stringify({ unit: unit || '斤' }),
      sortNum,
      status || 'available'
    )
    res.json(apiResponse(200, { id: result.lastInsertRowid }))
  } catch (error) {
    console.error('新增商品失败:', error)
    res.json(apiResponse(500, null, '新增商品失败'))
  }
})

app.put('/api/products/:id', (req, res) => {
  try {
    const { name, category, price, unit, sort_order, status } = req.body
    const id = parseIntSafe(req.params.id, NaN)
    if (!Number.isFinite(id)) {
      return res.json(apiResponse(400, null, '无效的商品ID'))
    }
    if (!name || !String(name).trim()) {
      return res.json(apiResponse(400, null, '商品名称不能为空'))
    }
    const priceNum = parseFloat(price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.json(apiResponse(400, null, '价格必须为非负数'))
    }
    const result = db.prepare(`
      UPDATE dishes SET name = ?, category = ?, price = ?, specs_json = ?, sort_order = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(name).trim(),
      category || 'main',
      priceNum,
      JSON.stringify({ unit: unit || '斤' }),
      parseIntSafe(sort_order, 0),
      status || 'available',
      id
    )
    if (result.changes === 0) {
      return res.json(apiResponse(404, null, '商品不存在'))
    }
    res.json(apiResponse(200, null, '更新成功'))
  } catch (error) {
    console.error('更新商品失败:', error)
    res.json(apiResponse(500, null, '更新商品失败'))
  }
})

app.delete('/api/products/:id', (req, res) => {
  try {
    const id = parseIntSafe(req.params.id, NaN)
    if (!Number.isFinite(id)) {
      return res.json(apiResponse(400, null, '无效的商品ID'))
    }
    const result = db.prepare('DELETE FROM dishes WHERE id = ?').run(id)
    if (result.changes === 0) {
      return res.json(apiResponse(404, null, '商品不存在'))
    }
    res.json(apiResponse(200, null, '删除成功'))
  } catch (error) {
    console.error('删除商品失败:', error)
    res.json(apiResponse(500, null, '删除商品失败'))
  }
})

app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all()
    const settings = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    res.json(apiResponse(200, settings))
  } catch (error) {
    res.json(apiResponse(500, null, '获取失败'))
  }
})

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body
    if (!key) {
      return res.json(apiResponse(400, null, 'key 不能为空'))
    }
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(String(key), stringValue)
    res.json(apiResponse(200, null, '保存成功'))
  } catch (error) {
    console.error('保存设置失败:', error)
    res.json(apiResponse(500, null, '保存失败'))
  }
})



const projectRoot = path.join(__dirname, '..')
const exportsDir = path.join(projectRoot, 'exports')
const backupsDir = path.join(projectRoot, 'backups')
const logsDir = path.join(projectRoot, 'logs')

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

app.post('/api/data/export', (req, res) => {
  try {
    ensureDir(exportsDir)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `黄小帅数据导出_${timestamp}.xlsx`
    const filePath = path.join(exportsDir, fileName)

    const customers = db.prepare('SELECT * FROM customers WHERE deleted = 0').all()
    const orders = db.prepare(`
      SELECT o.*, c.wechat_nickname as customer_nickname
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.deleted = 0
      ORDER BY o.created_at DESC
    `).all()
    const dishes = db.prepare('SELECT * FROM dishes ORDER BY sort_order').all()
    const tags = db.prepare('SELECT * FROM tags').all()

    const orderStatusText = {
      pending: '待接单', preparing: '制作中', waiting_pickup: '待取餐',
      delivering: '配送中', delivered: '已送达', completed: '已完成', cancelled: '已取消'
    }
    const paymentStatusText = { paid: '已支付', unpaid: '未支付', refunded: '已退款' }

    const customerSheet = customers.map(c => ({
      '顾客ID': c.id,
      '昵称': c.wechat_nickname,
      '备注': c.wechat_remark || '',
      '电话': c.phone || '',
      '默认地址': c.default_address || '',
      '等级': c.customer_level || '',
      '来源': c.source || '',
      '累计订单': c.total_orders || 0,
      '累计消费': c.total_spent || 0,
      '上次下单': c.last_order_date || '',
      '备注信息': c.notes || ''
    }))

    const flatItems = []
    for (const o of orders) {
      let items = []
      try { items = JSON.parse(o.items_json || '[]') } catch {}
      if (items.length === 0) {
        flatItems.push({
          '订单号': o.order_no,
          '顾客': o.customer_nickname || o.wechat_nickname,
          '电话': o.phone || '',
          '地址': o.delivery_address,
          '商品': '', '单价': '', '数量': '',
          '总价': o.order_total,
          '配送方式': o.delivery_method === 'sf' ? '顺丰' : '自取',
          '订单状态': orderStatusText[o.status] || o.status,
          '支付状态': paymentStatusText[o.payment_status] || o.payment_status,
          '支付方式': o.payment_method || '',
          '下单时间': o.created_at || ''
        })
      } else {
        for (const item of items) {
          flatItems.push({
            '订单号': o.order_no,
            '顾客': o.customer_nickname || o.wechat_nickname,
            '电话': o.phone || '',
            '地址': o.delivery_address,
            '商品': item.name || '',
            '单价': item.price || '',
            '数量': item.qty || '',
            '总价': item.price && item.qty ? (item.price * item.qty).toFixed(2) : '',
            '配送方式': o.delivery_method === 'sf' ? '顺丰' : '自取',
            '订单状态': orderStatusText[o.status] || o.status,
            '支付状态': paymentStatusText[o.payment_status] || o.payment_status,
            '支付方式': o.payment_method || '',
            '下单时间': o.created_at || ''
          })
        }
      }
    }

    const dishSheet = dishes.map(d => ({
      'ID': d.id,
      '名称': d.name,
      '分类': d.category === 'main' ? '主推' : d.category === 'side' ? '小食' : d.category,
      '价格': d.price,
      '排序': d.sort_order || 0
    }))

    const tagSheet = tags.map(t => ({
      'ID': t.id,
      '名称': t.name,
      '颜色': t.color || '',
      '排序': t.sort_order || 0
    }))

    const wb = utils.book_new()
    utils.book_append_sheet(wb, utils.json_to_sheet(customerSheet), '顾客')
    utils.book_append_sheet(wb, utils.json_to_sheet(flatItems), '订单明细')
    utils.book_append_sheet(wb, utils.json_to_sheet(dishSheet), '商品')
    utils.book_append_sheet(wb, utils.json_to_sheet(tagSheet), '标签')

    writeFile(wb, filePath)

    res.json(apiResponse(200, {
      path: filePath,
      fileName,
      customers: customers.length,
      orders: orders.length,
      dishes: dishes.length
    }, '导出成功'))
  } catch (error) {
    console.error('导出数据失败:', error)
    res.json(apiResponse(500, null, '导出失败: ' + error.message))
  }
})

app.post('/api/data/backup', (req, res) => {
  try {
    ensureDir(backupsDir)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `huangxiaoshuai_${timestamp}.db`
    const backupPath = path.join(backupsDir, fileName)

    db.close()
    fs.copyFileSync(dbPath, backupPath)
    db = new DatabaseSync(dbPath)

    res.json(apiResponse(200, {
      path: backupPath,
      fileName,
      size: fs.statSync(backupPath).size
    }, '备份成功'))
  } catch (error) {
    try { db = new DatabaseSync(dbPath) } catch {}
    console.error('备份失败:', error)
    res.json(apiResponse(500, null, '备份失败: ' + error.message))
  }
})

app.delete('/api/data/clear-cache', (req, res) => {
  try {
    ensureDir(logsDir)
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'))
    let deletedCount = 0
    for (const file of logFiles) {
      try {
        fs.unlinkSync(path.join(logsDir, file))
        deletedCount++
      } catch {}
    }
    res.json(apiResponse(200, { deletedCount }, `已清除 ${deletedCount} 个日志文件`))
  } catch (error) {
    console.error('清除缓存失败:', error)
    res.json(apiResponse(500, null, '清除失败: ' + error.message))
  }
})

// ========== 应用信息 ==========

app.get('/api/app/info', (req, res) => {
  res.json(apiResponse(200, {
    version: '1.0.0',
    electron: 'N/A (Web版)',
    vue: '3.x',
    dataPath: dbPath
  }))
})

// 启动服务器
const PORT = process.env.PORT || 3000

if (!initDatabase()) {
  console.error('数据库初始化失败，服务器无法启动')
  process.exit(1)
}

app.listen(PORT, () => {
  console.log(`黄小帅麻辣鸡服务器运行在 http://localhost:${PORT}`)
  console.log(`按 Ctrl+C 停止服务器`)
})
