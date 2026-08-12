@echo off
setlocal
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo.
echo ============================================
echo   YunYing Platform - Stop Services
echo ============================================
echo.

echo [1/3] Stopping PM2 processes ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" kill >nul 2>&1
if not errorlevel 1 (
  echo   [OK] PM2 stopped
) else (
  echo   [SKIP] PM2 not running
)
echo.

echo [2/3] Killing backend by port 3000 ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
echo   Done
echo.

echo [3/3] Killing frontend by port 5173 ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
echo   Done
echo.

echo ============================================
echo   All services stopped.
echo ============================================
echo.
pause
