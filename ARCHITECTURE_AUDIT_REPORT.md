# Архитектурный аудит проекта Selectio

**Дата:** 21 февраля 2025  
**Стек:** Next.js 16 (App Router), tRPC, Turborepo Monorepo, Drizzle ORM

**Последнее обновление:** Выполнен рефакторинг по рекомендациям (кроме rate limit).

---

## Исполнительное резюме

Проект демонстрирует **зрелую архитектуру** с чётким разделением доменов и продуманной структурой монорепозитория. Основные сильные стороны — отсутствие циклических зависимостей, сквозная типизация через tRPC и хорошая документация (Cursor rules). Критическими точками являются **дублирование валидации (Zod)**, **частичная клиентская бизнес-логика** (фильтрация списка вакансий) и **отключённый rate limiting**. Ниже — детальный разбор и план рефакторинга.

---

## 1. Архитектура монорепозитория и границы модулей

### 1.1 Оценка разделения apps / packages

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Переиспользование кода** | ✅ Хорошо | `ui`, `db`, `validators`, `shared`, `api` — активно используются в нескольких приложениях |
| **Изоляция доменов** | ✅ Хорошо | Пакеты имеют чёткие границы; `shared` — центральный узел, но не создаёт циклов |
| **Dependency direction** | ✅ Соблюдено | db → api → app; packages не зависят от apps |
| **Слабая связанность** | ⚠️ Требует внимания | `shared` зависит от `ai`, `db` — при росте может стать bottleneck |

**Структура зависимостей (упрощённо):**

```
Leaf: config, types, validators, integration-clients, ui
  ↓
Layer 1: db, lib, auth, document-processor, ai, emails, html-parsers
  ↓
Layer 2: server-utils, shared, jobs-shared
  ↓
Layer 3: jobs-parsers, tg-client
  ↓
Layer 4: jobs, extension-api
  ↓
Layer 5: api

Apps: app, interview — тянут практически весь граф; web, docs — только ui
```

**Вывод:** Архитектура масштабируема. Добавление нового приложения (например, admin-panel) возможно без перестройки — достаточно подключить `api`, `auth`, `ui`. Новый пакет в `packages/` потребует аккуратного выбора зависимостей, чтобы не нарушить направление.

### 1.2 Dependency Graph и циклические зависимости

- **Циклы между пакетами:** Не обнаружены
- **Knip:** Настроен для entry/project анализа
- **Madge (cycle check):** Есть в `apps/app` (`bun run cycle`) для проверки циркулярных импортов внутри приложения

**Риск:** При возможном добавлении зависимости `db` → `shared` или `ai` → `shared` возникнет цикл. Рекомендуется явно документировать, что `shared` — потребитель нижних слоёв, а не наоборот.

### 1.3 tsconfig и path aliases

| Пакет | Path aliases | Замечание |
|-------|--------------|-----------|
| apps/app, apps/interview | `~/*`, `@/*` → `./src/*` | Однотипно |
| packages (jobs, jobs-parsers, jobs-shared) | `~/*` → `./src/*` | Частичная несогласованность |
| packages/ui | Нет aliases | Прямые импорты |
| api, db, validators | compiled-package.json | Стандартизировано |

**Рекомендация:** Ввести единый convention для path aliases в packages (например, `~/*` → `./src/*` в `.cursor/rules`) и придерживаться его в новых пакетах.

---

## 2. Дизайн системы на Next.js (App Router)

### 2.1 Separation of Concerns (Server vs Client)

| Аспект | Оценка | Детали |
|--------|--------|--------|
| **Серверные компоненты** | ✅ Хорошо | Layout `(dashboard)` — Server, загружает session, workspaces, organizations через `api()` |
| **Client components** | ⚠️ Избыточно | ~130+ файлов с `"use client"`; некоторые страницы целиком клиентские |
| **Граница Server/Client** | ✅ Корректно | `client-server-bundles.mdc` описывает допустимые импорты; нет server-only кода в клиенте |
| **Hydration** | ✅ Настроено | `HydrateClient`, `createTRPCOptionsProxy` для передачи server state в TanStack Query |

