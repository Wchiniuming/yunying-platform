@echo off
echo ============================================
echo   PM2 Auto-Start Setup
echo ============================================
echo.
cd /d "%~dp0.."
set PROJECT_DIR=%CD%
echo Project: %PROJECT_DIR%
echo.
echo [1/3] Checking PM2 ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" list >nul 2>&1
if errorlevel 1 (
  echo PM2 not running. Run npm run pm2:start first.
  pause
  exit /b 1
)
echo   OK
echo.
echo [2/3] Saving process list ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" save >nul 2>&1
echo   OK
echo.
echo [3/3] Creating startup script ...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set STARTUP_BAT=%STARTUP_DIR%\start-huang-pm2.bat
echo @echo off > "%STARTUP_BAT%"
echo cd /d "%PROJECT_DIR%" >> "%STARTUP_BAT%"
echo call "%%~dp0..\node_modules\.bin\pm2.cmd" resurrect >> "%STARTUP_BAT%"
if exist "%STARTUP_BAT%" (
  echo   OK: %STARTUP_BAT%
) else (
  echo   FAILED: could not write to Startup folder
)
echo.
echo ============================================
echo   Setup complete. Reboot to verify.
echo.
echo   To remove auto-start, delete:
echo   %STARTUP_BAT%
echo ============================================
pause
