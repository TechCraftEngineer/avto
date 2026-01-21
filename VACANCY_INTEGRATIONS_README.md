# Интеграции вакансий с платформами

## Обзор

Реализован отдельный интерфейс для управления связями вакансий с внешними платформами. Интерфейс позволяет:

1. **Показывать только активные интеграции** - отображаются только платформы, с которыми есть активные интеграции в workspace
2. **Добавлять связи с вакансиями** - возможность добавить ID или URL вакансии на платформе
3. **Валидировать интеграции** - проверка корректности данных интеграции
4. **Отображать статус** - визуальный индикатор статуса каждой интеграции

## API эндпоинты

### `freelancePlatforms.getVacancyIntegrations`
Получает список активных интеграций workspace и публикаций вакансии.

**Входные параметры:**
- `workspaceId: string` - ID workspace
- `vacancyId: string` - ID вакансии

**Возвращает:**
```typescript
{
  activeIntegrations: Array<{
    id: string;
    type: string;
    name: string;
    lastUsedAt: Date | null;
    createdAt: Date;
  }>;
  publications: Array<{
    id: string;
    vacancyId: string;
    platform: string;
    externalId: string | null;
    url: string | null;
    isActive: boolean;
    lastSyncedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

### `freelancePlatforms.updatePublication`
Обновляет данные публикации (externalId или URL).

**Входные параметры:**
- `workspaceId: string` - ID workspace
- `publicationId: string` - ID публикации
- `externalId?: string` - новый external ID
- `url?: string` - новый URL

### `freelancePlatforms.validatePublication`
Валидирует публикацию и обновляет её статус.

**Входные параметры:**
- `workspaceId: string` - ID workspace
- `publicationId: string` - ID публикации

**Возвращает:**
```typescript
{
  isValid: boolean;
  message: string;
  platform: string;
  url: string | null;
  externalId: string | null;
}
```

## UI компонент

### `VacancyIntegrationManager`
Основной компонент для управления интеграциями вакансий.

**Функциональность:**
- Отображение активных интеграций workspace
- Добавление новых публикаций
- Редактирование существующих публикаций
- Валидация публикаций
- Визуальные индикаторы статуса

**Особенности:**
- Показывает только платформы с активными интеграциями
- Валидирует URL и externalId
- Обновляет статус публикации после валидации
- Предоставляет удобный интерфейс для управления

## Интеграция

Компонент интегрирован в страницу вакансии (`/orgs/[orgSlug]/workspaces/[slug]/vacancies/[id]`) в правую колонку после блока шортлиста.

## Поддерживаемые платформы

- HeadHunter (HH)
- Avito
- SuperJob
- Habr Career
- Telegram

## Статусы интеграций

- **Активна** - интеграция настроена и прошла валидацию
- **Неактивна** - интеграция требует настройки или проверки

## Безопасность

- Все операции требуют доступа к workspace
- Проверка принадлежности публикаций к workspace
- Валидация входных данных через Zod схемы