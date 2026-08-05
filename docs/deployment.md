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
# 双击运行 scripts/pm2-autostart.bat
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

项目根目录下的 `scripts/` 目录提供了几个辅助脚本：

| 脚本 | 说明 |
|------|------|
| `scripts/start.bat` | 一键启动前后端服务 |
| `scripts/stop.bat` | 停止所有服务 |
| `scripts/status.bat` | 查看服务状态 |
| `scripts/update.bat` | 更新代码后重启 |
| `scripts/pm2-autostart.bat` | 配置 PM2 开机自启（双击运行） |

---

## PM2 开机自启配置（推荐）

配置后每次开机自动启动，浏览器直接访问 http://localhost:5173，无需手动操作。

### 工作原理

1. `npm run pm2:start` 启动两个进程：`huang-server`（后端 3000）和 `huang-frontend`（前端 5173）
2. `pm2 save` 保存当前运行的进程列表
3. `pm2-autostart.bat` 在 Windows 启动文件夹生成一个 `.bat` 文件
4. 用户登录后 Windows 自动执行该 `.bat`，调用 `pm2 resurrect` 恢复保存的进程

### 完整步骤

```bash
# 1. 安装并启动服务
npm install
npm run pm2:start

# 2. 双击运行 scripts/pm2-autostart.bat
#    - 会执行 pm2 save
#    - 会在启动文件夹生成 start-huang-pm2.bat
#    - 看到 [OK] 表示成功

# 3. 重启电脑验证
#    开机后等 5-10 秒，访问 http://localhost:5173
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
| 保存进程列表 | `npx pm2 save` |
| 从保存列表恢复 | `npx pm2 resurrect` |

### 取消开机自启

1. 删除启动文件夹里的 `start-huang-pm2.bat` 文件（路径：`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`）
2. 运行 `npm run pm2:delete` 删除 PM2 进程

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
| 配置开机自启 | 双击 `scripts/pm2-autostart.bat` |
| 停止服务 | `npm run pm2:stop` 或双击 `scripts/stop.bat` |
| 构建前端 | `npm run build` |

---

## 常见问题

**Q: start.bat / PM2 提示"端口 3000/5173 已被占用"**
A: 先 `npm run pm2:stop` 或双击 `scripts/stop.bat` 停止现有服务。

**Q: Node 版本低于 22.5**
A: 升级 Node.js 到 22.5+。node:sqlite 是 Node.js 内置实验性模块，旧版本不支持。

**Q: pm2-autostart.bat 闪退（窗口关闭看不到输出）**
A: 用文本编辑器（如 VSCode）打开 `scripts/pm2-autostart.bat` 检查文件内容，确保是 ASCII 编码（无 BOM），并且每行没有损坏的字符。也可以直接用管理员权限运行 PowerShell 执行命令。

**Q: 配置了开机自启但重启后服务没起来**
A: 排查步骤：
1. 打开 `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`，确认 `start-huang-pm2.bat` 存在
2. 打开该文件检查内容——**重点看第 3 行 `call` 命令的路径**：必须是**项目的绝对路径**（如 `E:\workspace\yunying_platform\node_modules\.bin\pm2.cmd`），不能是相对路径（如 `%~dp0..`）
3. 在项目目录下手动运行该 `.bat` 看是否报错

**Q: Git clone 后如何同步更新**
A: 在项目目录下运行 `git pull`，然后 `npm run pm2:restart` 重启服务即可。

**Q: 数据库文件在哪**
A: Windows 在 `%APPDATA%\huangxiaoshuai\data\`，Mac/Linux 在 `~/.huangxiaoshuai/data/`。

**Q: 新电脑部署时怎么避免路径错误**
A: 项目路径建议用**纯英文无空格**（如 `E:\workspace\yunying_platform`），不要放在 `C:\Program Files\` 这种带空格的目录下。