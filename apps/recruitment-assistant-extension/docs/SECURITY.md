# Безопасность расширения

## Реализованные меры защиты

### 1. Content Security Policy (CSP)
- Явная CSP для extension pages: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`
- Блокировка inline-скриптов и eval
- Загрузка скриптов только из пакета расширения

### 2. Защита от XSS
- Callback-страница: пользовательские данные выводятся через `textContent`, не `innerHTML`
- Отсутствие `eval`, `new Function`, `dangerouslySetInnerHTML`

### 3. Защита от SSRF (Server-Side Request Forgery)
- Whitelist доменов для API-запросов в service worker
- Разрешены только: `app.avtonaim.qbsoft.ru`, `localhost`, `127.0.0.1`
- Проверка протокола: только HTTPS (кроме localhost)

### 4. Минимальные права
- `storage`, `activeTab`, `tabs`, `scripting` — только необходимые permissions
- `host_permissions` — ограничены конкретными доменами (LinkedIn, hh.ru, app)

### 5. Сборка (обфускация/минификация)
- Отключены source maps в production (`sourcemap: false`)
- Включена минификация кода (Vite esbuild)
- Собранный код сложнее читать и анализировать

### 6. Хранение чувствительных данных
- Токен и userData — только в `chrome.storage.local` (не синхронизируются)
- При выходе — полная очистка `authToken` и `userData`

### 7. Manifest V3
- Service worker вместо background page
- Запрет удалённого выполнения кода
- Ограничение `executeScript` строками

## Рекомендации при публикации

1. **Obfuscation**: для дополнительной защиты можно добавить `rollup-plugin-obfuscator` (опционально — может увеличить размер и время сборки).
2. **Code signing**: ключ в manifest (`key`) обеспечивает стабильный ID расширения между обновлениями.
3. **Ревью**: перед публикацией в Chrome Web Store пройдите автоматическую проверку безопасности.
