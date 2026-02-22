# Рекомендации по Better Auth

## ✅ Что уже сделано

1. Добавлены переменные окружения `BETTER_AUTH_SECRET` и `BETTER_AUTH_URL`
2. Настроена конфигурация сессий (expiresIn, updateAge, cookieCache)
3. Включен rate limiting для защиты от брутфорса
4. Добавлены trustedOrigins для CSRF защиты
5. Настроен useSecureCookies для HTTPS

## 🔧 Следующие шаги

### 1. Обновите .env файл

```bash
# Добавьте в ваш .env:
BETTER_AUTH_SECRET=fv/bwv38c/0fyD6UP2AM5FNASRqxXP49TwgvSR73500=
BETTER_AUTH_URL=http://localhost:3000

# AUTH_SECRET можно оставить для обратной совместимости
```

### 2. Сгенерируйте схему БД

```bash
cd packages/auth
bun run generate
```

Это создаст файл `packages/db/src/auth-schema.ts` с актуальной схемой.

### 3. Production: Secondary Storage (Redis/KV)

Для production рекомендуется использовать Redis или другое KV хранилище для сессий:

```typescript
// packages/auth/src/index.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

// В конфигурации auth:
secondaryStorage: {
  get: async (key) => {
    const value = await redis.get(key)
    return value ? JSON.parse(value as string) : null
  },
  set: async (key, value, ttl) => {
    await redis.set(key, JSON.stringify(value), { ex: ttl })
  },
  delete: async (key) => {
    await redis.del(key)
  },
}
```

### 4. Мониторинг и логирование

Добавьте мониторинг для отслеживания:
- Неудачных попыток входа (rate limit срабатывания)
- Времени ответа auth endpoints
- Ошибок в onAPIError

### 5. Дополнительные плагины

Рассмотрите добавление:
- `twoFactor` - двухфакторная аутентификация
- `passkey` - вход через passkeys (WebAuthn)
- `admin` - административные функции
- `multiSession` - множественные сессии на разных устройствах

```typescript
import { twoFactor } from "better-auth/plugins/two-factor"
import { passkey } from "better-auth/plugins/passkey"

// В extraPlugins:
extraPlugins: [
  twoFactor(),
  passkey(),
]
```

## 📊 Текущая конфигурация

- **Сессии**: 7 дней, обновление каждый день
- **Cookie cache**: 5 минут
- **Rate limit**: 10 запросов в минуту
- **Storage**: PostgreSQL (рекомендуется Redis для production)
- **CSRF**: Включен с trustedOrigins
- **Secure cookies**: Автоматически для HTTPS

## 🔒 Безопасность

1. ✅ Используйте HTTPS в production
2. ✅ Минимум 32 символа для секрета
3. ⚠️ Настройте Redis для production
4. ⚠️ Включите email verification для новых пользователей
5. ⚠️ Рассмотрите 2FA для критичных операций

## 📚 Полезные ссылки

- [Better Auth Docs](https://better-auth.com/docs)
- [Options Reference](https://better-auth.com/docs/reference/options)
- [Security Best Practices](https://better-auth.com/docs/concepts/security)
