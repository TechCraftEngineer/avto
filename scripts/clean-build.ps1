# Clean build script for selectio project
# This script cleans up Next.js locks and cache to prevent build conflicts

Write-Host "🧹 Cleaning Next.js build artifacts..." -ForegroundColor Green

# Find and remove all .next directories
Get-ChildItem -Path . -Recurse -Directory -Name ".next" | ForEach-Object {
    $path = Join-Path (Get-Location) $_
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "Removed: $path" -ForegroundColor Yellow
    }
}

# Find and remove lock files in .next directories
Get-ChildItem -Path . -Recurse -File -Name "lock" | Where-Object {
    $_.FullName -like "*\.next\*"
} | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "Removed lock: $($_.FullName)" -ForegroundColor Yellow
}

# Clean turbo cache if --full flag is provided
param([switch]$Full)
if ($Full) {
    Write-Host "🧽 Full clean - removing turbo cache..." -ForegroundColor Cyan
    if (Test-Path ".turbo") {
        Remove-Item -Path ".turbo" -Recurse -Force
        Write-Host "Removed: .turbo" -ForegroundColor Yellow
    }
}

Write-Host "✅ Build artifacts cleaned successfully!" -ForegroundColor Green