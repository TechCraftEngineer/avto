# Настройка Inngest для локальной разработки

## Проблема
При запуске `bun run jobs:inngest` возникала ошибка аутентификации:
```
[Inngest] warn - Couldn't unpack register response: SyntaxError: JSON Parse error: Unexpected identifier "Authentication"
```

## Решение
Inngest CLI требует API ключей даже для локальной разработки. Добавлены переменные окружения и обновлены скрипты.

## Настройка
Переменные окружения автоматически устанавливаются через `cross-env` в скрипте `jobs:inngest:dev`.

## Запуск
Используйте команду:
```bash
bun run jobs:inngest:dev
```

Эта команда запускает:
1. Inngest сервер на порту 8000 с endpoint `/api/inngest`
2. Inngest CLI dev server с необходимыми ключами

## Доступные команды
- `bun run jobs:dev` - только Inngest сервер
- `bun run jobs:inngest` - только Inngest CLI (с переменными окружения)
- `bun run jobs:inngest:dev` - оба сервиса одновременно

## Переменные окружения
Для локальной разработки используются тестовые ключи:
- `INNGEST_EVENT_KEY=dev-event-key`
- `INNGEST_SIGNING_KEY=dev-key`