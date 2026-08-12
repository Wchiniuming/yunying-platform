@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo.
echo ============================================
echo   YunYing Platform - PM2 Start
echo ============================================
echo.

echo [STEP 1] Checking Node.js ...
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo   %NODE_VER%
echo.

echo [STEP 2] Checking PM2 ...
if not exist "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" (
  echo   [ERROR] PM2 not found. Run: npm install -g pm2
  pause
  exit /b 1
)
echo   PM2 found
echo.

echo [STEP 3] Checking ecosystem.config.cjs ...
if not exist "%PROJECT_DIR%\ecosystem.config.cjs" (
  echo   [ERROR] ecosystem.config.cjs not found
  pause
  exit /b 1
)
echo   OK
echo.

echo [STEP 4] Checking ports ...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  echo   [WARN] Port 3000 is already in use
  echo   Trying to identify process...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo   PID %%a may be using port 3000
  )
)
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
  echo   [WARN] Port 5173 is already in use
)
echo.

echo [STEP 5] Starting services via PM2 ...
call "%PROJECT_DIR%\node_modules\.bin\pm2.cmd" start ecosystem.config.cjs
echo.

echo [STEP 6] Waiting for backend to be ready ...
set /a count=0
:WAIT_LOOP
set /a count+=1
timeout /t 1 /nobreak >nul
curl -s -m 2 http://localhost:3000/api/app/info >nul 2>&1
if not errorlevel 1 goto BACKEND_OK
if !count! GEQ 30 (
  echo   [ERROR] Backend failed to start after 15 seconds
  echo.
  echo   Check logs with:
  echo   pm2 logs
  echo.
  pause
  exit /b 1
)
echo   Waiting... !count!/30
goto WAIT_LOOP

:BACKEND_OK
echo.
echo ============================================
echo   Services started successfully
echo ============================================
echo.
echo   Frontend:   http://localhost:5173
echo   Backend:    http://localhost:3000
echo.
echo   PM2 status:  pm2 status
echo   PM2 logs:    pm2 logs
echo   Stop:        pm2 kill
echo.
echo   Services are running in the background.
echo   Close this window - they will keep running.
echo.
pause
exit /b 0
