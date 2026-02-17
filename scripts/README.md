# Puppeteer HH.ru скрипт

## Использование

1. Создайте файл `cookies.json` с вашими cookies от hh.ru
2. Запустите скрипт:

```bash
bun run scripts/puppeteer-hh.ts
# или с указанием пути к cookies
bun run scripts/puppeteer-hh.ts ./path/to/cookies.json
```

## Формат cookies

Используйте формат из `cookies.example.json`. Cookies можно экспортировать из браузера с помощью расширений типа "EditThisCookie" или "Cookie-Editor".
