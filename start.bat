@echo off
setlocal
cd /d "%~dp0"

echo [TeamTrack] Checking PostgreSQL status...
netstat -ano | findstr ":5432" >nul
if %ERRORLEVEL% neq 0 (
    echo [TeamTrack] Starting local PostgreSQL database...
    "%~dp0infrastructure\pgsql\bin\pg_ctl.exe" -D "%~dp0infrastructure\pgsql\data" -l "%~dp0infrastructure\pgsql\logfile.log" -o "-p 5432" start
    timeout /t 2 /nobreak >nul
) else (
    echo [TeamTrack] PostgreSQL is already running on port 5432.
)

echo [TeamTrack] Starting Frontend and Backend servers...
pnpm dev

