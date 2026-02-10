# Настройка миграций базы данных в k3s

## Стратегия деплоя с нулевым простоем

### Автоматический процесс (рекомендуется)

При push в `main` с изменениями в `apps/app/**` или `packages/**`:

1. **Сборка образов** (параллельно)
   - Образ приложения
   - Образ миграций

2. **Миграция базы данных**
   - Запускается Kubernetes Job
   - Применяет миграции к существующей БД
   - Старая версия приложения продолжает работать

3. **Деплой нового приложения**
   - Только после успешной миграции
   - Rolling update (постепенная замена подов)
   - Старые поды работают до готовности новых

### Почему это работает без простоя

**Обратная совместимость миграций:**
- Новые колонки добавляются с DEFAULT или NULL
- Старые колонки не удаляются сразу
- Изменения типов через промежуточные колонки

**Пример безопасной миграции:**

```sql
-- ❌ Опасно (ломает старую версию)
ALTER TABLE users DROP COLUMN old_field;

-- ✅ Безопасно (двухэтапная миграция)
-- Этап 1: Добавить новую колонку (деплой v1.1)
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Этап 2: Удалить старую (деплой v1.2, через неделю)
ALTER TABLE users DROP COLUMN old_field;
```

**Rolling Update в Kubernetes:**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # Максимум +1 под во время обновления
    maxUnavailable: 0  # Минимум 0 недоступных подов
```

## Предварительные требования

Создайте Secret с учетными данными базы данных:

```bash
kubectl create secret generic db-credentials \
  --from-literal=postgres-url="postgresql://user:password@host:5432/database" \
  -n qbs
```

Или через манифест:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: qbs
type: Opaque
stringData:
  postgres-url: "postgresql://user:password@host:5432/database"
```

## Ручной запуск миграции

### Через GitHub Actions
1. Actions → DB Migrate (Manual)
2. Run workflow
3. Выберите ветку

### Через kubectl
```bash
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate-manual
  namespace: qbs
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migrate
        image: cr.yandex/crpqovavgc2mbmvv32ko/db-migrate:latest
        env:
        - name: POSTGRES_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: postgres-url
EOF

# Проверить статус
kubectl logs job/db-migrate-manual -n qbs -f
```

## Правила написания миграций

### ✅ Безопасные операции
- Добавление новых таблиц
- Добавление nullable колонок
- Добавление колонок с DEFAULT
- Создание индексов CONCURRENTLY
- Добавление CHECK constraints как NOT VALID, затем VALIDATE

### ⚠️ Требуют двухэтапного деплоя
- Переименование колонок (добавить новую → копировать данные → удалить старую)
- Изменение типов (добавить новую → мигрировать → удалить старую)
- Удаление колонок (сначала убрать из кода → потом из БД)
- Удаление таблиц (сначала убрать из кода → потом из БД)

### ❌ Опасные операции
- DROP COLUMN в одном деплое с изменением кода
- ALTER COLUMN TYPE без промежуточного шага
- Добавление NOT NULL без DEFAULT (блокирует таблицу)
- Создание обычных индексов на больших таблицах

## Откат

### Откат приложения
```bash
# Откатить deployment на предыдущую версию
kubectl rollout undo deployment/app -n qbs

# Откатить на конкретную ревизию
kubectl rollout history deployment/app -n qbs
kubectl rollout undo deployment/app --to-revision=2 -n qbs
```

### Откат миграции
Миграции не откатываются автоматически. Для отката:

1. Создайте новую миграцию с обратными изменениями
2. Или используйте drizzle-kit локально:

```bash
cd packages/db
export POSTGRES_URL="your-connection-string"
bunx drizzle-kit drop
```

## Мониторинг

```bash
# Статус последней миграции
kubectl get jobs -n qbs -l app=db-migrate --sort-by=.metadata.creationTimestamp

# Логи миграции
kubectl logs job/db-migrate-<commit-sha> -n qbs

# Статус деплоя приложения
kubectl rollout status deployment/app -n qbs

# История деплоев
kubectl rollout history deployment/app -n qbs
```

## Troubleshooting

### Миграция зависла
```bash
# Проверить статус Job
kubectl describe job db-migrate-<sha> -n qbs

# Проверить логи
kubectl logs job/db-migrate-<sha> -n qbs

# Удалить зависший Job
kubectl delete job db-migrate-<sha> -n qbs
```

### Миграция упала, но деплой продолжился
Это невозможно — workflow останавливается при ошибке миграции.

### Нужно срочно откатить
```bash
# 1. Откатить приложение
kubectl rollout undo deployment/app -n qbs

# 2. Если нужно, откатить БД вручную
# (создать обратную миграцию)
```
