@echo off
echo.
echo ============================================
echo   YunYing Platform - PM2 Auto-Start Setup
echo ============================================
echo.
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo Project: %PROJECT_DIR%
echo.

echo [1/4] Checking PM2 installation ...
if not exist "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" (
  echo   [ERROR] PM2 not found. Run: npm install
  pause
  exit /b 1
)
echo   OK
echo.

echo [2/4] Saving current PM2 process list ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" save >nul 2>&1
if errorlevel 1 (
  echo   [WARN] Could not save - no processes to save, or PM2 not running
) else (
  echo   OK
)
echo.

echo [3/4] Configuring Windows startup ...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set STARTUP_BAT=%STARTUP_DIR%\start-huang-pm2.bat
(
  echo @echo off
  echo cd /d "%PROJECT_DIR%"
  echo call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" resurrect
) > "%STARTUP_BAT%"

if exist "%STARTUP_BAT%" (
  echo   OK: %STARTUP_BAT%
) else (
  echo   [ERROR] Could not write to Startup folder
  pause
  exit /b 1
)
echo.

echo [4/4] Verifying PM2 startup config ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" startup >nul 2>&1
echo   OK
echo.

echo ============================================
echo   Auto-start setup complete
echo ============================================
echo.
echo   Windows will now run: pm2 resurrect
echo   on every startup to restore services.
echo.
echo   To remove auto-start, delete:
echo   %STARTUP_BAT%
echo.
pause
