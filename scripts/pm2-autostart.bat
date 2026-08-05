@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   PM2 开机自启配置
echo ============================================
echo.

cd /d "%~dp0.."
set PROJECT_DIR=%CD%

echo [STEP 1] 检查 PM2 进程状态 ...
npx pm2 list 2>nul | findstr "huang-server" >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] PM2 服务未启动，请先运行: npm run pm2:start
  pause
  exit /b 1
)
echo   PM2 服务运行正常
echo.

echo [STEP 2] 创建开机启动任务计划 ...
schtasks /create /tn "HuangXiaoshuai PM2" /tr "cmd /c cd /d %PROJECT_DIR% && npm run pm2:start" /sc onlogon /rl limited /f 2>nul
if errorlevel 1 (
  echo   [WARNING] 创建任务计划失败，尝试以管理员身份运行
  powershell -Command "Start-Process schtasks -ArgumentList '/create /tn \"HuangXiaoshuai PM2\" /tr \"cmd /c cd /d %PROJECT_DIR% && npm run pm2:start\" /sc onlogon /rl limited /f' -Verb RunAs"
) else (
  echo   [OK] 任务计划已创建
)
echo.

echo [STEP 3] 保存 PM2 进程列表 ...
npx pm2 save
if errorlevel 1 (
  echo   [WARNING] pm2 save 失败，忽略
)
echo.

echo ============================================
echo   配置完成！
echo   开机后会自动启动 PM2 服务（huang-server + huang-frontend）
echo.
echo   如需取消开机自启，运行:
echo   schtasks /delete /tn "HuangXiaoshuai PM2" /f
echo ============================================
pause
