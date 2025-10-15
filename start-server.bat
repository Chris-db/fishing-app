@echo off
cd /d "D:\VS Projects\fish_app"
echo Starting FishTimes server...
echo.
echo Your app will be available at: http://localhost:8080/
echo.
echo Press Ctrl+C to stop the server
echo.
npx http-server -p 8080 -o

