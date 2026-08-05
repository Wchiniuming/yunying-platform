@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   PM2 Auto-Start Setup
echo ============================================
echo.

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo [STEP 1] Checking PM2 status ...
node_modules\.bin\pm2 list 2>nul | findstr "huang-server" >nul 2>&1
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
node_modules\.bin\pm2 save >nul 2>&1
if errorlevel 1 (
  echo   [WARNING] pm2 save failed
) else (
  echo   [OK] Process list saved
)
echo.

echo [STEP 3] Creating Task Scheduler entry ...
schtasks /create /tn "HuangXiaoshuai PM2" /tr "cmd /c cd /d %PROJECT_DIR% && npm run pm2:start" /sc onlogon /rl limited /f >nul 2>&1
if errorlevel 1 (
  echo   [WARNING] Task creation failed - run as Administrator
) else (
  echo   [OK] Task created
)
echo.

echo ============================================
echo   Done! Services will auto-start on next login.
echo.
echo   To remove auto-start (Admin PowerShell):
echo   schtasks /delete /tn "HuangXiaoshuai PM2" /f
echo ============================================
echo.
pause
