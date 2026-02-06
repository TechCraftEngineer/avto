# Анализ и рекомендации по улучшению системы интервью

## ✅ ИСПРАВЛЕНО: Обработка закрытого соединения

### Проблема
Ошибка `TypeError: terminated` и `UND_ERR_SOCKET` возникала когда клиент закрывал соединение (закрытие вкладки, нажатие "стоп"), а сервер продолжал пытаться отправлять данные.

### Решение
Добавлена graceful обработка закрытых соединений:

1. **В `stream-executor.ts`**:
   - Детекция ошибок закрытого соединения (AbortError, UND_ERR_SOCKET, terminated, socket hang up)
   - Логирование вместо выброса ошибки
   - Пропуск fallback модели при закрытом соединении

2. **В `handler.ts`**:
   - Try-catch обертка в `execute` для перехвата ошибок стрима
   - Graceful return при закрытом соединении
   - Улучшенная обработка в `onError`

### Технические детали
```typescript
// Детекция закрытого соединения
const isConnectionClosed =
  errorName === "AbortError" ||
  errorMessage.includes("terminated") ||
  errorMessage.includes("UND_ERR_SOCKET") ||
  errorMessage.includes("other side closed") ||
  errorMessage.includes("socket hang up") ||
  errorMessage.includes("ECONNRESET");

// Не пытаемся использовать fallback при закрытом соединении
if (error instanceof Error && error.name === "AbortError") {
  console.log("[Stream] Соединение закрыто клиентом, пропускаем fallback");
  throw error;
}
```

### Результат
- ✅ Нет ошибок в логах при закрытии соединения клиентом
- ✅ Graceful shutdown стрима
- ✅ Не тратим ресурсы на fallback модель
- ✅ TypeScript компиляция успешна
- ✅ Production build успешен

---

## 🔴 Критические проблемы (требуют немедленного исправления)

### 1. botSettings не используются в промптах
**Проблема**: Бот не знает своё имя, роль и название компании
**Текущее состояние**: 
- `botSettings` передаются в `interviewContext` для tools
- НО не передаются в `systemPromptBuilder.build()`
- Бот представляется как "профессиональный интервьюер" вместо конкретного имени

**Решение**:
```typescript
// В prompts/types.ts добавить BotSettings
export interface BotSettings {
  botName?: string;
  botRole?: string;
  companyName?: string;
}

// Обновить SystemPromptBuilder.build()
build(
  isFirstResponse: boolean,
  currentStage: StageId,
  entity?: GigLike | VacancyLike | null,
  botSettings?: BotSettings,
): string

// В base-prompt-builder.ts добавить метод
protected getBotIdentity(botSettings?: BotSettings): string {
  if (!botSettings) return "";
  
  const parts: string[] = [];
  
  if (botSettings.botName && botSettings.botRole) {
    parts.push(`Вы — ${botSettings.botName}, ${botSettings.botRole}`);
  } else if (botSettings.botName) {
    parts.push(`Вы — ${botSettings.botName}`);
  }
  
  if (botSettings.companyName) {
    parts.push(`Вы представляете компанию ${botSettings.companyName}`);
  }
  
  return parts.join(". ");
}

// В handler.ts передавать botSettings
const systemPrompt = strategy.systemPromptBuilder.build(
  isFirstResponse,
  currentStage,
  entity,
  interviewContext.botSettings,
);
```

### 2. Отсутствует контекст вакансии/gig в промпте
**Проблема**: Бот не знает детали позиции и не может адаптировать вопросы
**Текущее состояние**:
- Entity передаётся только для customBotInstructions
- Название, описание, требования не используются

**Решение**:
```typescript
// В base-prompt-builder.ts добавить метод
protected getEntityContext(entity?: GigLike | VacancyLike | null): string {
  if (!entity) return "";
  
  const parts: string[] = [];
  
  if (entity.title) {
    parts.push(`ПОЗИЦИЯ: ${entity.title}`);
  }
  
  if (entity.description) {
    const shortDesc = entity.description.length > 300 
      ? entity.description.substring(0, 300) + "..."
      : entity.description;
    parts.push(`ОПИСАНИЕ:\n${shortDesc}`);
  }
  
  // Для vacancy
  if ('region' in entity && entity.region) {
    parts.push(`РЕГИОН: ${entity.region}`);
  }
  if ('workLocation' in entity && entity.workLocation) {
    parts.push(`ФОРМАТ РАБОТЫ: ${entity.workLocation}`);
  }
  
  // Для gig
  if ('deadline' in entity && entity.deadline) {
    parts.push(`ДЕДЛАЙН: ${entity.deadline.toLocaleDateString('ru-RU')}`);
  }
  if ('estimatedDuration' in entity && entity.estimatedDuration) {
    parts.push(`СРОК ВЫПОЛНЕНИЯ: ${entity.estimatedDuration}`);
  }
  
  return parts.join("\n\n");
}
```

