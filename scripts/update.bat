@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo [DEBUG] PROJECT_DIR=%PROJECT_DIR%
echo.
echo ============================================
echo   黄小帅麻辣鸡 - 升级脚本
echo ============================================
echo.
echo 本脚本将：停止服务 -> 自动备份数据库 -> 更新依赖 -> 运行迁移 -> 提示手动启动
echo 数据库绝对不会被修改或重置，数据会备份到 C:\backup\
echo.
pause
echo.
echo [1/5] 停止服务 ...
taskkill /F /FI "WINDOWTITLE eq HuangServer" 2>nul
taskkill /F /FI "WINDOWTITLE eq HuangDev" 2>nul
echo   已停止
echo.
echo [2/5] 自动备份数据库 ...
if not exist "C:\backup" mkdir "C:\backup"
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value'') do set DATETIME=%%a
set BACKUP_FILE=C:\backup\huangxiaoshuai-!DATETIME:~0,8!-!DATETIME:~8,6!.db
set DB_FILE=%APPDATA%\data\huangxiaoshuai.db
if exist "!DB_FILE!" (
  copy /Y "!DB_FILE!" "!BACKUP_FILE!" >nul 2>&1
  echo   备份: !BACKUP_FILE!
) else (
  echo   数据库文件不存在，跳过备份
)
echo.
echo [3/5] 更新 npm 依赖 ...
call npm install
if errorlevel 1 (
  echo   X npm install 失败
  pause
  exit /b 1
)
echo   依赖已更新
echo.
echo [4/5] 运行 schema 迁移 ...
if not exist "%APPDATA%\data" mkdir "%APPDATA%\data"
start "HuangMigrate" /MIN cmd /c "node server\index.js >> logs\migrate.log 2>&1"
timeout /t 4 /nobreak >nul
taskkill /F /FI "WINDOWTITLE eq HuangMigrate" 2>nul >nul
echo   Schema 迁移完成
echo.
echo [5/5] 完成
echo.
echo ============================================
echo   升级完成
echo ============================================
echo 备份文件: C:\backup\huangxiaoshuai-*.db
echo 下一步：双击 start.bat 启动新版本
echo.
pause
