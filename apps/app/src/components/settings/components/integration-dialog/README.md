# Упрощение интеграции с hh.ru

## Что было изменено

### Проблемы старой реализации

1. **Множество ref'ов** — `twoFactorCredentialsRef`, `codeSubmittedRef`, `resendTriggeredRef` создавали сложную логику синхронизации
2. **Polling через refetchInterval** — избыточно при наличии Realtime подписки
3. **Дублирование логики** — проверка данных формы в нескольких местах
4. **Нет разделения ответственности** — один хук управлял всем

### Новая архитектура

#### 1. Машина состояний (`hh-integration-state.ts`)

Чёткие переходы между этапами:
- `idle` → `verifying` → `captcha` | `twoFactor` | `success` | `error`
- `twoFactor` → `processing` → `success` | `error`

Преимущества:
- Предсказуемые переходы состояний
- Легко отлаживать
- Нет race conditions

#### 2. Специализированный хук (`use-hh-integration.ts`)

Инкапсулирует всю логику HH:
- Управление состоянием через reducer
- Обработка капчи, 2FA, повторной отправки
- Нет ref'ов — всё в state

#### 3. Упрощённый основной хук (`use-integration-dialog.ts`)

Теперь только:
- Управление формой
- Делегирование HH логики в `useHHIntegration`
- Простая обработка Kwork

## Преимущества

1. **Читаемость** — логика разделена по файлам
2. **Тестируемость** — reducer легко тестировать
3. **Поддержка** — понятные переходы состояний
4. **Производительность** — убран polling, меньше ре-рендеров
5. **Типобезопасность** — строгие типы для состояний

## Использование

```tsx
const hhIntegration = useHHIntegration({
  workspaceId,
  onSuccess: () => {
    // Обработка успеха
  },
});

// Запуск проверки
await hhIntegration.startVerification(login, password, authType);

// Отправка капчи
await hhIntegration.submitCaptcha(captcha);

// Отправка 2FA кода
await hhIntegration.submit2FACode(code);

// Повторная отправка кода
await hhIntegration.resendCode();

// Сброс состояния
hhIntegration.reset();

// Проверка состояния
if (hhIntegration.state.step === "twoFactor") {
  // Показать диалог 2FA
}
```

## Миграция

Старый код с ref'ами и множеством useState заменён на:
- Один reducer для управления состоянием
- Чёткие action'ы для изменения состояния
- Автоматическая синхронизация через state

Все диалоги теперь управляются через `hhState.step` вместо отдельных boolean флагов.
