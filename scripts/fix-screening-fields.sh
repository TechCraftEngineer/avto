#!/bin/bash

# Скрипт для автоматической замены старых полей на новые

echo "🔧 Исправление полей screening..."

# Замена screening.score на screening.overallScore
find packages/api/src -type f -name "*.ts" -exec sed -i 's/screening\.score/screening.overallScore/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseScreening\.score/responseScreening.overallScore/g' {} +

# Замена screening.detailedScore (удаляем, так как вычисляется)
find packages/api/src -type f -name "*.ts" -exec sed -i 's/screening\.detailedScore/screening.overallScore/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseScreening\.detailedScore/responseScreening.overallScore/g' {} +

# Замена screening.analysis на screening.overallAnalysis
find packages/api/src -type f -name "*.ts" -exec sed -i 's/screening\.analysis/screening.overallAnalysis/g' {} +

# Замена response.compositeScore на responseScreening.overallScore
find packages/api/src -type f -name "*.ts" -exec sed -i 's/response\.compositeScore/responseScreening.overallScore/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseTable\.compositeScore/responseScreening.overallScore/g' {} +

# Замена response.recommendation на responseScreening.recommendation
find packages/api/src -type f -name "*.ts" -exec sed -i 's/response\.recommendation/responseScreening.recommendation/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseTable\.recommendation/responseScreening.recommendation/g' {} +

# Замена response.strengths на responseScreening.strengths
find packages/api/src -type f -name "*.ts" -exec sed -i 's/response\.strengths/responseScreening.strengths/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseTable\.strengths/responseScreening.strengths/g' {} +

# Замена response.weaknesses на responseScreening.weaknesses
find packages/api/src -type f -name "*.ts" -exec sed -i 's/response\.weaknesses/responseScreening.weaknesses/g' {} +
find packages/api/src -type f -name "*.ts" -exec sed -i 's/responseTable\.weaknesses/responseScreening.weaknesses/g' {} +

echo "✅ Замены выполнены"
