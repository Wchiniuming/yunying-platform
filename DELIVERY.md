# 黄小帅麻辣鸡外卖订单管理平台 — 交付文档

> **给接手用户的快速指南**：从零安装 → 启动 → 使用 → 测试，全程大约 10 分钟。

---

## 1. 系统要求

| 依赖 | 版本要求 | 说明 |
|---|---|---|
| **Node.js** | **22.5 或更高**（推荐 LTS 22.x） | 项目使用 Node 22.5+ 内置的 `node:sqlite` |
| npm | 随 Node 一起安装 | 包管理工具 |
| 操作系统 | Windows 10/11（也支持 macOS/Linux，但脚本为 Windows 优化） | |
| 磁盘空间 | ~500 MB（含依赖） | |
| 内存 | ≥ 2 GB | |

> **重要**：必须使用 Node 22.5+，因为项目使用内置的 `node:sqlite` 模块（替代旧的 better-sqlite3）。低版本会启动失败。

### 如何检查 Node 版本

```powershell
node --version
```

应该显示 `v22.x` 或更高。如果版本低或没装：

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（22.x）
3. 双击安装包，一路 Next
4. 重启 PowerShell，再运行 `node --version` 确认

---

## 2. 快速开始（5 步）

### 第 1 步：解压项目
将项目 ZIP 解压到任意目录（**避免中文路径**），例如：
```
C:\apps\yunying_platform\
```

> **如果是升级而不是首次安装**：见 `UPDATE.md`（迭代更新指南）。
> 原则：**永远不触碰数据库** `%APPDATA%\huangxiaoshuai\data\huangxiaoshuai.db`。
>
> **打包注意**：所有 `.bat` 脚本必须以 **UTF-8 with BOM** 编码保存。
> Windows cmd 用 BOM 识别 UTF-8 才能正确显示中文，否则会把乱码当命令执行。
> 大多数压缩工具默认保留 BOM，但若发现脚本乱码，用记事本"另存为" → 编码选 UTF-8（含 BOM）即可。

### 第 2 步：安装依赖
**双击运行** `scripts\install.bat`

或 PowerShell：
```powershell
cd C:\apps\yunying_platform
.\scripts\install.bat
```

该脚本会：
- 检查 Node 版本（≥22.5）
- 安装所有 npm 依赖
- 第一次启动 server 让它创建 SQLite 数据库与默认账号

预计耗时：1-3 分钟（取决于网络）。

### 第 3 步：启动服务
**双击运行** `scripts\start.bat`

或 PowerShell：
```powershell
.\scripts\start.bat
```

该脚本会：
- 在后台启动后端 API 服务（端口 3000）
- 在后台启动前端开发服务（端口 5173）
- 两个进程都**不依赖 cmd 窗口**——关掉黑色窗口后服务仍在跑
- 日志输出到 `logs/` 目录

启动成功后会显示：
```
后端启动成功 http://localhost:3000
前端启动成功 http://localhost:5173
打开浏览器访问 http://localhost:5173
```

### 第 4 步：访问系统
浏览器打开：**http://localhost:5173**

### 第 5 步：登录
- **账号**：`admin`
- **密码**：`admin123`

> ⚠️ **生产部署务必修改密码**（系统设置 → 修改密码）

---

## 3. 目录结构

```
yunying_platform/
├── DELIVERY.md            # 本文档（首次部署）
├── UPDATE.md              # 迭代升级指南（升级时必读）
├── scripts/               # Windows 启动/维护脚本
│   ├── install.bat        # 首次部署：装依赖、建库
│   ├── update.bat         # 升级：装依赖、跑 schema 迁移（不碰数据）
│   ├── start.bat          # 启动服务（后台，不依赖 cmd 窗口）
│   ├── stop.bat           # 停止服务
│   ├── status.bat         # 查看服务状态
│   └── run-tests.bat      # 跑 API 测试套件
│
├── server/                # 后端（Node.js + Express + SQLite）
│   └── index.js
│
├── src/renderer/          # 前端（Vue 3 + Vite + Element Plus）
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   ├── api/               # API 客户端
│   ├── router/            # 路由
│   └── ...
│
├── tests/                 # 测试套件（101 个 API 用例）
│   ├── api/
│   ├── e2e/
│   └── helpers/
│
├── logs/                  # 服务运行日志（自动创建）
│
├── package.json
├── vite.config.js
└── README.md
```

---

## 4. 端口说明

| 端口 | 用途 | 谁访问 |
|---|---|---|
| **3000** | 后端 API 服务（Express） | 浏览器通过 Vite 代理间接访问 |
| **5173** | 前端开发服务（Vite dev） | 浏览器直接打开 |
| 13901-13909 | 测试用隔离端口 | 仅 `tests/` 内部使用 |

如果 3000 或 5173 端口被占用：
- 修改 `vite.config.js` 中的 `server.port`
- 修改 `server/index.js` 中 `const PORT = process.env.PORT || 3000`（或设置环境变量 `PORT`）

---

## 5. 数据存储

SQLite 数据库文件位于：
```
Windows:  C:\Users\<你的用户名>\AppData\Roaming\huangxiaoshuai\data\huangxiaoshuai.db
```

首次启动时自动创建。**备份此文件即可备份所有数据**。

数据表（8 张）：顾客、订单、订单状态日志、商品、标签、用户、设置、顾客标签关联。

---

## 6. 常用操作

