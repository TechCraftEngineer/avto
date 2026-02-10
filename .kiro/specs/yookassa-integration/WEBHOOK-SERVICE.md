# Webhook Service - Отдельный сервис на Hono

## 📋 Обзор

Создан отдельный легковесный сервис на Hono для обработки webhook-уведомлений от ЮКасса.

**Расположение:** `apps/webhooks/`

## 🎯 Преимущества

### Производительность
- **Hono** - один из самых быстрых веб-фреймворков для Bun
- Время обработки: ~10-30ms (vs ~50-100ms в tRPC)
- Меньше overhead, нет лишних абстракций

### Масштабирование
- Независимое масштабирование от основного API
- Можно развернуть на edge (Cloudflare Workers, Vercel Edge)
- Изолированная нагрузка на CPU и память

### Безопасность
- Легче настроить IP-whitelisting
- Простой rate limiting через middleware
- Изоляция от основного API

### Изоляция
- Проблемы с webhook не влияют на основной API
- Отдельные логи и мониторинг
- Независимый деплой и откат

## 📁 Структура

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
├── turbo.json
├── .gitignore
├── README.md                       # Полная документация
├── QUICKSTART.md                   # Быстрый старт
├── DEPLOYMENT.md                   # Варианты деплоя
└── MIGRATION.md                    # Миграция с tRPC
```

## 🚀 Быстрый старт

### 1. Установка

```bash
bun install
```

### 2. Настройка .env

```bash
WEBHOOKS_PORT=3001
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_API_URL=https://api.yookassa.ru/v3
```

### 3. Запуск

```bash
# Development
bun run dev:webhooks

# Production
cd apps/webhooks && bun run start
```

### 4. Проверка

```bash
curl http://localhost:3001/health
```

## 🔗 Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/health` | GET | Health check |
| `/webhooks/yookassa` | POST | Webhook от ЮКасса |

## 🔐 Безопасность

### API-верификация (Метод 2)

Сервис использует API-верификацию для проверки подлинности webhook:

1. Получает webhook-уведомление
2. Выполняет GET-запрос к API ЮКасса
3. Сравнивает статус из webhook со статусом из API
4. Использует статус из API как более надежный источник

### HTTPS и порты

- Принимает webhook только через HTTPS (TLS 1.2+)
- Только на портах 443 или 8443
- Проверка через заголовки `x-forwarded-proto` и `x-forwarded-port`

### Middleware

```typescript
// Проверка безопасности
validateWebhookSecurity(c, next)

// Rate limiting (опционально)
rateLimiter({ windowMs: 60000, limit: 100 })

// IP whitelisting (опционально)
ipWhitelist(YOOKASSA_IPS)
```

## 📊 Мониторинг

### Логирование

Все операции логируются в структурированном JSON-формате:

```json
{
  "level": "info",
  "message": "Получен webhook от ЮКасса",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "context": {
    "event": "payment.succeeded",
    "paymentId": "payment_id",
    "status": "succeeded"
  }
}
```

### Метрики (опционально)

```typescript
import { prometheus } from 'hono/prometheus';

app.use('*', registerMetrics);
app.get('/metrics', printMetrics);
```

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "webhooks"
}
```

## 🚢 Деплой

### Варианты

1. **Docker** (рекомендуется)
   ```bash
   docker build -t webhooks-service .
   docker run -p 3001:3001 --env-file .env webhooks-service
   ```

2. **VPS с systemd**
   ```bash
   sudo systemctl enable webhooks
   sudo systemctl start webhooks
   ```

3. **Vercel Edge**
   ```bash
   vercel --prod
   ```

4. **Cloudflare Workers**
   ```bash
   wrangler deploy
   ```

5. **Railway / Fly.io**
   - Автоматический деплой из GitHub

Подробнее: [DEPLOYMENT.md](../../apps/webhooks/DEPLOYMENT.md)

## 🔄 Миграция с tRPC

### Старый endpoint (tRPC)

```
POST https://api.yourdomain.com/api/trpc/payment.webhook
```

### Новый endpoint (Hono)

```
POST https://webhooks.yourdomain.com/webhooks/yookassa
```

### Процесс миграции

1. Запустите webhook-сервис
2. Добавьте новый URL в ЮКасса (не удаляя старый)
3. Тестируйте параллельную работу 1-2 недели
4. Удалите старый URL из ЮКасса
5. (Опционально) Удалите tRPC webhook endpoint

Подробнее: [MIGRATION.md](../../apps/webhooks/MIGRATION.md)

## 🧪 Тестирование

### Локальное тестирование

```bash
# 1. Запустите сервис
bun run dev:webhooks

