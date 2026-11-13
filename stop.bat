@echo off
setlocal
cd /d "%~dp0"

echo [TeamTrack] Stopping local PostgreSQL database...
"%~dp0infrastructure\pgsql\bin\pg_ctl.exe" -D "%~dp0infrastructure\pgsql\data" stop
echo [TeamTrack] Done.

