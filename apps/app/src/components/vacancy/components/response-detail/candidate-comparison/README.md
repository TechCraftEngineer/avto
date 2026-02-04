# Candidate Comparison Modal

Модуль для сравнения кандидатов по вакансии.

## Структура

```
candidate-comparison/
├── index.tsx                      # Главный компонент модалки
├── types.ts                       # Типы данных
├── utils.ts                       # Утилиты для расчетов
├── use-candidates-data.ts         # Хук для получения данных
├── comparison-table-header.tsx    # Заголовок таблицы с сортировкой
├── comparison-table-row.tsx       # Строка таблицы с данными кандидата
├── status-filter.tsx              # Фильтр по статусу
└── README.md                      # Документация
```

## Использование

```tsx
import { CandidateComparisonModal } from "./candidate-comparison";

<CandidateComparisonModal
  currentResponse={response}
  vacancyId={vacancyId}
/>
```

## Компоненты

### CandidateComparisonModal
Главный компонент модального окна для сравнения кандидатов.

**Props:**
- `currentResponse: VacancyResponse` - текущий отклик кандидата
- `vacancyId: string` - ID вакансии

### ComparisonTableHeader
Заголовок таблицы с возможностью сортировки по колонкам.

### ComparisonTableRow
Строка таблицы с данными одного кандидата.

### StatusFilter
Фильтр для отображения кандидатов по статусу.

## Хуки

### useCandidatesData
Получает список всех откликов вакансии и преобразует их в метрики для сравнения.

**Возвращает:**
- `candidates: CandidateMetrics[]` - список кандидатов с метриками
- `isLoading: boolean` - статус загрузки
- `total: number` - общее количество откликов

## Утилиты

### calculateMatchScore
Рассчитывает процент соответствия кандидата требованиям вакансии.

### calculateResponseTime
Рассчитывает время с момента отклика (в часах или днях).

### calculateLastActivity
Определяет последнюю активность кандидата.

### getExperienceFromProfile
Извлекает информацию об опыте из профиля кандидата.

### getStatusColor
Возвращает цветовую схему для статуса.

### getMatchScoreColor
Возвращает цвет для отображения оценки соответствия.

## Особенности

- Реальные данные через tRPC API
- Сортировка по всем колонкам
- Фильтрация по статусу
- Выделение текущего кандидата
- Адаптивный дизайн
- Состояния загрузки и пустого списка
