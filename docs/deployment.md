# 运营平台部署指南

## 环境要求

- **Node.js 22.5 或更高版本**（必须）
  - 检查版本：`node --version`
  - 低于 22.5 需升级：https://nodejs.org/

## 项目结构

```
yunying_platform/
├── server/          # 后端代码
├── src/renderer/    # 前端源码
├── dist/            # 构建产物（已构建时存在）
├── scripts/         # 启动脚本（Windows .bat）
├── package.json     # 依赖配置
└── vite.config.js   # Vite 配置
```

> 注意：不要拷贝 `node_modules/` 和 `scripts/logs/`，新电脑重新安装即可。

## 安装与启动

### Windows（推荐）

1. 双击 `scripts/start.bat`
2. 脚本会自动检测并完成：
   - Phase A：安装依赖（首次或缺失时）
   - Phase B：预检端口占用
   - Phase C：启动后端 + 前端

### Mac / Linux 或手动启动

```bash
# 安装依赖
npm install

# 启动（后端 3000 + 前端 5173 同时运行）
npm start
```

### 分开启动（可选）

```bash
# 终端 1：后端
npm run server

# 终端 2：前端
npm run dev
```

## 访问

打开浏览器访问 **http://localhost:5173**

## 数据存储

SQLite 数据库文件位置由 server/index.js 中的 `userDataPath` 决定，Windows 默认在：

```
%APPDATA%\huangxiaoshuai\data\
```

## 快速命令

| 操作 | 命令 |
|------|------|
| 启动（Windows） | 双击 `scripts/start.bat` |
| 安装依赖 | `npm install` |
| 同时启动前后端 | `npm start` |
| 只启动后端 | `npm run server` |
| 只启动前端 | `npm run dev` |
| 构建前端 | `npm run build` |
| 停止服务（Windows） | 双击 `scripts/stop.bat` |

## 常见问题

**Q: start.bat 提示"端口 3000/5173 已被占用"**
A: 先双击 `scripts/stop.bat` 停止现有服务，再重新 start。

**Q: Node 版本低于 22.5**
A: 升级 Node.js 到 22.5+。node:sqlite 是 Node.js 内置实验性模块，旧版本不支持。

**Q: 启动后浏览器访问空白**
A: 确保后端（3000）和前端（5173）都已正常启动，观察 start.bat 窗口的输出日志。

**Q: 数据库文件在哪**
A: Windows 在 `%APPDATA%\huangxiaoshuai\data\`，Mac/Linux 需在 server/index.js 中确认路径逻辑。