**Примеры корректного разделения:**
- `invitations/page.tsx` — Server страница, передаёт данные в `InvitationsClient`
- `(dashboard)/layout.tsx` — Server layout, `api().workspace.list()` + `api().organization.list()`, `WorkspaceProvider` — клиентский контекст

**Проблемные зоны:**
- `vacancies/page.tsx`, `gigs/page.tsx`, `responses/page.tsx` — полностью клиентские страницы
- Отсутствует server-side prefetch для начальных данных; первый рендер ждёт client-side `useQuery`

### 2.2 Композиция компонентов и связанность

**Сильные стороны:**
- **VacancyResponsesContext** — корректно избавляет от prop drilling для операций (refresh, archived, screenNew, screenAll)
- **WorkspaceProvider** — централизует org/workspace, используется через `useWorkspace`, `useWorkspaceParams`
- **NuqsAdapter** — URL state для фильтров

**Слабости:**
- `VacancyResponsesContext` — **270+ строк**, перегружен колбэками (`registerOnArchivedSyncComplete`, `getOnArchivedSyncComplete`, `registerOnScreenAllProgress` и т.д.). Высокая связанность: множество компонентов жёстко зависят от этого контекста.
- Регистрация хендлеров через `setOperationHandler` — неявный контракт, усложняет тестирование.
- Некоторые компоненты (например, `vacancy-filters`, `response-table-toolbar`) принимают 10+ пропсов — признак избыточной связанности.

**Рекомендация:** Разбить VacancyResponsesContext на более мелкие контексты (например, `OperationsStateContext` + `OperationHandlersContext`) или перейти на команды/события вместо регистрации хендлеров.

### 2.3 Server State vs Client State

| Тип состояния | Реализация | Оценка |
|---------------|------------|--------|
| **Server State** | TanStack Query + tRPC `useQuery` | ✅ Корректно |
| **Client State (UI)** | `useState` для модалок, фильтров, режимов | ✅ Уместно |
| **URL State** | nuqs для фильтров | ✅ Современно |
| **Бизнес-логика на клиенте** | ⚠️ Проблема | См. ниже |

**useVacancyFilters** (`hooks/use-vacancy-filters.ts`):
- Выполняет **поиск** (title, region), **фильтрацию** (source, status, даты), **сортировку** на клиенте
- API `freelancePlatforms.getVacancies` уже поддерживает `source`, `sortBy`, `sortOrder`, но **не поддерживает**: `search`, `statusFilter` (active/inactive), `dateFrom`/`dateTo`
- Следствие: загрузка **всех** вакансий в память; при росте числа вакансий — деградация производительности и лишний трафик

**Рекомендация:** Перенести фильтрацию/сортировку/поиск в `getVacancies` (или отдельный endpoint) и ввести пагинацию. Это снизит нагрузку на клиент и улучшит масштабируемость.

---

## 3. Слой данных и tRPC

### 3.1 Структура Router/Procedure

| Аспект | Оценка | Комментарий |
|--------|--------|-------------|
| **Организация** | ✅ Отлично | 25+ доменных роутеров (user, vacancy, gig, workspace и т.д.) |
| **Файловая структура** | ✅ Соответствует правилам | Один файл = одна процедура; kebab-case; `satisfies TRPCRouterRecord` |
| **Вложенные роутеры** | ✅ Используются | vacancy.responses, gig.chat, workspace.invites |
| **Масштабируемость** | ✅ Готова | Добавление нового домена — создать папку + зарегистрировать в root.ts |

### 3.2 Валидация Zod — дублирование

**Критические места дублирования:**

1. **statusFilter** — один и тот же enum в двух файлах:
   - `vacancy/responses/list.ts`: `z.array(z.enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"])).optional()`
   - `vacancy/responses/list-workspace.ts`: `z.array(z.enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"])).optional()`

