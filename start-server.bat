@echo off
echo ===================================================
echo    Village Enterprise IT Tips Web App Server
echo ===================================================
echo.
echo This will start a local web server to test the app.
echo.
echo Instructions:
echo 1. The server will start automatically
echo 2. Open your browser and go to: http://localhost:8000
echo 3. Close this window to stop the server
echo.
echo Press any key to start the server...
pause >nul

echo.
echo Starting server...
echo.

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File simple-server.ps1

echo.
echo Server stopped. You can close this window.
pause
