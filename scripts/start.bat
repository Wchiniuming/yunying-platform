@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo [ONE-STOP] 黄小帅麻辣鸡 - 全自动启动
echo ============================================
echo [DEBUG] PROJECT_DIR=%PROJECT_DIR%
where node
echo.
if not exist logs mkdir logs

echo [STEP 0] Node 版本检测 ...
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo   %NODE_VER% (需要 22.5+ 才支持 node:sqlite)
echo.
echo [STEP 1] 检查 node_modules 和 node:sqlite ...
node -e "const {DatabaseSync} = require('node:sqlite');" 2>nul
if errorlevel 1 (set NEED_INSTALL=1) else (set NEED_INSTALL=0)
if not exist node_modules set NEED_INSTALL=1
echo   NEED_INSTALL=!NEED_INSTALL! (1=需要安装，0=已安装)
echo.
echo ============================================
echo   流程: NEED_INSTALL=1 -> [A]安装 -> [B]测试 -> [C]启动
echo        NEED_INSTALL=0 -> [B]测试 -> [C]启动
echo ============================================
echo.
if exist logs\install.log del /q logs\install.log
if exist logs\test.log del /q logs\test.log
if exist logs\server.log del /q logs\server.log
if exist logs\frontend.log del /q logs\frontend.log
if exist logs\migrate.log del /q logs\migrate.log

echo [PHASE A] 安装依赖 + 初始化数据库
if !NEED_INSTALL! EQU 1 (
  call npm install >> logs\install.log 2>&1
  if errorlevel 1 (
    echo   [ERROR] npm install 失败，查看日志 logs\install.log
    type logs\install.log
    pause
    exit /b 1
  )
  echo   npm install 完成
  if not exist "%APPDATA%\huangxiaoshuai\data" mkdir "%APPDATA%\huangxiaoshuai\data"
  start "HuangServer" /MIN cmd /c "node server\index.js > nul 2>&1"
  timeout /t 4 /nobreak >nul
  taskkill /F /FI "WINDOWTITLE eq HuangServer" 2>nul >nul
  echo   数据库已初始化
) else (
  echo   跳过安装 (node_modules 已存在且 node:sqlite 正常)
)
echo.
echo [PHASE B] 环境检查 ...
echo [B1] 检查端口 3000 (后端) ...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  echo   [ERROR] 端口 3000 已被占用，请先运行 stop.bat
  pause
  exit /b 1
)
echo   端口 3000 可用
echo [B2] 检查端口 5173 (前端) ...
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  echo   [ERROR] 端口 5173 已被占用，请先运行 stop.bat
  pause
  exit /b 1
)
echo   端口 5173 可用
echo [B3] 检查 server/index.js ...
if not exist server\index.js (
  echo   [ERROR] server\index.js 不存在
  pause
  exit /b 1
)
echo   server\index.js 存在
echo [B4] 检查 package.json ...
if not exist package.json (
  echo   [ERROR] package.json 不存在
  pause
  exit /b 1
)
echo   package.json 存在
echo [B5] 尝试启动 server 并验证健康检查 ...
start "HuangServer" /MIN cmd /c "node server\index.js > nul 2>&1"
timeout /t 3 /nobreak >nul
curl -s -m 2 http://localhost:3000/api/app/info >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] server 健康检查失败，查看日志 logs\server.log
  taskkill /F /FI "WINDOWTITLE eq HuangServer" 2>nul >nul
  type logs\server.log
  pause
  exit /b 1
)
echo   server 健康检查通过
taskkill /F /FI "WINDOWTITLE eq HuangServer" 2>nul >nul
echo   环境检查全部通过
echo.
echo [PHASE C] 启动服务
echo [1/2] 启动后端 API (端口 3000) ...
start "HuangServer" /MIN cmd /c "node server\index.js >> logs\server.log 2>&1"
timeout /t 2 /nobreak >nul
echo [2/2] 启动前端开发服务 (端口 5173) ...
start "HuangDev" /MIN cmd /c "npm run dev >> logs\frontend.log 2>&1"
echo.
echo 等待服务就绪（最多 30 秒）...
set /a count=0
:WAIT_LOOP
set /a count+=1
timeout /t 1 /nobreak >nul
curl -s -m 1 http://localhost:3000/api/app/info >nul 2>&1
if not errorlevel 1 goto BACKEND_OK
if !count! GEQ 30 (
  echo   [ERROR] 等待超时，查看日志 logs\server.log
  type logs\server.log
  pause
  exit /b 1
)
echo   等待中... !count!/30
goto WAIT_LOOP

:BACKEND_OK
echo.
echo ============================================
echo   启动成功
echo ============================================
echo   后端 API:    http://localhost:3000
echo   前端页面:    http://localhost:5173
echo ============================================
echo 服务已在后台运行。关闭服务请双击 stop.bat
echo.
pause
exit /b 0
