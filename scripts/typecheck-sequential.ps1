#!/usr/bin/env pwsh

$ErrorActionPreference = "Continue"
$failed = @()
$succeeded = @()

$packages = @(
    "packages/validators",
    "packages/shared",
    "packages/config",
    "packages/db",
    "packages/auth",
    "packages/lib",
    "packages/ai",
    "packages/api",
    "packages/server-utils",
    "packages/jobs-shared",
    "packages/jobs-parsers",
    "packages/jobs",
    "packages/tg-client",
    "packages/document-processor",
    "packages/ui",
    "packages/emails",
    "apps/ai-proxy",
    "apps/app",
    "apps/web",
    "apps/webhooks",
    "apps/interview"
)

Write-Host "Running typecheck for all packages..." -ForegroundColor Cyan

foreach ($pkg in $packages) {
    if (Test-Path "$pkg/package.json") {
        Write-Host "`nChecking $pkg..." -ForegroundColor Yellow
        Push-Location $pkg
        $result = bun run typecheck 2>&1
        $exitCode = $LASTEXITCODE
        Pop-Location
        
        if ($exitCode -eq 0) {
            Write-Host "✓ $pkg passed" -ForegroundColor Green
            $succeeded += $pkg
        } else {
            Write-Host "✗ $pkg failed" -ForegroundColor Red
            Write-Host $result
            $failed += $pkg
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Succeeded: $($succeeded.Count)" -ForegroundColor Green
Write-Host "Failed: $($failed.Count)" -ForegroundColor Red

if ($failed.Count -gt 0) {
    Write-Host "`nFailed packages:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "`nAll packages passed typecheck!" -ForegroundColor Green
exit 0
