@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo.
echo ============================================
echo   黄小帅运营平台 - 更新脚本
echo ============================================
echo.
echo 本脚本执行：停止服务 -> 拉取代码 -> 安装依赖 -> 重启服务
echo 数据库不会被修改，旧数据完整保留
echo.
pause
echo.
echo [1/6] 停止 PM2 服务 ...
call npm run pm2:stop
echo   已停止
echo.
echo [2/6] 拉取云端代码 ...
git pull
if errorlevel 1 (
  echo   X git pull 失败，请检查网络或冲突
  pause
  exit /b 1
)
echo   代码已更新
echo.
echo [3/6] 安装依赖 ...
call npm install
if errorlevel 1 (
  echo   X npm install 失败
  pause
  exit /b 1
)
echo   依赖安装完成
echo.
echo [4/6] 自动数据库备份 ...
if not exist "C:\backup" mkdir "C:\backup"
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set DATETIME=%%a
set BACKUP_FILE=C:\backup\huangxiaoshuai-!DATETIME:~0,8!-!DATETIME:~8,6!.db
set DB_FILE=%APPDATA%\data\huangxiaoshuai.db
if exist "!DB_FILE!" (
  copy /Y "!DB_FILE!" "!BACKUP_FILE!" >nul 2>&1
  echo   备份: !BACKUP_FILE!
) else (
  echo   数据库文件不存在，跳过备份
)
echo.
echo [5/6] 启动服务 ...
call npm run pm2:start
echo.
echo [6/6] 完成
echo.
echo ============================================
echo   更新完成
echo ============================================
echo 备份文件: C:\backup\huangxiaoshuai-*.db
echo 请访问 http://localhost:5173 验证新功能
echo.
pause