2. **screeningFilter** — идентичный enum в обоих:
   - `z.enum(["all", "evaluated", "not-evaluated", "high-score", "low-score"]).default("all")`

3. **Pagination** — десятки мест с дублированием:
   - `page: z.number().min(1).default(1)`
   - `limit: z.number().min(1).max(100).default(20)` (варьируются default 20, 50, 100 и max 50, 100, 200)

4. **sortDirection** — централизован в `sort-types.ts`, но `sortDirectionSchema` используется только в vacancy responses; в других роутерах — inline `z.enum(["asc","desc"])`.

**Рекомендация:** Создать в `@qbs-autonaim/validators` (или `packages/api/src/schemas`):
- `paginationSchema`, `paginationInputSchema` (page, limit)
- `statusFilterSchema` (response statuses)
- `screeningFilterSchema`
- `sortDirectionSchema` — экспортировать из validators для единообразия

### 3.3 Type Safety (БД → tRPC → UI)

| Этап | Реализация | Оценка |
|------|------------|--------|
| **БД → tRPC** | Drizzle schema → репозитории/запросы → возвращаемые типы | ✅ |
| **tRPC outputs** | `inferRouterOutputs<AppRouter>` → `RouterOutputs` | ✅ |
| **UI** | `RouterOutputs["vacancy"]["responses"]["list"]["responses"][0]` | ✅ Полная типизация |

Типы корректно пробрасываются; в app используются `RouterOutputs` для компонентов. **Рекомендация:** Вынести часто используемые алиасы (например, `VacancyListItem`) в общий файл типов, чтобы избежать длинных путей `RouterOutputs["freelancePlatforms"]["getVacancies"][number]`.

### 3.4 Context и Middleware

**Context** (`trpc.ts`):
- `session`, `db`, `workspaceRepository`, `organizationRepository`, `auditLogger`, `ipAddress`, `userAgent`, `interviewToken`, `inngest`
- Хорошо структурирован; репозитории инжектятся с db

**Procedures:**
- `publicProcedure` — timing, security headers, security audit
- `protectedProcedure` — + session check
- `interviewTokenProcedure` — для интервью

**Middleware:**
- `securityAudit` — логирование, slow ops (>5s), UNAUTHORIZED/FORBIDDEN
- `rateLimitMiddleware` — **закомментирован** (`.use(rateLimitMiddleware)` закомментирован)
- `timingMiddleware` — искусственная задержка 100–500ms в dev (может маскировать проблемы производительности)

**Доменные middleware:**
- `TenantGuard`, `TenantIsolationError` — workspace isolation
- `checkWorkspaceAccess`, `checkRateLimit`, `checkActionPermission` в recruiter-agent

**Критично:** Rate limiting отключён — API уязвим к brute-force и DoS. Включить после нагрузочного тестирования и настройки лимитов под прод.

---

## 4. Поддерживаемость и технический долг

### 4.1 Места с низкой читаемостью

| Файл/область | Проблема | Рекомендация |
|--------------|----------|--------------|
| `VacancyResponsesContext` | Сложный контракт с 15+ методами, регистрация хендлеров через ref | Разделить на меньшие контексты; рассмотреть event emitter |
| `vacancy/responses/list.ts`, `list-workspace.ts` | Дублирование логики пагинации, фильтров, маппинга | Вынести общие утилиты (`paginatedResponse`, `buildWhereConditions`) в shared |
| `useVacancyFilters` | 80+ строк с многоступенчатой фильтрацией и сортировкой | Перенести на сервер; оставить на клиенте только минимальный слой |
| Множественные `limit: z.number()...` | Разные default/max в каждом роутере | Централизовать в validators |

### 4.2 Масштабируемость добавления фич

