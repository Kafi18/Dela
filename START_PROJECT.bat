@echo off
setlocal
cd /d "%~dp0"

echo [1/4] Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org
  pause
  exit /b 1
)

echo [2/4] npm install...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

echo [3/4] server\.env (встроенная БД, без PostgreSQL)...
call npm run env:embedded
if errorlevel 1 ( pause & exit /b 1 )

echo [4/4] Запуск backend + frontend...
start "Dela Backend" cmd /k "cd /d %~dp0 && npm run dev:server"
start "Dela Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Откройте http://localhost:5173
echo API health: http://localhost:4000/api/health
echo.
echo Данные хранятся в памяти до перезапуска сервера. Для постоянной БД: Docker или PostgreSQL + DELA_EMBEDDED_DB=false (см. README).
pause
