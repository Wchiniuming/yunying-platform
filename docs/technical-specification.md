# 麻辣鸡外卖订单管理平台 - 技术方案

> 文档版本: v1.3
> 创建日期: 2025-07-29
> 状态: 草稿 (基于Oracle审核修订 + 离线升级机制)

---

## 1. 技术架构

### 1.1 整体架构 (含自动更新)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Windows PC                                  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    Electron 桌面应用                            │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │              Vue 3 + Element Plus                        │ │   │
│  │  │   订单管理 / 顾客管理 / 配送追踪 / 数据统计 / 系统设置   │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                              │                                │   │
│  │  ┌───────────────────────────┴───────────────────────────┐  │   │
│  │  │              electron-updater (自动更新模块)           │  │   │
│  │  │   ├── 检查更新 ──→ 下载更新包 ──→ 安装新版本         │  │   │
│  │  │   └── 启动时检测 │ 后台下载 │ 用户确认后安装         │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  │                              │                                │   │
│  │                              ▼                                │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │                    SQLite 数据库                        │  │   │
│  │  │              (存储位置: %APPDATA%\MalaJi\)             │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│                           ▲                                           │
│                           │ 更新检查                                  │
│                           ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    更新服务器 (HTTP)                            │   │
│  │  ├── latest.yml         (版本信息)                           │   │
│  │  └── MalaJi-Setup-1.2.0.exe  (安装包)                       │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈 (修订版 - 轻量化)

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 桌面框架 | Electron | 28+ | 打包成Windows exe |
| 前端框架 | Vue 3 | 3.4+ | 渐进式JS框架 |
| UI组件库 | Element Plus | 2.5+ | Vue3组件库 |
| 前端路由 | Vue Router | 4.x | SPA路由 |
| 状态管理 | Pinia | 2.x | Vue3状态管理 |
| 构建工具 | Vite | 5.x | 下一代构建工具 |
| 数据库 | SQLite | 3.x | 零配置,单文件 |
| ORM框架 | better-sqlite3 | 9.x | Node.js原生SQLite |

### 1.3 目录结构 (程序与数据分离)

```
安装目录: C:\Program Files\MalaJi\
程序文件 (可升级覆盖)
├── MalaJi.exe                 # 主程序
├── resources/                 # 资源文件
└── uninstall.exe             # 卸载程序

用户数据目录: %APPDATA%\MalaJi\
数据文件 (升级时永不触碰)
├── data/
│   └── malaji.db             # SQLite数据库 (所有用户数据)
├── logs/                      # 日志文件
│   └── app.log               # 应用日志
└── config/
    └── settings.json          # 用户配置
```

### 1.4 为什么选择这个方案?

| 对比项 | 原方案 (Spring Boot + MySQL) | 修订方案 (Electron + SQLite) |
|--------|------------------------------|-------------------------------|
| 用户安装组件 | JDK + MySQL + Maven + Node.js (5个) | 只需要exe (1个) |
| 数据库配置 | 需配端口/密码/字符集 | 无需配置,自动创建 |
| 启动速度 | 30秒+ | 3秒内 |
| 数据文件 | MySQL数据目录 (复杂) | 单一 .db 文件 |
| 适合对象 | 技术用户 | 任何用户 |
| 迁移成本 | 高 (需迁移整个数据库) | 低 (复制文件即可) |

**Oracle建议**: 对于 <50单/天的小餐馆,轻量方案完全够用,且用户体验提升10倍。

### 1.3 项目结构 (修订版)

```
mala-ji-platform/
├── docs/                          # 文档目录
│   ├── requirements.md            # 需求文档
│   └── technical-specification.md  # 本文档
│
├── src/                           # Electron + Vue 主项目
│   ├── main/                      # Electron 主进程
│   │   ├── index.js              # 入口
│   │   ├── database.js           # SQLite 数据库操作
│   │   ├── updater.js           # 自动更新模块 (核心!)
│   │   └── preload.js            # 预加载脚本
│   │
│   ├── renderer/                  # Vue 渲染进程
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.js           # Vue 入口
│   │   │   ├── App.vue           # 根组件
│   │   │   │
│   │   │   ├── router/          # 路由
│   │   │   └── index.js
│   │   │
│   │   │   ├── stores/          # Pinia 状态
│   │   │   │   ├── order.js
│   │   │   │   ├── customer.js
│   │   │   │   └── app.js
│   │   │
│   │   │   ├── views/           # 页面
│   │   │   │   ├── OrderList.vue
│   │   │   │   ├── OrderForm.vue
│   │   │   │   ├── CustomerList.vue
│   │   │   │   ├── CustomerForm.vue
│   │   │   │   ├── DeliveryBoard.vue
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── Settings.vue
│   │   │   │   └── UpdateNotice.vue   # 更新提示组件
│   │   │
│   │   │   ├── components/     # 组件
│   │   │   │   ├── Sidebar.vue
│   │   │   │   ├── OrderItem.vue
│   │   │   │   └── CustomerSelector.vue
│   │   │
│   │   │   └── utils/          # 工具
│   │   │       ├── db.js       # SQLite 操作封装
│   │   │       ├── format.js
│   │   │       ├── ipc.js       # 主进程通信
│   │   │       └── constants.js
│   │   │
│   │   └── assets/             # 静态资源
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── electron-builder.json   # 打包配置
│
├── update-server/                  # 更新服务器 (可选)
│   ├── latest.yml               # 版本信息
│   └── releases/                # 安装包存储
│       └── MalaJi-Setup-1.0.0.exe
│
└── dist/                         # 打包输出
    ├── MalaJi-Setup.exe        # Windows 安装包
    └── MalaJi.exe              # 免安装版
```

