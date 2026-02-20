# PowerShell script to run development server

Write-Host "Running environment check..." -ForegroundColor Cyan
node scripts/check-env.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "Environment check failed. Please fix the issues above before continuing." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Starting development server..." -ForegroundColor Green
next dev 