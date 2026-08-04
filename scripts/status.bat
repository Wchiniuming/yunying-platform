@echo off
setlocal
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo [DEBUG] PROJECT_DIR=%PROJECT_DIR%
echo.
echo ============================================
echo   黄小帅麻辣鸡 - 服务状态
echo ============================================
echo.
echo [后端 API] http://localhost:3000
netstat -ano | findstr :3000 | findstr LISTENING >nul
if not errorlevel 1 (echo   状态:  运行中 & curl -s -m 2 http://localhost:3000/api/app/info 2>nul & echo.) else (echo   状态:  X 未运行)
echo.
echo [前端页面] http://localhost:5173
netstat -ano | findstr :5173 | findstr LISTENING >nul
if not errorlevel 1 (echo   状态:  运行中) else (echo   状态:  X 未运行)
echo.
echo [数据库]
if exist "%APPDATA%\data\huangxiaoshuai.db" (for %%A in ("%APPDATA%\data\huangxiaoshuai.db") do (echo   路径:  %APPDATA%\data\huangxiaoshuai.db & echo   大小:  %%~zA 字节)) else (echo   状态:  X 数据库不存在)
echo.
echo [日志文件]
if exist logs\server.log (for %%A in (logs\server.log) do echo   server.log:  %%~zA 字节)
if exist logs\frontend.log (for %%A in (logs\frontend.log) do echo   frontend.log: %%~zA 字节)
echo.
pause
