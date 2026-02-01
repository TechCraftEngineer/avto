# 📋 Чек-лист миграции компонентов

## 🎯 Цели миграции

- ✅ Организация по доменам вместо плоской структуры
- ✅ Применение Vercel React Best Practices
- ✅ Улучшение производительности (bundle size, re-renders)
- ✅ Упрощение поддержки и разработки
- ✅ Прямые импорты вместо баррельных

## 📊 Текущая статистика

- **426 файлов** компонентов
- **267 TSX + 86 TS + 73 других**
- **Глубина вложенности**: до 4 уровней
- **Средний размер компонента**: ~2KB

---

## 🚀 План миграции (2 недели)

### День 1-2: Подготовка и анализ

#### ✅ Выполнено
- [x] Создан план миграции (`migration-plan.md`)
- [x] Созданы инструменты миграции
- [x] Проанализирована текущая структура
- [x] Созданы шаблоны компонентов

#### 📋 Задачи
- [ ] Создать backup текущей структуры
- [ ] Запустить анализ зависимостей
- [ ] Установить инструменты миграции
- [ ] Протестировать инструменты на примере

```bash
# 1. Анализ зависимостей
cd apps/app/src/components
node migration-tools/analyze-dependencies.js

# 2. Создать backup
cp -r components components-backup

# 3. Проверить инструменты
node migration-tools/generate-component-structure.js ui
```

---

### День 3-4: Фаза 1 - Базовые компоненты

#### 🎯 Цель: Миграция UI, Layout, Auth компонентов

#### Компоненты для миграции:
```
ui/ (8 компонентов)
├── safe-html.tsx
├── confirmation-dialog.tsx
├── draft-error-notification.tsx
├── draft-persistence-example.tsx
├── restore-prompt.tsx
├── save-indicator.tsx
├── add-publication-dialog.tsx
└── ...

layout/ (3 компонента)
├── client-layout.tsx
├── layout/
└── ...

auth/ (3 компонента)
├── auth/
├── unified-auth-form.tsx
└── ...
```

#### Шаги выполнения:

1. **Создать структуры доменов**
```bash
node migration-tools/generate-component-structure.js ui
node migration-tools/generate-component-structure.js layout
node migration-tools/generate-component-structure.js auth
```

2. **Мигрировать компоненты**
```bash
node migration-tools/migrate-components.js phase1
```

3. **Обновить импорты**
```bash
node migration-tools/update-imports.js update
```

4. **Протестировать**
```bash
npm run typecheck
npm run build
```

#### ✅ Критерии успеха:
- [ ] Все импорты обновлены
- [ ] TypeScript компилируется без ошибок
- [ ] Приложение собирается
- [ ] Нет runtime ошибок

---

### День 5-8: Фаза 2 - Основные домены

#### 🎯 Цель: Миграция Dashboard, Workspace, Organization

#### Компоненты для миграции:
```
dashboard/ (9 компонентов)
├── dashboard/
├── active-vacancies.tsx
├── ai-assistant-panel.tsx
├── chart-area-interactive.tsx
├── dashboard-stats.tsx
├── pending-actions.tsx
├── quick-actions.tsx
├── recent-chats.tsx
├── recent-responses.tsx
├── responses-chart.tsx
├── section-cards.tsx
├── top-responses.tsx
└── ...

workspace/ (9 компонентов)
├── workspace/
├── create-workspace-dialog.tsx
├── workspace-card.tsx
├── workspace-list-client.tsx
├── workspace-notifications-provider.tsx
├── add-domain-dialog.tsx
├── delete-domain-dialog.tsx
├── dns-instructions-dialog.tsx
└── domain-card.tsx

organization/ (8 компонентов)
├── organization/
├── organization-members-client.tsx
└── ...
```

#### Шаги выполнения:

1. **Создать структуры доменов**
```bash
node migration-tools/generate-component-structure.js dashboard
node migration-tools/generate-component-structure.js workspace
node migration-tools/generate-component-structure.js organization
```

2. **Мигрировать компоненты**
```bash
node migration-tools/migrate-components.js phase2
```