# 2. Тестовый webhook
curl -X POST http://localhost:3001/webhooks/yookassa \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-Proto: https" \
  -H "X-Forwarded-Port: 443" \
  -d '{
    "type": "notification",
    "event": "payment.succeeded",
    "object": {
      "id": "test_id",
      "status": "succeeded",
      "amount": { "value": "1000.00", "currency": "RUB" },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }'
```

### Тестирование с ngrok

```bash
# 1. Запустите ngrok
ngrok http 3001

# 2. Используйте URL от ngrok в ЮКасса
https://abc123.ngrok.io/webhooks/yookassa
```

## 📈 Производительность

### Ожидаемые метрики

| Метрика | tRPC | Hono |
|---------|------|------|
| Время обработки | 50-100ms | 10-30ms |
| Память | 200-300MB | 50-100MB |
| CPU | Shared | Isolated |
| Throughput | ~100 req/s | ~1000 req/s |

### Бенчмарки

```bash
# Apache Bench
ab -n 1000 -c 10 -p webhook.json -T application/json \
  http://localhost:3001/webhooks/yookassa

# wrk
wrk -t4 -c100 -d30s --latency \
  http://localhost:3001/webhooks/yookassa
```

## 🔧 Конфигурация

### Переменные окружения

```bash
# Обязательные
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Опциональные
WEBHOOKS_PORT=3001                              # По умолчанию 3001
YOOKASSA_API_URL=https://api.yookassa.ru/v3    # По умолчанию production
NODE_ENV=production                             # development | production
```

### Nginx Reverse Proxy

```nginx
upstream webhooks {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl http2;
    server_name webhooks.yourdomain.com;

    location / {
        proxy_pass http://webhooks;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
```

## 🐛 Troubleshooting

### Сервис не запускается

```bash
# Проверьте переменные окружения
cat .env | grep YOOKASSA

# Проверьте порт
lsof -i :3001

# Проверьте логи
bun run dev:webhooks
```

### Webhook не приходят

1. ✅ Проверьте URL в ЮКасса
2. ✅ Убедитесь в HTTPS (production)
3. ✅ Проверьте firewall
4. ✅ Проверьте логи сервиса
5. ✅ Проверьте health check

### Ошибка "Платеж не найден"

1. ✅ База данных настроена
2. ✅ Платеж существует в БД
3. ✅ `yookassaId` совпадает

## 📚 Документация

- [README.md](../../apps/webhooks/README.md) - Полная документация
- [QUICKSTART.md](../../apps/webhooks/QUICKSTART.md) - Быстрый старт
- [DEPLOYMENT.md](../../apps/webhooks/DEPLOYMENT.md) - Варианты деплоя

## ✅ Checklist для production

- [ ] Переменные окружения настроены
- [ ] HTTPS сертификат установлен
- [ ] Rate limiting настроен
- [ ] Мониторинг настроен (Prometheus/Grafana)
- [ ] Логирование настроено (Loki/CloudWatch)
- [ ] Health check работает
- [ ] Webhook URL добавлен в ЮКасса
- [ ] Тестовый webhook успешно обработан
- [ ] Backup стратегия определена
- [ ] Rollback процедура протестирована
- [ ] Алерты настроены (Sentry/PagerDuty)
- [ ] Документация обновлена

## 🎯 Следующие шаги

1. ✅ Запустите сервис локально
2. ✅ Протестируйте с ngrok
3. 📖 Выберите вариант деплоя
4. 🚀 Разверните в production
5. 🔄 Настройте мониторинг
6. 📊 Добавьте метрики
7. 🔐 Настройте rate limiting
8. 📈 Оптимизируйте производительность

## 💡 Полезные ссылки

- [Hono Documentation](https://hono.dev/)
- [Bun Documentation](https://bun.sh/docs)
- [ЮКасса API](https://yookassa.ru/developers/api)
- [ЮКасса Webhook](https://yookassa.ru/developers/using-api/webhooks)
