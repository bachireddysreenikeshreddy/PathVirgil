@echo off
setlocal
cd /d "%~dp0"
echo Starting Harbor Cloudflare Pages setup...
echo This may ask you to approve a Node.js installation and sign in to Cloudflare.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-harbor-deployment.ps1"
echo.
if errorlevel 1 (
  echo Deployment stopped because one of the setup steps needs attention.
  echo You can share a screenshot of the error, but do not share passwords or tokens.
) else (
  echo Setup script finished. Check above for the actual Cloudflare URL and test results.
)
pause
