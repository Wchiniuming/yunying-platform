import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import fs from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 应用配置
const userDataPath = process.env.APPDATA || path.join(process.env.HOME || '', '.huangxiaoshuai')
const dbPath = path.join(userDataPath, 'data', 'huangxiaoshuai.db')

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
    db = new Database(dbPath)
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
      status TEXT NOT NULL DEFAULT 'pending',
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
    // 简单哈希，实际生产应该用bcrypt
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex')
    db.prepare(`INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)`).run(
      'admin',
      passwordHash,
      '管理员',
      'admin'
    )
  }

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

  // 初始化示例数据
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get()
  if (orderCount.count === 0) {
    // 示例顾客
    const customers = [
      ['张三', '13812340001', '朝阳区建国路88号1号楼1501', '老板很好，订单多'],
      ['李四', '13812340002', '海淀区中关村大街1号', '常客，点单准时'],
      ['王五', '13812340003', '东城区王府井大街138号', '新顾客，第一次下单'],
      ['赵六', '13812340004', '西城区金融大街1号', 'VIP客户'],
      ['钱七', '13812340005', '丰台区南三环西路88号', '每次都点微辣'],
      ['孙八', '13812340006', '石景山区石景山路88号', '投诉过一次，介意'],
      ['周九', '13812340007', '通州区新华大街1号', '朋友推荐来的'],
      ['吴十', '13812340008', '昌平区回龙观西大街88号', '自取订单多'],
      ['郑一', '13812340009', '大兴区亦庄经济开发区1号', '公司团建订单'],
      ['王二', '13812340010', '顺义区天竺大街1号', '深夜单多']
    ]
    const insertCustomer = db.prepare(`
      INSERT INTO customers (wechat_nickname, phone, default_address, notes, source, total_orders, total_spent, last_order_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
    `)
    const customerIds = []
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i]
      const orders = Math.floor(Math.random() * 15) + 1
      const spent = orders * (60 + Math.random() * 80)
      const daysAgo = Math.floor(Math.random() * 30)
      const result = insertCustomer.run(c[0], c[1], c[2], c[3],
        i < 5 ? '微信群' : i < 8 ? '朋友圈' : '朋友推荐',
        orders, spent.toFixed(2), daysAgo)
      customerIds.push(result.lastInsertRowid)
    }

    // 示例订单
    const statuses = ['pending', 'preparing', 'waiting_pickup', 'delivering', 'delivered', 'completed', 'cancelled']
    const deliveryMethods = ['self', 'sf']
    const paymentMethods = ['wechat', 'alipay', 'cash']
    const dishes = [
      { name: '麻辣鸡腿堡', price: 28 },
      { name: '麻辣鸡翅', price: 18 },
      { name: '香辣鸡腿堡', price: 26 },
      { name: '薯条(大)', price: 12 },
      { name: '薯条(小)', price: 8 },
      { name: '可乐(大)', price: 10 },
      { name: '可乐(小)', price: 6 },
      { name: '麻辣鸡块', price: 22 },
      { name: '黄金蝴蝶虾', price: 24 },
      { name: '原味鸡块', price: 20 }
    ]

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, customer_id, wechat_nickname, phone, delivery_address,
        items_json, order_total, delivery_method, sf_waybill_no, status, payment_status, payment_method, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
    `)

    const insertStatusLog = db.prepare(`
      INSERT INTO order_status_log (order_id, old_status, new_status, operator, operate_time, remark)
      VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' hours'), ?)
    `)

    for (let i = 0; i < 25; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId)
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const deliveryMethod = deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)]
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

      // 随机选择1-4个菜品
      const itemCount = Math.floor(Math.random() * 4) + 1
      const selectedDishes = []
      let total = 0
      for (let j = 0; j < itemCount; j++) {
        const dish = dishes[Math.floor(Math.random() * dishes.length)]
        const qty = Math.floor(Math.random() * 3) + 1
        selectedDishes.push({ name: dish.name, price: dish.price, qty })
        total += dish.price * qty
      }

      const orderNo = `MJ${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`
      const hoursAgo = Math.floor(Math.random() * 72)
      const sfWaybill = deliveryMethod === 'sf' ? `SF${Date.now()}${Math.floor(Math.random() * 1000)}` : null

      const result = insertOrder.run(
        orderNo, customerId, customer.wechat_nickname, customer.phone, customer.default_address,
        JSON.stringify(selectedDishes), total.toFixed(2), deliveryMethod, sfWaybill,
        status, 'paid', paymentMethod, 'wechat', hoursAgo
      )

      const orderId = result.lastInsertRowid

      // 插入状态日志
      const statusFlow = ['pending', 'preparing', 'waiting_pickup', 'delivering', 'delivered']
      const currentIndex = statusFlow.indexOf(status)
      if (currentIndex >= 0) {
        for (let s = 0; s <= currentIndex; s++) {
          insertStatusLog.run(orderId, s === 0 ? null : statusFlow[s-1], statusFlow[s], 'system', hoursAgo + (currentIndex - s) * 0.5, s === currentIndex ? '当前状态' : null)
        }
      }
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

// API 响应格式化
function apiResponse(code, data, message) {
  return { code, data, message }
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
    const { newPassword } = req.body
    if (!newPassword) {
      return res.json(apiResponse(400, null, '密码不能为空'))
    }
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex')
    db.prepare('UPDATE users SET password = ?').run(passwordHash)
    res.json(apiResponse(200, null, '密码修改成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '修改失败'))
  }
})

// ========== 顾客相关 ==========

app.get('/api/customers', (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', orderCount = '' } = req.query
    const offset = (page - 1) * pageSize

    let sql = 'SELECT * FROM customers WHERE deleted = 0'
    let countSql = 'SELECT COUNT(*) as total FROM customers WHERE deleted = 0'
    const params = []

    if (keyword) {
      sql += ' AND (wechat_nickname LIKE ? OR wechat_remark LIKE ? OR phone LIKE ? OR default_address LIKE ?)'
      countSql += ' AND (wechat_nickname LIKE ? OR wechat_remark LIKE ? OR phone LIKE ? OR default_address LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), offset)

    const list = db.prepare(sql).all(...params)
    const { total } = db.prepare(countSql).get(...(keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : []))

    const enrichedList = list.map(c => ({
      ...c,
      address: c.default_address || '',
      remark: c.notes || '',
      order_count: c.total_orders || 0,
      last_order_at: c.last_order_date || null,
      customer_level: c.customer_level || 'normal'
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

app.get('/api/customers/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted = 0').get(req.params.id)
    if (!customer) {
      return res.json(apiResponse(404, null, '顾客不存在'))
    }

    const recentOrders = db.prepare('SELECT id, order_no, order_total, status, created_at FROM orders WHERE customer_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT 5').all(req.params.id)

    res.json(apiResponse(200, {
      ...customer,
      address: customer.default_address || '',
      remark: customer.notes || '',
      order_count: customer.total_orders || 0,
      last_order_at: customer.last_order_date || null,
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
    const { wechat_nickname, phone, address, remark, customer_level, source } = req.body
    const result = db.prepare(`
      INSERT INTO customers (wechat_nickname, phone, default_address, notes, customer_level, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      wechat_nickname,
      phone || '',
      address || '',
      remark || '',
      customer_level || 'normal',
      source || '微信群'
    )

    res.json(apiResponse(200, { id: result.lastInsertRowid }, '添加成功'))
  } catch (error) {
    console.error('添加顾客失败:', error)
    res.json(apiResponse(500, null, '添加失败'))
  }
})

