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

## 2. 依赖变更

```diff
- "better-sqlite3": "^13.0.2"
+ 移除（改用 node:sqlite 内置）
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

## 4. 实际运行结果

请运行 `npm run test:api` 后把输出贴回这里。
