Write-Host "========================================" -ForegroundColor Green
Write-Host "    FishTimes - Starting Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Current directory: $PWD" -ForegroundColor Yellow
Write-Host ""

Write-Host "Changing to project directory..." -ForegroundColor Cyan
Set-Location "D:\VS Projects\fish_app"
Write-Host ""

Write-Host "New directory: $PWD" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking for index.html..." -ForegroundColor Cyan
if (Test-Path "index.html") {
    Write-Host "✅ index.html found!" -ForegroundColor Green
} else {
    Write-Host "❌ index.html NOT found!" -ForegroundColor Red
    Write-Host "Files in directory:" -ForegroundColor Yellow
    Get-ChildItem
    Read-Host "Press Enter to continue"
    exit
}

Write-Host ""
Write-Host "Starting http-server on port 3000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your FishTimes app will be available at:" -ForegroundColor Green
Write-Host "  http://localhost:3000/" -ForegroundColor White
Write-Host "  http://localhost:3000/index.html" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npx http-server -p 3000



