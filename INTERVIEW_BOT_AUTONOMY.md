# Автономность бота интервью

## Проблема
Ранее в системе были жёстко заданные вопросы и логика их выбора, что ограничивало гибкость бота.

## Решение
Убраны все жёстко заданные вопросы. Теперь бот полностью автономен и генерирует всё сам на основе:
- Контекста позиции (vacancy/gig)
- Текущей стадии интервью
- Истории диалога
- Настроек бота (имя, роль, компания)
- Кастомных инструкций от работодателя

## Что изменилось

### 1. Убраны жёстко заданные вопросы из стратегий
**До:**
```typescript
protected _questionBank: QuestionBankConfig = {
  organizationalDefaults: [
    "Какой график работы вам подходит?",
    "Какие ожидания по зарплате?",
    // ... ещё 10+ вопросов
  ],
  technicalDefaults: [
    "Расскажите о вашем опыте...",
    // ... ещё 10+ вопросов
  ],
};
```

**После:**
```typescript
protected _questionBank: QuestionBankConfig = {
  organizationalDefaults: [],
  technicalDefaults: [],
  customQuestionsField: "customInterviewQuestions",
};
```

### 2. Метод getNextQuestion() теперь возвращает null
**До:**
```typescript
getNextQuestion(questionBank, interviewState): string | null {
  const stage = interviewState.stage;
  const asked = new Set(interviewState.askedQuestions);
  
  let availableQuestions: string[];
  switch (stage) {
    case "intro":
      availableQuestions = questionBank.organizational.slice(0, 2);
      break;
    case "org":
      availableQuestions = questionBank.organizational;
      break;
    // ... выбор из жёстко заданных вопросов
  }
  
  return availableQuestions.find((q) => !asked.has(q)) || null;
}
```

**После:**
```typescript
getNextQuestion(_questionBank, _interviewState): string | null {
  // Бот сам генерирует вопросы на основе промпта и контекста
  return null;
}
```

### 3. Убраны suggestedQuestions из UI
**До:**
```typescript
getWelcomeMessage() {
  return {
    title: "Добро пожаловать!",
    suggestedQuestions: [
      "Почему вас заинтересовала эта вакансия?",
      "Какие у вас сильные стороны?",
    ],
  };
}
```

**После:**
```typescript
getWelcomeMessage() {
  return {
    title: "Добро пожаловать!",
    subtitle: "Ответьте на несколько вопросов о себе",
    placeholder: "Расскажите о себе...",
    greeting: "Напишите сообщение, чтобы начать разговор",
  };
}
```

## Как бот генерирует вопросы

Бот использует системный промпт, который содержит:

1. **Идентичность бота**
   - Имя, роль, компания (если настроены)

2. **Контекст позиции**
   - Название, описание, требования
   - Регион, формат работы (для vacancy)
   - Дедлайн, бюджет (для gig)

3. **Текущая стадия**
   - Введение (intro)
   - Организационные вопросы (org)
   - Профессиональные вопросы (tech)
   - Мотивация (motivation) / Подход к задаче (task_approach)
   - Завершение (wrapup)

4. **История диалога**
   - Последние 5 заданных вопросов (чтобы не повторяться)

5. **Адаптивная стратегия**
   - Определение уровня кандидата (Junior/Middle/Senior)
   - Подстройка сложности вопросов

6. **Детекция ботов**
   - Признаки использования AI
   - Действия при подозрении

7. **Стиль коммуникации**
   - Эмпатия и поддержка
   - Активное слушание
   - Естественный разговорный язык

## Преимущества

✅ **Гибкость** - бот адаптируется под любую позицию и кандидата
✅ **Контекстность** - вопросы релевантны конкретной ситуации
✅ **Уникальность** - каждое интервью уникально
✅ **Адаптивность** - бот подстраивается под уровень кандидата
✅ **Естественность** - диалог течёт естественно, без шаблонов

## Технические детали

- ✅ TypeScript компиляция проходит без ошибок
- ✅ Production build успешен
- ✅ Все изменения обратно совместимы
- ✅ Промпты универсальны для всех отраслей
- ✅ Без англицизмов в пользовательских текстах

## Файлы изменены

- `apps/interview/src/app/api/interview/chat/stream/strategies/base-strategy.ts`
- `apps/interview/src/app/api/interview/chat/stream/strategies/vacancy-strategy.ts`
- `apps/interview/src/app/api/interview/chat/stream/strategies/gig-strategy.ts`