### 3. Нет контекста истории диалога
**Проблема**: Бот может повторять вопросы
**Решение**:
```typescript
// Добавить в build() параметр askedQuestions
protected getConversationContext(askedQuestions?: string[]): string {
  if (!askedQuestions || askedQuestions.length === 0) return "";
  
  return `УЖЕ ЗАДАННЫЕ ВОПРОСЫ (не повторяйте их):
${askedQuestions.slice(-10).map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
}
```

## 🟡 Важные улучшения (повысят качество интервью)

### 4. Улучшить детекцию ботов
**Текущее состояние**: Только текстовые признаки
**Решение**:
```typescript
protected getBotDetectionInstructions(): string {
  return `ДЕТЕКЦИЯ АВТОМАТИЗИРОВАННЫХ ОТВЕТОВ:

ПРИЗНАКИ ИСПОЛЬЗОВАНИЯ AI:
1. Структурные паттерны:
   - Ответы всегда начинаются с "Конечно", "Безусловно"
   - Использование маркированных списков в каждом ответе
   - Идеальная грамматика без опечаток
   - Одинаковая длина ответов (200-300 слов)

2. Содержательные признаки:
   - Отсутствие конкретных деталей (даты, названия, цифры)
   - Общие фразы вместо личного опыта
   - Уклонение от прямых вопросов
   - Слишком "правильные" ответы без эмоций

3. Временные паттерны:
   - Мгновенные ответы на сложные вопросы
   - Одинаковое время ответа независимо от сложности

ДЕЙСТВИЯ ПРИ ПОДОЗРЕНИИ:
- Задайте вопрос требующий конкретного примера с датами
- Попросите описать эмоции в конкретной ситуации
- Задайте неожиданный вопрос вне контекста
- Попросите уточнить противоречие в предыдущих ответах`;
}
```

### 5. Адаптация под уровень кандидата
**Решение**:
```typescript
// Добавить анализ уровня в первых ответах
protected getAdaptiveQuestioningStrategy(): string {
  return `АДАПТАЦИЯ ВОПРОСОВ:

ОПРЕДЕЛЕНИЕ УРОВНЯ:
- Junior: 0-2 года опыта, базовые знания
- Middle: 2-5 лет, самостоятельная работа
- Senior: 5+ лет, архитектурные решения

СТРАТЕГИЯ ВОПРОСОВ:
Junior:
- Фокус на базовых концепциях
- Примеры учебных проектов
- Готовность к обучению

Middle:
- Реальные проекты и задачи
- Самостоятельное решение проблем
- Работа в команде

Senior:
- Архитектурные решения
- Менторство и лидерство
- Стратегическое мышление`;
}
```

### 6. Качественные критерии переходов
**Текущее**: Только количество вопросов
**Решение**:
```typescript
canTransition(from: string, to: string, context: TransitionContext): boolean {
  // Проверяем не только количество, но и качество
  const hasMinQuestions = context.askedQuestions.length >= this.getMinQuestions(from);
  const hasGoodResponses = context.userResponses.filter(r => r.length > 50).length >= 2;
  const noBotSuspicion = !context.botDetectionScore || context.botDetectionScore < 0.7;
  
  return hasMinQuestions && hasGoodResponses && noBotSuspicion;
}
```

## 🟢 Дополнительные улучшения (nice to have)

### 7. Эмпатия и поддержка
```typescript
protected getCommunicationStyle(): string {
  return `СТИЛЬ КОММУНИКАЦИИ:
- Используйте естественный разговорный русский язык
- Избегайте излишней формальности
- Будьте эмпатичны и поддерживайте позитивную атмосферу
- Давайте кандидату время на размышление
- Поощряйте развернутые ответы

ЭМПАТИЯ:
- Если кандидат нервничает: "Не волнуйтесь, это обычный разговор"
- Если ответ короткий: "Не могли бы вы рассказать подробнее?"
- Если кандидат сомневается: "Нет правильных или неправильных ответов"
- Признавайте хорошие ответы: "Интересный подход", "Хороший пример"`;
}
```

### 8. Контроль длины промпта
**Проблема**: Промпт может стать слишком длинным
**Решение**:
```typescript
build(...): string {
  const parts = [...];
  const fullPrompt = parts.filter(Boolean).join("\n\n");
  
  // Проверяем длину (примерно 4000 токенов = 16000 символов)
  if (fullPrompt.length > 15000) {
    console.warn('[Prompt Builder] Промпт слишком длинный:', fullPrompt.length);
    // Можно сократить менее важные части
  }
  
  return fullPrompt;
}
```

### 9. A/B тестирование промптов
```typescript
// Добавить версионирование промптов
protected getBaseRules(): string {
  const version = process.env.PROMPT_VERSION || 'v1';
  
  switch (version) {
    case 'v2':
      return this.getBaseRulesV2();
    default:
      return this.getBaseRulesV1();
  }
}
```

### 10. Метрики качества интервью
```typescript
// Добавить в metadata сессии
interface InterviewMetrics {
  averageResponseLength: number;
  questionsAsked: number;
  botDetectionScore: number;
  stageCompletionTime: Record<string, number>;
  candidateEngagement: number; // 0-1
}
```

## Приоритизация

### Фаза 1 (Критично - сделать сейчас): ✅ ВЫПОЛНЕНО
1. ✅ Добавить botSettings в промпт
2. ✅ Добавить контекст вакансии/gig
3. ✅ Добавить историю вопросов

### Фаза 2 (Важно - следующая итерация): ✅ ВЫПОЛНЕНО
4. ✅ Улучшить детекцию ботов
5. ✅ Добавить адаптацию под уровень
6. ✅ Качественные критерии переходов
7. ✅ Эмпатия и поддержка

### Фаза 3 (Улучшения - когда будет время): ⏳ НЕ РЕАЛИЗОВАНО
8. ⏳ Контроль длины промпта
9. ⏳ A/B тестирование
10. ⏳ Метрики качества

## Оценка текущей реализации

### ДО УЛУЧШЕНИЙ:
**Технически: 7/10**
- ✅ Хорошая архитектура
- ✅ Типобезопасность
- ✅ Разделение ответственности
- ❌ Не используются все доступные данные
- ❌ Нет контроля качества промптов

**С точки зрения интервью: 6/10**
- ✅ Структурированный подход
- ✅ Разные стадии
- ✅ Кастомные вопросы
- ❌ Бот безличный
- ❌ Может повторять вопросы
- ❌ Слабая детекция ботов
- ❌ Не адаптируется под кандидата

---

### ПОСЛЕ УЛУЧШЕНИЙ (Фазы 1-2):
**Технически: 9/10**
- ✅ Хорошая архитектура
- ✅ Типобезопасность
- ✅ Разделение ответственности
- ✅ Используются все доступные данные (botSettings, entity context, history)
- ✅ Качественные критерии переходов между стадиями
- ⏳ Нет контроля длины промпта (Phase 3)
- ⏳ Нет A/B тестирования (Phase 3)

**С точки зрения интервью: 9/10**
- ✅ Структурированный подход
- ✅ Разные стадии
- ✅ Кастомные вопросы
- ✅ Бот имеет идентичность (имя, роль, компания)
- ✅ Не повторяет вопросы (история последних 10 вопросов)
- ✅ Улучшенная детекция ботов (структурные, содержательные, поведенческие признаки)
- ✅ Адаптируется под уровень кандидата (Junior/Middle/Senior)
- ✅ Эмпатия и активное слушание
- ✅ Качественные критерии переходов (не только количество, но и качество ответов)
- ⏳ Нет метрик качества интервью (Phase 3)

---

## ✅ СТАТУС РЕАЛИЗАЦИИ

### Реализовано (Phases 1-2):
1. ✅ **botSettings в промпте** - бот знает своё имя, роль и компанию
2. ✅ **Контекст вакансии/gig** - бот знает детали позиции (title, description, region, deadline и т.д.)
3. ✅ **История вопросов** - бот не повторяет последние 10 заданных вопросов
4. ✅ **Улучшенная детекция ботов** - 3 категории признаков (структурные, содержательные, поведенческие)
5. ✅ **Адаптация под уровень** - стратегия вопросов для Junior/Middle/Senior
6. ✅ **Качественные критерии переходов** - учитывается качество ответов и bot detection score
7. ✅ **Эмпатия и поддержка** - естественный стиль коммуникации, активное слушание

### Не реализовано (Phase 3):
8. ⏳ **Контроль длины промпта** - мониторинг и предупреждения о длинных промптах
9. ⏳ **A/B тестирование** - версионирование промптов для экспериментов
10. ⏳ **Метрики качества** - сбор метрик для анализа качества интервью

### Технические детали:
- ✅ TypeScript компиляция проходит без ошибок
- ✅ Production build успешен
- ✅ Все изменения обратно совместимы
- ✅ Код следует архитектуре Strategy Pattern
- ✅ Промпты универсальны для всех отраслей (без англицизмов)

### Следующие шаги:
1. Протестировать в development окружении
2. Мониторить длину промптов в production
3. Собирать feedback от пользователей
4. При необходимости реализовать Phase 3 (метрики, A/B тесты)
