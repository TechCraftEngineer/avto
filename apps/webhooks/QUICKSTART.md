# Быстрый старт - Webhook Service

## 🚀 Запуск за 3 минуты

### 1. Установка зависимостей

```bash
# Из корня проекта
bun install
```

### 2. Настройка переменных окружения

Добавьте в `.env` (в корне проекта):

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
cd apps/webhooks
bun run start
```

Сервис запустится на `http://localhost:3001`

## ✅ Проверка работы

### Health Check

```bash
curl http://localhost:3001/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "webhooks"
}
```

### Тестовый webhook

```bash
curl -X POST http://localhost:3001/webhooks/yookassa \
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

## 📝 Основные endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/health` | GET | Health check |
| `/webhooks/yookassa` | POST | Webhook от ЮКасса |

## 🔧 Локальное тестирование с ngrok

Для тестирования с реальными webhook от ЮКасса:

```bash
# 1. Запустите сервис
bun run dev:webhooks

# 2. В другом терминале запустите ngrok
ngrok http 3001

# 3. Используйте URL от ngrok в настройках ЮКасса
# Например: https://abc123.ngrok.io/webhooks/yookassa
```

## 📚 Дополнительная документация

- [README.md](./README.md) - Полная документация
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Варианты деплоя
- [MIGRATION.md](./MIGRATION.md) - Миграция с tRPC

## 🐛 Troubleshooting

### Сервис не запускается

```bash
# Проверьте переменные окружения
cat .env | grep YOOKASSA

# Проверьте порт
lsof -i :3001
```

### Webhook не приходят

1. Проверьте URL в настройках ЮКасса
2. Убедитесь, что используется HTTPS (для production)
3. Проверьте логи: `bun run dev:webhooks`

### Ошибка "Платеж не найден"

Убедитесь, что:
1. База данных настроена
2. Платеж существует в БД
3. `yookassaId` в webhook совпадает с ID в БД

## 💡 Полезные команды

```bash
# Запуск с автоперезагрузкой
bun run dev:webhooks

# Сборка для production
bun run build

# Запуск production версии
bun run start

# Проверка типов
bun run typecheck

# Просмотр логов (если используется systemd)
sudo journalctl -u webhooks -f
```

## 🎯 Следующие шаги

1. ✅ Запустите сервис локально
2. ✅ Протестируйте health check
3. ✅ Отправьте тестовый webhook
4. 📖 Прочитайте [DEPLOYMENT.md](./DEPLOYMENT.md) для деплоя
5. 🔄 Настройте мониторинг (Prometheus/Grafana)
6. 🔐 Настройте rate limiting для production
7. 📊 Добавьте метрики и алерты

## 🆘 Нужна помощь?

- Проверьте [README.md](./README.md) для детальной документации
- Посмотрите логи: `bun run dev:webhooks`
- Проверьте health check: `curl http://localhost:3001/health`
