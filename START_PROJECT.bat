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
if exist "%~dp0.dev-api-port" del /q "%~dp0.dev-api-port" 2>nul
start "Dela Backend" cmd /k "cd /d %~dp0 && npm run dev:server"
start "Dela Frontend" cmd /k "cd /d %~dp0 && node scripts/wait-dev-api-port.mjs && npm run dev"

echo.
echo Откройте http://localhost:5173
echo Проверка API через сайт: http://localhost:5173  (запросы идут на /api)
echo.
echo Встроенная БД: пользователи/голоса сохраняются в %%AppData%%\Dela\embedded-db.json. Для PostgreSQL см. README.
pause
