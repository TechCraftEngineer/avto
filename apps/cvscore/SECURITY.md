# Безопасность CVScore API

## Реализованные меры защиты

### 1. Rate Limiting
- **Лимит**: 5 запросов в минуту с одного IP
- **Реализация**: In-memory (для dev/demo)
- **Продакшен**: Требуется Redis/Upstash/Vercel KV для serverless

### 2. Защита от Prompt Injection
Блокируются паттерны:
- `ignore previous/above/all instructions`
- Системные токены: `system:`, `assistant:`, `<|im_start|>`, `[INST]`
- XSS векторы: `<script>`, `<iframe>`, `javascript:`, `onclick=`

### 3. Валидация входных данных
- Минимальная/максимальная длина текста
- Санитизация control characters
- Zod schema validation

### 4. Защита от DoS
- Лимит размера payload: 5MB
- Таймаут AI запроса: 30 секунд
- Проверка Content-Length header

### 5. Безопасность данных
- Санитизация перед сохранением в БД
- Опциональное хранение (требуется согласие)
- Валидация AI ответов

### 6. CORS
- Настроенные headers
- OPTIONS preflight support
- Ограничение методов (POST, OPTIONS)

### 7. Логирование
- Подозрительная активность
- Rate limit нарушения
- Ошибки валидации
- Timestamp + IP для аудита

## Рекомендации для продакшена

1. **Rate Limiting**: Мигрировать на Redis/Upstash
2. **WAF**: Добавить Cloudflare или AWS WAF
3. **Мониторинг**: Настроить алерты на подозрительную активность
4. **IP Whitelist**: Для критичных эндпоинтов
5. **API Keys**: Добавить аутентификацию для публичного API
6. **HTTPS**: Обязательно в продакшене
7. **Secrets**: Использовать env variables для чувствительных данных
