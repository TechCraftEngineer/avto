# Webhook Service

Легковесный сервис на Hono для обработки webhook-уведомлений от внешних систем.

## Преимущества отдельного сервиса

- **Независимое масштабирование** - webhook может обрабатываться отдельно от основного API
- **Упрощенная безопасность** - легче настроить IP-whitelisting и rate limiting
- **Лучшая производительность** - Hono быстрее для простых HTTP endpoints
- **Изоляция** - проблемы с webhook не влияют на основной API
- **Простота деплоя** - можно развернуть на edge (Cloudflare Workers, Vercel Edge)

## Структура

```
apps/webhooks/
├── src/
│   ├── index.ts                    # Главный файл сервиса
│   ├── routes/
│   │   └── yookassa.ts             # Роутер для ЮКасса webhook
│   └── services/
│       └── yookassa-client.ts      # Клиент для API ЮКасса
├── package.json
├── tsconfig.json
└── README.md
```

## Запуск

### Development

```bash
bun run dev
```

Сервис запустится на порту 3001 (или WEBHOOKS_PORT из .env)

### Production

```bash
bun run build
bun run start
```

## Endpoints

### Health Check

```
GET /health
```

Возвращает статус сервиса:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "webhooks"
}
```

### ЮКасса Webhook

```
POST /webhooks/yookassa
```

Обрабатывает webhook-уведомления от ЮКасса о изменении статуса платежа.

**Требования безопасности:**
- HTTPS соединение (TLS 1.2+)
- Порт 443 или 8443
- API-верификация через GET-запрос к ЮКасса

**Тело запроса:**

```json
{
  "type": "notification",
  "event": "payment.succeeded",
  "object": {
    "id": "payment_id",
    "status": "succeeded",
    "amount": {
      "value": "1000.00",
      "currency": "RUB"
    },
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Успешный ответ (200):**

```json
{
  "success": true
}
```

**Ошибки:**

- `400 Bad Request` - невалидная структура webhook
- `403 Forbidden` - не прошла проверка безопасности или API-верификация
- `404 Not Found` - платеж не найден в БД
- `500 Internal Server Error` - внутренняя ошибка сервера

## Переменные окружения

```bash
# Порт сервиса (по умолчанию 3001)
WEBHOOKS_PORT=3001

# Учетные данные ЮКасса
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_API_URL=https://api.yookassa.ru/v3

# База данных (используется из @qbs-autonaim/db)
POSTGRES_URL=postgresql://...
```

## Безопасность

### API-верификация (Метод 2)

Сервис использует API-верификацию для проверки подлинности webhook:

1. Получает webhook-уведомление
2. Выполняет GET-запрос к API ЮКасса для получения актуального статуса
3. Сравнивает статус из webhook со статусом из API
4. Использует статус из API как более надежный источник

Это обеспечивает:
- Защиту от поддельных webhook-уведомлений
- Актуальность данных о статусе платежа
- Независимость от IP-адресов (которые могут меняться)

### HTTPS и порты

Сервис принимает webhook только:
- Через HTTPS с TLS 1.2+
- На портах 443 или 8443

### Логирование

Все операции логируются в структурированном JSON-формате:
- Получение webhook
- API-верификация
- Обновление статуса
- Ошибки

## Деплой

### Docker

```dockerfile
FROM oven/bun:1.3.10

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3001

CMD ["bun", "run", "start"]
```

### Vercel Edge

Можно развернуть на Vercel Edge Functions для минимальной задержки:

```typescript
// vercel.json
{
  "functions": {
    "apps/webhooks/src/index.ts": {
      "runtime": "edge"
    }
  }
}
```

### Cloudflare Workers

Hono отлично работает на Cloudflare Workers:

```bash
bun run build
wrangler deploy
```

## Мониторинг

Рекомендуется настроить мониторинг для:
- Количества обработанных webhook
- Времени обработки
- Ошибок API-верификации
- Отклоненных webhook (безопасность)

## Тестирование

Для тестирования webhook локально используйте ngrok или локальный туннель:

```bash
# Запустите сервис
bun run dev

# В другом терминале создайте туннель
ngrok http 3001

# Используйте URL от ngrok для настройки webhook в ЮКасса
```

## Связь с основным API

### Разделение ответственности

**Webhook-сервис (Hono)** - `apps/webhooks/`:
- Обработка webhook-уведомлений от ЮКасса
- API-верификация webhook
- Обновление статусов платежей в БД

**Основной API (tRPC)** - `packages/api/src/routers/payment/`:
- Создание платежей (create)
- Получение информации о платежах (get, list)
- Проверка статуса платежей (checkStatus)

### Общие зависимости

Оба сервиса используют:
- `@qbs-autonaim/db` - для доступа к базе данных
- `@qbs-autonaim/validators` - для валидации данных

### Почему отдельный сервис?

1. **Производительность**: Hono в 3-5 раз быстрее для простых HTTP endpoints
2. **Масштабирование**: Независимое от основного API
3. **Безопасность**: Легче настроить rate limiting и IP-whitelisting
4. **Изоляция**: Проблемы с webhook не влияют на основной API
