# @qbs-autonaim/ai

Пакет для управления промптами AI-ассистентов в проекте QBS Автонайм.

## Установка

```bash
bun add @qbs-autonaim/ai
```

## Использование

### Системные промпты

```typescript
import { SYSTEM_PROMPTS } from "@qbs-autonaim/ai";

const systemMessage = SYSTEM_PROMPTS.RESUME_ANALYZER;
```

### Промпты для вакансий

```typescript
import { buildVacancyRequirementsExtractionPrompt } from "@qbs-autonaim/ai";

const prompt = buildVacancyRequirementsExtractionPrompt(
  "Senior Frontend Developer",
  "Описание вакансии..."
);
```

### Промпты для скрининга

```typescript
import { 
  buildFullResumeScreeningPrompt,
  formatResumeForScreening 
} from "@qbs-autonaim/ai";

// Скрининг резюме
const resumePrompt = buildFullResumeScreeningPrompt(requirements, resumeData);

// Форматирование резюме
const formattedResume = formatResumeForScreening(resumeData);
```

### Промпты для интервью

```typescript
import { 
  buildInterviewQuestionPrompt,
  buildInterviewScoringPrompt 
} from "@qbs-autonaim/ai";

// Генерация следующего вопроса
const questionPrompt = buildInterviewQuestionPrompt(interviewContext);

// Финальный скоринг
const scoringPrompt = buildInterviewScoringPrompt(scoringContext);
```

### Промпты для кандидатов

```typescript
import { buildTelegramInvitePrompt } from "@qbs-autonaim/ai";

// Приглашение в Telegram
const invitePrompt = buildTelegramInvitePrompt(welcomeContext);
```

### Шаблоны промптов

```typescript
import { PROMPT_TEMPLATES, formatPrompt } from "@qbs-autonaim/ai";

const template = PROMPT_TEMPLATES.TEXT_ANALYSIS.user;
const prompt = formatPrompt(template, {
  text: "Текст для анализа",
  focus: "ключевые навыки"
});
```

## Структура

- `system-prompts.ts` - системные промпты для различных AI-ассистентов
- `user-prompts.ts` - пользовательские промпты и запросы
- `templates.ts` - шаблоны и утилиты для работы с промптами
- `vacancy-prompts.ts` - промпты для работы с вакансиями
- `screening-prompts.ts` - промпты для скрининга резюме
- `interview-prompts.ts` - промпты для проведения интервью
- `candidate-prompts.ts` - промпты для коммуникации с кандидатами

## Добавление новых промптов

1. Добавьте новый промпт в соответствующий файл
2. Экспортируйте его через `index.ts`
3. Обновите типы при необходимости
