# Response Detail Components

## Архитектура

Компоненты откликов разделены на две независимые группы для **vacancy** и **gig** откликов с полностью разными UI паттернами и бизнес-логикой.

## Старая архитектура (deprecated)

```typescript
// Устаревшие компоненты - не использовать в новом коде
import { ResponseDetailCard, GigResponseTabs, VacancyResponseTabs } from "~/components/response-detail";

// Проблемы:
// - Общий тип ResponseDetail как union
// - Type guards в компонентах
// - Условная логика
// - Смешивание бизнес-логики
```

## Новая архитектура

### Vacancy отклики (Найм на работу)

```typescript
import {
  VacancyResponseDetailCard,
  VacancyResponseHeaderCard,
  VacancyResponseTabs,
  VacancySalaryCard,
  VacancyResumeCard
} from "~/components/vacancy/response-detail";

// Фокус на:
// - Резюме и опыт кандидата
// - Зарплатные ожидания
// - Процесс найма (интервью → оффер → онбординг)
```

### Gig отклики (Разовые задания)

```typescript
import {
  GigResponseDetailCard,
  GigResponseHeaderCard,
  GigResponseTabs,
  GigPricingCard,
  GigPortfolioCard
} from "~/components/gig/response-detail";

// Фокус на:
// - Ценовые предложения и сроки
// - Портфолио исполнителя
// - Качество и рейтинг работ
```

## Специфичные компоненты

### Vacancy компоненты

#### VacancyResponseHeaderCard
- Крупное отображение зарплатных ожиданий
- Индикатор наличия резюме
- Статусы найма (новый, оценен, интервью, переговоры, завершен)

#### VacancySalaryCard
- Детальный анализ зарплатных ожиданий
- Сравнение с рыночными ставками
- Комментарии кандидата

#### VacancyResumeCard
- Скачивание и просмотр резюме
- Ссылки на профили платформ
- Контактная информация

### Gig компоненты

#### GigResponseHeaderCard
- Ценовое предложение и сроки prominently
- Рейтинг исполнителя
- Наличие портфолио

#### GigPricingCard
- Детальный анализ цены и сроков
- Сравнение с рыночными показателями
- Стоимость за день работы
- Кнопки для принятия/обсуждения условий

#### GigPortfolioCard
- Просмотр работ портфолио
- Скачивание прикрепленных файлов
- Навыки и опыт исполнителя

## Типы данных

### VacancyResponse
```typescript
type VacancyResponse = Response & {
  entityType: 'vacancy';
  resumeId: string | null;
  resumeUrl: string | null;
  platformProfileUrl: string | null;
  salaryExpectationsAmount: number | null;
  salaryExpectationsComment: string | null;
  screening: ScreeningData | null;
}
```

### GigResponse
```typescript
type GigResponse = Response & {
  entityType: 'gig';
  proposedPrice: number | null;
  proposedDeliveryDays: number | null;
  portfolioLinks: string[] | null;
  portfolioFileId: string | null;
  compositeScore: number | null;
  priceScore: number | null;
  deliveryScore: number | null;
  // ... reasoning поля
}
```

## Бизнес-процессы

### Vacancy flow
1. **Новый** → HR видит базовую информацию
2. **Оценка** → AI анализирует резюме
3. **Интервью** → Диалог с кандидатом
4. **Переговоры** → Обсуждение условий
5. **Оффер** → Предложение работы
6. **Онбординг** → Введение в должность

### Gig flow
1. **Новый** → Просмотр предложения
2. **Оценка** → AI рейтинг исполнителя
3. **Выбор** → Принятие ценового предложения
4. **Контракт** → Согласование деталей
5. **Выполнение** → Работа над заданием
6. **Приемка** → Проверка результата

## Миграция

1. **Новые компоненты**: Использовать новые типизированные компоненты
2. **Роутинг**: Обновлен для использования новых компонентов
3. **API**: Совместимо с существующими типами
4. **Миграция**: Постепенная замена старых компонентов

## Файловая структура

```
components/
├── vacancy/
│   └── response-detail/
│       ├── detail-card.tsx                    # Главный компонент vacancy
│       ├── header-card.tsx                    # Шапка с зарплатой и резюме
│       ├── tabs.tsx                          # Вкладки vacancy
│       ├── salary-card.tsx                    # Детальная карточка зарплаты
│       ├── resume-card.tsx                    # Карточка резюме и контактов
│       ├── hooks/
│       │   └── use-vacancy-response-flags.ts # Логика вкладок
│       └── types.ts                          # TypeScript типы
└── gig/
    └── response-detail/
        ├── detail-card.tsx                    # Главный компонент gig
        ├── header-card.tsx                    # Шапка с ценой и рейтингом
        ├── tabs.tsx                          # Вкладки gig
        ├── pricing-card.tsx                   # Детальная карточка ценообразования
        ├── portfolio-card.tsx                 # Карточка портфолио и навыков
        ├── hooks/
        │   └── use-gig-response-flags.ts     # Логика вкладок
        └── types.ts                          # TypeScript типы
```