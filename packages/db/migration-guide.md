# Руководство по безопасным миграциям

## Принципы zero-downtime миграций

### Правило 1: Обратная совместимость
Миграция должна работать как со старой, так и с новой версией кода.

### Правило 2: Двухэтапный деплой для breaking changes
Опасные изменения делаются в два этапа с отдельными деплоями.

### Правило 3: Используйте CONCURRENTLY для индексов
Обычные индексы блокируют таблицу на запись.

## Примеры безопасных миграций

### ✅ Добавление новой колонки

```typescript
// Миграция
await db.schema
  .alterTable('users')
  .addColumn('phone', 'text')
  .execute();

// Код сразу может использовать новую колонку
const user = await db
  .selectFrom('users')
  .select(['id', 'email', 'phone']) // phone может быть null
  .execute();
```

### ✅ Добавление колонки с DEFAULT

```typescript
// Миграция
await db.schema
  .alterTable('users')
  .addColumn('status', 'text', (col) => col.defaultTo('active'))
  .execute();

// Старый код продолжает работать
// Новый код получает status='active' для новых записей
```

### ✅ Создание индекса без блокировки

```sql
-- В drizzle-kit миграции
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

## Примеры опасных миграций (требуют двух этапов)

### ⚠️ Переименование колонки

**Этап 1: Добавить новую колонку**
```typescript
// Миграция v1.1
await db.schema
  .alterTable('users')
  .addColumn('full_name', 'text')
  .execute();

// Код v1.1: Пишем в обе колонки
await db
  .insertInto('users')
  .values({
    name: 'John',      // старая
    full_name: 'John'  // новая
  })
  .execute();

// Миграция данных (в фоне)
await db
  .updateTable('users')
  .set({ full_name: db.ref('name') })
  .where('full_name', 'is', null)
  .execute();
```

**Этап 2: Удалить старую колонку (через неделю)**
```typescript
// Код v1.2: Используем только full_name
await db
  .insertInto('users')
  .values({ full_name: 'John' })
  .execute();

// Миграция v1.2
await db.schema
  .alterTable('users')
  .dropColumn('name')
  .execute();
```

### ⚠️ Изменение типа колонки

**Этап 1: Добавить новую колонку**
```typescript
// Миграция v1.1: age из TEXT в INTEGER
await db.schema
  .alterTable('users')
  .addColumn('age_int', 'integer')
  .execute();

// Код v1.1: Пишем в обе
await db
  .insertInto('users')
  .values({
    age: '25',      // старая (text)
    age_int: 25     // новая (integer)
  })
  .execute();

// Миграция данных
await db.execute(sql`
  UPDATE users 
  SET age_int = CAST(age AS INTEGER)
  WHERE age_int IS NULL 
    AND age ~ '^[0-9]+$'
`);
```

**Этап 2: Удалить старую колонку**
```typescript
// Код v1.2: Используем age_int
await db
  .insertInto('users')
  .values({ age_int: 25 })
  .execute();

// Миграция v1.2
await db.schema
  .alterTable('users')
  .dropColumn('age')
  .execute();

// Опционально: переименовать age_int → age
await db.schema
  .alterTable('users')
  .renameColumn('age_int', 'age')
  .execute();
```

### ⚠️ Добавление NOT NULL constraint

**Этап 1: Добавить колонку с DEFAULT**
```typescript
// Миграция v1.1
await db.schema
  .alterTable('users')
  .addColumn('role', 'text', (col) => col.defaultTo('user'))
  .execute();

// Заполнить существующие записи
await db
  .updateTable('users')
  .set({ role: 'user' })
  .where('role', 'is', null)
  .execute();
```

**Этап 2: Добавить NOT NULL (после проверки)**
```typescript
// Миграция v1.2
await db.schema
  .alterTable('users')
  .alterColumn('role', (col) => col.setNotNull())
  .execute();
```

### ⚠️ Удаление колонки

**Этап 1: Убрать из кода**
```typescript
// Код v1.1: Перестаем использовать old_field
// Но колонка еще в БД
```

**Этап 2: Удалить из БД (через неделю)**
```typescript
// Миграция v1.2
await db.schema
  .alterTable('users')
  .dropColumn('old_field')
  .execute();
```

## Проверка миграций перед деплоем

### 1. Локальное тестирование
```bash
# Создать копию продакшн БД
pg_dump $PROD_DB > backup.sql
createdb test_migration
psql test_migration < backup.sql

# Применить миграцию
cd packages/db
export POSTGRES_URL="postgresql://localhost/test_migration"
bunx drizzle-kit migrate

# Проверить, что старый код работает
# Проверить, что новый код работает
```

### 2. Проверка блокировок
```sql
-- Посмотреть, какие блокировки создаст миграция
BEGIN;
-- Ваша миграция
SELECT * FROM pg_locks WHERE NOT granted;
ROLLBACK;
```

### 3. Оценка времени выполнения
```sql
-- Для больших таблиц
EXPLAIN ANALYZE
ALTER TABLE large_table ADD COLUMN new_field TEXT;
```

## Чеклист перед миграцией

- [ ] Миграция работает со старой версией кода?
- [ ] Миграция работает с новой версией кода?
- [ ] Нет блокирующих операций на больших таблицах?
- [ ] Индексы создаются с CONCURRENTLY?
- [ ] NOT NULL добавляется после заполнения данных?
- [ ] Есть план отката?
- [ ] Протестировано на копии продакшн БД?
- [ ] Оценено время выполнения?

## Откат миграций

### Автоматический откат кода
```bash
kubectl rollout undo deployment/app -n qbs
```

### Ручной откат БД
Создайте обратную миграцию:

```typescript
// Если добавили колонку
await db.schema
  .alterTable('users')
  .dropColumn('new_field')
  .execute();

// Если изменили данные
await db
  .updateTable('users')
  .set({ status: 'old_value' })
  .where('status', '=', 'new_value')
  .execute();
```

## Мониторинг миграций

```sql
-- Проверить активные блокировки
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Проверить прогресс CREATE INDEX CONCURRENTLY
SELECT 
  phase,
  round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "% done"
FROM pg_stat_progress_create_index;
```