---
## 2. 离线升级机制 (核心设计)

> **重要**: 用户场景是离线环境,直接拷贝exe更新。本节说明如何确保升级时不丢失数据。

### 2.1 目录结构 (程序与数据分离)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    程序目录 (C:\Program Files\MalaJi\)               │
│                    升级时覆盖这些文件                               │
├─────────────────────────────────────────────────────────────────────┤
│  MalaJi.exe          ← 主程序,升级时覆盖                          │
│  resources/          ← 静态资源,升级时覆盖                        │
│  uninstall.exe      ← 卸载程序,升级时覆盖                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ 升级时绝对不动
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    数据目录 (%APPDATA%\MalaJi\)                    │
│                    升级时完全不触碰,永不丢失                        │
├─────────────────────────────────────────────────────────────────────┤
│  data/                                                         │
│  └── malaji.db    ← SQLite数据库,所有订单和顾客数据!             │
│                                                                     │
│  logs/               ← 日志文件                                   │
│  └── app.log                                                         │
│                                                                     │
│  config/             ← 配置文件                                   │
│  └── settings.json                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 升级流程 (离线拷贝方式)

```
┌─────────────────────────────────────────────────────────────────────┐
│                       离线升级流程                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Step 1: 开发者打包新版本                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  npm run build:win                                          │   │
│  │  生成: dist/MalaJi-1.2.0.exe  (安装包)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Step 2: 拷贝安装包到目标机器 (U盘/局域网/任何方式)                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  方式A: U盘拷贝                                              │   │
│  │  方式B: 局域网共享                                            │   │
│  │  方式C: 直接拷贝到目标机器                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Step 3: 安装新版本                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  双击 MalaJi-1.2.0.exe                                      │   │
│  │                                                               │   │
│  │  安装程序检测到已安装旧版本:                                  │   │
│  │  → 询问: "是否保留用户数据?"  ← 选 [保留]                   │   │
│  │  → 升级程序只覆盖 C:\Program Files\MalaJi\ 下的程序文件       │   │
│  │  → %APPDATA%\MalaJi\ 数据完全不动!                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Step 4: 完成升级                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ✅ 新版本程序已安装                                         │   │
│  │  ✅ 所有订单数据完整保留 (malaji.db)                         │   │
│  │  ✅ 所有顾客数据完整保留                                     │   │
│  │  ✅ 打开应用,一切照旧                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 electron-builder 配置 (离线安装)

```json
// electron-builder.json
{
  "appId": "com.malaji.order",
  "productName": "麻辣鸡订单管理",
  "directories": {
    "output": "dist"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "麻辣鸡订单管理",
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeaderIcon": "build/icon.ico",
    "deleteAppDataOnUpgrade": false
  }
}
```

**关键配置**: `"deleteAppDataOnUpgrade": false` 确保升级时不删除用户数据!

### 2.4 升级操作手册

```
┌─────────────────────────────────────────────────────────────────────┐
│                    离线升级操作手册                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  【开发者】                                                          │
│  1. 完成新版本开发                                                  │
│  2. 修改版本号: package.json → "version": "1.2.0"                  │
│  3. 执行打包: npm run build:win                                     │
│  4. 把 dist/MalaJi-1.2.0.exe 拷贝给用户                            │
│                                                                       │
│  【用户 - 目标机器】                                                 │
│  1. 接收新版本安装包 (U盘/局域网等)                                  │
│  2. 关闭当前正在运行的应用                                           │
│  3. 双击 MalaJi-1.2.0.exe                                           │
│  4. 安装向导提示: "检测到已安装版本,是否保留数据?"                    │
│     → 点击 [下一步] 或 [保留用户数据]                                │
│  5. 等待安装完成                                                    │
│  6. 启动新版本应用                                                  │
│  7. 检查: 所有历史订单、顾客数据完好无损                             │
│                                                                       │
│  【重要】                                                            │
│  ⚠️ 升级前务必关闭应用,否则安装程序可能无法覆盖文件                  │
│  ⚠️ 如果安装程序提示 "是否删除用户数据",务必选 [否/保留]           │
│  ⚠️ 数据目录在 %APPDATA%\MalaJi\ ,不受安装程序影响                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.5 回滚操作 (如果升级后有问题)

```
如果新版本有问题,可以回滚到旧版本:

方法1: 重新安装旧版本
1. 卸载当前版本 (不删除用户数据)
2. 安装旧版本安装包
3. 数据不受影响

方法2: 手动替换 (紧急情况)
1. 关闭应用
2. 用旧版 MalaJi.exe 替换 C:\Program Files\MalaJi\MalaJi.exe
3. 重启应用
4. 数据不受影响

数据恢复 (极端情况)
如果malaji.db损坏或误删:
1. 检查 %APPDATA%\MalaJi\data\ 目录
2. 如果有备份文件 malaji.db.backup,重命名为 malaji.db
3. 启动应用
```

