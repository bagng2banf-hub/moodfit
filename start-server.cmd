@echo off
cd /d "%~dp0"
echo Mood Fit AI local server starting...
echo.
echo If the browser does not open automatically, use:
echo http://127.0.0.1:5173
echo.
start "" "http://127.0.0.1:5173"
npm.cmd run dev -- --host 127.0.0.1 --port 5173
