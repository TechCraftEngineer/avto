# Работа с датами рождения

## Проблема

Даты рождения — это **календарные даты без времени**. При работе с ними критически важно избегать проблем с таймзонами.

### Что может пойти не так?

```typescript
// ❌ НЕПРАВИЛЬНО: Дата зависит от таймзоны сервера
const birthDate = new Date(1987, 8, 24); // Месяц 8 = сентябрь

// На сервере в UTC+3:
// -> 1987-09-24T00:00:00+03:00
// PostgreSQL сохранит как: 1987-09-23T21:00:00Z (минус 3 часа!)
// При чтении в другой таймзоне получим 23 сентября вместо 24!
```

## Решение

Всегда используйте **UTC полночь** для календарных дат.

### Утилиты

Все утилиты находятся в `@qbs-autonaim/lib/utils/date-utils`:

```typescript
import {
  parseBirthDate,
  createUTCDate,
  formatDateForInput,
  parseDateFromInput,
  formatBirthDate,
  calculateAge,
} from "@qbs-autonaim/lib/utils/date-utils";
```

### Парсинг даты рождения

```typescript
// Из любого формата в UTC полночь
const birthDate = parseBirthDate("1987-09-24");
// -> 1987-09-24T00:00:00.000Z

const birthDate2 = parseBirthDate(new Date(1987, 8, 24));
// -> 1987-09-24T00:00:00.000Z (нормализовано в UTC)
```

### Создание даты из компонентов

```typescript
// Для парсинга из текста (например, "24 сентября 1987")
const birthDate = createUTCDate(1987, 8, 24); // Месяц 8 = сентябрь
// -> 1987-09-24T00:00:00.000Z
```

### Работа с input[type="date"]

```typescript
// Форматирование для input
const inputValue = formatDateForInput(birthDate);
// -> "1987-09-24"

// Парсинг из input
const birthDate = parseDateFromInput("1987-09-24");
// -> 1987-09-24T00:00:00.000Z
```

### Отображение пользователю

```typescript
// Форматирование для отображения
const displayText = formatBirthDate(birthDate);
// -> "24 сентября 1987"

// Вычисление возраста
const age = calculateAge(birthDate);
// -> 37 (в 2025 году)
```

## Примеры использования

### Backend: Парсинг из HeadHunter

```typescript
import { createUTCDate } from "@qbs-autonaim/lib/utils/date-utils";

export function parseRussianBirthDate(dateString: string): Date | null {
  // Парсим "24 сентября 1987"
  const day = 24;
  const month = 8; // сентябрь
  const year = 1987;
  
  return createUTCDate(year, month, day);
}
```

### Backend: Обогащение данных кандидата

```typescript
import { parseBirthDate } from "@qbs-autonaim/lib/utils/date-utils";

if (personalInfo.birthDate && !enriched.birthDate) {
  enriched.birthDate = parseBirthDate(personalInfo.birthDate);
}
```

### Frontend: Форма с датой рождения

```typescript
import { 
  formatDateForInput, 
  parseDateFromInput 
} from "@qbs-autonaim/lib/utils/date-utils";

// Инициализация input
const [birthDateInput, setBirthDateInput] = useState(
  formatDateForInput(candidate.birthDate)
);

// Отправка на сервер
const handleSubmit = () => {
  const parsedDate = parseDateFromInput(birthDateInput);
  if (!parsedDate) {
    toast.error("Некорректная дата рождения");
    return;
  }
  
  // Отправляем ISO string
  mutate({ birthDate: parsedDate.toISOString() });
};
```

### Frontend: Отображение даты

```typescript
import { formatBirthDate, calculateAge } from "@qbs-autonaim/lib/utils/date-utils";

// В компоненте
<div>
  <p>Дата рождения: {formatBirthDate(candidate.birthDate)}</p>
  <p>Возраст: {calculateAge(candidate.birthDate)} лет</p>
</div>

// В canvas/PDF
ctx.fillText(
  `Дата рождения: ${
    candidate.birthDate 
      ? new Date(candidate.birthDate).toLocaleDateString("ru-RU", { 
          timeZone: "UTC" 
        })
      : "Не указана"
  }`,
  50, 100
);
```

## База данных

### Схема

```typescript
// packages/db/src/schema/candidate/candidate.ts
birthDate: timestamp("birth_date", { 
  withTimezone: true,  // Храним с таймзоной
  mode: "date"         // Drizzle работает как с Date
}),
```

PostgreSQL хранит как `timestamp with time zone`, но благодаря UTC полночи дата всегда корректна.

## Чеклист

При работе с датами рождения:

- ✅ Используйте утилиты из `@qbs-autonaim/lib/utils/date-utils`
- ✅ Всегда парсите в UTC полночь
- ✅ Используйте `formatDateForInput` для input[type="date"]
- ✅ Используйте `parseDateFromInput` при чтении из input
- ✅ Указывайте `timeZone: "UTC"` при форматировании для отображения
- ❌ Не используйте `new Date(year, month, day)` напрямую
- ❌ Не используйте `.toISOString().slice(0, 10)` для форматирования
- ❌ Не забывайте про валидацию (31 февраля и т.д.)

## Тестирование

Проверьте работу в разных таймзонах:

```bash
# Локально (ваша таймзона)
TZ=Europe/Moscow bun run dev

# UTC (как на продакшене)
TZ=UTC bun run dev

# Другая таймзона
TZ=America/New_York bun run dev
```

Дата рождения должна оставаться одинаковой во всех случаях!