### 2.6 数据备份建议

```
建议用户定期备份数据目录:

备份操作 (每月一次):
1. 打开文件夹: %APPDATA%\MalaJi\
2. 复制整个 data 文件夹到安全位置
3. 例如: copy "%APPDATA%\MalaJi\data" "D:\备份\MalaJi_data_20250801"

迁移到新电脑:
1. 在新电脑安装应用
2. 把旧电脑的 %APPDATA%\MalaJi\data 整个复制过去
3. 完成数据迁移
```

---

## 3. 数据库设计 (SQLite)

> SQLite 是零配置、单文件数据库,非常适合轻量级应用。

### 3.1 ER图


```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  customers  │       │   orders    │       │    tags     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │       │ id          │
│ wechat_name │  │    │ order_no    │       │ name        │
│ wechat_remark│ │    │ customer_id │◄──────│ color       │
│ phone       │  │    │ wechat_name │       │ category    │
│ address     │  │    │ phone       │       │ created_at  │
│ level       │  │    │ address     │       └─────────────┘
│ source      │  │    │ items_json  │              │
│ total_orders│  │    │ food_total  │              │
│ total_spent │  │    │ packaging   │              │
│ last_order  │  │    │ delivery_fee│              │
│ created_at  │  │    │ discount    │              │
└─────────────┘  │    │ order_total│              │
       │         │    │ delivery_   │              │
       │         │    │   method    │              │
       │         │    │ driver_name │              │
       │         │    │ driver_phone│              │
       │         │    │ status      │              │
       │         │    │ source      │              │
       │         │    │ created_at  │              │
       │         │    └─────────────┘              │
       │         │                                   │
       ▼         ▼                                   │
┌─────────────────────────┐                           │
│    customer_tags        │                           │
├─────────────────────────┤                           │
│ customer_id (FK)         │◄────────────────────────┘
│ tag_id (FK)              │
└─────────────────────────┘
```

### 2.2 表结构 (SQLite 语法)

#### 2.2.1 customers (顾客表)

```sql
CREATE TABLE customers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    wechat_nickname TEXT NOT NULL,
    wechat_remark   TEXT,
    phone           TEXT,
    default_address TEXT,
    customer_level  TEXT DEFAULT 'normal',
    source          TEXT,
    total_orders    INTEGER DEFAULT 0,
    total_spent     REAL DEFAULT 0,
    last_order_date TEXT,
    notes           TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    deleted         INTEGER DEFAULT 0
);

CREATE INDEX idx_customers_wechat ON customers(wechat_nickname);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_level ON customers(customer_level);
```

#### 2.2.2 orders (订单表)

```sql
CREATE TABLE orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no            TEXT NOT NULL UNIQUE,
    customer_id         INTEGER,
    wechat_nickname     TEXT NOT NULL,
    phone               TEXT,
    delivery_address    TEXT NOT NULL,

    -- 商品明细 (JSON格式)
    items_json          TEXT,

    -- 金额信息
    food_total          REAL NOT NULL DEFAULT 0,
    packaging_fee       REAL DEFAULT 0,
    delivery_fee        REAL DEFAULT 0,
    discount            REAL DEFAULT 0,
    order_total         REAL NOT NULL,

    -- 配送信息
    delivery_method     TEXT NOT NULL,
    driver_name         TEXT,
    driver_phone        TEXT,
    sf_waybill_no       TEXT,
    expected_delivery   TEXT,
    actual_pickup      TEXT,
    actual_delivery     TEXT,
    delivery_notes      TEXT,

    -- 订单状态
    status              TEXT NOT NULL DEFAULT 'pending',
    payment_status      TEXT NOT NULL DEFAULT 'paid',
    payment_method      TEXT,

    -- 扩展信息
    source              TEXT NOT NULL,
    wechat_order_time   TEXT,
    is_first_order      INTEGER DEFAULT 0,
    coupon_used         TEXT,
    notes               TEXT,

    -- 审计字段
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now')),
    deleted             INTEGER DEFAULT 0
);

CREATE INDEX idx_orders_no ON orders(order_no);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);20) NOT NULL DEFAULT 'pending' COMMENT '订单状态: pending/preparing/waiting_pickup/delivering/delivered/completed/cancelled',
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'paid' COMMENT '支付状态: paid/unpaid/refunded',
    payment_method      VARCHAR(20) COMMENT '支付方式: wechat/alipay/cash/other',

    -- 扩展信息
    source              VARCHAR(50) NOT NULL COMMENT '订单来源: wechat_group/wechat_personal/moments/other',
    wechat_order_time   DATETIME COMMENT '微信消息时间(接单时间)',
    is_first_order      TINYINT DEFAULT 0 COMMENT '是否新客首单',
    coupon_used         VARCHAR(100) COMMENT '使用的优惠券',
    notes               TEXT COMMENT '订单备注',

    -- 审计字段
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
```

#### 2.2.3 tags (标签表)

