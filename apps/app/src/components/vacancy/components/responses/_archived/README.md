# Заархивированный flow загрузки архивных откликов

**Дата архивации:** 2025-02

## Описание

Ранее по кнопке «Загрузить архивные отклики» открывался диалог подтверждения, после которого запускалась синхронизация архивных откликов с HeadHunter через API (Inngest job `vacancy/responses.sync-archived`).

## Текущее поведение

Вместо синхронизации через API теперь показывается сообщение о том, что пользователь может загрузить архивные отклики через расширение «Помощник рекрутера» в Chrome.

## Сохранённые компоненты (для возможного восстановления)

- `use-sync-archived-state.ts` — хук по-прежнему используется для регистрации handler в контексте (на случай, если sync запущен извне)
- `RefreshStatusIndicator` с mode="archived" — продолжает показывать прогресс при активной синхронизации
- API: `syncArchivedVacancyResponses` (packages/api), `triggerSyncArchivedVacancyResponses` (apps/app actions)
- Inngest: `syncArchivedVacancyResponsesFunction` (packages/jobs)

## Старое UI (до замены)

В `empty-state.tsx` при `showLoadButton` отображалось:

- Кнопка «Загрузить архивные отклики» с `onClick={onSyncArchivedDialogOpen}`
- Подсказка «Это может занять несколько минут»
- Блок «Что произойдёт дальше» с пунктами о загрузке с HH, появлении в таблице, AI-анализе

При клике открывался `RefreshStatusIndicator` в режиме confirmation (ConfirmationView с mode="archived"), после подтверждения вызывался `handleSyncArchived` → `triggerSyncArchivedVacancyResponses`.
