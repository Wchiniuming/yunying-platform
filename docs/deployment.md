# 运营平台部署指南

## 环境要求

- **Node.js 22.5 或更高版本**（必须）
  - 检查版本：`node --version`
  - 低于 22.5 需升级：https://nodejs.org/

---

## 方式一：Git Clone（推荐）

适合新电脑首次部署，直接从 GitHub 拉取最新代码。

### 第一步：克隆项目

```bash
git clone git@github.com:Wchiniuming/yunying-platform.git
cd yunying-platform
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：启动服务（二选一）

**方式 A：手动模式（每次需手动启动）**
```bash
npm start
```

**方式 B：PM2 模式（推荐，配置后开机自启）**
```bash
# 启动服务
npm run pm2:start

# 配置开机自启（只需执行一次）
npm run pm2:setup
# 按提示在【管理员】PowerShell 中运行输出的命令

# 保存当前进程列表
npx pm2 save
```

---

## 方式二：直接拷贝（备用）

适合内网隔离或网络不便的环境。

1. 拷贝整个项目文件夹到新电脑
2. 确保 Node.js ≥ 22.5
3. `npm install`
4. `npm start` 或 `npm run pm2:start`

> 注意：不要拷贝 `node_modules/`、`scripts/logs/`、`.sisyphus/` 目录

---

## 启动脚本说明（Windows）

项目根目录下的 `scripts/start.bat` 可直接双击启动，自动完成端口检测和依赖安装。

| 脚本 | 说明 |
|------|------|
| `scripts/start.bat` | 一键启动前后端服务 |
| `scripts/stop.bat` | 停止所有服务 |
| `scripts/status.bat` | 查看服务状态 |
| `scripts/update.bat` | 更新代码后重启 |

---

## PM2 开机自启配置（推荐）

配置后每次开机自动启动，浏览器直接访问 http://localhost:5173，无需手动操作。

### 完整步骤

```bash
# 1. 安装并启动服务
npm install
npm run pm2:start

# 2. 配置开机自启（只需执行一次）
# 这条命令会输出一段 PowerShell 命令，需在管理员 PowerShell 中运行
npm run pm2:setup

# 3. 保存当前进程列表
npx pm2 save
```

### PM2 常用命令

| 操作 | 命令 |
|------|------|
| 启动服务 | `npm run pm2:start` |
| 停止服务 | `npm run pm2:stop` |
| 重启服务 | `npm run pm2:restart` |
| 查看状态 | `npm run pm2:status` |
| 查看日志 | `npm run pm2:logs` |
| 删除进程 | `npm run pm2:delete` |
| 配置开机自启 | `npm run pm2:setup` |

### PM2 工作原理

- `pm2 start` 启动两个进程：`huang-server`（后端 3000）和 `huang-frontend`（前端 5173）
- `pm2 save` 保存当前运行的进程列表
- 开机时 PM2 自动恢复保存的进程列表
- 进程崩溃时 PM2 自动重启（带指数退避策略）

### 取消开机自启

```bash
# 删除 PM2 进程
npm run pm2:delete

# 注销开机自启（在管理员 PowerShell 中运行）
npx pm2 unstartup
```

---

## 访问

打开浏览器访问 **http://localhost:5173**

---

## 数据存储

SQLite 数据库文件位置，Windows 默认在：

```
%APPDATA%\huangxiaoshuai\data\
```

Mac/Linux 在 `~/.huangxiaoshuai/data/`。

---

## 快速命令汇总

| 操作 | 命令 |
|------|------|
| Git Clone 方式安装 | `git clone ... && cd ... && npm install` |
| 手动模式启动 | `npm start` |
| PM2 模式启动 | `npm run pm2:start` |
| PM2 开机自启 | `npm run pm2:setup` + `npx pm2 save` |
| 停止服务 | `npm run pm2:stop` 或双击 `scripts/stop.bat` |
| 构建前端 | `npm run build` |

---

## 常见问题

**Q: start.bat / PM2 提示"端口 3000/5173 已被占用"**
A: 先 `npm run pm2:stop` 或双击 `scripts/stop.bat` 停止现有服务。

**Q: Node 版本低于 22.5**
A: 升级 Node.js 到 22.5+。node:sqlite 是 Node.js 内置实验性模块，旧版本不支持。

**Q: PM2 开机自启不生效**
A: 确认步骤二以管理员身份运行了 `pm2 setup` 的输出命令，并执行了 `pm2 save`。

**Q: Git clone 后如何同步更新**
A: 在项目目录下运行 `git pull`，然后 `npm run pm2:restart` 重启服务即可。

**Q: 数据库文件在哪**
A: Windows 在 `%APPDATA%\huangxiaoshuai\data\`，Mac/Linux 在 `~/.huangxiaoshuai/data/`。
