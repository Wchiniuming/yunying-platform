@echo off
setlocal

set PROJECT_DIR=E:\workspace\yunying_platform

echo === Step 0: cd to project ===
pushd "%PROJECT_DIR%" || (echo FAILED to cd & pause & exit /b 1)

echo.
echo === Step 1: clean broken better-sqlite3 ===
if exist node_modules\better-sqlite3 (
  rmdir /s /q node_modules\better-sqlite3
  echo   removed
) else (
  echo   nothing to remove
)

echo.
echo === Step 2: npm install ===
call npm install
if errorlevel 1 (
  echo npm install FAILED
  popd
  pause
  exit /b 1
)

echo.
echo === Step 3: verify node:sqlite ===
node -e "const {DatabaseSync} = require('node:sqlite'); console.log('node:sqlite OK', typeof DatabaseSync);"
if errorlevel 1 (
  echo node:sqlite not available - need Node 22.5+
  node --version
  popd
  pause
  exit /b 1
)

echo.
echo === Step 4: run all API tests ===
call npm run test:api
set TEST_EXIT=%errorlevel%

echo.
echo === Step 5: cleanup ===
popd

if %TEST_EXIT% NEQ 0 (
  echo TESTS FAILED - see output above
) else (
  echo ALL TESTS PASSED
)

pause
exit /b %TEST_EXIT%