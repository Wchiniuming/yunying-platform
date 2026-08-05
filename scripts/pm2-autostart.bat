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
  exit /b 1
)
echo   [OK] PM2 is running
echo.

echo [STEP 2] Saving PM2 process list ...
node_modules\.bin\pm2 save >nul 2>&1
echo   [OK] Process list saved
echo.

echo [STEP 3] Creating Startup shortcut ...
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\HuangXiaoshuai.lnk
set BAT_PATH=%PROJECT_DIR%\run-pm2.bat

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\make_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut("%SHORTCUT_PATH%") >> "%TEMP%\make_shortcut.vbs"
echo oLink.TargetPath = "cmd.exe" >> "%TEMP%\make_shortcut.vbs"
echo oLink.Arguments = "/c cd /d %PROJECT_DIR% && npm run pm2:start" >> "%TEMP%\make_shortcut.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\make_shortcut.vbs"
echo oLink.Description = "Huang Xiaoshuai PM2 Auto-Start" >> "%TEMP%\make_shortcut.vbs"
echo oLink.Save() >> "%TEMP%\make_shortcut.vbs"
cscript //nologo "%TEMP%\make_shortcut.vbs" >nul 2>&1
del "%TEMP%\make_shortcut.vbs" >nul 2>&1

if exist "%SHORTCUT_PATH%" (
  echo   [OK] Startup shortcut created
) else (
  echo   [WARNING] Could not create shortcut. Run as Administrator if needed.
)
echo.

echo ============================================
echo   Done! Services will auto-start on next login.
echo.
echo   To remove auto-start:
echo   del "%SHORTCUT_PATH%"
echo ============================================
echo.
pause