```sql
CREATE TABLE tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    color       TEXT DEFAULT '#409EFF',
    category    TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(name, category)
);

CREATE INDEX idx_tags_category ON tags(category);
```

#### 2.2.4 customer_tags (顾客标签关联表)

```sql
CREATE TABLE customer_tags (
    customer_id INTEGER NOT NULL,
    tag_id      INTEGER NOT NULL,
    PRIMARY KEY (customer_id, tag_id)
);
```

#### 2.2.5 dishes (菜品表)

```sql
CREATE TABLE dishes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    price       REAL NOT NULL,
    specs_json  TEXT,
    flavors_json TEXT,
    status      TEXT DEFAULT 'available',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_dishes_status ON dishes(status);
```

#### 2.2.6 order_status_log (订单状态日志表)

```sql
CREATE TABLE order_status_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL,
    old_status  TEXT,
    new_status  TEXT NOT NULL,
    operator    TEXT,
    operate_time TEXT DEFAULT (datetime('now')),
    remark      TEXT
);

CREATE INDEX idx_log_order ON order_status_log(order_id);
```

#### 2.2.7 users (用户表)

```sql
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    real_name   TEXT,
    role        TEXT DEFAULT 'operator',
    status      TEXT DEFAULT 'active',
    last_login  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);
```

### 2.3 初始化数据

```sql
-- 插入预置标签
INSERT INTO tags (name, color, category, sort_order) VALUES
-- 口味偏好
('重辣', '#F56C6C', 'flavor', 1),
('中辣', '#E6A23C', 'flavor', 2),
('微辣', '#67C23A', 'flavor', 3),
('不要辣', '#909399', 'flavor', 4),
('麻辣', '#F56C6C', 'flavor', 5),
('五香', '#409EFF', 'flavor', 6),
-- 忌口
('不要香菜', '#67C23A', 'avoid', 1),
('不要葱蒜', '#909399', 'avoid', 2),
('不要辣椒', '#E6A23C', 'avoid', 3),
('海鲜过敏', '#F56C6C', 'avoid', 4),
('坚果过敏', '#F56C6C', 'avoid', 5),
-- 客户等级
('普通', '#909399', 'level', 1),
('常客', '#409EFF', 'level', 2),
('VIP', '#E6A23C', 'level', 3),
('SVIP', '#F56C6C', 'level', 4),
-- 来源
('微信群', '#409EFF', 'source', 1),
('朋友圈', '#67C23A', 'source', 2),
('朋友推荐', '#E6A23C', 'source', 3),
-- 特殊
('投诉过', '#F56C6C', 'special', 1),
('退款多', '#E6A23C', 'special', 2),
('需重点关注', '#F56C6C', 'special', 3);

-- 插入默认管理员账户 (密码: admin123, BCrypt加密)
INSERT INTO users (username, password, real_name, role) VALUES
('admin', '$2a$10$XJ3LqM5L5YUQwQo5O5J5XeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', '管理员', 'admin');
```

---

## 3. API接口设计

### 3.1 接口规范

#### 统一响应格式

```typescript
// 成功响应
{
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}

// 分页响应
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 错误响应
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 3.2 订单接口

```
POST   /api/orders              # 创建订单
GET    /api/orders              # 订单列表 (分页+筛选)
GET    /api/orders/{id}         # 订单详情
PUT    /api/orders/{id}         # 更新订单
DELETE /api/orders/{id}         # 删除订单
PUT    /api/orders/{id}/status  # 更新订单状态
GET    /api/orders/statistics   # 订单统计
```

#### 创建订单

```typescript
// POST /api/orders
// Request
{
  "customerId": 1,
  "wechatNickname": "@麻辣鸡粉丝",
  "phone": "13800138000",
  "deliveryAddress": "XX市XX区XX路XX号",
  "items": [
    {
      "name": "麻辣鸡(大份)",
      "qty": 1,
      "price": 68,
      "spec": "大份",
      "flavor": "麻辣",
      "note": "不要香菜"
    }
  ],
  "foodTotal": 68,
  "packagingFee": 3,
  "deliveryFee": 5,
  "discount": 10,
  "orderTotal": 66,
  "deliveryMethod": "sf",
  "driverName": "张师傅",
  "driverPhone": "13900139000",
  "expectedDelivery": "2025-07-29 13:30:00",
  "paymentStatus": "paid",
  "paymentMethod": "wechat",
  "source": "wechat_group",
  "wechatOrderTime": "2025-07-29 12:30:00",
  "notes": ""
}

// Response
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1,
    "orderNo": "WX_20250729_001"
  }
}
```

#### 订单列表

```typescript
// GET /api/orders?page=1&pageSize=20&status=pending&startDate=2025-07-01&endDate=2025-07-31&keyword=麻辣鸡
// Response
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "orderNo": "WX_20250729_001",
        "wechatNickname": "@麻辣鸡粉丝",
        "itemsSummary": "麻辣鸡(大份)x1 + 凉菜x1",
        "orderTotal": 66,
        "deliveryMethod": "顺丰同城",
        "status": "preparing",
        "createdAt": "2025-07-29 12:30:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 3.3 顾客接口

