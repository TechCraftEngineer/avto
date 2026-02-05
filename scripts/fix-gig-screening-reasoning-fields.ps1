# Скрипт для замены старых полей *ScoreReasoning на новые *Analysis в компонентах гигов

$files = @(
    "apps/app/src/components/gigs/components/ranked-candidate-card/ranked-candidate-card.tsx",
    "apps/app/src/components/gigs/components/candidate-comparison/candidate-comparison.tsx",
    "apps/app/src/components/gigs/components/ranking-list/ranking-list.tsx",
    "apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/ranking/ranking-page-client.tsx"
)

$replacements = @{
    "priceScoreReasoning" = "priceAnalysis"
    "deliveryScoreReasoning" = "deliveryAnalysis"
    "skillsMatchScoreReasoning" = "skillsAnalysis"
    "experienceScoreReasoning" = "experienceAnalysis"
    "overallScoreReasoning" = "overallAnalysis"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Обработка файла: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        
        $modified = $false
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            if ($content -match $old) {
                $content = $content -replace $old, $new
                $modified = $true
                Write-Host "  Заменено: $old -> $new"
            }
        }
        
        if ($modified) {
            Set-Content $file -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  Файл обновлен" -ForegroundColor Green
        } else {
            Write-Host "  Изменений не требуется" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Файл не найден: $file" -ForegroundColor Red
    }
}

Write-Host "`nГотово!" -ForegroundColor Green
