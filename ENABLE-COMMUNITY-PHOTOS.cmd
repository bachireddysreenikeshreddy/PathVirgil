@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\enable-d1-photos.ps1"
if errorlevel 1 (
 echo.
 echo Update stopped. Please send a screenshot of the error.
)
pause
