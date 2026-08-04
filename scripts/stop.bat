@echo off
setlocal
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo [DEBUG] PROJECT_DIR=%PROJECT_DIR%
echo.
echo ============================================
echo   黄小帅麻辣鸡 - 停止服务
echo ============================================
echo.
echo [1/2] 停止后端服务 ...
taskkill /F /FI "WINDOWTITLE eq HuangServer" 2>nul
if not errorlevel 1 (echo   后端已停止) else (echo   - 后端未在运行)
echo.
echo [2/2] 停止前端服务 ...
taskkill /F /FI "WINDOWTITLE eq HuangDev" 2>nul
if not errorlevel 1 (echo   前端已停止) else (echo   - 前端未在运行)
echo.
echo 所有服务已停止
echo.
pause