### 查看服务状态
**双击 `scripts\status.bat`**

### 停止所有服务
**双击 `scripts\stop.bat`**

### 查看日志
```powershell
# 实时查看后端日志
Get-Content logs\server.log -Wait

# 实时查看前端日志
Get-Content logs\frontend.log -Wait

# 或者直接用记事本打开
notepad logs\server.log
```

### 修改端口
通过环境变量（PowerShell）：
```powershell
$env:PORT=4000
.\scripts\start.bat
```

### 数据备份
直接复制 DB 文件：
```powershell
Copy-Item "$env:APPDATA\huangxiaoshuai\data\huangxiaoshuai.db" "C:\backup\huangxiaoshuai-$(Get-Date -Format yyyyMMdd).db"
```

### 重置数据库（清空所有数据）
```powershell
Remove-Item "$env:APPDATA\huangxiaoshuai\data\huangxiaoshuai.db"
.\scripts\start.bat
```
下次启动会重建空数据库 + 默认 admin 账号 + 示例数据。

---

## 7. 测试

### 一键运行测试
**双击 `scripts\run-tests.bat`**

或 PowerShell：
```powershell
.\scripts\run-tests.bat
```

会自动跑 **116 个测试用例**（28 个后端端点全覆盖）。预期全绿。

输出样例：
```
=== P0-2 Auth (2 endpoints) ===
  ✓ 登录：正确账号返回 200 + 用户信息
  ✓ 登录：错误密码返回 401
  ...
  → 12 passed, 0 failed
```

### 查看测试报告
测试相关文档：
- `tests/README.md` — 测试套件说明
- `tests/P6_REPORT.md` — 完整 BUG 修复报告

---

## 8. 故障排查

### 服务起不来 / 端口占用
```powershell
# 查看谁占用 3000
netstat -ano | findstr :3000
# 用 PID 杀进程（替换 12345）
taskkill /F /PID 12345

# 或用脚本
.\scripts\stop.bat
.\scripts\start.bat
```

### npm install 失败
1. 检查 Node 版本：`node --version`
2. 删除 `node_modules` 和 `package-lock.json`，重新 `npm install`
3. 检查网络：能否访问 https://registry.npmjs.org/

### 浏览器打开 5173 是空白
1. 看 `logs\frontend.log` 是否有 vite 报错
2. 看 `logs\server.log` 后端是否启动
3. 访问 http://localhost:3000/api/app/info 应返回 JSON

### 数据库锁死 / 损坏
```powershell
# 删除并重建（数据会丢失！）
Remove-Item "$env:APPDATA\huangxiaoshuai\data\huangxiaoshuai.db*"
.\scripts\start.bat
```

### 中文显示乱码
PowerShell 终端默认 GBK 编码。运行 `chcp 65001` 切到 UTF-8。

---

## 9. 功能模块

| 模块 | 路由 | 说明 |
|---|---|---|
| 仪表板 | `/dashboard` | 当日订单、营收、待办、新顾客 |
| 订单管理 | `/orders` | 订单列表 + 详情 + 创建 |
| 顾客管理 | `/customers` | 顾客档案 + 消费统计 |
| 配送 | `/delivery` | 待取餐、配送中、当日送达 |
| 商品 | `/products` | 菜单 CRUD |
| 设置 | `/settings` | 店铺信息、改密码 |

---

## 10. 技术栈

- **后端**：Node.js + Express + SQLite（内置 `node:sqlite`）
- **前端**：Vue 3 + Vite + Element Plus + Pinia + Vue Router + ECharts
- **数据库**：SQLite（单文件，零配置）
- **测试**：自研 Node 测试框架（101 个用例）

---

## 11. 默认账号

| 账号 | 密码 | 角色 | 来源 |
|---|---|---|---|
| `admin` | `admin123` | 管理员 | 首次启动自动 seed（SHA-256 加密存储） |

修改密码：登录 → 设置 → 修改密码。

---

## 12. 安全提示（生产部署必读）

1. **立即修改 admin 默认密码**
2. 不要把项目暴露到公网直接访问（建议 nginx 反代 + HTTPS）
3. 定期备份 SQLite 数据库文件
4. 当前 API 无鉴权（所有 `/api/*` 任何人都能调用），生产部署必须加 nginx basic auth 或前置鉴权代理

---

## 13. 联系 / 支持

- 项目源码：见仓库根目录
- 测试报告：`tests/README.md`
- BUG 历史：`tests/P6_REPORT.md`
- API 端点清单：28 个，详见 `server/index.js`

---

## 附录：脚本一览（位于 `scripts/` 子目录）

| 脚本 | 用途 | 是否需要管理员权限 |
|---|---|---|
| `scripts\install.bat` | 首次部署安装 | 否 |
| `scripts\update.bat` | 升级（保留数据） | 否 |
| `scripts\start.bat` | 启动服务（后台） | 否 |
| `scripts\stop.bat` | 停止服务 | 否 |
| `scripts\status.bat` | 查看状态 | 否 |
| `scripts\run-tests.bat` | 跑测试套件 | 否 |

> **脚本会自动定位项目根目录**：脚本放在 `scripts/` 子目录时，内部用 `%~dp0..\` 解析项目根，无论用户从哪一层调用都能正确找到 `server/`、`package.json` 等。

所有脚本**不依赖 cmd 窗口保持打开**——双击运行后即可关闭黑窗口。