# Interview Chat Stream API

Модульная архитектура для обработки стриминга чата интервью.

## Структура модулей

### handler.ts
Главный обработчик POST запросов. Координирует все модули и возвращает стрим.

### schema.ts
Zod схемы валидации для входящих запросов:
- `requestSchema` - валидация тела запроса
- Поддержка text и file parts
- Поддержка tool approval flows

### access-control.ts
Проверка доступа к интервью:
- `checkInterviewAccess()` - валидация токена и прав доступа
- `loadInterviewSession()` - загрузка и валидация сессии

### context-loader.ts
Загрузка контекста вакансии/задания:
- `loadInterviewContext()` - загружает vacancy/gig и настройки компании

### conversation-builder.ts
Формирование истории диалога:
- `buildConversationHistory()` - для оркестратора
- `formatMessagesForModel()` - для AI модели

### message-handler.ts
Работа с сообщениями:
- `extractMessageText()` - извлечение текста из сообщения
- `hasVoiceFile()` - проверка наличия голосового файла
- `saveUserMessage()` - сохранение сообщения пользователя
- `saveAssistantMessages()` - сохранение ответов ассистента

### stream-executor.ts
Выполнение стриминга с fallback:
- `executeStreamWithFallback()` - автоматическое переключение на fallback модель
- Обработка таймаутов и сетевых ошибок

### resumable-stream-helper.ts
Поддержка resumable streams (требует Redis):
- `getStreamContext()` - создание контекста для восстановления стримов
- `isRedisAvailable()` - проверка доступности Redis

## Улучшения из ai-chatbot

1. ✅ Структурированная обработка ошибок через `InterviewSDKError`
2. ✅ Строгая валидация с Zod v4
3. ✅ Разделение логики на модули
4. ✅ Автоматический fallback на резервную модель
5. ✅ Поддержка resumable streams
6. ✅ Правильная типизация Database
7. ✅ Оптимизация сохранения сообщений

## Использование

```typescript
import { POST, maxDuration } from "./handler";

export { POST, maxDuration };
```