```
POST   /api/customers           # 创建顾客
GET    /api/customers           # 顾客列表
GET    /api/customers/{id}      # 顾客详情
PUT    /api/customers/{id}      # 更新顾客
DELETE /api/customers/{id}      # 删除顾客
GET    /api/customers/{id}/orders # 顾客订单列表
GET    /api/customers/statistics # 顾客统计
GET    /api/customers/suggest   # 顾客联想
```

#### 创建顾客

```typescript
// POST /api/customers
// Request
{
  "wechatNickname": "@麻辣鸡忠实粉",
  "wechatRemark": "张三(城东)",
  "phone": "13800138000",
  "defaultAddress": "XX市XX区XX路XX号",
  "customerLevel": "vip",
  "source": "wechat_group",
  "tagIds": [1, 3, 15],
  "flavorPreference": "麻辣",
  "avoidFood": ["香菜"],
  "notes": "老客户,每次都点特辣"
}

// Response
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": 1
  }
}
```

### 3.4 配送接口

```
GET    /api/delivery/board      # 配送看板
PUT    /api/delivery/{orderId}/status # 更新配送状态
```

### 3.5 统计接口

```
GET    /api/stats/dashboard      # 今日概览
GET    /api/stats/order         # 订单统计
GET    /api/stats/customer      # 顾客统计
GET    /api/stats/export        # 导出报表
```

#### 今日概览

```typescript
// GET /api/stats/dashboard
// Response
{
  "code": 200,
  "data": {
    "todayOrders": 15,
    "todayRevenue": 1256.00,
    "todayAvgOrder": 83.73,
    "pendingOrders": 3,
    "newCustomers": 2,
    "recentOrders": [
      { "id": 1, "orderNo": "WX_20250729_001", "wechatNickname": "@xxx", "orderTotal": 66 }
    ]
  }
}
```

### 3.6 标签接口

```
GET    /api/tags                # 标签列表
POST   /api/tags                # 创建标签
PUT    /api/tags/{id}           # 更新标签
DELETE /api/tags/{id}           # 删除标签
GET    /api/tags/categories     # 标签分类
```

### 3.7 菜品接口

```
GET    /api/dishes              # 菜品列表
POST   /api/dishes              # 创建菜品
PUT    /api/dishes/{id}         # 更新菜品
DELETE /api/dishes/{id}         # 删除菜品
PUT    /api/dishes/{id}/status  # 更新状态(在售/售罄)
```

### 3.8 认证接口

```
POST   /api/auth/login          # 登录
POST   /api/auth/logout         # 登出
GET    /api/auth/current        # 当前用户
```

---

## 4. 代码规范

### 4.1 Java代码规范

#### 4.1.1 命名规范

```java
// 类名: UpperCamelCase
public class OrderController { }
public class OrderServiceImpl { }
public class OrderMapper { }

// 方法名: lowerCamelCase
public Order createOrder(OrderDTO dto) { }
public List<Order> findByStatus(String status) { }

// 变量名: lowerCamelCase
private Long customerId;
private String orderNo;

// 常量: UPPER_SNAKE_CASE
public static final String STATUS_PENDING = "pending";
private static final int MAX_PAGE_SIZE = 100;

// 包名: 全小写
com.malaji.controller
com.malaji.service
com.malaji.mapper
```

#### 4.1.2 Controller规范

```java
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * 创建订单
     */
    @PostMapping
    public Result<Long> createOrder(@Validated @RequestBody CreateOrderRequest request) {
        Long orderId = orderService.createOrder(request);
        return Result.success(orderId);
    }

    /**
     * 订单列表
     */
    @GetMapping
    public Result<PageResult<OrderVO>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keyword) {
        PageResult<OrderVO> result = orderService.listOrders(page, pageSize, status, startDate, endDate, keyword);
        return Result.success(result);
    }

    /**
     * 订单详情
     */
    @GetMapping("/{id}")
    public Result<OrderVO> detail(@PathVariable Long id) {
        OrderVO order = orderService.getOrderDetail(id);
        return Result.success(order);
    }
}
```

#### 4.1.3 Service规范

```java
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class OrderService {

    private final OrderMapper orderMapper;
    private final CustomerMapper customerMapper;

    public Long createOrder(CreateOrderRequest request) {
        // 1. 参数校验
        ValidateUtil.notBlank(request.getWechatNickname(), "顾客微信名不能为空");
        ValidateUtil.notEmpty(request.getItems(), "商品明细不能为空");

        // 2. 构建订单实体
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        // ... 其他字段映射

        // 3. 保存订单
        orderMapper.insert(order);

        // 4. 更新顾客统计
        updateCustomerStats(request);

        // 5. 记录状态日志
        saveStatusLog(order.getId(), null, order.getStatus());

        return order.getId();
    }

    private String generateOrderNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%03d", (int)(Math.random() * 999));
        return "WX_" + date + "_" + seq;
    }
}
```

#### 4.1.4 Mapper规范

```java
@Mapper
public interface OrderMapper extends BaseMapper<Order> {

    // 自定义查询方法
    List<Order> selectByStatus(@Param("status") String status);

    // 分页查询
    IPage<Order> selectPage(IPage<Order> page, @Param("status") String status);

    // 统计查询
    @Select("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")
    Long countToday();

    // 使用XML映射复杂SQL
    List<OrderDetailVO> selectDetailById(@Param("id") Long id);
}
```

