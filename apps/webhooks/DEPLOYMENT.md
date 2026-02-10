# Деплой Webhook-сервиса

## Варианты деплоя

### 1. Docker (рекомендуется для production)

```dockerfile
FROM oven/bun:1.3.9 as base

WORKDIR /app

# Копируем workspace файлы
COPY package.json bun.lock turbo.json ./
COPY apps/webhooks ./apps/webhooks
COPY packages ./packages

# Устанавливаем зависимости
RUN bun install --frozen-lockfile

# Собираем проект
RUN bun run build:webhooks

# Production образ
FROM oven/bun:1.3.9-slim

WORKDIR /app

COPY --from=base /app/apps/webhooks/dist ./dist
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3001

CMD ["bun", "run", "dist/index.js"]
```

**Запуск:**

```bash
docker build -t webhooks-service .
docker run -p 3001:3001 --env-file .env webhooks-service
```

### 2. Standalone Bun Server

Самый простой вариант для VPS/dedicated сервера:

```bash
# Установка зависимостей
bun install

# Production запуск
bun run --env-file .env apps/webhooks/src/index.ts
```

**Systemd service** (`/etc/systemd/system/webhooks.service`):

```ini
[Unit]
Description=Webhook Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/selectio
ExecStart=/usr/local/bin/bun run --env-file .env apps/webhooks/src/index.ts
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable webhooks
sudo systemctl start webhooks
sudo systemctl status webhooks
```

### 3. Vercel Edge Functions

Hono отлично работает на Vercel Edge:

**vercel.json:**

```json
{
  "functions": {
    "apps/webhooks/src/index.ts": {
      "runtime": "edge",
      "memory": 128,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/webhooks/:path*",
      "destination": "/apps/webhooks/src/index.ts"
    }
  ]
}
```

**Деплой:**

```bash
vercel --prod
```

### 4. Cloudflare Workers

**wrangler.toml:**

```toml
name = "webhooks-service"
main = "apps/webhooks/src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { WEBHOOKS_PORT = "3001" }

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

**Деплой:**

```bash
bun run build
wrangler deploy
```

### 5. Railway

Railway поддерживает Bun из коробки:

1. Подключите GitHub репозиторий
2. Выберите `apps/webhooks` как root directory
3. Добавьте переменные окружения
4. Railway автоматически определит Bun и запустит сервис

**railway.json:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install && bun run build"
  },
  "deploy": {
    "startCommand": "bun run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 6. Fly.io

**fly.toml:**

```toml
app = "webhooks-service"
primary_region = "ams"

[build]
  dockerfile = "Dockerfile"

[env]
  WEBHOOKS_PORT = "3001"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/health"
```

**Деплой:**

```bash
fly launch
fly deploy
```

## Nginx Reverse Proxy

Если деплоите на VPS, настройте Nginx:

```nginx
upstream webhooks {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl http2;
    server_name webhooks.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/webhooks.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhooks.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting для webhook
    limit_req_zone $binary_remote_addr zone=webhook_limit:10m rate=10r/s;
    limit_req zone=webhook_limit burst=20 nodelay;

    location / {
        proxy_pass http://webhooks;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://webhooks/health;
        access_log off;
    }
}
```

## Мониторинг

### Prometheus метрики

Добавьте в `apps/webhooks/src/index.ts`:

```typescript
import { prometheus } from 'hono/prometheus';

const { printMetrics, registerMetrics } = prometheus();

app.use('*', registerMetrics);
app.get('/metrics', printMetrics);
```

### Grafana Dashboard

Импортируйте готовый dashboard для Hono или создайте свой с метриками:
- Количество обработанных webhook
- Время обработки (p50, p95, p99)
- Количество ошибок
- Rate limiting срабатывания

### Sentry для ошибок

```typescript
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.onError((err, c) => {
  Sentry.captureException(err);
  // ... остальная обработка
});
```

## Настройка ЮКасса

1. Войдите в личный кабинет ЮКасса
2. Перейдите в раздел "Настройки" → "Уведомления"
3. Добавьте URL webhook: `https://webhooks.yourdomain.com/webhooks/yookassa`
4. Выберите события для уведомлений:
   - `payment.succeeded`
   - `payment.canceled`
   - `payment.waiting_for_capture`

## Тестирование в production

```bash
# Health check
curl https://webhooks.yourdomain.com/health

# Тестовый webhook (используйте реальные данные из ЮКасса)
curl -X POST https://webhooks.yourdomain.com/webhooks/yookassa \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-Proto: https" \
  -H "X-Forwarded-Port: 443" \
  -d '{
    "type": "notification",
    "event": "payment.succeeded",
    "object": {
      "id": "test_payment_id",
      "status": "succeeded",
      "amount": {
        "value": "1000.00",
        "currency": "RUB"
      },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }'
```

## Безопасность

### Rate Limiting

Добавьте rate limiting middleware:

```typescript
import { rateLimiter } from 'hono-rate-limiter';

app.use(
  '/webhooks/*',
  rateLimiter({
    windowMs: 60 * 1000, // 1 минута
    limit: 100, // 100 запросов
    standardHeaders: 'draft-6',
    keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
  })
);
```

### IP Whitelisting (опционально)

Если хотите использовать IP-whitelisting вместо API-верификации:

```typescript
const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
];

function isYookassaIP(ip: string): boolean {
  // Реализация проверки IP в диапазонах
  // Используйте библиотеку ipaddr.js или ip-range-check
}
```

## Логи

Логи пишутся в stdout в JSON формате. Настройте сбор логов:

### Docker Compose с Loki

```yaml
version: '3.8'

services:
  webhooks:
    build: .
    ports:
      - "3001:3001"
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
        loki-batch-size: "400"
```

### CloudWatch Logs (AWS)

```bash
# Установите CloudWatch agent
aws logs create-log-group --log-group-name /webhooks/production
```

## Rollback

Если что-то пошло не так:

```bash
# Docker
docker stop webhooks-service
docker run -p 3001:3001 webhooks-service:previous-version

# Systemd
sudo systemctl stop webhooks
# Откатите код на предыдущую версию
sudo systemctl start webhooks

# Vercel
vercel rollback
```

## Checklist перед деплоем

- [ ] Переменные окружения настроены
- [ ] HTTPS сертификат установлен
- [ ] Rate limiting настроен
- [ ] Мониторинг настроен (Prometheus/Grafana/Sentry)
- [ ] Логирование настроено
- [ ] Health check работает
- [ ] Webhook URL добавлен в ЮКасса
- [ ] Тестовый webhook успешно обработан
- [ ] Backup стратегия определена
- [ ] Rollback процедура протестирована
