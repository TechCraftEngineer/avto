# Компоненты таблицы откликов

## Структура

### Основные компоненты

- **ResponseTableHeader** - заголовок таблицы с колонками
- **SortableHeaderCell** - сортируемая ячейка заголовка
- **StaticHeaderCell** - статическая ячейка заголовка
- **ColumnVisibilityToggle** - переключатель видимости колонок

### Хуки

- **useColumnVisibility** - управление видимостью колонок с сохранением в localStorage

## Улучшения

### Доступность (A11y)

- ✅ Правильные ARIA-атрибуты (`aria-label`, `aria-sort`, `aria-hidden`)
- ✅ Описательные метки для кнопок сортировки
- ✅ Видимые фокусные кольца (`focus-visible`)
- ✅ Минимальная область клика 24px для кнопок

### Производительность

- ✅ Мемоизация компонентов с `memo()`
- ✅ Мемоизация колбэков с `useCallback()`
- ✅ Мемоизация вычислений с `useMemo()`
- ✅ Предотвращение лишних ре-рендеров

### Типизация

- ✅ Строгая типизация с `readonly` для неизменяемых данных
- ✅ Валидация данных из localStorage
- ✅ Экспорт типов для переиспользования
- ✅ Брендированные типы для `ColumnId`

### Архитектура

- ✅ Разделение на переиспользуемые компоненты
- ✅ Единая ответственность (SRP)
- ✅ DRY - устранение дублирования кода
- ✅ Централизованный экспорт через `index.ts`

## Использование

```tsx
import { 
  ResponseTableHeader, 
  useColumnVisibility,
  ColumnVisibilityToggle 
} from "./responses";

function ResponsesTable() {
  const { isColumnVisible, visibleColumns, toggleColumn, resetColumns } = 
    useColumnVisibility();

  return (
    <>
      <ColumnVisibilityToggle
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
      />
      <Table>
        <ResponseTableHeader
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
          hasResponses={responses.length > 0}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          isColumnVisible={isColumnVisible}
        />
        {/* ... */}
      </Table>
    </>
  );
}
```

## Константы

- `REQUIRED_COLUMN` - обязательная колонка (всегда видима)
- `DEFAULT_VISIBLE_COLUMNS` - колонки, видимые по умолчанию
- `STORAGE_KEY` - ключ для localStorage
- `COLUMN_LABELS` - метки колонок на русском языке
