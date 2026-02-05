# PowerShell скрипт для замены старых полей на новые

Write-Host "🔧 Исправление полей screening..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "packages/api/src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Замены
    if ($content -match 'screening\.score(?!Match)') {
        $content = $content -replace 'screening\.score(?!Match)', 'screening.overallScore'
        $modified = $true
    }
    
    if ($content -match 'responseScreening\.score(?!Match)') {
        $content = $content -replace 'responseScreening\.score(?!Match)', 'responseScreening.overallScore'
        $modified = $true
    }
    
    if ($content -match 'screening\.detailedScore') {
        $content = $content -replace 'screening\.detailedScore', 'screening.overallScore'
        $modified = $true
    }
    
    if ($content -match 'screening\.analysis(?!:)') {
        $content = $content -replace 'screening\.analysis(?!:)', 'screening.overallAnalysis'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "✅ Замены выполнены" -ForegroundColor Green