```xml
<select id="selectDetailById" resultType="com.malaji.vo.OrderDetailVO">
    SELECT o.*, c.wechat_remark as customerRemark
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = #{id}
</select>
```

#### 4.1.5 DTO/VO规范

```java
// DTO: 用于接收请求参数
@Data
public class CreateOrderRequest {

    @NotNull(message = "顾客微信名不能为空")
    private String wechatNickname;

    @NotEmpty(message = "商品明细不能为空")
    private List<OrderItemDTO> items;

    @NotNull(message = "实收金额不能为空")
    @DecimalMin(value = "0", message = "实收金额不能为负数")
    private BigDecimal orderTotal;

    // ... 其他字段
}

// VO: 用于返回响应数据
@Data
public class OrderVO {

    private Long id;
    private String orderNo;
    private String wechatNickname;
    private String itemsSummary;  // 商品摘要(前端展示用)
    private BigDecimal orderTotal;
    private String statusText;    // 状态文本(前端展示用)
    private String createdAtText; // 格式化时间(前端展示用)

    // 转换方法
    public static OrderVO fromEntity(Order order) {
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        // ... 其他字段映射
        return vo;
    }
}
```

### 4.2 前端代码规范

#### 4.2.1 目录规范

```
src/
├── api/              # API接口 (每个模块一个文件)
├── views/            # 页面组件 (按模块分组)
├── components/       # 公共组件 (按功能命名)
├── stores/           # Pinia状态 (按模块命名)
├── utils/            # 工具函数
└── assets/           # 静态资源
```

#### 4.2.2 组件规范

```vue
<!-- 组件名: PascalCase, 文件名: kebab-case -->
<!-- OrderList.vue -->

<template>
  <div class="order-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>订单列表</h2>
      <el-button type="primary" @click="handleCreate">
        新增订单
      </el-button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="订单状态">
        <el-option label="全部" value="" />
        <el-option label="待接单" value="pending" />
        <el-option label="制作中" value="preparing" />
        <!-- ... -->
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column prop="orderNo" label="订单编号" width="180" />
      <el-table-column prop="wechatNickname" label="顾客" width="120" />
      <el-table-column prop="itemsSummary" label="商品" min-width="200" />
      <el-table-column prop="orderTotal" label="金额" width="100" align="right">
        <template #default="{ row }">
          ¥{{ row.orderTotal }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">
            查看
          </el-button>
          <el-button link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrderList } from '@/api/order'
import { getStatusText, getStatusType } from '@/utils/constants'

// 筛选条件
const filters = reactive({
  status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status,
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1]
    }
    const res = await getOrderList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 操作处理
const handleCreate = () => { /* ... */ }
const handleView = (row) => { /* ... */ }
const handleEdit = (row) => { /* ... */ }

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.order-list {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
    }
  }

  .filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
```

#### 4.2.3 API接口规范

```javascript
// api/order.js
import request from '@/utils/request'

// 获取订单列表
export function getOrderList(params) {
  return request({
    url: '/api/orders',
    method: 'get',
    params
  })
}

// 获取订单详情
export function getOrderDetail(id) {
  return request({
    url: `/api/orders/${id}`,
    method: 'get'
  })
}

// 创建订单
export function createOrder(data) {
  return request({
    url: '/api/orders',
    method: 'post',
    data
  })
}

// 更新订单
export function updateOrder(id, data) {
  return request({
    url: `/api/orders/${id}`,
    method: 'put',
    data
  })
}

// 删除订单
export function deleteOrder(id) {
  return request({
    url: `/api/orders/${id}`,
    method: 'delete'
  })
}

// 更新订单状态
export function updateOrderStatus(id, status) {
  return request({
    url: `/api/orders/${id}/status`,
    method: 'put',
    data: { status }
  })
}
```

#### 4.2.4 工具函数规范

```javascript
// utils/constants.js

// 订单状态
export const ORDER_STATUS = {
  pending: { text: '待接单', type: 'info' },
  preparing: { text: '制作中', type: 'warning' },
  waiting_pickup: { text: '待取餐', type: 'warning' },
  delivering: { text: '配送中', type: 'primary' },
  delivered: { text: '已送达', type: 'success' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'danger' }
}

// 客户等级
export const CUSTOMER_LEVEL = {
  normal: { text: '普通', color: '#909399' },
  regular: { text: '常客', color: '#409EFF' },
  vip: { text: 'VIP', color: '#E6A23C' },
  svip: { text: 'SVIP', color: '#F56C6C' }
}

// 配送方式
export const DELIVERY_METHOD = {
  self: '自送',
  sf: '顺丰同城',
  other: '其他'
}

// 支付状态
export const PAYMENT_STATUS = {
  paid: '已支付',
  unpaid: '未支付',
  refunded: '已退款'
}

// 获取状态文本
export function getStatusText(status) {
  return ORDER_STATUS[status]?.text || status
}

// 获取状态类型
export function getStatusType(status) {
  return ORDER_STATUS[status]?.type || 'info'
}

// 获取等级文本
export function getLevelText(level) {
  return CUSTOMER_LEVEL[level]?.text || level
}

// 格式化金额
export function formatPrice(price) {
  return `¥${parseFloat(price || 0).toFixed(2)}`
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}
```

