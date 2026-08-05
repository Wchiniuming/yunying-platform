@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   PM2 Auto-Start Setup
echo ============================================
echo.

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo [STEP 1] Checking PM2 status ...
npx pm2 list 2>nul | findstr "huang-server" >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] PM2 not running. Run: npm run pm2:start
  echo.
  pause
  cmd /k
  exit /b 1
)
echo   [OK] PM2 is running
echo.

echo [STEP 2] Saving PM2 process list ...
npx pm2 save
if errorlevel 1 (
  echo   [WARNING] pm2 save failed, ignoring
) else (
  echo   [OK] Process list saved
)
echo.

echo [STEP 3] Creating Windows Task Scheduler entry ...
schtasks /create /tn "HuangXiaoshuai PM2" /tr "cmd /c cd /d %PROJECT_DIR% && npm run pm2:start" /sc onlogon /rl limited /f 2>nul
if errorlevel 1 (
  echo   [WARNING] Task creation failed. Run as Administrator if needed.
) else (
  echo   [OK] Task created
)
echo.

echo ============================================
echo   Done! PM2 will auto-start on next login.
echo.
echo   To remove auto-start (Admin PowerShell):
echo   schtasks /delete /tn "HuangXiaoshuai PM2" /f
echo ============================================
echo.
pause
