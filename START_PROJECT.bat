@echo off
setlocal

cd /d "%~dp0"

echo [1/4] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  echo Install Node.js LTS from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

echo [2/4] Installing dependencies (if needed)...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo [3/4] Preparing server .env...
call npm run setup
if errorlevel 1 (
  echo setup failed. Check project files.
  pause
  exit /b 1
)

echo [4/4] Starting backend and frontend...
start "Dela Backend" cmd /k "cd /d %~dp0 && npm run dev:server"
start "Dela Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Frontend should be available at http://localhost:5173
echo Backend health check: http://localhost:4000/api/health
echo.
echo If you run for the first time, open server\.env and set DB_PASSWORD.
echo Then restart this launcher.
pause
