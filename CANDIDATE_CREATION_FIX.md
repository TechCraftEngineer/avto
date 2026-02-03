# Исправление: Создание глобальных кандидатов при импорте откликов

## Проблема

При автоматическом импорте откликов через HH парсер не создавались записи в таблице `candidates` (глобальные кандидаты). Это приводило к тому, что:

- Отклики сохранялись в таблицу `response`
- Поле `globalCandidateId` оставалось пустым
- Не было централизованной базы кандидатов для дедупликации

## Причина

Функции парсера HH (`saveBasicResponse`, `enrichHHResponses`) не вызывали сервис создания кандидатов, в отличие от ручного импорта через `importBulkResponses`.

## Решение

### 1. Обновлен процесс обогащения откликов

**Файл:** `packages/jobs-parsers/src/parsers/hh/services/enricher.ts`

Добавлена логика создания глобального кандидата при обогащении отклика:

```typescript
// Создание или поиск глобального кандидата при наличии контактов
if (!globalCandidateId && (experienceData.contacts?.email || experienceData.phone || experienceData.contacts?.telegram)) {
  const candidateRepository = new CandidateRepository(db);
  
  const { candidate, created } = await candidateRepository.findOrCreateCandidate({
    organizationId: vacancy.workspace.organizationId,
    fullName: response.candidateName || "Без имени",
    email: experienceData.contacts?.email || null,
    phone: experienceData.phone || null,
    telegramUsername: experienceData.contacts?.telegram || null,
    resumeUrl: response.resumeUrl || null,
    source: "APPLICANT",
    originalSource: "HH",
  });

  globalCandidateId = candidate.id;
}
```

### 2. Расширен тип SaveResponseData

**Файл:** `packages/jobs-parsers/src/parsers/types.ts`

Добавлено поле `globalCandidateId`:

```typescript
export interface SaveResponseData {
  // ... существующие поля
  globalCandidateId?: string | null;
}
```

### 3. Обновлена функция updateResponseDetails

**Файл:** `packages/jobs/src/services/response/response-repository.ts`

- Добавлено сохранение `globalCandidateId` в отклик
- Добавлено логирование события `CANDIDATE_LINKED`

### 4. Добавлен новый тип события

**Файлы:**
- `packages/db/src/schema/response/response-history.ts`
- `packages/lib/src/vacancy-response-history.ts`

Добавлен тип события `CANDIDATE_LINKED` для отслеживания связывания откликов с глобальными кандидатами.

## Результат

Теперь при импорте откликов через HH парсер:

1. ✅ Создается базовый отклик в таблице `response`
2. ✅ При обогащении отклика контактными данными автоматически создается запись в таблице `candidates`
3. ✅ Поле `globalCandidateId` в отклике связывается с глобальным кандидатом
4. ✅ Работает дедупликация по email/phone/telegram
5. ✅ Логируется событие связывания кандидата

## Тестирование

Для проверки исправления:

1. Запустите импорт откликов через HH парсер
2. Дождитесь обогащения откликов (функция `enrichHHResponses`)
3. Проверьте таблицу `candidates` - должны появиться новые записи
4. Проверьте поле `global_candidate_id` в таблице `response` - должно быть заполнено
5. Проверьте таблицу `response_history` - должны быть события `CANDIDATE_LINKED`

## Совместимость

Изменения обратно совместимы:
- Существующие отклики без `globalCandidateId` продолжат работать
- При следующем обогащении для них будут созданы кандидаты
- Ручной импорт через `importBulkResponses` продолжает работать как прежде
