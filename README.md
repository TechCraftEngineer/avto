# QBS Автонайм

Платформа для автоматизации работы с вакансиями на HH.ru. Позволяет автоматически входить в систему, парсить вакансии и отклики кандидатов.

## Что это?

Монорепозиторий на базе Bun и Turborepo для автоматизации рекрутинга:

- 🤖 Автоматический вход на HH.ru с сохранением сессии
- 🔐 Безопасное хранение credentials в БД с шифрованием
- 📋 Парсинг активных вакансий и откликов
- 💼 Извлечение данных кандидатов (опыт, контакты, теги)
- 🧠 AI-скрининг резюме через DeepSeek
- 📊 Веб-интерфейс для управления
- 🏢 SaaS-архитектура с workspaces для управления несколькими компаниями

## Быстрый старт

### Требования

- Node.js 22.21.0+
- Bun 1.3.3+
- PostgreSQL (или Supabase)

### Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd qbs-autonaim

# Установить зависимости
bun install

# Настроить переменные окружения
cp .env.example .env

# Сгенерировать ключ шифрования
bun db:generate-key

# Добавить сгенерированный ключ в .env:
# ENCRYPTION_KEY=<generated-key>

# Настроить базу данных
bun db:push

# Мигрировать существующие данные на workspaces (если есть)
bun db:migrate-workspaces

# Запустить в режиме разработки
bun dev
```

### Настройка переменных окружения

```env
# База данных
POSTGRES_URL="your-postgres-url"

# Аутентификация
AUTH_SECRET="your-secret-key"

# Шифрование (сгенерировать через bun db:generate-key)
ENCRYPTION_KEY="your-encryption-key"

# AI Provider (deepseek или openai)
AI_PROVIDER="deepseek"

# DeepSeek API (если AI_PROVIDER=deepseek)
DEEPSEEK_API_KEY="your-api-key"

# OpenAI API (если AI_PROVIDER=openai)
OPENAI_API_KEY="your-api-key"

# MCP (Model Context Protocol) - путь к корневой директории для MCP filesystem сервера
# Определяет, где MCP инструменты могут получать доступ к файлам
# Для локальной разработки: ./mcp_root (относительно корня проекта)
# Для контейнеров: /srv/mcp или /app/mcp_root
MCP_ROOT_PATH="./mcp_root"
```

Приложение будет доступно по адресу: http://localhost:3000

## AI Провайдеры

Проект поддерживает гибкое переключение между DeepSeek и OpenAI для AI-скрининга резюме.

### Настройка провайдера

**DeepSeek (по умолчанию, экономичный):**
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-key
```

**OpenAI (более мощный):**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-4o-mini  # опционально
```

### Доступные модели

- **DeepSeek**: `deepseek-chat` (по умолчанию), `deepseek-coder`
- **OpenAI**: `gpt-4o-mini` (по умолчанию), `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

Подробнее: [AI_PROVIDER_GUIDE.md](AI_PROVIDER_GUIDE.md)

## Интеграции

### Добавление интеграции HH.ru

1. Откройте веб-интерфейс: http://localhost:3000
2. Перейдите в Настройки → Интеграции
3. Нажмите "Добавить интеграцию"
4. Выберите тип "HeadHunter (HH.ru)"
5. Введите email и пароль от HH.ru
6. Credentials будут зашифрованы и сохранены в БД

### Работа с интеграциями

Все credentials хранятся в зашифрованном виде в таблице `integrations`:

- `type` - тип интеграции (hh, linkedin)
- `credentials` - зашифрованные данные авторизации
- `cookies` - сохраненные сессии для работы без повторной авторизации
- `metadata` - дополнительные данные

## Команды

```bash
bun dev              # Запустить в режиме разработки
bun build            # Собрать проект
bun typecheck        # Проверить типы
bun lint             # Проверить код
bun lint:fix         # Исправить ошибки линтера

bun db:push               # Обновить схему БД
bun db:studio             # Открыть Drizzle Studio
bun db:generate-key       # Сгенерировать ключ шифрования
bun db:migrate-workspaces # Мигрировать данные на workspaces
```

## Структура проекта

```
qbs-autonaim/
├── apps/nextjs/          # Next.js приложение
├── packages/
│   ├── jobs/             # Автоматизация HH.ru (Crawlee)
│   ├── db/               # База данных (Drizzle ORM)
│   ├── api/              # tRPC API
│   ├── auth/             # Аутентификация
│   ├── ui/               # UI компоненты
│   └── validators/       # Zod схемы
└── tooling/
    ├── typescript/       # Общие настройки TypeScript
    └── tailwind/         # Общие настройки Tailwind
```

## Безопасность

- Все credentials шифруются с помощью AES-256-GCM перед сохранением в БД
- Ключ шифрования хранится в переменных окружения
- Cookies сохраняются для работы в serverless режиме
- Credentials никогда не передаются на клиент

## Лицензия

MIT

## Документация

### Для пользователей

- 📖 [Руководство пользователя](docs/USER_GUIDE.md) - полное руководство по работе с платформой
- 🚀 [Быстрый старт](docs/QUICK_START.md) - начните работу за 15 минут

### Для разработчиков

Техническая документация находится в папке [docs/technical/](docs/technical/)
