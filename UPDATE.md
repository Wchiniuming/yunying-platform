# 平台迭代更新指南

> **给开发者 / 二次开发者**：交付新版本给用户时，用户如何正确升级，**不影响数据库**。

---

## 升级原则

> **永远不触碰数据库文件**。

SQLite 数据库（`%APPDATA%\huangxiaoshuai\data\huangxiaoshuai.db`）是**用户私有数据**。升级时只需替换代码，**绝对不要**让升级脚本修改、覆盖或重置数据库。

---

## 用户侧：升级步骤

### 方法一：一键升级（推荐）

**收到新版本后**：

1. **先停止服务**（避免文件被占用）：
   ```powershell
   .\scripts\stop.bat
   ```

2. **解压新版本覆盖**到原目录（覆盖时**保留**）：
   - `package.json`（覆盖，新依赖会被 install 安装）
   - `server/`、`src/`、`tests/`、`scripts/`、`DELIVERY.md`、`UPDATE.md`
   - `.env`、`*.local`（如果用户有自定义配置）
   - 你的个人笔记、截图等

   **绝对不要覆盖的文件**：
   - 任何 `.db` 文件
   - 任何 `.env` 文件（除非你主动修改过并要分发新版）
   - 用户自己加的脚本/数据

3. **运行升级脚本**（自动处理依赖、迁移）：
   ```powershell
   .\scripts\update.bat
   ```

4. **启动新版本**：
   ```powershell
   .\scripts\start.bat
   ```

> **整个过程数据库零修改**。如果新版本需要修改表结构（比如加字段），由 server 启动时**自动迁移**（`ALTER TABLE` 是 idempotent 的）。

---

### 方法二：手动升级

```powershell
.\scripts\stop.bat
# 备份当前版本（可选）
Copy-Item . ..\yunying_platform.bak -Recurse -Exclude node_modules,logs,tests\.test-data

# 解压新版本覆盖
Expand-Archive .\new-version.zip -DestinationPath . -Force

# 更新依赖
npm install

# 启动（首次启动会跑 schema 迁移）
.\scripts\start.bat
```

---

## 开发者侧：发布新版本清单

每次发布新版本，按这个清单打包：

### 必须包含

```
yunying_platform/
├── DELIVERY.md            # 首次部署文档
├── UPDATE.md              # 本文件（迭代指南）
├── scripts/               # 启动/升级/测试脚本
│   ├── install.bat
│   ├── update.bat         # ← 新增
│   ├── start.bat
│   ├── stop.bat
│   ├── status.bat
│   └── run-tests.bat
├── package.json           # 新依赖版本
├── server/                # 后端代码
├── src/renderer/          # 前端代码
├── tests/                 # 测试套件
├── vite.config.js
└── index.html
```

### 必须**排除**（打 zip 时不要包含）

```
node_modules/              # 用户自己 npm install
logs/                      # 用户运行时生成
tests/.test-data/          # 测试产物
dist/                      # build 产物
.env / .env.local          # 用户私有配置
*.db / *.db-*              # 数据库
*.log                      # 日志
.sisyphus/                 # 开发工具
.git/                      # git 历史
```

### 推荐：发版前自检

```powershell
# 在干净环境测试
Remove-Item node_modules -Recurse -Force
npm install
.\scripts\run-tests.bat    # 必须 116/116 全绿
```

---

## 数据库 schema 变更的正确做法

当新版本需要加字段时：

### 推荐的 server 端写法（idempotent migration）

在 `server/index.js` 的 `initTables()` 末尾添加：

```js
// 兼容旧库：补齐某字段（已存在则忽略）
const customerCols = db.prepare("PRAGMA table_info(customers)").all()
if (!customerCols.some(c => c.name === 'new_field')) {
  db.exec(`ALTER TABLE customers ADD COLUMN new_field TEXT`)
}
```

**示例**：本项目 `order_status_log` 加 `action` 列已用此模式（见 `server/index.js` line 148）。

### ❌ 不要这样做

- 不要让用户手动跑 SQL
- 不要修改 `CREATE TABLE` 语句（已存在的库不会自动重建）
- 不要在升级脚本里 `DROP TABLE` 或 `DELETE FROM`
- 不要在启动时强制 `INSERT OR REPLACE` 业务数据

---

## 升级脚本示例（`scripts/update.bat`）

> 见 `scripts/update.bat`。它会做：
> 1. 停止服务（如果运行中）
> 2. `npm install`（更新依赖）
> 3. **不触碰数据库**
> 4. 启动一次 server 跑 schema 迁移（3 秒后停掉）
> 5. 让用户决定是否 start

---

## 数据备份建议（用户须知）

**任何时候升级前都应该备份一次数据库**：

```powershell
# 手动备份
$date = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item "$env:APPDATA\huangxiaoshuai\data\huangxiaoshuai.db" "C:\backup\huangxiaoshuai-$date.db"
```

定期备份策略由用户决定，**升级流程本身不强制备份**——但建议在 README/培训中强调。

---

## 回滚

如果新版本有问题，回滚到旧版本：

```powershell
.\scripts\stop.bat

# 假设你升级前备份了整个目录
Remove-Item .\* -Recurse -Force -Exclude logs
Copy-Item ..\yunying_platform.bak\* . -Recurse -Force

.\scripts\start.bat
```

数据库**不受影响**——它一直在 `%APPDATA%` 不在项目目录里。

---

## 升级 vs 首次安装

| 操作 | 首次安装 | 升级 |
|---|---|---|
| 脚本 | `scripts\install.bat` | `scripts\update.bat` |
| npm install | ✓ | ✓ |
| 建数据库 | ✓（空库） | ✗（**用现有库**） |
| 建 admin 账号 | ✓ | ✗（已存在） |
| Seed 示例数据 | ✓ | ✗（**不要**） |
| Schema 迁移 | 第一次跑 | 增量跑（idempotent） |

---

## 给二次开发者的提示

1. **不要直接改 `server/index.js` 的 `CREATE TABLE`**——只加 `ALTER TABLE`
2. **加新字段时先看 PRAGMA table_info**——确保 idempotent
3. **数据迁移 SQL 必须在 `try/catch` 里**——避免老库兼容问题
4. **测试用 `DISABLE_SEED=1`**——避免污染数据
5. **发布前跑完整测试**：`.\scripts\run-tests.bat` 必须 116/116
6. **保持 BUG 编号连贯**：下一个修的 BUG 用 BUG-019，不要重置