# Миграция поля experience на profileData

## Выполненные изменения

### 1. Обновлена схема БД
- ✅ Удалено поле `experience` из `candidateExperienceColumns`
- ✅ Удалено поле `experience` из `CreateResponseSchema`
- ✅ Обновлен тип `StoredProfileData` для поддержки опыта работы

### 2. Созданы вспомогательные функции
- ✅ `packages/db/src/utils/profile-data-helpers.ts` - для работы с profileData в БД
- ✅ `packages/shared/src/utils/experience-helpers.ts` - для работы с опытом в UI

### 3. Обновлены сервисы парсинга
- ✅ `packages/jobs-parsers/src/parsers/hh/services/resume-enrichment.ts`
- ✅ `packages/jobs-parsers/src/parsers/hh/parsers/response/response-utils.ts`
- ✅ `packages/jobs-parsers/src/functions/response/refresh-all-resumes.ts`

### 4. Обновлены shared сервисы
- ✅ `packages/jobs-shared/src/types/response.ts` - удалено поле experience
- ✅ `packages/jobs-shared/src/services/response.ts` - обновлена проверка hasDetailedInfo

### 5. Обновлены API сервисы
- ✅ `packages/api/src/services/candidate.service.ts` - использует profileData
- ✅ `packages/api/src/routers/recruiter-agent/get-interview-questions.ts`
- ✅ `packages/ai/src/screening-prompts.ts`

### 6. Обновлены репозитории
- ✅ `packages/jobs/src/services/response/response-repository.ts`

## Оставшиеся файлы для обновления

### API и сервисы
- `packages/api/src/routers/candidates/get-by-id.ts`
- `packages/api/src/services/gig-chat/context-loader.ts`
- `packages/api/src/services/gig-shortlist-generator.ts`
- `packages/shared/src/gig-shortlist-generator.ts`
- `packages/jobs/src/inngest/functions/telegram/bot-response.ts`

### UI компоненты (apps/app)
- `apps/app/src/components/vacancy/components/responses/response-cards.tsx`
- `apps/app/src/components/vacancy/components/response-detail/hooks/use-vacancy-response-flags.ts`
- `apps/app/src/components/shared/components/response-header-card.tsx`
- `apps/app/src/components/shared/components/response-detail-tabs/tabs/experience-tab.tsx`
- `apps/app/src/components/gig/components/response-detail/portfolio-card.tsx`
- `apps/app/src/components/gig/components/response-detail/hooks/use-gig-response-flags.ts`

## Следующие шаги

1. Обновить оставшиеся API файлы
2. Обновить UI компоненты
3. Запустить проверку типов: `bun run typecheck`
4. Протестировать функциональность
