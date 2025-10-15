@echo off
echo ========================================
echo    FishTimes - Starting Server
echo ========================================
echo.
echo Current directory: %CD%
echo.
echo Changing to project directory...
cd /d "D:\VS Projects\fish_app"
echo.
echo New directory: %CD%
echo.
echo Checking for index.html...
if exist "index.html" (
    echo ✅ index.html found!
) else (
    echo ❌ index.html NOT found!
    echo Files in directory:
    dir /b
    pause
    exit
)
echo.
echo Starting http-server on port 3000...
echo.
echo Your FishTimes app will be available at:
echo   http://localhost:3000/
echo   http://localhost:3000/index.html
echo.
echo Press Ctrl+C to stop the server
echo.
npx http-server -p 3000



