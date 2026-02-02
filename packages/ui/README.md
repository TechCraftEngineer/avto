# @qbs-autonaim/ui

UI компонентная библиотека с поддержкой tree-shaking для оптимальной производительности.

## 🚀 Tree-shaking

Библиотека полностью поддерживает tree-shaking. Вы можете импортировать компоненты двумя способами:

### 1. Импорт из главного индекса (barrel export)
```typescript
import { Button, Card, Input } from "@qbs-autonaim/ui";
```

### 2. Прямой импорт отдельных компонентов (рекомендуется для tree-shaking)
```typescript
import Button from "@qbs-autonaim/ui/button";
import Card from "@qbs-autonaim/ui/card";
import Input from "@qbs-autonaim/ui/input";
```

## 📦 Особенности

- ✅ **ESM only** - Только ES модули для лучшей поддержки tree-shaking
- ✅ **Side effects: false** - Bundler'ы могут безопасно удалять неиспользуемый код
- ✅ **Individual exports** - Каждый компонент доступен по отдельному пути
- ✅ **TypeScript** - Полная поддержка типов
- ✅ **Tailwind CSS** - Стилизованные компоненты на основе Tailwind

## 🛠️ Использование с различными bundler'ами

### Next.js (рекомендуется)
```typescript
// Прямой импорт для tree-shaking
import Button from "@qbs-autonaim/ui/button";

// Или импорт из индекса
import { Button } from "@qbs-autonaim/ui";
```

### Vite
```typescript
// Tree-shaking работает автоматически
import Button from "@qbs-autonaim/ui/button";
```

### Webpack
```typescript
// Убедитесь, что в webpack.config.js настроено:
module.exports = {
  optimization: {
    sideEffects: true, // или настройте sideEffectsDetection
  },
};
```

## 📋 Доступные компоненты

### UI Компоненты
- `accordion` - Аккордеон
- `alert`, `alert-dialog` - Уведомления
- `avatar` - Аватар пользователя
- `badge` - Бейдж
- `breadcrumb` - Навигационные крошки
- `button`, `button-group` - Кнопки
- `calendar` - Календарь
- `card` - Карточки (Card, CardHeader, CardTitle, CardContent, CardFooter, CardAction)
- `carousel` - Карусель
- `chart` - Графики (на основе recharts)
- `checkbox` - Чекбоксы
- `collapsible` - Сворачиваемый контент
- `command` - Командная палитра
- `context-menu` - Контекстное меню
- `dialog`, `drawer`, `sheet` - Модальные окна
- `dropdown-menu` - Выпадающее меню
- `empty` - Пустое состояние
- `field`, `form` - Формы и поля
- `hover-card` - Карточки при наведении
- `input`, `input-group`, `input-otp`, `textarea` - Поля ввода
- `label` - Метки
- `menubar` - Меню бар
- `navigation-menu` - Навигационное меню
- `pagination` - Пагинация
- `password-input` - Поле пароля
- `popover` - Поповеры
- `progress` - Прогресс бары
- `radio-group` - Радио кнопки
- `resizable` - Изменяемые панели
- `scroll-area` - Области прокрутки
- `select` - Выпадающие списки
- `separator` - Разделители
- `sidebar` - Боковая панель
- `skeleton` - Скелетоны загрузки
- `slider` - Слайдеры
- `sonner` - Toast уведомления
- `spinner` - Спиннеры
- `switch` - Переключатели
- `table` - Таблицы
- `tabs` - Вкладки
- `theme` - Темизация
- `toast`, `radix-toast` - Toast уведомления
- `toggle`, `toggle-group` - Переключатели
- `tooltip`, `tooltip-markdown` - Подсказки
- `info-tooltip` - Информационные подсказки
- `integration-icon` - Иконки интеграций
- `candidate-avatar` - Аватар кандидата
- `delete-vacancy-dialog` - Диалог удаления вакансии

### Хуки
- `use-mobile` - Определение мобильного устройства
- `use-toast` - Управление toast уведомлениями

### Утилиты
- `cn` - Функция для объединения CSS классов (из index.ts)

## 🎯 Рекомендации по оптимизации

### 1. Используйте прямые импорты
```typescript
// ✅ Хорошо для tree-shaking
import Button from "@qbs-autonaim/ui/button";
import Card from "@qbs-autonaim/ui/card";

// ❌ Менее оптимально
import { Button, Card } from "@qbs-autonaim/ui";
```

### 2. Импортируйте только то, что используете
```typescript
// ✅ Импортируйте только нужные компоненты
import { Card, CardHeader, CardTitle } from "@qbs-autonaim/ui/card";

// ❌ Не импортируйте весь пакет
import * as UI from "@qbs-autonaim/ui";
```

### 3. Используйте dynamic imports для тяжелых компонентов
```typescript
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@qbs-autonaim/ui/chart"), {
  ssr: false,
  loading: () => <div>Загрузка...</div>
});
```

## 🔧 Сборка и разработка

```bash
# Установка зависимостей
bun install

# Проверка типов
bun run typecheck

# Линтинг
bun run lint

# Форматирование
bun run format
```

## 📄 Лицензия

MIT