---

## 5. 开发计划

### 5.1 Phase 1: MVP开发 (2-3周)

#### 第1周: 基础架构

| 任务 | 负责人 | 状态 | 说明 |
|------|--------|------|------|
| 项目初始化 (Vue + Spring Boot) | | TODO | |
| 数据库表结构创建 | | TODO | |
| 用户登录/权限基础 | | TODO | |
| 公共组件封装 | | TODO | |

**交付物:**
- [ ] 项目框架搭建完成
- [ ] 数据库脚本执行成功
- [ ] 登录功能可用

#### 第2周: 核心功能开发

| 任务 | 负责人 | 状态 | 说明 |
|------|--------|------|------|
| 顾客管理 (CRUD + 标签) | | TODO | |
| 订单录入 + 列表 | | TODO | |
| 订单状态流转 | | TODO | |
| 配送状态管理 | | TODO | |

**交付物:**
- [ ] 顾客增删改查可用
- [ ] 订单增删改查可用
- [ ] 订单状态可正常流转

#### 第3周: 完善和测试

| 任务 | 负责人 | 状态 | 说明 |
|------|--------|------|------|
| 数据概览页面 | | TODO | |
| 筛选和搜索功能 | | TODO | |
| 基础统计功能 | | TODO | |
| 本地测试 + Bug修复 | | TODO | |
| 文档完善 | | TODO | |

**交付物:**
- [ ] 数据概览可用
- [ ] 所有功能通过测试
- [ ] 部署文档完成

### 5.2 Phase 2: 运营增强 (2-3周)

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 订单统计报表 | P0 | 日/周/月报 |
| 顾客消费分析 | P0 | 复购率/高价值顾客 |
| 筛选和导出 | P1 | 订单/顾客导出Excel |
| 菜品管理 | P1 | 菜品增删改 |
| 预订单功能 | P2 | 预约时间下单 |

### 5.3 Phase 3: 迭代优化 (待定)

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 微信消息提醒 | P2 | 订单状态变更通知 |
| 优惠卷系统 | P2 | 优惠券发放核销 |
| 更多统计维度 | P1 | 菜品销量/配送分析 |

---

## 6. 部署与升级方案

### 6.1 开发环境

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 开发时使用,用户不需要 |
| electron-builder | 最新 | 打包工具 |

**用户运行环境:** 仅需 Windows 10+, 不需要安装任何其他软件。

### 6.2 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 开发模式 (热重载)
npm run dev
# 自动打开浏览器 http://localhost:5173

# 3. 打包
npm run build:win
```

### 6.3 首次安装

```
1. 下载 MalaJi-Setup-1.x.x.exe
2. 双击运行
3. 选择安装目录 (默认 C:\Program Files\MalaJi\)
4. 完成安装
5. 桌面出现快捷方式
6. 双击快捷方式启动
```

**首次安装后的目录:**
```
C:\Program Files\MalaJi\        # 程序目录 (可升级)
└── MalaJi.exe
└── ...

%APPDATA%\MalaJi\              # 用户数据目录 (永不升级)
└── data\
│   └── malaji.db              # SQLite数据库
└── logs\
│   └── app.log
└── config\
    └── settings.json
```

### 6.4 升级流程 (离线拷贝)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    离线升级流程 (直接拷贝)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Step 1: 获取新版本安装包                                           │
│  - 开发者打包: npm run build:win                                   │
│  - 生成文件: dist/MalaJi-Setup-1.2.0.exe                          │
│  - 通过U盘/局域网/任何方式拷贝到目标机器                             │
│                                                                       │
│  Step 2: 安装新版本                                                 │
│  - 关闭当前正在运行的应用 ⚠️ 重要!                                 │
│  - 双击新安装包                                                     │
│  - 安装程序检测到已安装版本 → 询问保留数据                          │
│  - 点击 [下一步],保留所有用户数据                                    │
│                                                                       │
│  Step 3: 完成升级                                                   │
│  - 程序目录更新: C:\Program Files\MalaJi\                           │
│  - 数据目录不变: %APPDATA%\MalaJi\                                  │
│  - 打开应用,一切数据完好                                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.5 升级检查清单

```
升级前检查:
□ 关闭当前正在运行的应用
□ 确认有旧版本数据备份 (可选,推荐)

升级步骤:
□ 双击新版本安装包
□ 选择 [保留用户数据] (默认选项)
□ 等待安装完成
□ 打开应用验证

验证清单:
□ 所有订单数据完整
□ 所有顾客数据完整
□ 设置保留正常
□ 无报错信息
```

### 6.6 回滚操作

```
如果升级后出现问题:

方法1: 重新安装旧版本
1. 卸载当前版本 (不删除用户数据)
2. 使用旧版本安装包重新安装
3. 数据不受影响