app.put('/api/customers/:id', (req, res) => {
  try {
    const { wechat_nickname, phone, address, remark, customer_level, source } = req.body
    db.prepare(`
      UPDATE customers SET wechat_nickname = ?, phone = ?, default_address = ?, notes = ?,
      customer_level = ?, source = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      wechat_nickname,
      phone || '',
      address || '',
      remark || '',
      customer_level || 'normal',
      source || '微信群',
      req.params.id
    )

    res.json(apiResponse(200, null, '更新成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '更新失败'))
  }
})

app.delete('/api/customers/:id', (req, res) => {
  try {
    db.prepare('UPDATE customers SET deleted = 1 WHERE id = ?').run(req.params.id)
    res.json(apiResponse(200, null, '删除成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '删除失败'))
  }
})

app.get('/api/customers/search', (req, res) => {
  try {
    const { keyword } = req.query
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

// ========== 订单相关 ==========

app.get('/api/orders', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status = '', keyword = '', startDate = '', endDate = '', customerId = '' } = req.query
    const offset = (page - 1) * pageSize

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
    params.push(parseInt(pageSize), offset)

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

    const timeline = db.prepare('SELECT * FROM order_status_log WHERE order_id = ? ORDER BY operate_time ASC').all(req.params.id)

    let items = []
    try {
      items = JSON.parse(order.items_json || '[]')
    } catch (e) {
      items = []
    }

    res.json(apiResponse(200, {
      ...order,
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
      order_total, delivery_method, sf_tracking_no, remark, payment_method, payment_status
    } = req.body

    const orderNo = generateOrderNo()
    const itemsJson = JSON.stringify(items || [])

    const result = db.prepare(`
      INSERT INTO orders (order_no, customer_id, wechat_nickname, phone, delivery_address,
        items_json, order_total, delivery_method, sf_waybill_no, notes, payment_method, payment_status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, customer_id, wechat_nickname, phone, delivery_address, itemsJson,
      order_total, delivery_method, sf_tracking_no, remark, payment_method, payment_status, 'wechat')

    // 更新顾客统计
    if (customer_id) {
      db.prepare(`
        UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?,
        last_order_date = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(order_total, customer_id)
    }

    // 记录状态日志
    db.prepare(`
      INSERT INTO order_status_log (order_id, new_status, operator, remark)
      VALUES (?, 'pending', 'system', '订单创建')
    `).run(result.lastInsertRowid)

    res.json(apiResponse(200, { id: result.lastInsertRowid, order_no: orderNo }, '订单创建成功'))
  } catch (error) {
    console.error('创建订单失败:', error)
    res.json(apiResponse(500, null, '创建失败'))
  }
})

app.put('/api/orders/:id', (req, res) => {
  try {
    const { status, operator = 'system' } = req.body
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(req.params.id)

    if (!order) {
      return res.json(apiResponse(404, null, '订单不存在'))
    }

    const oldStatus = order.status

    db.prepare(`
      UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, req.params.id)

    // 记录状态日志
    db.prepare(`
      INSERT INTO order_status_log (order_id, old_status, new_status, operator)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, oldStatus, status, operator)

    res.json(apiResponse(200, null, '状态更新成功'))
  } catch (error) {
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
      recentOrders
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
    const dayNum = parseInt(days) || 7
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
    const dayNum = parseInt(days) || 0
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
    const topN = Math.min(Math.max(parseInt(limit) || 10, 1), 50)
    const dayNum = parseInt(days) || 0
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
    const dayNum = parseInt(days) || 0
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
    const dayNum = parseInt(days) || 0
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
    if (!name || !price) {
      return res.json(apiResponse(400, null, '商品名称和价格不能为空'))
    }
    const result = db.prepare(`
      INSERT INTO dishes (name, category, price, specs_json, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      category || 'main',
      parseFloat(price),
      JSON.stringify({ unit: unit || '斤' }),
      parseInt(sort_order || 0),
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
    const id = parseInt(req.params.id)
    if (!name || !price) {
      return res.json(apiResponse(400, null, '商品名称和价格不能为空'))
    }
    const result = db.prepare(`
      UPDATE dishes SET name = ?, category = ?, price = ?, specs_json = ?, sort_order = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name,
      category || 'main',
      parseFloat(price),
      JSON.stringify({ unit: unit || '斤' }),
      parseInt(sort_order || 0),
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
    const id = parseInt(req.params.id)
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
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
    res.json(apiResponse(200, null, '保存成功'))
  } catch (error) {
    res.json(apiResponse(500, null, '保存失败'))
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
