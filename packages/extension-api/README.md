# Extension API

REST API на Hono для браузерного расширения Recruitment Assistant. Используется для импорта вакансий и откликов с HH.ru.

## Запуск

```bash
# Из корня репозитория
bun run dev:extension-api

# Или из пакета
cd packages/extension-api && bun run dev
```

По умолчанию сервис слушает порт **3002** (`EXTENSION_API_PORT`).

## Endpoints

| Метод | Путь | Авторизация |
|-------|------|-------------|
| GET | `/health` | — |
| POST | `/hh-import?type=vacancies` | Bearer token |
| POST | `/hh-import?type=responses` | Bearer token |
| GET | `/workspaces?organizationId=...` | Bearer token |

## Интеграция с расширением

Расширение использует `getExtensionApiUrl()` из `config.ts` — все запросы (hh-import, workspaces) идут на Hono API.

- По умолчанию: `http://localhost:3002`
- Для production: задайте `EXTENSION_API_BASE` при сборке расширения
