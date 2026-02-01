# Инструменты миграции компонентов

Этот набор инструментов помогает организовать миграцию компонентов на новую структуру по доменам в соответствии с Vercel React Best Practices.

## 🚀 Быстрый старт

### 1. Анализ текущей структуры

```bash
# Запустить анализ зависимостей
node migration-tools/analyze-dependencies.js

# Результаты сохраняются в migration-report.json
```

### 2. Создание структуры домена

```bash
# Создать структуру для нового домена
node migration-tools/generate-component-structure.js ui

# Создать компонент в домене
node migration-tools/generate-component-structure.js button ui
```

### 3. Миграция компонентов по фазам

```bash
# Миграция первой фазы (ui, layout, auth)
node migration-tools/migrate-components.js phase1

# Миграция второй фазы (dashboard, workspace, organization)
node migration-tools/migrate-components.js phase2

# И так далее...
```

### 4. Обновление импортов

```bash
# Обновить импорты во всем приложении
node migration-tools/update-imports.js update

# Проверить корректность импортов
node migration-tools/update-imports.js validate

# Обновить и проверить
node migration-tools/update-imports.js all
```

## 📋 Фазы миграции

### Фаза 1: Базовые компоненты (1-2 дня)
```bash
node migration-tools/migrate-components.js phase1
```
- `ui/` - переиспользуемые компоненты
- `layout/` - компоненты макета
- `auth/` - аутентификация

### Фаза 2: Основные домены (3-4 дня)
```bash
node migration-tools/migrate-components.js phase2
```
- `dashboard/` - дашборд
- `workspace/` - рабочее пространство
- `organization/` - организация

### Фаза 3: Бизнес-логика (5-7 дней)
```bash
node migration-tools/migrate-components.js phase3
```
- `vacancies/` - вакансии
- `gigs/` - фриланс проекты
- `candidates/` - кандидаты

### Фаза 4: Интеграционные компоненты (3-4 дня)
```bash
node migration-tools/migrate-components.js phase4
```
- `responses/` - отклики
- `chat/` - чат система
- `settings/` - настройки

## 🛠️ Инструменты

### `analyze-dependencies.js`
Анализирует текущую структуру компонентов и их зависимости.

**Вывод:**
- Распределение файлов по категориям
- Статистика импортов
- Компоненты с множественными использованиями

### `generate-component-structure.js`
Генерирует структуру компонентов по шаблонам.

**Использование:**
```bash
# Создать домен
node generate-component-structure.js vacancies

# Создать компонент
node generate-component-structure.js vacancy-card vacancies
```

### `migrate-components.js`
Автоматически перемещает компоненты и создает индексные файлы.

**Особенности:**
- Сохраняет структуру поддиректорий
- Создает index.ts файлы
- Обновляет импорты в перемещенных файлах

### `update-imports.js`
Обновляет импорты во всем приложении после миграции.

**Режимы:**
- `update` - обновить импорты
- `validate` - проверить корректность
- `all` - обновить и проверить

## 📝 Шаблоны

### Структура компонента
```
component-name/
├── component-name.tsx       # Основной компонент
├── component-name.types.ts  # Типы
├── index.ts                 # Экспорты
└── component-name.test.tsx  # Тесты (опционально)
```

### Структура домена
```
domain/
├── components/             # Компоненты
├── hooks/                  # Кастомные хуки
├── utils/                  # Утилиты
├── types/                  # Общие типы
└── index.ts               # Экспорты домена
```

## ✅ Лучшие практики

### 1. Server Components по умолчанию
```tsx
// ❌ Все компоненты клиентские
'use client'

function MyComponent() {
  return <div>Content</div>
}

// ✅ Server Components по умолчанию
function MyComponent() {
  return <div>Content</div>
}

// Только интерактивные компоненты клиентские
'use client'
function InteractiveComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState()}>Click</button>
}
```

### 2. Прямые импорты
```tsx
// ❌ Баррельные импорты
import { Button, Input } from '@/components/ui'

// ✅ Прямые импорты
import Button from '@/components/ui/components/button'
import Input from '@/components/ui/components/input'
```

### 3. Группировка по доменам
```tsx
// Хорошо организованная структура
components/
├── vacancies/
│   ├── components/
│   │   ├── vacancy-card/
│   │   └── vacancy-form/
│   ├── hooks/
│   └── types/
└── ui/
    ├── components/
    ├── atoms/
    └── molecules/
```

## 🚨 Важные замечания

1. **Резервные копии**: Создавайте backup перед миграцией
2. **Тестирование**: После каждой фазы запускайте тесты
3. **Импорты**: Используйте `update-imports.js` для обновления
4. **Валидация**: Проверяйте импорты после обновления

## 📊 Мониторинг прогресса

- Используйте `analyze-dependencies.js` для отслеживания прогресса
- Проверяйте `migration-report.json` для статистики
- Следите за размером bundle после каждой фазы

## 🔧 Troubleshooting

### Импорты не обновились
```bash
# Проверить импорты
node migration-tools/update-imports.js validate

# Перезапустить обновление
node migration-tools/update-imports.js update
```

### Компонент не найден
```bash
# Проверить структуру
find src/components -name "*component-name*"

# Создать компонент заново
node migration-tools/generate-component-structure.js component-name domain
```

### Циклические зависимости
- Разделить компоненты на более мелкие
- Использовать паттерн "составной компонент"
- Переместить общую логику в хуки или утилиты