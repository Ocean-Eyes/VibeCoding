@echo off
cd /d "%~dp0"
where npx >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
call npx --yes vercel login
if errorlevel 1 (
  pause
  exit /b 1
)
call npx --yes vercel --prod --scope auto-nav
pause
