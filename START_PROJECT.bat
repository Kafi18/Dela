@echo off
setlocal

cd /d "%~dp0"

echo [1/6] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  echo Install Node.js LTS from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

echo [2/6] Installing dependencies (if needed)...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo [3/6] Writing server\.env for Docker PostgreSQL (password: postgres)...
call npm run env:docker
if errorlevel 1 (
  echo env:docker failed.
  pause
  exit /b 1
)

echo [4/6] Starting PostgreSQL in Docker (if Docker is installed)...
where docker >nul 2>nul
if errorlevel 1 (
  echo.
  echo Docker not found. Install Docker Desktop, then run this file again,
  echo OR edit server\.env with your own PostgreSQL DB_HOST and DB_PASSWORD.
  echo.
  goto skipdocker
)

call docker compose up -d
if errorlevel 1 (
  echo docker compose failed. Is Docker Desktop running?
  goto skipdocker
)

echo [5/6] Waiting for PostgreSQL to accept connections...
call npm run db:wait
if errorlevel 1 (
  echo db:wait failed — check Docker and port 5432.
)

:skipdocker
echo [6/6] Starting backend and frontend...
start "Dela Backend" cmd /k "cd /d %~dp0 && npm run dev:server"
start "Dela Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000/api/health
echo.
echo If you use Docker: DB user postgres / password postgres (see docker-compose.yml).
echo Old accounts from another PC are NOT in Git — they live only in your PostgreSQL data.
pause
