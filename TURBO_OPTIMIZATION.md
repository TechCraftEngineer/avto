# 🚀 Оптимизация сборки Turbo

## Проблема
Команда `turbo run build` выполняется слишком долго для всего проекта.

## Решения

### ✅ 1. Уже реализовано

#### Включено удалённое кэширование
В `turbo.json` добавлено:
```json
"remoteCache": {
  "enabled": true
}
```

#### Оптимизирована задача build
- `outputLogs: "hash-only"` - показывает только хэши вместо полных логов
- Явное указание переменных окружения для лучшего кэширования

#### Добавлены команды для частичной сборки
```bash
bun run build:app    # Собрать только приложение app
bun run build:web    # Собрать только web
bun run build:tg     # Собрать только Telegram клиент
bun run build:jobs   # Собрать только jobs
```

---

### 🔧 2. Дополнительные рекомендации

#### A. Использовать Vercel Remote Cache (бесплатно)
```bash
# Войти в Vercel
npx turbo login

# Связать проект
npx turbo link
```

После этого кэш будет сохраняться в облаке и переиспользоваться между сборками.

#### B. Использовать параллелизацию
```bash
# Указать количество параллельных задач (по умолчанию = количество CPU)
turbo run build --concurrency=8
```

Или добавить в `package.json`:
```json
"build:fast": "turbo run build --concurrency=10"
```

#### C. Собирать только изменённые пакеты
```bash
# Собрать только то, что изменилось с последнего коммита
turbo run build --filter=[HEAD^1]

# Собрать только то, что изменилось в текущей ветке
turbo run build --filter=[origin/main...HEAD]
```

#### D. Использовать daemon для ускорения
```bash
# Запустить Turbo daemon (ускоряет последующие сборки)
turbo daemon start

# Проверить статус
turbo daemon status
```

#### E. Оптимизировать TypeScript сборку

В `tsconfig.json` каждого пакета добавить:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".cache/tsbuildinfo.json"
  }
}
```

#### F. Использовать SWC вместо Babel (для Next.js)

В `next.config.js`:
```js
module.exports = {
  swcMinify: true, // Использовать SWC для минификации
}
```

#### G. Анализировать производительность сборки
```bash
# Посмотреть, какие задачи занимают больше всего времени
turbo run build --profile=profile.json

# Затем загрузить profile.json в Chrome DevTools (Performance tab)
```

---

### 📊 3. Мониторинг и отладка

#### Посмотреть, что кэшируется
```bash
turbo run build --dry-run
```

#### Очистить кэш Turbo
```bash
turbo run build --force
```

#### Посмотреть граф зависимостей
```bash
turbo run build --graph
```

Это создаст файл `.turbo/graph.html` с визуализацией зависимостей.

---

### 🎯 4. Рекомендуемый workflow

#### Для разработки
```bash
# Использовать частичную сборку
bun run build:app
```

#### Для CI/CD
```bash
# Использовать полную сборку с кэшированием
turbo run build --concurrency=10
```

#### Для локальной проверки
```bash
# Собрать только изменённые пакеты
turbo run build --filter=[HEAD^1]
```

---

### 📈 Ожидаемые результаты

- **Первая сборка**: может быть медленной (создаётся кэш)
- **Последующие сборки**: 
  - Без изменений: ~1-2 секунды (100% кэш)
  - С небольшими изменениями: 10-30% от времени полной сборки
  - С Vercel Remote Cache: кэш работает даже после `git clean`

---

### 🔍 Диагностика медленной сборки

Если сборка всё ещё медленная:

1. **Проверить, работает ли кэш**:
   ```bash
   turbo run build --dry-run
   ```
   Должны быть строки `cache hit` для неизменённых пакетов.

2. **Найти медленные пакеты**:
   ```bash
   turbo run build --profile=profile.json
   ```

3. **Проверить размер node_modules**:
   ```bash
   du -sh node_modules
   ```

4. **Оптимизировать зависимости**:
   - Удалить неиспользуемые пакеты
   - Использовать `peerDependencies` вместо `dependencies` где возможно

---

### 💡 Быстрые команды

```bash
# Самая быстрая сборка (только изменённое)
turbo run build --filter=[HEAD^1] --concurrency=10

# Сборка с профилированием
turbo run build --profile=profile.json

# Сборка конкретного приложения
bun run build:app

# Принудительная пересборка (игнорировать кэш)
turbo run build --force
```
