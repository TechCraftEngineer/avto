# RefreshStatusIndicator

Универсальный компонент для отображения прогресса различных операций с откликами вакансии.

## Режимы работы

### 1. Режим обновления откликов (`refresh`)

Получение новых откликов с HeadHunter.

```tsx
<RefreshStatusIndicator
  vacancyId={vacancyId}
  mode="refresh"
  showConfirmation={showConfirmation}
  onConfirmationClose={() => setShowConfirmation(false)}
  onConfirm={handleConfirm}
/>
```

### 2. Режим архивной синхронизации (`archived`)

Получение всех откликов, включая архивные.

```tsx
<RefreshStatusIndicator
  vacancyId={vacancyId}
  mode="archived"
  showConfirmation={showConfirmation}
  onConfirmationClose={() => setShowConfirmation(false)}
  onConfirm={handleConfirm}
/>
```

### 3. Режим анализа откликов (`analyze`)

Автоматический анализ выбранных откликов с помощью ИИ.

```tsx
<RefreshStatusIndicator
  vacancyId={vacancyId}
  mode="analyze"
  batchId={batchId}
  totalResponses={selectedResponses.length}
  showConfirmation={showConfirmation}
  onConfirmationClose={() => setShowConfirmation(false)}
  onConfirm={handleConfirm}
/>
```

## Props

| Prop | Тип | Обязательный | Описание |
|------|-----|--------------|----------|
| `vacancyId` | `string` | Да | ID вакансии |
| `mode` | `"refresh" \| "archived" \| "analyze"` | Нет | Режим работы (по умолчанию `"refresh"`) |
| `batchId` | `string` | Нет | ID batch для режима `analyze` |
| `totalResponses` | `number` | Нет | Количество откликов для анализа |
| `showConfirmation` | `boolean` | Нет | Показать диалог подтверждения |
| `onConfirmationClose` | `() => void` | Нет | Callback при закрытии диалога |
| `onConfirm` | `() => void` | Нет | Callback при подтверждении действия |
| `className` | `string` | Нет | Дополнительные CSS классы |

## Особенности

- Автоматическое подключение к Realtime каналам Inngest
- Отображение прогресса в реальном времени
- Автоматическое закрытие после завершения
- Поддержка всех трех режимов работы
- Доступность (ARIA атрибуты, keyboard navigation)
- Адаптивный дизайн
