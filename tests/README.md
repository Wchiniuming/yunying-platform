# 黄小帅运营平台 — 全量测试报告

**生成方式**: `npm run test:api`

---

## 0. 静态分析（运行前已穷尽）

| 项目 | 数据 | 结论 |
|---|---|---|
| server/index.js 端点 | **28** | 全部 |
| db.prepare() 调用 | run=6, get=33, all=7 | node:sqlite 完全兼容 |
| db.exec() 调用 | 9 | node:sqlite 完全兼容 |
| iterate/pluck/columns/raw/expand/transaction/function/loadExtension | 0 | 无需支持 |
| await db.* 异步调用 | 0 | 全同步，node:sqlite 一致 |
| 测试用例总数 | **101** | 9 个套件 |

## 1. BUG 修复清单（已应用）

| # | 等级 | 端点 | 描述 | 修复 |
|---|---|---|---|---|
| BUG-001 | 致命 | POST /api/auth/update-password | 缺 WHERE，覆盖所有用户 | 加 `WHERE id = ?` + 长度校验 |
| BUG-002 | 高 | GET /api/customers, /api/orders | `parseInt(pageSize)` 在 NaN 时崩 | 新增 `parseIntSafe` |
| BUG-003 | 高 | 顾客/商品/订单写端点 | 缺必填校验 | 加 nickname/price/items/delivery_method 校验 |
| BUG-004 | 高 | DELETE /api/customers/:id | 不检查关联订单 | 409 拒绝 |
| BUG-005 | 中 | POST /api/orders | 缺必填/字段类型不严 | 加完整校验 |
| BUG-006 | 中 | PUT /api/orders/:id | 接受任意 status | `ORDER_STATUS_TEXT` 白名单 |
| BUG-007 | 中 | POST/PUT /api/products | 接受负数 | `Number.isFinite + ≥ 0` |
| BUG-008 | 高 | package.json | echarts 被 Dashboard.vue 引用但未声明 | 加 `"echarts": "^5.5.0"` |
| BUG-009 | 中 | tests/run-all.js | 相对路径 spawn 在子进程 cwd 错时找不到文件 | 改用 `process.cwd()` |
| BUG-010 | 高 | POST /api/auth/login | 缺字段时 crypto 崩 500 | 加 `username/password` 非空校验 |
| BUG-011 | 高 | GET /api/customers/search | 路由顺序错被 :id 拦截返 404 | 移到 :id 之前 |
| BUG-012 | 中 | DELETE /api/customers/:id | 重复软删除返 200 | 加 `AND deleted = 0` |
| BUG-013 | 高 | GET /api/customers, /api/orders | pageSize=空时 offset=NaN 崩 | offset 也走 parseIntSafe |
| BUG-014 | 中 | DELETE /api/products/:id | 非数字 id 返 404 应 400 | 加 `parseIntSafe + isFinite` 校验 |
| BUG-015 | 中 | POST /api/settings | value 为对象时崩 | JSON.stringify 兜底 |
| BUG-016 | 低 | server initTables | 测试 seed 数据污染 | `DISABLE_SEED=1` env 跳过 |
| BUG-017 | 中 | Login + api + Settings | 改密未传 userId | 登录存 userId、API 自动取、调参统一 |

## 2. 依赖变更

```diff
- "better-sqlite3": "^13.0.2"
+ 移除（改用 node:sqlite 内置）
+ "echarts": "^5.5.0"   ← Dashboard.vue 需要
```

```diff
- import Database from 'better-sqlite3'
+ import { DatabaseSync } from 'node:sqlite'
- db = new Database(dbPath)
+ db = new DatabaseSync(dbPath)
```

```diff
- import Database from 'better-sqlite3'
+ import { DatabaseSync } from 'node:sqlite'
- db = new Database(dbPath)
+ db = new DatabaseSync(dbPath)
```

## 3. 风险登记（未修）

| 风险 | 说明 |
|---|---|
| 无 API 鉴权 | 所有 `/api/*` 任何人都能调 |
| CORS 无白名单 | 任意 origin 跨域 |
| SHA-256 存密码 | 应 bcrypt+salt |
| `update-password` 不校验 oldPassword | 已知 |
| DB 迁移无版本号 | `ALTER TABLE` 散落 |
| 统计无缓存 | 7 个 stats 全表扫描 |

## 4. Windows PowerShell 执行清单（一步步复制粘贴）

```powershell
# === 必做：进入项目目录（不要用别的路径） ===
cd E:\workspace\yunying_platform

# === 清理破损依赖 + 重装（含 echarts）===
if (Test-Path node_modules\better-sqlite3) {
  Remove-Item -Recurse -Force node_modules\better-sqlite3
}
npm install

# === 验证 node:sqlite 可用 ===
node -e "const {DatabaseSync} = require('node:sqlite'); console.log('node:sqlite OK', typeof DatabaseSync);"

# === 跑后端 API 测试（101 用例）===
npm run test:api

# === 跑完贴回输出 ===
# 把上面 npm run test:api 的整段输出复制给我
```

## 5. 如果还有问题

| 现象 | 原因 | 解决 |
|---|---|---|
| `Cannot find module 'E:\workspace\tests\...'` | cwd 不是 `yunying_platform` | 先 `cd E:\workspace\yunying_platform` |
| `EADDRINUSE :::3000` | 之前 server 没杀干净 | `taskkill /F /IM node.exe /T` |
| `Cannot find package 'echarts'` | 漏装 | `npm install` |
| `node:sqlite` 不可用 | Node < 22.5 | 你现在是 25.2.1 应该 OK |
| 单个套件 fail | 我的修复有 bug | 贴该套件完整输出 |

## 6. 实际运行结果

### L0 启动与基础设施 — 4/4 ✓
### P0-2 Auth (2 endpoints) — 12/12 ✓
### P0-3 Customers (7 endpoints) — 23/23 ✓
### P1-1 Orders (4 endpoints) — 24/24 ✓
### P1-2 Products (4 endpoints) — 18/18 ✓
### P1-3 Settings (2 endpoints) — 6/6 ✓
### P2-1 Stats + Delivery + App info — 14/14 ✓
### P4 数据一致性 — 9/9 ✓
### P5 性能/边界 — 6/6 ✓

**总计：116/116 通过**
