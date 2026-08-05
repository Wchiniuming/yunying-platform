@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   PM2 Auto-Start Setup for Huang Xiaoshuai
echo ============================================
echo.

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo [STEP 1] Checking PM2 status ...
npx pm2 list 2>nul | findstr "huang-server" >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] PM2 not running. Run: npm run pm2:start
  pause
  exit /b 1
)
echo   [OK] PM2 is running
echo.

echo [STEP 2] Saving PM2 process list ...
npx pm2 save
if errorlevel 1 (
  echo   [WARNING] pm2 save failed, ignoring
)
echo.

echo [STEP 3] Creating Windows Task Scheduler entry ...
schtasks /create /tn "HuangXiaoshuai PM2" /tr "cmd /c cd /d %PROJECT_DIR% && npm run pm2:start" /sc onlogon /rl limited /f 2>nul
if errorlevel 1 (
  echo   [WARNING] Failed to create task (try running as Administrator)
) else (
  echo   [OK] Task Scheduler entry created
)
echo.

echo ============================================
echo   Setup complete!
echo.
echo   On next login, PM2 services will auto-start.
echo.
echo   To remove auto-start, run as Administrator:
echo   schtasks /delete /tn "HuangXiaoshuai PM2" /f
echo ============================================
pause