方法2: 手动替换程序文件 (紧急)
1. 关闭应用
2. 用旧版 MalaJi.exe 覆盖 C:\Program Files\MalaJi\MalaJi.exe
3. 重启应用
```

### 6.7 数据备份与迁移

```
备份操作 (定期,推荐每月一次):
1. 打开: %APPDATA%\MalaJi\
2. 复制整个 data 文件夹到安全位置
3. 例如: copy "%APPDATA%\MalaJi\data" "D:\备份\MalaJi_data_日期"

迁移到新电脑:
1. 在新电脑安装应用
2. 关闭应用
3. 复制旧电脑的 %APPDATA%\MalaJi\data 到新电脑对应目录
4. 覆盖同名文件
5. 启动应用,数据迁移完成
```

---

## 7. 注意事项 (修订版)

### 7.1 安全建议

| 措施 | 说明 |
|------|------|
| SQLite | 内置防SQL注入 |
| 数据存储 | 本地文件,无云端泄露风险 |
| 密码 | BCrypt加密存储 |
| XSS | Vue自动防护 |
| 自动更新 | HTTPS校验,防止篡改 |

### 7.2 性能建议

| 指标 | 评估 |
|------|------|
| SQLite性能 | <50单/天 完全够用 |
| 索引 | 已为常用查询创建索引 |
| 分页 | 列表查询限制最大100条 |
| 数据量 | SQLite支持10万+订单无压力 |

### 7.3 数据安全保障

```
┌─────────────────────────────────────────────────────────────────────┐
│                     数据安全保障机制                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. 物理隔离                                                        │
│     - 程序目录: C:\Program Files\MalaJi\ (可写,可升级)              │
│     - 数据目录: %APPDATA%\MalaJi\ (永不升级时触碰)                   │
│                                                                       │
│  2. 升级机制保障                                                     │
│     - electron-updater 只替换 Program Files 下的文件                │
│     - AppData目录 完全不受影响                                        │
│                                                                       │
│  3. 回滚能力                                                         │
│     - 可安装任意旧版本                                               │
│     - 数据向前兼容                                                    │
│                                                                       │
│  4. 备份机制                                                         │
│     - 升级前建议手动备份                                              │
│     - .db文件 复制即可备份                                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 附录

### 8.1 开发工具推荐

| 工具 | 用途 |
|------|------|
| VS Code | 开发IDE |
| Git | 版本控制 |
| SQLite Viewer (Chrome插件) | 查看数据库 |
| Electron DevTools | 调试 |

---

## 9. Oracle 审核记录

### 9.1 审核时间
- 审核日期: 2025-07-29
- 审核人: Oracle

### 9.2 审核意见摘要

**问题1: 技术栈过重**
- 原方案使用 Spring Boot + MySQL 8.0 + JDK 17 + Maven
- 非技术用户需要安装5-6个软件才能运行
- Oracle建议: 改用 Electron + SQLite 轻量方案

**问题2: 数据库选型不当**
- MySQL 对于 <50单/天 完全不需要
- MySQL Windows 安装复杂,需配置端口/密码/字符集
- Oracle建议: 改用 SQLite,零配置,单文件

**问题3: 架构过于企业化**
- 使用 Spring Security + JWT 认证
- 7张表 + 30+ API
- 对于单用户系统完全过度设计
- Oracle建议: 简化架构,去掉复杂认证

**问题4: 升级迭代机制不明确**
- 原方案未考虑升级流程
- 如果重新安装会丢失数据
- Oracle建议: 程序与数据分离 + 离线升级

**问题5: 在线更新不符合用户场景**
- 用户实际场景是离线环境
- 直接拷贝exe到目标机器更新
- Oracle建议: 离线升级方案,直接拷贝安装包

### 9.3 修订内容

| 项目 | 原方案 | 修订方案 |
|------|--------|----------|
| 桌面框架 | Web应用 | Electron (exe) |
| 数据库 | MySQL 8.0 | SQLite 3 |
| ORM | MyBatis-Plus | better-sqlite3 |
| 认证 | Spring Security + JWT | 简化为单用户 |
| 打包 | Maven + npm分开 | electron-builder |
| 用户安装 | JDK+MySQL+Node等5个 | 仅需exe |
| 升级方式 | 在线自动下载 | 离线拷贝安装包 |
| 数据安全 | 可能丢失 | %APPDATA% 隔离存储 |

### 9.4 修订后优势

1. **零配置**: 用户双击exe即可使用
2. **单文件数据库**: SQLite无需安装
3. **一键打包**: electron-builder生成exe
4. **轻松迁移**: 复制.db文件即可
5. **适合规模**: <50单/天完全够用
6. **安全升级**: 数据与程序分离,升级不碰数据
7. **离线升级**: 直接拷贝安装包,无需网络

### 9.5 风险提示

| 风险 | 评估 | 应对 |
|------|------|------|
| 数据量增长 | SQLite支持10万+订单 | 届时可迁移到MySQL |
| 多用户并发 | 仅支持单用户 | 预留扩展接口 |
| 大文件处理 | Electron内存限制 | 不处理大文件业务 |
| 升级中断 | 拷贝到一半断了 | 重新拷贝,不覆盖正在运行的文件 |
| 误删数据 | 用户手动删除 | 定期备份习惯 |

