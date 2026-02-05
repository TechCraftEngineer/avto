# Скрипт для исправления полей скрининга во фронтенд-компонентах
# Заменяет обращения к старым полям на новые через response.screening

$files = @(
    "apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/responses/[responseId]/page.tsx",
    "apps/app/src/components/gig/components/response-detail/header-card.tsx",
    "apps/app/src/components/gig/components/response-detail/hooks/use-gig-response-flags.ts",
    "apps/app/src/components/gig/components/response-detail/tabs.tsx",
    "apps/app/src/components/gigs/components/candidate-comparison/candidate-comparison.tsx",
    "apps/app/src/components/gigs/components/ranked-candidate-card/ranked-candidate-card.tsx",
    "apps/app/src/components/gigs/components/ranking-list/ranking-list.tsx",
    "apps/app/src/components/shared/components/response-detail-tabs/tabs/comparison-tab.tsx",
    "apps/app/src/components/vacancy/components/response-detail/hooks/use-vacancy-response-flags.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Обработка файла: $file"
        
        $content = Get-Content $file -Raw
        
        # Замены для полей, которые теперь в screening
        $content = $content -replace 'response\.compositeScore', 'response.screening?.overallScore'
        $content = $content -replace 'response\.recommendation', 'response.screening?.recommendation'
        $content = $content -replace 'response\.strengths', 'response.screening?.strengths'
        $content = $content -replace 'response\.weaknesses', 'response.screening?.weaknesses'
        $content = $content -replace 'response\.skillsMatchScore', 'response.screening?.skillsMatchScore'
        $content = $content -replace 'response\.experienceScore', 'response.screening?.experienceScore'
        $content = $content -replace 'response\.priceScore', 'response.screening?.priceScore'
        $content = $content -replace 'response\.deliveryScore', 'response.screening?.deliveryScore'
        $content = $content -replace 'response\.rankingPosition', 'response.screening?.rankingPosition'
        $content = $content -replace 'response\.rankingAnalysis', 'response.screening?.rankingAnalysis'
        
        # Замены для candidate (в некоторых компонентах используется candidate вместо response)
        $content = $content -replace 'candidate\.compositeScore', 'candidate.screening?.overallScore'
        $content = $content -replace 'candidate\.recommendation', 'candidate.screening?.recommendation'
        $content = $content -replace 'candidate\.strengths', 'candidate.screening?.strengths'
        $content = $content -replace 'candidate\.weaknesses', 'candidate.screening?.weaknesses'
        $content = $content -replace 'candidate\.skillsMatchScore', 'candidate.screening?.skillsMatchScore'
        $content = $content -replace 'candidate\.experienceScore', 'candidate.screening?.experienceScore'
        $content = $content -replace 'candidate\.priceScore', 'candidate.screening?.priceScore'
        $content = $content -replace 'candidate\.deliveryScore', 'candidate.screening?.deliveryScore'
        $content = $content -replace 'candidate\.rankingPosition', 'candidate.screening?.rankingPosition'
        $content = $content -replace 'candidate\.rankingAnalysis', 'candidate.screening?.rankingAnalysis'
        
        # Удаление обращений к несуществующим reasoning-полям
        # Эти поля были удалены, заменяем на соответствующие analysis-поля
        $content = $content -replace 'response\.compositeScoreReasoning', 'response.screening?.overallAnalysis'
        $content = $content -replace 'response\.priceScoreReasoning', 'response.screening?.priceAnalysis'
        $content = $content -replace 'response\.deliveryScoreReasoning', 'response.screening?.deliveryAnalysis'
        $content = $content -replace 'response\.skillsMatchScoreReasoning', 'response.screening?.skillsAnalysis'
        $content = $content -replace 'response\.experienceScoreReasoning', 'response.screening?.experienceAnalysis'
        
        $content = $content -replace 'candidate\.compositeScoreReasoning', 'candidate.screening?.overallAnalysis'
        $content = $content -replace 'candidate\.priceScoreReasoning', 'candidate.screening?.priceAnalysis'
        $content = $content -replace 'candidate\.deliveryScoreReasoning', 'candidate.screening?.deliveryAnalysis'
        $content = $content -replace 'candidate\.skillsMatchScoreReasoning', 'candidate.screening?.skillsAnalysis'
        $content = $content -replace 'candidate\.experienceScoreReasoning', 'candidate.screening?.experienceAnalysis'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "✓ Файл обработан: $file"
    } else {
        Write-Host "⚠ Файл не найден: $file"
    }
}

Write-Host "`nГотово! Все файлы обработаны."