3. **Обновить импорты**
```bash
node migration-tools/update-imports.js update
```

4. **Оптимизировать производительность**
   - Добавить `React.memo` к компонентам
   - Применить lazy loading для тяжелых компонентов
   - Оптимизировать re-renders

---

### День 9-15: Фаза 3 - Бизнес-логика

#### 🎯 Цель: Миграция Vacancies, Gigs, Candidates

#### Компоненты для миграции:
```
vacancies/ (~50 компонентов)
├── vacancies/
├── vacancy/
├── vacancy-detail/
├── vacancy-creator/
├── vacancy-chat/
├── vacancy-chat-interface/
└── ...

gigs/ (~20 компонентов)
├── gig/
├── gig-detail/
└── ...

candidates/ (~15 компонентов)
├── candidates/
├── candidate/
└── ...
```

#### Особенности:
- **Наибольший объем работ**
- **Сложные зависимости**
- **Требует тщательного тестирования**

#### Шаги выполнения:

1. **Подготовка** - разделить на подфазы
2. **Миграция vacancies** (3 дня)
3. **Миграция gigs** (1 день)
4. **Миграция candidates** (1 день)
5. **Интеграционное тестирование** (1 день)

---

### День 16-18: Фаза 4 - Интеграционные компоненты

#### 🎯 Цель: Миграция Responses, Chat, Settings

#### Компоненты для миграции:
```
responses/ (~25 компонентов)
├── responses/
├── response/
├── response-detail/
└── ...

chat/ (~15 компонентов)
├── chat/
├── ai-chat/
└── ...

settings/ (~10 компонентов)
├── settings/
└── ...
```

#### Финализация:
- Удаление старых файлов
- Финальное тестирование
- Обновление документации

---

## 🛠️ Инструменты и скрипты

### Автоматизированные скрипты:
```bash
# Анализ зависимостей
node migration-tools/analyze-dependencies.js

# Создание структуры компонента
node migration-tools/generate-component-structure.js component-name domain

# Миграция по фазам
node migration-tools/migrate-components.js phase1

# Обновление импортов
node migration-tools/update-imports.js update
node migration-tools/update-imports.js validate
```

### Ручные проверки:
```bash
# Проверка типов
npm run typecheck

# Проверка сборки
npm run build

# Запуск тестов
npm run test

# Анализ bundle
npm run analyze-bundle
```

---

## 📈 Метрики успеха

### Производительность:
- [ ] **Bundle size**: уменьшение на 15-20%
- [ ] **First paint**: улучшение на 10-15%
- [ ] **Re-renders**: уменьшение на 20-30%

### Качество кода:
- [ ] **Циклические зависимости**: 0
- [ ] **Неиспользуемые импорты**: 0
- [ ] **TypeScript ошибки**: 0

### Поддерживаемость:
- [ ] **Время поиска компонента**: уменьшение на 50%
- [ ] **Время добавления компонента**: уменьшение на 30%
- [ ] **Code review**: упрощение на 40%

---

## 🚨 Риски и mitigation

### Риск: Сломанные импорты
**Mitigation:**
- Автоматическое обновление импортов
- Валидация после каждого шага
- Резервные копии

### Риск: Регрессии производительности
**Mitigation:**
- Замер метрик до и после
- Пошаговое тестирование
- Rollback план

### Риск: Циклические зависимости
**Mitigation:**
- Анализ зависимостей перед миграцией
- Правильная структура доменов
- Инструменты обнаружения циклов

---

## 📝 Документация

После миграции обновить:
- [ ] README компонентов
- [ ] Storybook stories
- [ ] TypeScript документацию
- [ ] Стиль-гайд

---

## 🎉 Post-migration

### Очистка:
- [ ] Удалить старые файлы
- [ ] Удалить инструменты миграции
- [ ] Обновить CI/CD пайплайны

### Мониторинг:
- [ ] Настроить метрики производительности
- [ ] Добавить мониторинг bundle size
- [ ] Настроить alerts на регрессии

### Обучение команды:
- [ ] Документация новой структуры
- [ ] Обучение новым паттернам
- [ ] Code review guidelines