| Сценарий | Сложность | Оценка |
|----------|-----------|--------|
| Новая tRPC процедура | Низкая | Следовать существующим паттернам; 1 файл + регистрация |
| Новый домен (например, `notifications`) | Средняя | Создать router, зарегистрировать в root; проверить зависимость от shared/db |
| Новое приложение в apps/ | Низкая | Добавить в workspaces; подключить api, auth, ui |
| Изменение схемы БД | Средняя | Drizzle миграции; обновить типы; возможен каскад в api |

### 4.3 Избыточная сложность

- **shared** зависит от `ai`, `db`, `config`, `types`, `validators` — «толстый» пакет. При росте может стать местом накопления cross-cutting логики. Рекомендуется держать `shared` минимальным; выносить доменную логику в отдельные пакеты.
- **jobs** — глубокий граф зависимостей (ai, db, emails, jobs-parsers, tg-client и т.д.). Логично разбить на поддомены (jobs-kwork, jobs-hh и т.п.), если они начнут расти независимо.

---

## 5. План рефакторинга (приоритизированный)

### Фаза 1: Быстрые победы (1–2 спринта)

| # | Задача | Зачем | Что даст |
|---|--------|------|----------|
| 1 | **Централизовать Zod-схемы** в validators | Устранить дублирование statusFilter, screeningFilter, pagination | Единый источник правды; меньше ошибок при изменении статусов |
| 2 | **Включить rate limit middleware** | Защита API | Снижение риска DoS, brute-force |
| 3 | **Убрать timingMiddleware** в dev или сделать опциональным | 100–500ms задержка маскирует проблемы | Более честная оценка производительности |
| 4 | **Документировать dependency direction** | Предотвратить циклы | Явные правила в `.cursor/rules` или ADR |

### Фаза 2: Оптимизация данных (2–3 спринта)

| # | Задача | Зачем | Что даст |
|---|--------|------|----------|
| 5 | **Расширить getVacancies** | Добавить search, statusFilter (isActive), dateFrom/dateTo, пагинацию | Перенести фильтрацию на сервер; меньше данных по сети |
| 6 | **Упростить useVacancyFilters** | Оставить только управление UI (состояние фильтров) | Хук станет тонким; логика — на сервере |
| 7 | **Prefetch для списков** | Server Components или `prefetchQuery` в layout | Быстрее первый рендер; лучше Core Web Vitals |

### Фаза 3: Улучшение компонентов (2–4 спринта)

| # | Задача | Зачем | Что даст |
|---|--------|------|----------|
| 8 | **Рефакторинг VacancyResponsesContext** | Снизить связанность | Разделить на OperationsState + Handlers; упростить тесты |
| 9 | **Уменьшить «client islands»** | Страницы vacancies, gigs, responses — выделить server shell + client islands | Меньше JS на клиенте; лучший hydration |
| 10 | **Унифицировать path aliases** | Один convention для всех packages | Предсказуемость; меньше путаницы при онбординге |

### Фаза 4: Стратегические улучшения (по мере необходимости)

| # | Задача | Зачем | Что даст |
|---|--------|------|----------|
| 11 | **Мониторинг «shared»** | Не допустить раздувания | Выносить тяжёлую логику в domain packages |
| 12 | **Рассмотреть разбиение jobs** | При росте на 2x+ | jobs-kwork, jobs-hh — изоляция, параллельная разработка |

---

## 6. Итоговая оценка

| Критерий | Оценка (1–5) | Комментарий |
|----------|--------------|-------------|
| Архитектура монорепо | 4/5 | Чёткая структура; minor — унификация aliases |
| Next.js App Router | 4/5 | Хорошее разделение; есть перегруз client components |
| tRPC и типизация | 4/5 | Сильная сторона; дублирование Zod — главный минус |
| Поддерживаемость | 4/5 | Масштабируемо; точечные «горячие точки» |
| Безопасность | 3/5 | Rate limit отключён — критичный gap |

**Общая оценка: 4/5** — проект готов к долгосрочному развитию. Фокус рефакторинга: централизация валидации, возврат rate limiting, перенос тяжёлой фильтрации на сервер и упрощение VacancyResponsesContext.
